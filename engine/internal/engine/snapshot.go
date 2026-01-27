package engine

import (
	"fmt"
	"runstate/engine/internal/ports"
	"runstate/engine/internal/proc"
	"time"
)

type PortSnapshot struct {
	Port      int            `json:"port"`
	PID       int32          `json:"pid"`
	Process   *proc.ProcInfo `json:"process,omitempty"`
	FirstSeen time.Time      `json:"first_seen"`
	LastSeen  time.Time      `json:"last_seen"`
	Orphaned  bool           `json:"orphaned"`
	Insight   *PortInsight   `json:"insight,omitempty"`
}

var portState = make(map[string]struct {
	FirstSeen time.Time
	LastSeen  time.Time
})

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
	seen := make(map[string]bool)
	seenThisScan := make(map[string]bool)

	out := []PortSnapshot{} // IMPORTANT

	for _, p := range tcpPorts {
		pid, _ := ports.InodeToPID(p.Inode)
		// We no longer continue/skip if pid is 0.
		// PID 0 represents a system process or a process in a different namespace (Docker).

		key := fmt.Sprintf("%d:%d", p.Port, pid)
		if seen[key] {
			continue
		}
		seen[key] = true

		state, exists := portState[key]
		if !exists {
			state.FirstSeen = now
		}
		state.LastSeen = now
		portState[key] = state
		seenThisScan[key] = true

		ps := PortSnapshot{
			Port:      p.Port,
			PID:       pid,
			FirstSeen: state.FirstSeen,
			LastSeen:  state.LastSeen,
		}

		if info, ok := procs[pid]; ok {
			ps.Process = &info
		}
		orphaned := false

		if ps.Process != nil {
			ppid := ps.Process.PPID

			// PID 1 is always a valid parent (init/systemd)
			if ppid > 1 {
				if _, ok := procs[ppid]; !ok {
					orphaned = true
				}
			}
		}

		ps.Orphaned = orphaned

		// Generate insight for this port
		cmdline := ""
		name := ""
		if ps.Process != nil {
			cmdline = ps.Process.Cmdline
			name = ps.Process.Name
		}

		ps.Insight = GenerateInsight(
			state.FirstSeen,
			cmdline,
			name,
			10*time.Minute,
		)

		out = append(out, ps)
	}

	return out, nil

}
