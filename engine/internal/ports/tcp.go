package ports

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type TcpPort struct {
	Port      int
	LocalAddr string
	Inode     string
	State     string
	TxQueue   int64
	RxQueue   int64
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

// parseIPv6 handles 32-character hex strings from /proc/net/tcp6
func parseIPv6(hexStr string) string {
	if len(hexStr) != 32 {
		return hexStr
	}
	// IPv6 is 16 bytes, stored as four 32-bit little-endian words
	var ip []string
	for i := 0; i < 4; i++ {
		word, _ := strconv.ParseUint(hexStr[i*8:(i+1)*8], 16, 32)
		// Each word is 4 bytes, let's just use net.IP feel
		// But here we want a string representation.
		// Actually, simpler to just hex-group it if we wanted,
		// but let's follow the standard: 4 bytes at a time, each word is little-endian.
		b0 := byte(word & 0xFF)
		b1 := byte((word >> 8) & 0xFF)
		b2 := byte((word >> 16) & 0xFF)
		b3 := byte((word >> 24) & 0xFF)
		ip = append(ip, fmt.Sprintf("%02x%02x:%02x%02x", b3, b2, b1, b0))
	}
	// This isn't exactly right for standard IPv6 string but we need it for net.ParseIP later
	// net.ParseIP handles standard IPv6.
	// Actually, easier: 4 groups of 4 bytes, each group is reversed.
	res := ""
	for i := 0; i < 16; i += 4 {
		h := hexStr[i*2 : (i+4)*2]
		// Reverse bytes in this 4-byte chunk
		res += h[6:8] + h[4:6] + h[2:4] + h[0:2]
	}
	// Return as hex, snapshot.go's getInterface/net.ParseIP will handle it if we format it right.
	// Or better: just return the bytes and let snapshot handle it?
	// No, let's return a string that net.ParseIP likes.
	return fmt.Sprintf("%s:%s:%s:%s:%s:%s:%s:%s",
		hexStr[6:8]+hexStr[4:6], hexStr[2:4]+hexStr[0:2],
		hexStr[14:16]+hexStr[12:14], hexStr[10:12]+hexStr[8:10],
		hexStr[22:24]+hexStr[20:22], hexStr[18:20]+hexStr[16:18],
		hexStr[30:32]+hexStr[28:30], hexStr[26:28]+hexStr[24:26])
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

			addr := ""
			if len(addrHex) == 8 {
				addr = parseIPv4(addrHex)
			} else if len(addrHex) == 32 {
				addr = parseIPv6(addrHex)
			} else {
				addr = addrHex
			}

			// Parse queues (index 4 is tx_queue:rx_queue)
			var tx, rx int64
			queues := strings.Split(fields[4], ":")
			if len(queues) == 2 {
				tx, _ = strconv.ParseInt(queues[0], 16, 64)
				rx, _ = strconv.ParseInt(queues[1], 16, 64)
			}

			out = append(out, TcpPort{
				Port:      int(p),
				LocalAddr: addr,
				Inode:     inode,
				State:     state,
				TxQueue:   tx,
				RxQueue:   rx,
			})
		}
		f.Close()
	}

	return out, nil
}
