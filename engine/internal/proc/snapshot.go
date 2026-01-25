package proc

import (
	"time"

	"github.com/shirou/gopsutil/v3/process"
)

type ProcInfo struct {
	PID        int32     `json:"pid"`
	PPID       int32     `json:"ppid"`
	Name       string    `json:"name"`
	Cmdline    string    `json:"cmdline"`
	Username   string    `json:"username"`
	CreateTime time.Time `json:"create_time"`
	MemoryMB   float64   `json:"memory_mb"`
}

func Snapshot() (map[int32]ProcInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	result := make(map[int32]ProcInfo)

	for _, p := range procs {
		pid := p.Pid

		name, _ := p.Name()
		cmd, _ := p.Cmdline()
		user, _ := p.Username()
		ppid, _ := p.Ppid()
		mem, _ := p.MemoryInfo()
		ct, _ := p.CreateTime()

		result[pid] = ProcInfo{
			PID:        pid,
			PPID:       ppid,
			Name:       name,
			Cmdline:    cmd,
			Username:   user,
			CreateTime: time.UnixMilli(ct),
			MemoryMB:   float64(mem.RSS) / 1024 / 1024,
		}
	}

	return result, nil
}
