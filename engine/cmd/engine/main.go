package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net"
	"net/http"
	"os"
	"os/exec"
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
			Force bool `json:"force"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if req.PID <= 0 {
			http.Error(w, "Cannot terminate system kernel process (PID 0)", http.StatusForbidden)
			return
		}

		targetProc, err := os.FindProcess(req.PID)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		type KillResult struct {
			Success bool   `json:"success"`
			Phase   string `json:"phase"`
			Message string `json:"message"`
		}

		// Phase 1: SIGTERM
		if !req.Force {
			if err := targetProc.Signal(syscall.SIGTERM); err == nil {
				// Wait for graceful termination
				for i := 0; i < 8; i++ {
					time.Sleep(500 * time.Millisecond)
					if err := targetProc.Signal(syscall.Signal(0)); err != nil {
						json.NewEncoder(w).Encode(KillResult{Success: true, Phase: "sigterm", Message: "Terminated gracefully"})
						return
					}
				}
			}
		}

		// Phase 2: SIGKILL
		if err := targetProc.Signal(syscall.SIGKILL); err != nil {
			json.NewEncoder(w).Encode(KillResult{Success: false, Phase: "sigkill", Message: err.Error()})
			return
		}

		json.NewEncoder(w).Encode(KillResult{Success: true, Phase: "sigkill", Message: "Force terminated"})
	})

	mux.HandleFunc("/service/stop", func(w http.ResponseWriter, r *http.Request) {
		if withCORS(w, r) {
			return
		}
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			ServiceName string `json:"service_name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		// Execute systemctl stop directly (assumes engine runs as root via pkexec)
		cmd := exec.Command("systemctl", "stop", req.ServiceName)
		output, err := cmd.CombinedOutput()

		type ServiceResult struct {
			Success bool   `json:"success"`
			Message string `json:"message"`
		}

		if err != nil {
			json.NewEncoder(w).Encode(ServiceResult{
				Success: false,
				Message: fmt.Sprintf("Failed to stop service: %s. Output: %s", err, string(output)),
			})
			return
		}

		json.NewEncoder(w).Encode(ServiceResult{
			Success: true,
			Message: fmt.Sprintf("Service %s stopped successfully", req.ServiceName),
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
