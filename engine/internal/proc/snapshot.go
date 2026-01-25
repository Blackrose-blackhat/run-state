package proc

import (
	"log"
	"runtime"
	"time"

	"github.com/shirou/gopsutil/v3/process"
)

// ProcInfo encapsulates essential process metadata.
type ProcInfo struct {
	PID        int32     `json:"pid"`
	PPID       int32     `json:"ppid"`
	Name       string    `json:"name"`
	Cmdline    string    `json:"cmdline"`
	Username   string    `json:"username"`
	CreateTime time.Time `json:"create_time"`
	MemoryMB   float64   `json:"memory_mb"`
}

// Snapshot returns a map of current processes, keyed by PID.
// It is designed to be highly resilient to nil pointer errors during scanning.
func Snapshot() (map[int32]ProcInfo, error) {
	// Global recovery to catch unexpected gopsutil failures
	defer func() {
		if r := recover(); r != nil {
			log.Printf("[Snapshot] Recovered from panic: %v", r)
		}
	}()

	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	result := make(map[int32]ProcInfo)

	for _, p := range procs {
		if p == nil {
			continue
		}

		pid := p.Pid

		// Safely extract metadata, ignoring errors for restricted processes
		name, _ := p.Name()
		cmd, _ := p.Cmdline()
		user, _ := p.Username()
		ppid, _ := p.Ppid()
		mem, _ := p.MemoryInfo()
		ct, _ := p.CreateTime()

		memMB := 0.0
		// Triple-check nil safety for memory info
		if mem != nil && runtime.GOOS != "" {
			// Check RSS field explicitly
			memMB = float64(mem.RSS) / 1024 / 1024
		}

		// Ensure we don't have crazy create times
		var createTime time.Time
		if ct > 0 {
			createTime = time.UnixMilli(ct)
		} else {
			createTime = time.Now()
		}

		result[pid] = ProcInfo{
			PID:        pid,
			PPID:       ppid,
			Name:       name,
			Cmdline:    cmd,
			Username:   user,
			CreateTime: createTime,
			MemoryMB:   memMB,
		}
	}

	return result, nil
}
