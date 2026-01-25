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
	AgeCategory      string   `json:"age_category"` // "fresh", "lingering", "forgotten"
	AgeDuration      string   `json:"age_duration"`
	IsForgotten      bool     `json:"is_forgotten"`
	ForgottenReasons []string `json:"forgotten_reasons,omitempty"`
}

// DevToolPatterns maps command patterns to human-readable explanations
var DevToolPatterns = []struct {
	Pattern     *regexp.Regexp
	Explanation string
}{
	// Node.js ecosystem
	{regexp.MustCompile(`(?i)vite`), "Vite dev server"},
	{regexp.MustCompile(`(?i)webpack`), "Webpack dev server"},
	{regexp.MustCompile(`(?i)next`), "Next.js dev server"},
	{regexp.MustCompile(`(?i)nuxt`), "Nuxt.js dev server"},
	{regexp.MustCompile(`(?i)react-scripts`), "Create React App dev server"},
	{regexp.MustCompile(`(?i)vue-cli|@vue/cli`), "Vue CLI dev server"},
	{regexp.MustCompile(`(?i)angular.*serve`), "Angular dev server"},
	{regexp.MustCompile(`(?i)esbuild`), "esbuild bundler"},
	{regexp.MustCompile(`(?i)parcel`), "Parcel dev server"},
	{regexp.MustCompile(`(?i)rollup.*watch`), "Rollup watcher"},
	{regexp.MustCompile(`(?i)nodemon`), "Nodemon process monitor"},
	{regexp.MustCompile(`(?i)ts-node`), "TypeScript runtime"},
	{regexp.MustCompile(`(?i)tsx\s`), "TSX runtime"},
	{regexp.MustCompile(`(?i)express`), "Express.js server"},
	{regexp.MustCompile(`(?i)fastify`), "Fastify server"},
	{regexp.MustCompile(`(?i)koa`), "Koa server"},
	{regexp.MustCompile(`(?i)npm\s+run`), "npm script"},
	{regexp.MustCompile(`(?i)pnpm\s`), "pnpm script"},
	{regexp.MustCompile(`(?i)yarn\s`), "yarn script"},
	{regexp.MustCompile(`(?i)bun\s`), "Bun runtime"},

	// Python ecosystem
	{regexp.MustCompile(`(?i)flask`), "Flask dev server"},
	{regexp.MustCompile(`(?i)django.*runserver`), "Django dev server"},
	{regexp.MustCompile(`(?i)uvicorn`), "Uvicorn ASGI server"},
	{regexp.MustCompile(`(?i)gunicorn`), "Gunicorn WSGI server"},
	{regexp.MustCompile(`(?i)fastapi`), "FastAPI server"},
	{regexp.MustCompile(`(?i)streamlit`), "Streamlit app"},
	{regexp.MustCompile(`(?i)jupyter`), "Jupyter server"},
	{regexp.MustCompile(`(?i)python.*-m\s+http`), "Python HTTP server"},
	{regexp.MustCompile(`(?i)python.*SimpleHTTP`), "Python SimpleHTTP server"},

	// Go ecosystem
	{regexp.MustCompile(`(?i)go\s+run`), "Go run command"},
	{regexp.MustCompile(`(?i)air`), "Air live reload (Go)"},
	{regexp.MustCompile(`(?i)gin`), "Gin web framework"},
	{regexp.MustCompile(`(?i)fiber`), "Fiber web framework"},
	{regexp.MustCompile(`(?i)echo`), "Echo web framework"},

	// Rust ecosystem
	{regexp.MustCompile(`(?i)cargo\s+(run|watch)`), "Cargo run/watch"},
	{regexp.MustCompile(`(?i)trunk\s+serve`), "Trunk dev server (WASM)"},

	// Ruby ecosystem
	{regexp.MustCompile(`(?i)rails\s+s`), "Rails dev server"},
	{regexp.MustCompile(`(?i)puma`), "Puma web server"},
	{regexp.MustCompile(`(?i)webrick`), "WEBrick server"},

	// Java/JVM ecosystem
	{regexp.MustCompile(`(?i)spring-boot`), "Spring Boot app"},
	{regexp.MustCompile(`(?i)gradle.*bootRun`), "Gradle bootRun"},
	{regexp.MustCompile(`(?i)mvn.*spring-boot:run`), "Maven Spring Boot"},

	// PHP ecosystem
	{regexp.MustCompile(`(?i)php\s+-S`), "PHP built-in server"},
	{regexp.MustCompile(`(?i)artisan\s+serve`), "Laravel dev server"},

	// Database/Services
	{regexp.MustCompile(`(?i)postgres`), "PostgreSQL database"},
	{regexp.MustCompile(`(?i)mysql`), "MySQL database"},
	{regexp.MustCompile(`(?i)redis-server`), "Redis server"},
	{regexp.MustCompile(`(?i)mongo`), "MongoDB server"},

	// Tauri/Electron
	{regexp.MustCompile(`(?i)tauri`), "Tauri dev server"},
	{regexp.MustCompile(`(?i)electron`), "Electron app"},

	// Generic patterns (lower priority)
	{regexp.MustCompile(`(?i)node\s`), "Node.js process"},
	{regexp.MustCompile(`(?i)python\d?(\s|$)`), "Python process"},
	{regexp.MustCompile(`(?i)ruby\s`), "Ruby process"},
	{regexp.MustCompile(`(?i)java\s`), "Java process"},
	{regexp.MustCompile(`(?i)php\s`), "PHP process"},
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

// ExplainProcess generates a human-readable explanation for a process
func ExplainProcess(cmdline string, name string) string {
	// Try cmdline first (more specific)
	for _, pattern := range DevToolPatterns {
		if pattern.Pattern.MatchString(cmdline) {
			return pattern.Explanation
		}
	}

	// Fallback to process name
	for _, pattern := range DevToolPatterns {
		if pattern.Pattern.MatchString(name) {
			return pattern.Explanation
		}
	}

	// Generic fallback
	if name != "" {
		return "Started by " + name
	}
	return "Unknown origin"
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
	explanation := ExplainProcess(cmdline, processName)
	isForgotten, reasons := IsForgottenPort(firstSeen, cmdline, processName, forgottenThreshold)

	return &PortInsight{
		Explanation:      explanation,
		AgeCategory:      category,
		AgeDuration:      duration,
		IsForgotten:      isForgotten,
		ForgottenReasons: reasons,
	}
}
