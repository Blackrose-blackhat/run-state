package engine

import (
	"runstate/engine/internal/ports"
	"runstate/engine/internal/proc"
)

type PortState struct {
	Port int            `json:"port"`
	PID  int32          `json:"pid"`
	Proc *proc.ProcInfo `json:"process,omitempty"`
}

func SnapshotPorts() ([]PortState, error) {
	procMap, err := proc.Snapshot()
	if err != nil {
		return nil, err
	}

	tcpPorts, err := ports.ListTCPPorts()
	if err != nil {
		return nil, err
	}

	var out []PortState

	for _, tp := range tcpPorts {
		pid, ok := ports.InodeToPID(tp.Inode)
		if !ok {
			continue
		}

		ps := PortState{
			Port: tp.Port,
			PID:  pid,
		}

		if p, ok := procMap[pid]; ok {
			ps.Proc = &p
		}

		out = append(out, ps)
	}

	return out, nil
}
