package ports

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

type TcpPort struct {
	Port  int
	Inode string
	State string
}

func ListTCPPorts() ([]TcpPort, error) {
	var out []TcpPort

	files := []string{"/proc/net/tcp", "/proc/net/tcp6"}
	for _, file := range files {
		f, err := os.Open(file)
		if err != nil {
			continue // Some systems might not have tcp6
		}

		scanner := bufio.NewScanner(f)
		scanner.Scan() // skip header

		for scanner.Scan() {
			fields := strings.Fields(scanner.Text())
			if len(fields) < 10 {
				continue
			}

			local := fields[1]
			state := fields[3]
			inode := fields[9]

			// LISTEN only
			if state != "0A" {
				continue
			}

			parts := strings.Split(local, ":")
			if len(parts) != 2 {
				continue
			}

			portHex := parts[1]
			p, err := strconv.ParseInt(portHex, 16, 32)
			if err != nil {
				continue
			}

			out = append(out, TcpPort{
				Port:  int(p),
				Inode: inode,
				State: state,
			})
		}
		f.Close()
	}

	return out, nil
}
