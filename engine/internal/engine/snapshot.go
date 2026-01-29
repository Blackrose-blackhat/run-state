package engine

import (
	"fmt"
	"net"
	"runstate/engine/internal/ports"
	"runstate/engine/internal/proc"
	"strings"
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

	// Phase 2 Fields
	Traffic *TrafficInfo `json:"traffic,omitempty"`
	Risks   []string     `json:"risks,omitempty"`
	Project *ProjectInfo `json:"project,omitempty"`
}

type TrafficInfo struct {
	TxQueue  int64 `json:"tx_queue"`
	RxQueue  int64 `json:"rx_queue"`
	IsActive bool  `json:"is_active"`
}

type ProjectInfo struct {
	Name string `json:"name"`
	Path string `json:"path"`
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
	LastTx    int64
	LastRx    int64
}

var (
	stateMu   sync.Mutex
	portState = make(map[portKey]*portStateEntry)
)

/* -------------------- project identification -------------------- */
func getProjectInfo(cwd string) *ProjectInfo {
	if cwd == "" {
		return nil
	}
	// Simple heuristic: last part of the path
	parts := strings.Split(strings.TrimRight(cwd, "/"), "/")
	if len(parts) == 0 {
		return nil
	}
	name := parts[len(parts)-1]
	// Avoid generic names
	if name == "src" || name == "app" || name == "build" || name == "dist" {
		if len(parts) > 1 {
			name = parts[len(parts)-2] + "/" + name
		}
	}

	return &ProjectInfo{
		Name: name,
		Path: cwd,
	}
}

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

	// Dedup by port number to handle multi-interface listeners (e.g. 0.0.0.0 and 127.0.0.1)
	portMap := make(map[int]PortSnapshot)

	for _, p := range tcpPorts {
		pid, _ := ports.InodeToPID(p.Inode)
		info, hasProc := procs[pid]

		// Skip noise but continue tracking state
		isNoise := hasProc && IsNoiseProcess(info.Cmdline, info.Name)
		if isNoise {
			continue
		}

		// State key using port+PID
		sKey := portKey{
			Port:  p.Port,
			Inode: fmt.Sprintf("%d", pid),
		}

		stateMu.Lock()
		entry, exists := portState[sKey]
		if !exists {
			entry = &portStateEntry{FirstSeen: now}
			portState[sKey] = entry
		}

		// Traffic awareness
		isActive := (p.TxQueue > entry.LastTx) || (p.RxQueue > entry.LastRx)
		entry.LastTx = p.TxQueue
		entry.LastRx = p.RxQueue
		entry.LastSeen = now
		entry.Misses = 0
		stateMu.Unlock()

		ps := PortSnapshot{
			Port:      p.Port,
			LocalAddr: p.LocalAddr,
			Interface: getInterface(p.LocalAddr),
			PID:       pid,
			FirstSeen: entry.FirstSeen,
			LastSeen:  entry.LastSeen,
			Traffic: &TrafficInfo{
				TxQueue:  p.TxQueue,
				RxQueue:  p.RxQueue,
				IsActive: isActive,
			},
		}

		if hasProc {
			ps.Process = &info
			ps.Project = getProjectInfo(info.Cwd)

			// Check orphaned status
			if info.PPID > 1 {
				if _, ok := procs[info.PPID]; !ok {
					ps.Orphaned = true
					ps.Risks = append(ps.Risks, "ORPHANED_PROCESS")
				}
			}
			ps.Insight = GenerateInsight(entry.FirstSeen, info.Cmdline, info.Name, 10*time.Minute)
		} else {
			// Try to identify service by port if no process found (e.g. Docker, system service)
			if expl, icon, ok := GenerateInsightFromPort(ps.Port); ok && icon != "system" {
				cat, dur := CategorizeAge(ps.FirstSeen)
				ps.Insight = &PortInsight{
					Explanation: expl,
					Icon:        icon,
					Category:    CategoryDev,
					AgeCategory: cat,
					AgeDuration: dur,
				}
				// Create mock process info so it's not "KERNEL" in the UI
				ps.Process = &proc.ProcInfo{
					Name:     expl,
					Cmdline:  expl,
					Username: "N/A",
				}
			} else {
				// Default fallback for ports we can't identify (common for Docker/rootless)
				ps.Insight = &PortInsight{
					Explanation: "Unidentified Service",
					Icon:        "system",
					Category:    CategoryUnidentified,
					AgeCategory: "fresh",
					AgeDuration: "unknown",
				}
				// If port is in common dev range, maybe it's a dev service
				if ps.Port >= 1024 {
					ps.Insight.Explanation = "Potential Dev/Container Service"
					ps.Insight.Icon = "docker"
					ps.Insight.Category = CategoryDev
				}

				ps.Process = &proc.ProcInfo{
					Name:     "UNKNOWN",
					Cmdline:  "Unknown process (likely Docker or System)",
					Username: "unknown",
				}
				ps.Risks = append(ps.Risks, "HIDDEN_PROCESS")
			}
		}

		// Security Risk Heuristic: Public Exposure
		if ps.Interface == "any" || ps.Interface == "public" {
			if ps.Insight != nil && ps.Insight.Category == CategoryDev {
				ps.Risks = append(ps.Risks, "PUBLIC_EXPOSURE")
			}
		}

		// Never skip ports anymore - if it's open, show it
		if ps.Insight == nil {
			ps.Insight = &PortInsight{
				Explanation: "System Resource",
				Icon:        "system",
				Category:    CategorySystem,
				AgeCategory: "fresh",
				AgeDuration: "unknown",
			}
		}

		// Dedup choice: prefer 'any' (0.0.0.0) or 'public' over 'loopback'
		existing, found := portMap[ps.Port]
		if !found {
			portMap[ps.Port] = ps
		} else {
			rank := func(iface string) int {
				switch iface {
				case "any":
					return 3
				case "public":
					return 2
				case "private":
					return 1
				default:
					return 0
				}
			}
			if rank(ps.Interface) > rank(existing.Interface) {
				portMap[ps.Port] = ps
			}
		}
	}

	// Build output slice
	out := make([]PortSnapshot, 0, len(portMap))
	for _, ps := range portMap {
		out = append(out, ps)
	}

	// Prune inactive ports from state tracking
	stateMu.Lock()
	for k, v := range portState {
		if v.LastSeen != now {
			v.Misses++
			if v.Misses > 3 {
				delete(portState, k)
			}
		}
	}
	stateMu.Unlock()

	return out, nil
}
