# PortWatch CLI Makefile
# Build and install the portwatch CLI tool

BINARY_NAME := portwatch
VERSION := $(shell git describe --tags --always --dirty 2>/dev/null || echo "dev")
BUILD_TIME := $(shell date -u '+%Y-%m-%d_%H:%M:%S')
LDFLAGS := -ldflags "-X main.Version=$(VERSION) -X main.BuildTime=$(BUILD_TIME) -s -w"

# Installation directories
PREFIX ?= /usr/local
BINDIR := $(PREFIX)/bin

.PHONY: all build install uninstall clean help

all: build

## build: Compile the portwatch binary
build:
	@echo "⚡ Building $(BINARY_NAME)..."
	@CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME) ./cmd/portwatch
	@echo "✓ Built: ./$(BINARY_NAME)"

## install: Install portwatch to $(BINDIR) (requires sudo)
install: build
	@echo "⚡ Installing $(BINARY_NAME) to $(BINDIR)..."
	@sudo install -m 755 $(BINARY_NAME) $(BINDIR)/$(BINARY_NAME)
	@echo "✓ Installed: $(BINDIR)/$(BINARY_NAME)"
	@echo ""
	@echo "Run 'portwatch --help' to get started!"

## uninstall: Remove portwatch from $(BINDIR)
uninstall:
	@echo "⚡ Removing $(BINARY_NAME) from $(BINDIR)..."
	@sudo rm -f $(BINDIR)/$(BINARY_NAME)
	@echo "✓ Uninstalled"

## clean: Remove build artifacts
clean:
	@echo "⚡ Cleaning..."
	@rm -f $(BINARY_NAME)
	@echo "✓ Cleaned"

## user-install: Install to ~/.local/bin (no sudo required)
user-install: build
	@echo "⚡ Installing $(BINARY_NAME) to ~/.local/bin..."
	@mkdir -p ~/.local/bin
	@install -m 755 $(BINARY_NAME) ~/.local/bin/$(BINARY_NAME)
	@echo "✓ Installed: ~/.local/bin/$(BINARY_NAME)"
	@echo ""
	@if ! echo "$$PATH" | grep -q "$$HOME/.local/bin"; then \
		echo "⚠ Add ~/.local/bin to your PATH:"; \
		echo "  export PATH=\"\$$HOME/.local/bin:\$$PATH\""; \
		echo ""; \
	fi
	@echo "Run 'portwatch --help' to get started!"

## user-uninstall: Remove from ~/.local/bin
user-uninstall:
	@echo "⚡ Removing $(BINARY_NAME) from ~/.local/bin..."
	@rm -f ~/.local/bin/$(BINARY_NAME)
	@echo "✓ Uninstalled"

## help: Show this help message
help:
	@echo "⚡ PortWatch Makefile"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | column -t -s ':' | sed 's/^/  /'
