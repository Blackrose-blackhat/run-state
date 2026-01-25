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
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:1420")
	w.Header().Set("Access-Control-Allow-Methods", "GET, OPTIONS")
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

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}

	port := ln.Addr().(*net.TCPAddr).Port
	fmt.Printf("PORT=%d\n", port)

	server := &http.Server{
		Handler: mux,
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
