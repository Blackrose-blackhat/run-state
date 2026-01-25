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
	f, err := os.Open("/proc/net/tcp")
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var out []TcpPort
	scanner := bufio.NewScanner(f)

	// skip header
	scanner.Scan()

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

	return out, nil
}
