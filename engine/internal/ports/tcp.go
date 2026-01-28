package ports

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

type TcpPort struct {
	Port      int
	LocalAddr string
	Inode     string
	State     string
}

func hexToIP(hexStr string) string {
	// IPv4 is 8 chars, IPv6 is 32 chars
	if len(hexStr) == 8 {
		// IPv4: 0100007F -> 127.0.0.1
		var bytes [4]uint64
		for i := 0; i < 4; i++ {
			b, _ := strconv.ParseUint(hexStr[i*2:i*2+2], 16, 8)
			bytes[3-i] = b // Little endian
		}
		// Wait, linux /proc/net/tcp uses little-endian but per-byte
		// 0100007F is 127.0.0.1
		// 01 -> 1
		// 00 -> 0
		// 00 -> 0
		// 7F -> 127
		// So it's 127.0.0.1 if read backwards... no, 0100007F is actually 127.0.0.1 if you read it as 7F.00.00.01?
		// Let's re-verify: 0100007F. 01 is 1st byte, 00 2nd, 00 3rd, 7F 4th.
		// Usually /proc/net/tcp lists 0100007F as 127.0.0.1.
		// 0x7F = 127.
		// So 01 is 1, 00 is 0, 00 is 0, 7F is 127.
		// Byte 1: 01
		// Byte 2: 00
		// Byte 3: 00
		// Byte 4: 7F
		// If it's 127.0.0.1, then 7F is the first byte. So it IS little-endian.
		b1, _ := strconv.ParseUint(hexStr[0:2], 16, 8)
		b2, _ := strconv.ParseUint(hexStr[2:4], 16, 8)
		b3, _ := strconv.ParseUint(hexStr[4:6], 16, 8)
		b4, _ := strconv.ParseUint(hexStr[6:8], 16, 8)
		return strconv.FormatUint(b1, 10) + "." + strconv.FormatUint(b2, 10) + "." + strconv.FormatUint(b3, 10) + "." + strconv.FormatUint(b4, 10)
		// Actually, standard way:
		// 0100007F -> 127.0.0.1 is WRONG.
		// 127.0.0.1 is 7F 00 00 01.
		// In /proc/net/tcp it's 0100007F because it's stored as a uint32 in little endian.
		// So 01 is the last byte, 7F is the first.
	}
	return hexStr // Fallback for IPv6 or unknown
}

// Fixed hexToIP for IPv4 (little endian uint32)
func parseIPv4(hexStr string) string {
	if len(hexStr) != 8 {
		return hexStr
	}
	d, _ := strconv.ParseUint(hexStr, 16, 32)
	return strconv.FormatUint(d&0xFF, 10) + "." +
		strconv.FormatUint((d>>8)&0xFF, 10) + "." +
		strconv.FormatUint((d>>16)&0xFF, 10) + "." +
		strconv.FormatUint((d>>24)&0xFF, 10)
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

			addrHex := parts[0]
			portHex := parts[1]
			p, err := strconv.ParseInt(portHex, 16, 32)
			if err != nil {
				continue
			}

			out = append(out, TcpPort{
				Port:      int(p),
				LocalAddr: parseIPv4(addrHex),
				Inode:     inode,
				State:     state,
			})
		}
		f.Close()
	}

	return out, nil
}
