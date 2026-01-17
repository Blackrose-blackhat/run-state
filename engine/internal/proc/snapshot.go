package proc

type ProcInfo struct {
	PID        int32   `json:"pid"`
	PPID       int32   `json:"ppid"`
	Name       string  `json:"name"`
	Cmdline    string  `json:"cmdline"`
	Username   string  `json:"username"`
	CreateTime string  `json:"create_time"`
	MemoryMB   float64 `json:"memory_mb"`
}
