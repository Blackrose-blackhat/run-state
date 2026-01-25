package ports

import (
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

func InodeToPID(inode string) (int32, bool) {
	procEntries, _ := os.ReadDir("/proc")

	for _, e := range procEntries {
		if !e.IsDir() {
			continue
		}

		pid := e.Name()
		if pid[0] < '0' || pid[0] > '9' {
			continue
		}

		fdDir := filepath.Join("/proc", pid, "fd")
		fds, err := os.ReadDir(fdDir)
		if err != nil {
			continue
		}

		for _, fd := range fds {
			link, err := os.Readlink(filepath.Join(fdDir, fd.Name()))
			if err != nil {
				continue
			}

			if strings.Contains(link, "socket:["+inode+"]") {
				p, _ := strconv.Atoi(pid)
				return int32(p), true
			}
		}
	}

	return 0, false
}
