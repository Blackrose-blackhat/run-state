package main

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"runstate/engine/internal/engine"
	"runstate/engine/internal/proc"
)

// Version info (set via ldflags)
var (
	Version   = "dev"
	BuildTime = "unknown"
)

// ANSI color codes
const (
	Reset      = "\033[0m"
	Bold       = "\033[1m"
	Dim        = "\033[2m"
	Red        = "\033[31m"
	Green      = "\033[32m"
	Yellow     = "\033[33m"
	Blue       = "\033[34m"
	Magenta    = "\033[35m"
	Cyan       = "\033[36m"
	White      = "\033[37m"
	BoldGreen  = "\033[1;32m"
	BoldRed    = "\033[1;31m"
	BoldYellow = "\033[1;33m"
	BoldCyan   = "\033[1;36m"
	BgRed      = "\033[41m"
	BgGreen    = "\033[42m"
)

// SAFETY: Critical services that should NEVER be stopped
var protectedServices = map[string]bool{
	// Init systems
	"systemd": true,
	"init":    true,
	// Critical system services
	"dbus":             true,
	"dbus-daemon":      true,
	"polkit":           true,
	"udev":             true,
	"systemd-udevd":    true,
	"systemd-journald": true,
	"systemd-logind":   true,
	"systemd-resolved": true,
	"systemd-networkd": true,
	"NetworkManager":   true,
	"sshd":             true,
	"ssh":              true,
	// Display/Desktop critical
	"gdm":     true,
	"gdm3":    true,
	"sddm":    true,
	"lightdm": true,
	"Xorg":    true,
	"xorg":    true,
	// Kernel/system
	"kthreadd":  true,
	"ksoftirqd": true,
	"migration": true,
	"watchdog":  true,
}

// SAFETY: Process names that should NEVER be killed
var protectedProcesses = map[string]bool{
	"systemd":     true,
	"init":        true,
	"kthreadd":    true,
	"dbus-daemon": true,
	"polkitd":     true,
	"gdm":         true,
	"Xorg":        true,
	"gnome-shell": true,
	"kwin":        true,
	"plasmashell": true,
	"sshd":        true,
	"login":       true,
	"agetty":      true,
}

// Minimum safe PID - processes below this are system critical
const minSafePID = 100

func main() {
	if len(os.Args) < 2 {
		printHelp()
		os.Exit(0)
	}

	cmd := os.Args[1]

	// Commands that require root privileges
	needsRoot := map[string]bool{
		"list":      true,
		"ls":        true,
		"watch":     true,
		"kill":      true,
		"uninstall": true,
	}

	// Auto-elevate if needed
	if needsRoot[cmd] && os.Geteuid() != 0 {
		elevateAndRun()
		return
	}

	switch cmd {
	case "list", "ls":
		cmdList()
	case "kill":
		if len(os.Args) < 3 {
			fmt.Printf("%s✗ Usage: portwatch kill <pid|service>%s\n", BoldRed, Reset)
			fmt.Printf("\n  Examples:\n")
			fmt.Printf("    portwatch kill 1234      %s# Kill process by PID%s\n", Dim, Reset)
			fmt.Printf("    portwatch kill nginx     %s# Stop systemd service%s\n", Dim, Reset)
			os.Exit(1)
		}
		cmdKill(os.Args[2])
	case "watch":
		cmdWatch()
	case "server":
		cmdServer()
	case "uninstall":
		cmdUninstall()
	case "version", "-v", "--version":
		printVersion()
	case "help", "-h", "--help":
		printHelp()
	default:
		fmt.Printf("%s✗ Unknown command: %s%s\n", BoldRed, cmd, Reset)
		printHelp()
		os.Exit(1)
	}
}

// elevateAndRun re-executes the command with elevated privileges
func elevateAndRun() {
	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("%s✗ Cannot find executable path: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	// Try pkexec first (graphical sudo), fall back to sudo
	var elevateCmd *exec.Cmd

	if _, err := exec.LookPath("pkexec"); err == nil {
		// Use pkexec for graphical prompt
		args := append([]string{exe}, os.Args[1:]...)
		elevateCmd = exec.Command("pkexec", args...)
	} else {
		// Fall back to sudo
		args := append([]string{exe}, os.Args[1:]...)
		elevateCmd = exec.Command("sudo", args...)
	}

	elevateCmd.Stdin = os.Stdin
	elevateCmd.Stdout = os.Stdout
	elevateCmd.Stderr = os.Stderr

	if err := elevateCmd.Run(); err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			os.Exit(exitErr.ExitCode())
		}
		os.Exit(1)
	}
}

func printVersion() {
	fmt.Printf("%s⚡ PortWatch%s v%s\n", BoldCyan, Reset, Version)
	fmt.Printf("   Built: %s\n", BuildTime)
}

func printHelp() {
	fmt.Printf(`
%s⚡ PortWatch%s - Deep shell observability for the modern engineer

%sUSAGE:%s
    portwatch <command> [arguments]

%sCOMMANDS:%s
    %slist, ls%s          List all active ports with process info
    %skill <target>%s     Smart kill - auto-detects PID or service name
    %swatch%s             Live-updating port monitor (TUI mode)
    %sserver%s            Start HTTP API server (for Tauri app)
    %suninstall%s         Uninstall PortWatch CLI from the system
    %sversion%s           Show version information
    %shelp%s              Show this help message

%sFLAGS:%s
    --json            Output in JSON format (for list command)
    -f, --force       Force kill without confirmation

%sEXAMPLES:%s
    portwatch list              # Show all ports
    portwatch list --json       # JSON output
    portwatch kill 1234         # Kill process by PID
    portwatch kill nginx        # Stop systemd service
    portwatch kill redis -f     # Force kill without prompt
    portwatch watch             # Live monitor
    portwatch uninstall         # Remove PortWatch

`, BoldCyan, Reset,
		Bold, Reset,
		Bold, Reset,
		Green, Reset,
		Green, Reset,
		Green, Reset,
		Green, Reset,
		Green, Reset,
		Green, Reset,
		Bold, Reset,
		Bold, Reset)
}

func cmdList() {
	jsonOutput := false
	for _, arg := range os.Args[2:] {
		if arg == "--json" || arg == "-j" {
			jsonOutput = true
		}
	}

	ports, err := engine.SnapshotPorts()
	if err != nil {
		fmt.Printf("%s✗ Error: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	if jsonOutput {
		enc := json.NewEncoder(os.Stdout)
		enc.SetIndent("", "  ")
		enc.Encode(ports)
		return
	}

	// Pretty table output
	if len(ports) == 0 {
		fmt.Printf("%s⚠ No active ports found%s\n", Yellow, Reset)
		return
	}

	fmt.Printf("\n%s⚡ Active Ports%s (%d found)\n\n", BoldCyan, Reset, len(ports))
	fmt.Printf("%s%-8s %-15s %-12s %-8s %-25s %s%s\n", Bold,
		"PORT", "ADDRESS", "INTERFACE", "PID", "PROCESS", "PROJECT", Reset)
	fmt.Printf("%s%s%s\n", Dim, strings.Repeat("─", 90), Reset)

	for _, p := range ports {
		procName := "UNKNOWN"
		project := ""
		if p.Process != nil {
			procName = truncate(p.Process.Name, 25)
		}
		if p.Project != nil {
			project = truncate(p.Project.Name, 20)
		}

		// Color based on interface type
		ifaceColor := White
		switch p.Interface {
		case "loopback":
			ifaceColor = Green
		case "any":
			ifaceColor = Yellow
		case "public":
			ifaceColor = Red
		}

		// Risk indicator
		riskIndicator := ""
		if len(p.Risks) > 0 {
			riskIndicator = fmt.Sprintf("%s⚠%s", Yellow, Reset)
		}

		fmt.Printf("%-8d %-15s %s%-12s%s %-8d %-25s %-20s %s\n",
			p.Port, p.LocalAddr, ifaceColor, p.Interface, Reset, p.PID, procName, project, riskIndicator)
	}
	fmt.Println()
}

// cmdKill is a smart kill that auto-detects whether target is a PID or service name
func cmdKill(target string) {
	// Check for force flag
	forceKill := false
	for _, arg := range os.Args[3:] {
		if arg == "-f" || arg == "--force" {
			forceKill = true
		}
	}

	// Try to parse as PID first
	pid, err := strconv.Atoi(target)
	if err == nil && pid > 0 {
		// It's a PID - kill the process
		killProcess(pid, forceKill)
		return
	}

	// Not a PID - check if it's a systemd service
	checkCmd := exec.Command("systemctl", "is-active", target)
	output, _ := checkCmd.Output()
	status := strings.TrimSpace(string(output))

	if status == "active" || status == "activating" || status == "inactive" {
		// It's a systemd service
		stopService(target, forceKill)
		return
	}

	// Try to find by process name
	processes, _ := proc.Snapshot()
	var matchedPID int32 = 0
	var matchCount int = 0

	for pid, info := range processes {
		if strings.Contains(strings.ToLower(info.Name), strings.ToLower(target)) ||
			strings.Contains(strings.ToLower(info.Cmdline), strings.ToLower(target)) {
			matchedPID = pid
			matchCount++
		}
	}

	if matchCount == 1 {
		killProcess(int(matchedPID), forceKill)
		return
	} else if matchCount > 1 {
		fmt.Printf("%s⚠ Multiple processes match '%s'%s\n", Yellow, target, Reset)
		fmt.Printf("  Use %sportwatch list%s to find the specific PID\n\n", Bold, Reset)
		os.Exit(1)
	}

	// Nothing found
	fmt.Printf("%s✗ '%s' is not a valid PID, service name, or running process%s\n", BoldRed, target, Reset)
	os.Exit(1)
}

func killProcess(pid int, forceKill bool) {
	if pid <= 0 {
		fmt.Printf("%s✗ Cannot kill system processes (PID 0 or negative)%s\n", BoldRed, Reset)
		os.Exit(1)
	}

	// SAFETY: Protect low PIDs (kernel and critical init processes)
	if pid < minSafePID {
		fmt.Printf("%s⛔ BLOCKED: PID %d is a critical system process%s\n", BoldRed, pid, Reset)
		fmt.Printf("   Low PIDs (< %d) are protected to prevent system damage.\n\n", minSafePID)
		os.Exit(1)
	}

	// Get process info first
	processes, _ := proc.Snapshot()
	procInfo, exists := processes[int32(pid)]

	// SAFETY: Check if process name is protected
	if exists && protectedProcesses[procInfo.Name] {
		fmt.Printf("%s⛔ BLOCKED: '%s' is a critical system process%s\n", BoldRed, procInfo.Name, Reset)
		fmt.Printf("   Killing this process could crash your system.\n\n")
		os.Exit(1)
	}

	// SAFETY: Check if running as root user (UID 0) and owned by root
	if exists && procInfo.Username == "root" && pid < 1000 {
		fmt.Printf("%s⚠ Warning: This is a root-owned system process%s\n", BoldYellow, Reset)
	}

	fmt.Printf("\n%s⚠ Kill Process%s\n\n", BoldYellow, Reset)
	if exists {
		fmt.Printf("  PID:      %d\n", pid)
		fmt.Printf("  Name:     %s\n", procInfo.Name)
		fmt.Printf("  Command:  %s\n", truncate(procInfo.Cmdline, 60))
		fmt.Printf("  User:     %s\n", procInfo.Username)
	} else {
		fmt.Printf("  PID:      %d\n", pid)
		fmt.Printf("  %s(Process info not available)%s\n", Dim, Reset)
	}

	if !forceKill {
		fmt.Printf("\n%sAre you sure you want to kill this process? [y/N]:%s ", Bold, Reset)

		reader := bufio.NewReader(os.Stdin)
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" && response != "yes" {
			fmt.Printf("%s✗ Aborted%s\n", Yellow, Reset)
			return
		}
	}

	targetProc, err := os.FindProcess(pid)
	if err != nil {
		fmt.Printf("%s✗ Process not found: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	// Try SIGTERM first
	fmt.Printf("\n%s→ Sending SIGTERM...%s\n", Cyan, Reset)
	if err := targetProc.Signal(syscall.SIGTERM); err != nil {
		fmt.Printf("%s✗ Failed: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	// Wait for graceful termination
	for i := 0; i < 6; i++ {
		time.Sleep(500 * time.Millisecond)
		if err := targetProc.Signal(syscall.Signal(0)); err != nil {
			fmt.Printf("%s✓ Process terminated gracefully%s\n\n", BoldGreen, Reset)
			return
		}
		if !forceKill {
			fmt.Printf("  Waiting... (%ds)\n", (i+1)/2)
		}
	}

	// Force kill
	fmt.Printf("%s→ Process didn't stop. Sending SIGKILL...%s\n", Yellow, Reset)
	if err := targetProc.Signal(syscall.SIGKILL); err != nil {
		fmt.Printf("%s✗ Failed: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	fmt.Printf("%s✓ Process force-killed%s\n\n", BoldGreen, Reset)
}

func stopService(serviceName string, forceKill bool) {
	// SAFETY: Check if service is protected
	if protectedServices[serviceName] {
		fmt.Printf("%s⛔ BLOCKED: '%s' is a critical system service%s\n", BoldRed, serviceName, Reset)
		fmt.Printf("   Stopping this service could crash your system or lock you out.\n\n")
		os.Exit(1)
	}

	// SAFETY: Check for systemd-* services
	if strings.HasPrefix(serviceName, "systemd-") {
		fmt.Printf("%s⛔ BLOCKED: systemd services are protected%s\n", BoldRed, Reset)
		fmt.Printf("   Stopping '%s' could destabilize your system.\n\n", serviceName)
		os.Exit(1)
	}

	fmt.Printf("\n%s⚙ Stop Service%s\n\n", BoldCyan, Reset)
	fmt.Printf("  Service: %s%s%s\n", Bold, serviceName, Reset)

	// Check if service exists
	checkCmd := exec.Command("systemctl", "is-active", serviceName)
	output, _ := checkCmd.Output()
	status := strings.TrimSpace(string(output))

	if status == "inactive" {
		fmt.Printf("  Status:  %sinactive%s\n", Dim, Reset)
		fmt.Printf("\n%s⚠ Service is already stopped%s\n\n", Yellow, Reset)
		return
	}

	fmt.Printf("  Status:  %s%s%s\n", Green, status, Reset)

	if !forceKill {
		fmt.Printf("\n%sAre you sure you want to stop this service? [y/N]:%s ", Bold, Reset)

		reader := bufio.NewReader(os.Stdin)
		response, _ := reader.ReadString('\n')
		response = strings.TrimSpace(strings.ToLower(response))

		if response != "y" && response != "yes" {
			fmt.Printf("%s✗ Aborted%s\n", Yellow, Reset)
			return
		}
	}

	fmt.Printf("\n%s→ Stopping service...%s\n", Cyan, Reset)

	// Already running as root due to auto-elevation
	stopCmd := exec.Command("systemctl", "stop", serviceName)
	stopCmd.Stdout = os.Stdout
	stopCmd.Stderr = os.Stderr

	if err := stopCmd.Run(); err != nil {
		fmt.Printf("%s✗ Failed to stop service: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	fmt.Printf("%s✓ Service '%s' stopped successfully%s\n\n", BoldGreen, serviceName, Reset)
}

func cmdWatch() {
	// Use alternate screen buffer and hide cursor for flicker-free updates
	fmt.Print("\033[?1049h") // Enter alternate screen buffer
	fmt.Print("\033[?25l")   // Hide cursor

	// Ensure cleanup on exit
	defer func() {
		fmt.Print("\033[?25h")   // Show cursor
		fmt.Print("\033[?1049l") // Exit alternate screen buffer
	}()

	// Handle interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	// Initial render
	renderWatchView()

	for {
		select {
		case <-ticker.C:
			renderWatchView()
		case <-sigChan:
			return
		}
	}
}

func renderWatchView() {
	// Build output in a buffer first to minimize screen updates
	var buf strings.Builder

	// Move cursor to home position
	buf.WriteString("\033[H")

	// Header
	buf.WriteString(fmt.Sprintf("%s⚡ PortWatch - Live Monitor%s (Press Ctrl+C to exit)\n\n", BoldCyan, Reset))

	ports, err := engine.SnapshotPorts()
	if err != nil {
		buf.WriteString(fmt.Sprintf("%s✗ Error: %v%s\n", BoldRed, err, Reset))
		fmt.Print(buf.String())
		return
	}

	now := time.Now().Format("15:04:05")
	buf.WriteString(fmt.Sprintf("%sUpdated: %s%s | %d active ports\n\n", Dim, now, Reset, len(ports)))

	buf.WriteString(fmt.Sprintf("%s%-8s %-15s %-10s %-8s %-20s %-15s%s\n", Bold,
		"PORT", "ADDRESS", "INTERFACE", "PID", "PROCESS", "TRAFFIC", Reset))
	buf.WriteString(fmt.Sprintf("%s%s%s\n", Dim, strings.Repeat("─", 85), Reset))

	for _, p := range ports {
		procName := "UNKNOWN"
		if p.Process != nil {
			procName = truncate(p.Process.Name, 20)
		}

		// Interface color
		ifaceColor := White
		switch p.Interface {
		case "loopback":
			ifaceColor = Green
		case "any":
			ifaceColor = Yellow
		case "public":
			ifaceColor = Red
		}

		// Traffic indicator
		traffic := "idle"
		trafficColor := Dim
		if p.Traffic != nil && p.Traffic.IsActive {
			traffic = "●active"
			trafficColor = Green
		}

		buf.WriteString(fmt.Sprintf("%-8d %-15s %s%-10s%s %-8d %-20s %s%-15s%s\n",
			p.Port, p.LocalAddr, ifaceColor, p.Interface, Reset,
			p.PID, procName, trafficColor, traffic, Reset))
	}

	// Clear remaining lines (in case ports were removed)
	buf.WriteString("\033[J")

	// Write entire buffer at once
	fmt.Print(buf.String())
}

func cmdServer() {
	// Import the existing server logic
	fmt.Printf("%s⚡ Starting PortWatch API Server...%s\n", BoldCyan, Reset)
	fmt.Printf("   Use %sportwatch list%s for CLI mode instead.\n\n", Bold, Reset)

	// Run the original engine server
	// This executes the server in-process by calling the engine's server code
	os.Args = []string{"portwatch-server"}

	// Execute the engine binary if available, otherwise start inline server
	enginePath := "/usr/local/bin/portwatch-engine"
	if _, err := os.Stat(enginePath); err == nil {
		cmd := exec.Command("pkexec", enginePath)
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Run()
	} else {
		fmt.Printf("%s⚠ Server mode requires separate engine binary%s\n", Yellow, Reset)
		fmt.Printf("   Run: cd engine && go run ./cmd/engine\n")
	}
}

func cmdUninstall() {
	fmt.Printf("\n%s🗑 Uninstall PortWatch%s\n\n", BoldRed, Reset)

	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("%s✗ Error finding binary path: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	fmt.Printf("  Binary location: %s%s%s\n", Bold, exe, Reset)
	fmt.Printf("\n%sAre you sure you want to uninstall PortWatch? [y/N]:%s ", Bold, Reset)

	reader := bufio.NewReader(os.Stdin)
	response, _ := reader.ReadString('\n')
	response = strings.TrimSpace(strings.ToLower(response))

	if response != "y" && response != "yes" {
		fmt.Printf("%s✗ Aborted%s\n", Yellow, Reset)
		return
	}

	fmt.Printf("\n%s→ Removing binary...%s\n", Cyan, Reset)

	err = os.Remove(exe)
	if err != nil {
		fmt.Printf("%s✗ Failed to remove binary: %v%s\n", BoldRed, err, Reset)
		os.Exit(1)
	}

	fmt.Printf("%s✓ PortWatch successfully uninstalled%s\n\n", BoldGreen, Reset)
	os.Exit(0)
}

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-3] + "..."
}
