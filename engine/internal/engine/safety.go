package engine

import (
	"runstate/engine/internal/proc"
	"strings"
)

// ProtectedPorts defines system-critical ports that require explicit override
var ProtectedPorts = map[int]string{
	22:    "SSH",
	53:    "DNS",
	80:    "HTTP (system)",
	443:   "HTTPS (system)",
	2375:  "Docker (unencrypted)",
	2376:  "Docker (TLS)",
	2377:  "Docker Swarm",
	3306:  "MySQL",
	5432:  "PostgreSQL",
	6379:  "Redis",
	27017: "MongoDB",
}

// ProtectedUsers are system accounts whose processes require override to kill
var ProtectedUsers = []string{"root", "systemd", "docker", "postgres", "mysql", "redis"}

// KillSimulation contains impact analysis for a potential kill operation
type KillSimulation struct {
	TargetPID       int32           `json:"target_pid"`
	TargetProcess   *proc.ProcInfo  `json:"target_process"`
	ChildProcesses  []proc.ProcInfo `json:"child_processes"`
	AffectedPorts   []int           `json:"affected_ports"`
	IsProtected     bool            `json:"is_protected"`
	ProtectedReason string          `json:"protected_reason,omitempty"`
	Warnings        []string        `json:"warnings"`
}

// IsProtectedPort checks if a port is system-critical
func IsProtectedPort(port int) (bool, string) {
	if reason, ok := ProtectedPorts[port]; ok {
		return true, reason
	}
	return false, ""
}

// IsProtectedUser checks if a username is a system account
func IsProtectedUser(username string) bool {
	username = strings.ToLower(username)
	for _, u := range ProtectedUsers {
		if username == u {
			return true
		}
	}
	return false
}

// IsProtectedProcess checks if a process should be protected from termination
func IsProtectedProcess(p *proc.ProcInfo) (bool, string) {
	if p == nil {
		return false, ""
	}

	// Check username
	if IsProtectedUser(p.Username) {
		return true, "Process owned by system user: " + p.Username
	}

	// Check for critical system processes
	criticalProcesses := []string{
		"systemd", "init", "sshd", "dockerd", "containerd",
		"Xorg", "Xwayland", "gnome-shell", "kwin", "plasma",
	}
	nameLower := strings.ToLower(p.Name)
	for _, cp := range criticalProcesses {
		if nameLower == strings.ToLower(cp) {
			return true, "System-critical process: " + p.Name
		}
	}

	return false, ""
}

// GetChildProcesses finds all descendant processes of a given PID
func GetChildProcesses(pid int32, processes map[int32]proc.ProcInfo) []proc.ProcInfo {
	children := []proc.ProcInfo{}

	var findChildren func(parentPID int32)
	findChildren = func(parentPID int32) {
		for _, p := range processes {
			if p.PPID == parentPID {
				children = append(children, p)
				findChildren(p.PID)
			}
		}
	}

	findChildren(pid)
	return children
}

// GetProcessPorts finds all ports owned by a process and its children
func GetProcessPorts(pid int32, children []proc.ProcInfo, ports []PortSnapshot) []int {
	// Collect all PIDs (target + children)
	pids := make(map[int32]bool)
	pids[pid] = true
	for _, child := range children {
		pids[child.PID] = true
	}

	// Find ports owned by these PIDs
	affectedPorts := []int{}
	for _, port := range ports {
		if pids[port.PID] {
			affectedPorts = append(affectedPorts, port.Port)
		}
	}

	return affectedPorts
}

// SimulateKill performs a dry-run analysis of killing a process
func SimulateKill(pid int32, processes map[int32]proc.ProcInfo, ports []PortSnapshot) KillSimulation {
	sim := KillSimulation{
		TargetPID:      pid,
		ChildProcesses: []proc.ProcInfo{},
		AffectedPorts:  []int{},
		Warnings:       []string{},
	}

	// Get target process info
	if p, ok := processes[pid]; ok {
		sim.TargetProcess = &p

		// Check if protected
		if protected, reason := IsProtectedProcess(&p); protected {
			sim.IsProtected = true
			sim.ProtectedReason = reason
		}

		// Check parent PID - warn if not a shell or terminal
		if p.PPID > 1 {
			if parent, ok := processes[p.PPID]; ok {
				shellPatterns := []string{"bash", "zsh", "sh", "fish", "terminal", "konsole", "gnome-terminal", "alacritty", "kitty", "wezterm"}
				isShell := false
				parentLower := strings.ToLower(parent.Name)
				for _, pattern := range shellPatterns {
					if strings.Contains(parentLower, pattern) {
						isShell = true
						break
					}
				}
				if !isShell {
					sim.Warnings = append(sim.Warnings, "Parent process is not a shell: "+parent.Name)
				}
			}
		}
	}

	// Get child processes
	sim.ChildProcesses = GetChildProcesses(pid, processes)
	if len(sim.ChildProcesses) > 0 {
		sim.Warnings = append(sim.Warnings,
			"Will terminate "+string(rune('0'+len(sim.ChildProcesses)))+" child process(es)")
	}

	// Get affected ports
	sim.AffectedPorts = GetProcessPorts(pid, sim.ChildProcesses, ports)

	// Check if any affected ports are protected
	for _, port := range sim.AffectedPorts {
		if protected, reason := IsProtectedPort(port); protected {
			sim.IsProtected = true
			sim.ProtectedReason = "Protected port " + reason + " will be affected"
			break
		}
	}

	return sim
}
