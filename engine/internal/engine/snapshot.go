package engine

import (
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
	Detached  bool           `json:"detached"`
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
	seenThisScan := make(map[portKey]bool)
	out := []PortSnapshot{}

	for _, p := range tcpPorts {
		key := portKey{
			Port:  p.Port,
			Inode: p.Inode,
		}

		if seenThisScan[key] {
			continue
		}
		seenThisScan[key] = true

		pid, _ := ports.InodeToPID(p.Inode)

		info, hasProc := procs[pid]
		if hasProc && IsNoiseProcess(info.Cmdline, info.Name) {
			continue
		}

		ps := PortSnapshot{
			Port:      p.Port,
			LocalAddr: p.LocalAddr,
			Interface: getInterface(p.LocalAddr),
			PID:       pid,
		}

		if hasProc {
			ps.Process = &info
		}

		/* -------- state update (after filtering) -------- */

		stateMu.Lock()
		entry, exists := portState[key]
		if !exists {
			entry = &portStateEntry{FirstSeen: now}
			portState[key] = entry
		}
		entry.LastSeen = now
		entry.Misses = 0
		stateMu.Unlock()

		ps.FirstSeen = entry.FirstSeen
		ps.LastSeen = entry.LastSeen

		/* -------- detached detection -------- */

		if ps.Process != nil {
			ppid := ps.Process.PPID
			if ppid > 1 {
				if _, ok := procs[ppid]; !ok {
					ps.Detached = true
				}
			}
		}

		/* -------- insight -------- */

		cmdline := ""
		name := ""
		if ps.Process != nil {
			cmdline = ps.Process.Cmdline
			name = ps.Process.Name
		}

		ps.Insight = GenerateInsight(
			entry.FirstSeen,
			cmdline,
			name,
			10*time.Minute,
		)

		out = append(out, ps)
	}

	/* -------- prune disappeared ports -------- */

	stateMu.Lock()
	for k, v := range portState {
		if !seenThisScan[k] {
			v.Misses++
			if v.Misses > 3 {
				delete(portState, k)
			}
		}
	}
	stateMu.Unlock()

	return out, nil
}
