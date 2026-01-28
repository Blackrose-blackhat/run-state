package engine

import (
	"fmt"
	"net"
	"runstate/engine/internal/ports"
	"runstate/engine/internal/proc"
	"sync"
	"time"
)

type PortSnapshot struct {
	Port      int            `json:"port"`
	LocalAddr string         `json:"local_addr"`
	Interface string         `json:"interface"` // loopback, any, private, public
	PID       int32          `json:"pid"`
	Process   *proc.ProcInfo `json:"process,omitempty"`
	FirstSeen time.Time      `json:"first_seen"`
	LastSeen  time.Time      `json:"last_seen"`
	Orphaned  bool           `json:"orphaned"`
	Insight   *PortInsight   `json:"insight,omitempty"`
}

/* -------------------- interface classification -------------------- */

func getInterface(addr string) string {
	ip := net.ParseIP(addr)
	if ip == nil {
		return "unknown"
	}

	if ip.IsLoopback() {
		return "loopback"
	}
	if ip.IsUnspecified() {
		return "any"
	}
	if ip.IsPrivate() {
		return "private"
	}
	return "public"
}

/* -------------------- port state -------------------- */

type portKey struct {
	Port  int
	Inode string
}

type portStateEntry struct {
	FirstSeen time.Time
	LastSeen  time.Time
	Misses    int
}

var (
	stateMu   sync.Mutex
	portState = make(map[portKey]*portStateEntry)
)

/* -------------------- snapshot -------------------- */

func SnapshotPorts() ([]PortSnapshot, error) {
	procs, err := proc.Snapshot()
	if err != nil {
		return nil, err
	}

	tcpPorts, err := ports.ListTCPPorts()
	if err != nil {
		return nil, err
	}

	now := time.Now()

	// Key by port+localAddr for true uniqueness
	type dedupKey struct {
		Port      int
		LocalAddr string
	}

	seenThisScan := make(map[dedupKey]bool)
	stateKeys := make(map[portKey]dedupKey) // Map old state keys to new dedup keys
	out := []PortSnapshot{}

	for _, p := range tcpPorts {
		dKey := dedupKey{
			Port:      p.Port,
			LocalAddr: p.LocalAddr,
		}

		// Skip true duplicates first
		if seenThisScan[dKey] {
			continue
		}
		seenThisScan[dKey] = true

		pid, _ := ports.InodeToPID(p.Inode)
		info, hasProc := procs[pid]

		// Skip noise but continue tracking
		isNoise := hasProc && IsNoiseProcess(info.Cmdline, info.Name)

		// State key using port+PID instead of inode
		sKey := portKey{
			Port:  p.Port,
			Inode: fmt.Sprintf("%d", pid), // Use PID as stable identifier
		}

		stateMu.Lock()
		entry, exists := portState[sKey]
		if !exists {
			entry = &portStateEntry{FirstSeen: now}
			portState[sKey] = entry
		}
		entry.LastSeen = now
		entry.Misses = 0
		stateKeys[sKey] = dKey
		stateMu.Unlock()

		// Skip noise from output after tracking state
		if isNoise {
			continue
		}

		ps := PortSnapshot{
			Port:      p.Port,
			LocalAddr: p.LocalAddr,
			Interface: getInterface(p.LocalAddr),
			PID:       pid,
			FirstSeen: entry.FirstSeen,
			LastSeen:  entry.LastSeen,
		}

		if hasProc {
			ps.Process = &info

			// Check orphaned status
			if info.PPID > 1 {
				if _, ok := procs[info.PPID]; !ok {
					ps.Orphaned = true
				}
			}

			ps.Insight = GenerateInsight(
				entry.FirstSeen,
				info.Cmdline,
				info.Name,
				10*time.Minute,
			)
		}

		out = append(out, ps)
	}

	// Prune using the new dedup keys
	stateMu.Lock()
	for k, v := range portState {
		dKey, tracked := stateKeys[k]
		if !tracked || !seenThisScan[dKey] {
			v.Misses++
			if v.Misses > 3 {
				delete(portState, k)
			}
		}
	}
	stateMu.Unlock()

	return out, nil
}
