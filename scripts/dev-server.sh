#!/bin/bash
#
# Dev Server Control Script
#
# Manages the NVC RAGbot development server lifecycle.
# Usage: ./scripts/dev-server.sh [command]
#
# Commands:
#   start      Start the development server (foreground)
#   start --background  Start in background
#   stop       Stop the development server
#   restart    Restart the development server
#   status     Check if server is running
#   test       Run the test suite
#   logs       Show server logs
#   help       Show this help message
#

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PID_FILE="$PROJECT_ROOT/.dev-server.pid"
LOG_FILE="$PROJECT_ROOT/.dev-server.log"
PORT="${PORT:-3000}"

# Ensure PATH includes common Node.js locations
export PATH="/opt/homebrew/bin:/usr/local/bin:$PROJECT_ROOT/node_modules/.bin:$PATH"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print colored output
print_status() {
    echo -e "${BLUE}[NVC RAGbot]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

# Check if server is running
is_running() {
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Get the current PID
get_pid() {
    if [ -f "$PID_FILE" ]; then
        cat "$PID_FILE"
    fi
}

# Start the server
cmd_start() {
    local background=false

    # Check for --background flag
    if [ "$1" == "--background" ]; then
        background=true
    fi

    if is_running; then
        local pid=$(get_pid)
        print_warning "Server is already running (PID: $pid)"
        return 0
    fi

    print_status "Starting development server on port $PORT..."

    cd "$PROJECT_ROOT"

    if [ "$background" = true ]; then
        # Start in background with explicit PATH for node/npm/next
        PATH="/opt/homebrew/bin:/usr/local/bin:$PROJECT_ROOT/node_modules/.bin:$PATH" \
            nohup npm run dev > "$LOG_FILE" 2>&1 &
        local pid=$!
        echo "$pid" > "$PID_FILE"
        print_success "Server started in background (PID: $pid)"
        print_status "Logs: $LOG_FILE"
        print_status "View logs: ./scripts/dev-server.sh logs"
    else
        # Start in foreground
        print_status "Press Ctrl+C to stop"
        npm run dev
    fi
}

# Stop the server
cmd_stop() {
    if ! is_running; then
        print_warning "Server is not running"
        # Clean up stale PID file
        rm -f "$PID_FILE"
        return 0
    fi

    local pid=$(get_pid)
    print_status "Stopping server (PID: $pid)..."

    # Send SIGTERM first
    kill "$pid" 2>/dev/null || true

    # Wait for process to stop
    local count=0
    while ps -p "$pid" > /dev/null 2>&1 && [ $count -lt 10 ]; do
        sleep 1
        count=$((count + 1))
    done

    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        print_warning "Force stopping..."
        kill -9 "$pid" 2>/dev/null || true
    fi

    rm -f "$PID_FILE"
    print_success "Server stopped"
}

# Restart the server
cmd_restart() {
    print_status "Restarting server..."
    cmd_stop
    sleep 1
    cmd_start --background
}

# Check server status
cmd_status() {
    if is_running; then
        local pid=$(get_pid)
        print_success "Server is running (PID: $pid)"
        print_status "Port: $PORT"
        print_status "URL: http://localhost:$PORT"
        return 0
    else
        print_warning "Server is not running"
        # Clean up stale PID file
        rm -f "$PID_FILE"
        return 1
    fi
}

# Run tests
cmd_test() {
    print_status "Running tests..."
    cd "$PROJECT_ROOT"
    npm test "$@"
}

# Show logs
cmd_logs() {
    if [ -f "$LOG_FILE" ]; then
        print_status "Log file: $LOG_FILE"
        print_status "Last 50 lines:"
        echo "---"
        tail -50 "$LOG_FILE"
    else
        print_warning "No log file found at $LOG_FILE"
        print_status "Start server with --background to create logs"
    fi
}

# Show help
cmd_help() {
    echo "NVC RAGbot Dev Server Control"
    echo ""
    echo "Usage: $0 [command] [options]"
    echo ""
    echo "Commands:"
    echo "  start              Start the development server (foreground)"
    echo "  start --background Start the server in background"
    echo "  stop               Stop the development server"
    echo "  restart            Restart the development server"
    echo "  status             Check if server is running"
    echo "  test [args]        Run the test suite (passes args to jest)"
    echo "  logs               Show server logs"
    echo "  help, --help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start --background   # Start server in background"
    echo "  $0 status               # Check if running"
    echo "  $0 test --watch         # Run tests in watch mode"
    echo "  $0 logs                 # View recent logs"
    echo ""
    echo "Files:"
    echo "  PID file: $PID_FILE"
    echo "  Log file: $LOG_FILE"
}

# Main command handler
main() {
    local command="${1:-help}"
    shift || true

    case "$command" in
        start)
            cmd_start "$@"
            ;;
        stop)
            cmd_stop
            ;;
        restart)
            cmd_restart
            ;;
        status)
            cmd_status
            ;;
        test)
            cmd_test "$@"
            ;;
        logs)
            cmd_logs
            ;;
        help|--help|-h)
            cmd_help
            ;;
        *)
            print_error "Unknown command: $command"
            echo ""
            cmd_help
            exit 1
            ;;
    esac
}

# Run main
main "$@"
