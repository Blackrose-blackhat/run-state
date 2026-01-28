package engine

import (
	"fmt"
	"regexp"
	"strings"
	"time"
)

// PortInsight contains explanation and status information for a port
type PortInsight struct {
	Explanation      string   `json:"explanation"`
	Icon             string   `json:"icon"`         // "docker", "node", "database", etc.
	AgeCategory      string   `json:"age_category"` // "fresh", "lingering", "forgotten"
	AgeDuration      string   `json:"age_duration"`
	IsForgotten      bool     `json:"is_forgotten"`
	ForgottenReasons []string `json:"forgotten_reasons,omitempty"`
}

// DevToolPatterns maps command patterns to human-readable explanations and icons
var DevToolPatterns = []struct {
	Pattern     *regexp.Regexp
	Explanation string
	Icon        string
}{
	// Node.js ecosystem
	{regexp.MustCompile(`(?i)vite`), "Vite Dev Server", "node"},
	{regexp.MustCompile(`(?i)webpack`), "Webpack Dev Server", "node"},
	{regexp.MustCompile(`(?i)next`), "Next.js Dev Server", "node"},
	{regexp.MustCompile(`(?i)nuxt`), "Nuxt.js Dev Server", "node"},
	{regexp.MustCompile(`(?i)react-scripts`), "CRA Dev Server", "node"},
	{regexp.MustCompile(`(?i)vue-cli|@vue/cli`), "Vue CLI Dev Server", "node"},
	{regexp.MustCompile(`(?i)angular.*serve`), "Angular Dev Server", "node"},
	{regexp.MustCompile(`(?i)esbuild`), "esbuild bundler", "node"},
	{regexp.MustCompile(`(?i)parcel`), "Parcel Dev Server", "node"},
	{regexp.MustCompile(`(?i)rollup.*watch`), "Rollup watcher", "node"},
	{regexp.MustCompile(`(?i)nodemon`), "Nodemon monitor", "node"},
	{regexp.MustCompile(`(?i)ts-node`), "TypeScript runtime", "node"},
	{regexp.MustCompile(`(?i)tsx\s`), "TSX runtime", "node"},
	{regexp.MustCompile(`(?i)express`), "Express.js Server", "node"},
	{regexp.MustCompile(`(?i)fastify`), "Fastify Server", "node"},
	{regexp.MustCompile(`(?i)koa`), "Koa Server", "node"},
	{regexp.MustCompile(`(?i)npm\s+run`), "npm script", "node"},
	{regexp.MustCompile(`(?i)pnpm\s`), "pnpm script", "node"},
	{regexp.MustCompile(`(?i)yarn\s`), "yarn script", "node"},
	{regexp.MustCompile(`(?i)bun\s`), "Bun runtime", "node"},

	// Python ecosystem
	{regexp.MustCompile(`(?i)flask`), "Flask Dev Server", "python"},
	{regexp.MustCompile(`(?i)django.*runserver`), "Django Dev Server", "python"},
	{regexp.MustCompile(`(?i)uvicorn`), "Uvicorn ASGI Server", "python"},
	{regexp.MustCompile(`(?i)gunicorn`), "Gunicorn WSGI Server", "python"},
	{regexp.MustCompile(`(?i)fastapi`), "FastAPI Server", "python"},
	{regexp.MustCompile(`(?i)streamlit`), "Streamlit app", "python"},
	{regexp.MustCompile(`(?i)jupyter`), "Jupyter Server", "python"},

	// Go ecosystem
	{regexp.MustCompile(`(?i)go\s+run`), "Go run command", "go"},
	{regexp.MustCompile(`(?i)air`), "Air live reload (Go)", "go"},
	{regexp.MustCompile(`(?i)gin`), "Gin framework", "go"},
	{regexp.MustCompile(`(?i)fiber`), "Fiber framework", "go"},
	{regexp.MustCompile(`(?i)echo`), "Echo framework", "go"},

	// Rust ecosystem
	{regexp.MustCompile(`(?i)cargo\s+(run|watch)`), "Cargo run/watch", "rust"},
	{regexp.MustCompile(`(?i)trunk\s+serve`), "Trunk dev server", "rust"},

	// Ruby ecosystem
	{regexp.MustCompile(`(?i)rails\s+s`), "Rails dev server", "ruby"},
	{regexp.MustCompile(`(?i)puma`), "Puma web server", "ruby"},

	// Java/JVM ecosystem
	{regexp.MustCompile(`(?i)spring-boot`), "Spring Boot app", "java"},

	// Database/Services
	{regexp.MustCompile(`(?i)postgres|postmaster`), "PostgreSQL Database", "database"},
	{regexp.MustCompile(`(?i)mysql|mysqld`), "MySQL Database", "database"},
	{regexp.MustCompile(`(?i)redis-server`), "Redis Server", "database"},
	{regexp.MustCompile(`(?i)mongod\s`), "MongoDB Server", "database"},
	{regexp.MustCompile(`(?i)sqlite`), "SQLite Database", "database"},
	{regexp.MustCompile(`(?i)memcached`), "Memcached Server", "database"},
	{regexp.MustCompile(`(?i)surreal\s`), "SurrealDB Server", "database"},
	{regexp.MustCompile(`(?i)clickhouse`), "ClickHouse Database", "database"},

	// Containerization & Orchestration
	{regexp.MustCompile(`(?i)docker-proxy`), "Docker Proxy", "docker"},
	{regexp.MustCompile(`(?i)dockerd`), "Docker Daemon", "docker"},
	{regexp.MustCompile(`(?i)containerd`), "Container Runtime", "docker"},
	{regexp.MustCompile(`(?i)kubelet`), "Kubernetes Kubelet", "k8s"},
	{regexp.MustCompile(`(?i)kube-proxy`), "Kubernetes Proxy", "k8s"},
	{regexp.MustCompile(`(?i)minikube`), "Minikube Cluster", "k8s"},
	{regexp.MustCompile(`(?i)kubectl`), "Kubernetes CLI", "k8s"},
	{regexp.MustCompile(`(?i)helm\s`), "Helm (K8s)", "k8s"},

	// Message Brokers
	{regexp.MustCompile(`(?i)rabbitmq`), "RabbitMQ Server", "message-broker"},
	{regexp.MustCompile(`(?i)kafka`), "Apache Kafka", "message-broker"},
	{regexp.MustCompile(`(?i)nats-server`), "NATS Server", "message-broker"},

	// Tauri/Electron
	{regexp.MustCompile(`(?i)tauri`), "Tauri dev server", "tauri"},
	{regexp.MustCompile(`(?i)electron`), "Electron app", "electron"},

	// Generic patterns (lower priority)
	{regexp.MustCompile(`(?i)node\s`), "Node.js process", "node"},
	{regexp.MustCompile(`(?i)python\d?(\s|$)`), "Python process", "python"},
	{regexp.MustCompile(`(?i)ruby\s`), "Ruby process", "ruby"},
	{regexp.MustCompile(`(?i)java\s`), "Java process", "java"},
	{regexp.MustCompile(`(?i)php\s`), "PHP process", "php"},
	{regexp.MustCompile(`(?i)bun\s`), "Bun process", "node"},
	{regexp.MustCompile(`(?i)deno\s`), "Deno process", "node"},
}

// NoisePatterns contains regexes for processes that should be hidden from snapshots
var NoisePatterns = []*regexp.Regexp{
	regexp.MustCompile(`(?i)antigravity`),
	regexp.MustCompile(`(?i)language_server`),
	regexp.MustCompile(`(?i)adb`),
	regexp.MustCompile(`(?i)GradleDaemon`),
	// System/IDE internal nodes if they are obviously noise
	regexp.MustCompile(`(?i)node.*language-server`),
}

// IDE/Editor patterns for forgotten port detection
var IDEPatterns = []string{
	"code", "cursor", "zed", "vim", "nvim", "neovim",
	"emacs", "sublime", "atom", "idea", "webstorm",
	"pycharm", "goland", "rubymine", "phpstorm",
	"clion", "rider", "android-studio", "fleet",
}

// Terminal patterns
var TerminalPatterns = []string{
	"bash", "zsh", "sh", "fish", "terminal",
	"konsole", "gnome-terminal", "alacritty", "kitty",
	"wezterm", "iterm", "hyper", "tmux", "screen",
}

// ExplainProcess generates a human-readable explanation and icon for a process
func ExplainProcess(cmdline string, name string) (string, string) {
	if cmdline == "" && name == "" {
		return "System or Container Service", "docker"
	}

	// Try cmdline first (more specific)
	for _, pattern := range DevToolPatterns {
		if pattern.Pattern.MatchString(cmdline) {
			return pattern.Explanation, pattern.Icon
		}
	}

	// Fallback to process name
	for _, pattern := range DevToolPatterns {
		if pattern.Pattern.MatchString(name) {
			return pattern.Explanation, pattern.Icon
		}
	}

	// Terminal check
	for _, term := range TerminalPatterns {
		if strings.Contains(strings.ToLower(cmdline), term) || strings.Contains(strings.ToLower(name), term) {
			return "Terminal Session", "terminal"
		}
	}

	// Generic fallback
	if name != "" {
		return "Started by " + name, "system"
	}
	return "System Service", "system"
}

// IsDevProcess checks if a process matches any developer tool patterns
func IsDevProcess(cmdline string, name string) bool {
	_, icon := ExplainProcess(cmdline, name)
	return icon != "system"
}

// IsNoiseProcess returns true if a process is likely irrelevant to the user
func IsNoiseProcess(cmdline string, name string) bool {
	for _, pattern := range NoisePatterns {
		if pattern.MatchString(cmdline) || pattern.MatchString(name) {
			return true
		}
	}
	return false
}

// CategorizeAge returns the age category and human-readable duration
func CategorizeAge(firstSeen time.Time) (category string, duration string) {
	age := time.Since(firstSeen)

	// Format duration
	if age < time.Minute {
		duration = fmt.Sprintf("%ds", int(age.Seconds()))
	} else if age < time.Hour {
		duration = fmt.Sprintf("%dm %ds", int(age.Minutes()), int(age.Seconds())%60)
	} else if age < 24*time.Hour {
		duration = fmt.Sprintf("%dh %dm", int(age.Hours()), int(age.Minutes())%60)
	} else {
		duration = fmt.Sprintf("%dd %dh", int(age.Hours()/24), int(age.Hours())%24)
	}

	// Categorize
	switch {
	case age < 5*time.Minute:
		category = "fresh"
	case age < 15*time.Minute:
		category = "lingering"
	default:
		category = "forgotten"
	}

	return category, duration
}

// IsForgottenPort determines if a port appears to be forgotten
func IsForgottenPort(firstSeen time.Time, cmdline string, processName string, threshold time.Duration) (bool, []string) {
	reasons := []string{}
	age := time.Since(firstSeen)

	// Criterion 1: Open longer than threshold
	if age < threshold {
		return false, nil
	}
	reasons = append(reasons, fmt.Sprintf("Open for %s (threshold: %s)",
		formatDuration(age), formatDuration(threshold)))

	// Criterion 2: Parent is IDE/editor (high confidence of forgotten)
	cmdLower := strings.ToLower(cmdline)
	nameLower := strings.ToLower(processName)

	for _, ide := range IDEPatterns {
		if strings.Contains(cmdLower, ide) || strings.Contains(nameLower, ide) {
			reasons = append(reasons, "Spawned by IDE/editor: "+ide)
			break
		}
	}

	// Criterion 3: Parent is terminal (medium confidence)
	for _, term := range TerminalPatterns {
		if strings.Contains(cmdLower, term) || strings.Contains(nameLower, term) {
			reasons = append(reasons, "Running in terminal session")
			break
		}
	}

	// Criterion 4: Common dev port ranges
	// This would require port number, handled at call site

	return len(reasons) >= 2, reasons
}

func formatDuration(d time.Duration) string {
	if d < time.Minute {
		return fmt.Sprintf("%ds", int(d.Seconds()))
	} else if d < time.Hour {
		return fmt.Sprintf("%dm", int(d.Minutes()))
	} else {
		return fmt.Sprintf("%dh %dm", int(d.Hours()), int(d.Minutes())%60)
	}
}

// GenerateInsight creates a complete PortInsight for a port
func GenerateInsight(firstSeen time.Time, cmdline string, processName string, forgottenThreshold time.Duration) *PortInsight {
	category, duration := CategorizeAge(firstSeen)
	explanation, icon := ExplainProcess(cmdline, processName)
	isForgotten, reasons := IsForgottenPort(firstSeen, cmdline, processName, forgottenThreshold)

	return &PortInsight{
		Explanation:      explanation,
		Icon:             icon,
		AgeCategory:      category,
		AgeDuration:      duration,
		IsForgotten:      isForgotten,
		ForgottenReasons: reasons,
	}
}
