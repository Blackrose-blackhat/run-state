#!/usr/bin/env bash
#
# PortWatch CLI Installer
# Easy, interactive installation for Linux
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

# Symbols
CHECK="${GREEN}✓${RESET}"
CROSS="${RED}✗${RESET}"
WARN="${YELLOW}⚠${RESET}"
ARROW="${CYAN}→${RESET}"

# Spinner frames
SPINNER_FRAMES=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")

# Print functions
print_header() {
    echo -e "\n${BOLD}${CYAN}⚡ PortWatch CLI Installer${RESET}"
    echo -e "${DIM}━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
}

print_step() {
    echo -e "${ARROW} $1"
}

print_success() {
    echo -e "  ${CHECK} $1"
}

print_error() {
    echo -e "  ${CROSS} $1"
}

print_warn() {
    echo -e "  ${WARN} $1"
}

# Spinner function
spinner() {
    local pid=$1
    local message=$2
    local i=0
    
    while kill -0 $pid 2>/dev/null; do
        printf "\r  ${CYAN}${SPINNER_FRAMES[$i]}${RESET} $message"
        i=$(( (i + 1) % ${#SPINNER_FRAMES[@]} ))
        sleep 0.1
    done
    printf "\r"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get Go version
get_go_version() {
    go version 2>/dev/null | grep -oP 'go\K[0-9]+\.[0-9]+' || echo "0"
}

# Compare versions (returns 0 if $1 >= $2)
version_gte() {
    [ "$(printf '%s\n' "$1" "$2" | sort -V | head -n1)" = "$2" ]
}

# Check if running in a git repo or as a one-liner
is_local_repo() {
    [ -d "$SCRIPT_DIR/engine" ] && [ -f "$SCRIPT_DIR/engine/go.mod" ]
}

# Detect architecture
get_arch() {
    local arch=$(uname -m)
    case "$arch" in
        x86_64) echo "amd64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) echo "unknown" ;;
    esac
}

# Download binary from GitHub
download_binary() {
    local arch=$(get_arch)
    if [ "$arch" = "unknown" ]; then
        print_error "Unsupported architecture: $(uname -m)"
        exit 1
    fi

    # Get latest version from GitHub API (fallback to a hardcoded version if needed)
    print_step "Fetching latest release info..."
    local repo="Blackrose-blackhat/run-state"
    local version=$(curl -s "https://api.github.com/repos/$repo/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    
    if [ -z "$version" ]; then
        print_error "Could not fetch latest version from GitHub"
        exit 1
    fi
    
    print_success "Latest version: $version"
    
    local binary_name="portwatch-linux-$arch"
    local tar_name="$binary_name.tar.gz"
    local download_url="https://github.com/$repo/releases/download/$version/$tar_name"
    
    print_step "Downloading $tar_name..."
    local temp_dir=$(mktemp -d)
    curl -sSL "$download_url" -o "$temp_dir/$tar_name"
    
    if [ ! -f "$temp_dir/$tar_name" ]; then
        print_error "Download failed"
        exit 1
    fi
    
    print_step "Extracting binary..."
    tar -xzf "$temp_dir/$tar_name" -C "$temp_dir"
    
    if [ ! -f "$temp_dir/$binary_name" ]; then
        print_error "Extraction failed - binary not found"
        exit 1
    fi
    
    mv "$temp_dir/$binary_name" "$temp_dir/portwatch"
    echo "$temp_dir/portwatch"
}

# Main installation
main() {
    print_header
    
    # Detect script location
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    
    echo -e "${BOLD}Checking environment...${RESET}\n"
    
    # Check OS
    if [[ "$(uname)" != "Linux" ]]; then
        print_error "This installer only supports Linux"
        exit 1
    fi
    print_success "Linux detected"
    
    INSTALL_STRATEGY="binary"
    
    if is_local_repo; then
        print_success "Local repository detected"
        if command_exists go; then
            GO_VERSION=$(get_go_version)
            if version_gte "$GO_VERSION" "1.21"; then
                print_success "Go $GO_VERSION found (can build from source)"
                INSTALL_STRATEGY="source"
            fi
        fi
    fi

    if [ "$INSTALL_STRATEGY" = "binary" ]; then
        print_warn "Will install pre-built binary (standard for users)"
    fi
    
    echo ""
    
    # Installation location choice
    echo -e "${BOLD}Where would you like to install?${RESET}\n"
    echo -e "  ${GREEN}[1]${RESET} /usr/local/bin ${DIM}(system-wide, requires sudo)${RESET}"
    echo -e "  ${GREEN}[2]${RESET} ~/.local/bin   ${DIM}(user only, no sudo needed)${RESET}"
    echo ""
    
    read -p "$(echo -e "${BOLD}Choice [1/2]:${RESET} ")" choice
    
    case "$choice" in
        1)
            INSTALL_DIR="/usr/local/bin"
            NEED_SUDO=true
            ;;
        2)
            INSTALL_DIR="$HOME/.local/bin"
            NEED_SUDO=false
            mkdir -p "$INSTALL_DIR"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    echo ""
    
    local BINARY_PATH=""
    
    if [ "$INSTALL_STRATEGY" = "source" ]; then
        print_step "Building portwatch from source..."
        cd "$SCRIPT_DIR/engine"
        
        VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
        BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')
        LDFLAGS="-X main.Version=$VERSION -X main.BuildTime=$BUILD_TIME -s -w"
        
        (CGO_ENABLED=0 GOOS=linux GOARCH=$(get_arch) go build -ldflags "$LDFLAGS" -o portwatch ./cmd/portwatch) &
        BUILD_PID=$!
        spinner $BUILD_PID "Compiling..."
        
        wait $BUILD_PID
        if [ $? -ne 0 ]; then
            print_error "Build failed"
            exit 1
        fi
        BINARY_PATH="$SCRIPT_DIR/engine/portwatch"
        print_success "Build complete"
    else
        BINARY_PATH=$(download_binary)
        print_success "Binary download complete"
    fi
    
    # Install
    print_step "Installing to $INSTALL_DIR..."
    
    if [ "$NEED_SUDO" = true ]; then
        sudo install -m 755 "$BINARY_PATH" "$INSTALL_DIR/portwatch"
    else
        install -m 755 "$BINARY_PATH" "$INSTALL_DIR/portwatch"
    fi
    print_success "Installed: $INSTALL_DIR/portwatch"
    
    # Clean up
    if [ "$INSTALL_STRATEGY" = "source" ]; then
        rm -f "$BINARY_PATH"
    else
        rm -rf "$(dirname "$BINARY_PATH")"
    fi
    
    # Check PATH for user install
    if [ "$NEED_SUDO" = false ]; then
        if ! echo "$PATH" | grep -q "$HOME/.local/bin"; then
            echo ""
            print_warn "~/.local/bin is not in your PATH"
            echo ""
            echo -e "  Add this to your ${CYAN}~/.bashrc${RESET} or ${CYAN}~/.zshrc${RESET}:"
            echo -e "  ${DIM}export PATH=\"\$HOME/.local/bin:\$PATH\"${RESET}"
            echo ""
            echo -e "  Then run: ${CYAN}source ~/.bashrc${RESET}"
        fi
    fi
    
    echo ""
    echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}${GREEN}✓ Installation complete!${RESET}"
    echo -e "${BOLD}${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    echo -e "  Run ${CYAN}portwatch --help${RESET} to get started"
    echo -e "  Run ${CYAN}portwatch list${RESET} to see active ports"
    echo ""
    
    # Quick version check
    if command_exists portwatch || [ -x "$INSTALL_DIR/portwatch" ]; then
        echo -e "${DIM}$("$INSTALL_DIR/portwatch" version 2>/dev/null || echo "")${RESET}"
    fi
    echo ""
}

# Uninstall function
uninstall() {
    print_header
    echo -e "${BOLD}Uninstalling PortWatch...${RESET}\n"
    
    REMOVED=false
    
    if [ -f "/usr/local/bin/portwatch" ]; then
        print_step "Removing from /usr/local/bin..."
        sudo rm -f /usr/local/bin/portwatch
        print_success "Removed"
        REMOVED=true
    fi
    
    if [ -f "$HOME/.local/bin/portwatch" ]; then
        print_step "Removing from ~/.local/bin..."
        rm -f "$HOME/.local/bin/portwatch"
        print_success "Removed"
        REMOVED=true
    fi
    
    if [ "$REMOVED" = false ]; then
        print_warn "PortWatch is not installed"
    else
        echo ""
        print_success "Uninstallation complete"
    fi
    echo ""
}

# Parse arguments
case "${1:-}" in
    --uninstall|-u)
        uninstall
        ;;
    --help|-h)
        echo "PortWatch CLI Installer"
        echo ""
        echo "Usage: ./install.sh [options]"
        echo ""
        echo "Options:"
        echo "  --uninstall, -u    Uninstall portwatch"
        echo "  --help, -h         Show this help"
        ;;
    *)
        main
        ;;
esac
