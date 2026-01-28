package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"runstate/engine/internal/engine"
	"runstate/engine/internal/proc"
	"syscall"
	"time"
)

func withCORS(w http.ResponseWriter, r *http.Request) bool {
	// Allow all origins for development
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return true
	}
	return false
}

func main() {
	log.SetPrefix("[engine]")
	mux := http.NewServeMux()

	mux.HandleFunc("/processes", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		w.Header().Set("Content-Type", "application/json")

		snapshot, err := proc.Snapshot()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Also get ports to identify port owners
		ports, _ := engine.SnapshotPorts()
		portOwners := make(map[int32]bool)
		for _, p := range ports {
			portOwners[p.PID] = true
		}

		// Enrich with IsDev and Icon
		for pid, info := range snapshot {
			// Skip noise processes
			if engine.IsNoiseProcess(info.Cmdline, info.Name) {
				delete(snapshot, pid)
				continue
			}

			_, icon := engine.ExplainProcess(info.Cmdline, info.Name)

			// Strictly dev-centric: recognized dev tool or terminal session
			// or a port owner that ISN'T a known system process
			isSystem := (icon == "system")
			isDevTool := (icon != "system" && icon != "docker") // node, python, go, etc.
			isContainer := (icon == "docker")

			if isDevTool || isContainer || (portOwners[pid] && !isSystem) {
				info.IsDev = true
				info.Icon = icon
				snapshot[pid] = info
			}
		}

		json.NewEncoder(w).Encode(snapshot)
	})

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		w.Header().Set("Content-Type", "application/json")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		w.Write([]byte("OK"))
	})
	mux.HandleFunc("/ports", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		w.Header().Set("Content-Type", "application/json")

		data, err := engine.SnapshotPorts()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(data)
	})
	// Kill simulation endpoint - dry run impact analysis
	mux.HandleFunc("/kill/simulate", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		var req struct {
			PID int32 `json:"pid"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Get current state
		processes, err := proc.Snapshot()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		ports, err := engine.SnapshotPorts()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Simulate the kill
		simulation := engine.SimulateKill(req.PID, processes, ports)
		json.NewEncoder(w).Encode(simulation)
	})

	// Data export endpoint - saves directly to Downloads folder
	mux.HandleFunc("/export", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			Data     string `json:"data"`
			Filename string `json:"filename"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		home, err := os.UserHomeDir()
		if err != nil {
			http.Error(w, "Could not find home directory", http.StatusInternalServerError)
			return
		}

		downloadDir := fmt.Sprintf("%s/Downloads", home)
		if err := os.MkdirAll(downloadDir, 0755); err != nil {
			http.Error(w, "Could not create downloads directory", http.StatusInternalServerError)
			return
		}

		filePath := fmt.Sprintf("%s/%s", downloadDir, req.Filename)
		if err := os.WriteFile(filePath, []byte(req.Data), 0644); err != nil {
			http.Error(w, "Failed to write file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{
			"status": "success",
			"path":   filePath,
		})
	})

	mux.HandleFunc("/kill", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}
		w.Header().Set("Content-Type", "application/json")

		var req struct {
			PID   int  `json:"pid"`
			Force bool `json:"force"` // Skip SIGTERM, go straight to SIGKILL
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		targetProc, err := os.FindProcess(req.PID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		type KillResult struct {
			Success bool   `json:"success"`
			Phase   string `json:"phase"` // "sigterm" or "sigkill"
			Message string `json:"message"`
		}

		// Phase 1: SIGTERM (graceful)
		if !req.Force {
			if err := targetProc.Signal(syscall.SIGTERM); err != nil {
				// Process might already be dead
				json.NewEncoder(w).Encode(KillResult{
					Success: true,
					Phase:   "sigterm",
					Message: "Process already terminated or inaccessible",
				})
				return
			}

			// Wait up to 4 seconds for graceful termination
			terminated := false
			for i := 0; i < 8; i++ {
				time.Sleep(500 * time.Millisecond)
				// Check if process still exists by sending signal 0
				if err := targetProc.Signal(syscall.Signal(0)); err != nil {
					terminated = true
					break
				}
			}

			if terminated {
				json.NewEncoder(w).Encode(KillResult{
					Success: true,
					Phase:   "sigterm",
					Message: "Process terminated gracefully",
				})
				return
			}

			// Process still alive, escalate to SIGKILL
			log.Printf("[kill] PID %d did not respond to SIGTERM, escalating to SIGKILL", req.PID)
		}

		// Phase 2: SIGKILL (forced)
		if err := targetProc.Signal(syscall.SIGKILL); err != nil {
			json.NewEncoder(w).Encode(KillResult{
				Success: false,
				Phase:   "sigkill",
				Message: "Failed to force kill: " + err.Error(),
			})
			return
		}

		json.NewEncoder(w).Encode(KillResult{
			Success: true,
			Phase:   "sigkill",
			Message: "Process force terminated",
		})
	})

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}

	port := ln.Addr().(*net.TCPAddr).Port
	fmt.Printf("PORT=%d\n", port)

	// Recovery middleware to prevent engine crashes from unexpected panics
	recoveryHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("[CRITICAL] Panic caught by middleware: %v", err)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		mux.ServeHTTP(w, r)
	})

	// Logging middleware for engineering observability
	loggingHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		recoveryHandler.ServeHTTP(w, r)
		log.Printf("%s %s %s", r.Method, r.URL.Path, time.Since(start))
	})

	server := &http.Server{
		Handler: loggingHandler,
	}
	go func() {
		if err := server.Serve(ln); err != nil && err != http.ErrServerClosed {
			log.Fatal(err)
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, syscall.SIGINT, syscall.SIGTERM)
	<-sig

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	server.Shutdown(ctx)
	log.Println("shutdown complete")
}
