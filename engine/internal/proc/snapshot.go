package proc

import "github.com/shirou/gopsutil/process"

type ProcInfo struct {
	PID        int32   `json:"pid"`
	PPID       int32   `json:"ppid"`
	Name       string  `json:"name"`
	Cmdline    string  `json:"cmdline"`
	Username   string  `json:"username"`
	CreateTime string  `json:"create_time"`
	MemoryMB   float64 `json:"memory_mb"`
}

func Snapshot() ([]ProcInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

}
