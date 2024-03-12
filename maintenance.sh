#!/bin/bash

function stop_services() {
    echo "Stopping services..."
    docker compose stop
}

function start_services() {
    echo "Starting services... $1"
    
    START_BLOCK=${1:-19413571} docker compose up producer
}

function restart_services() {
    stop_services
    start_services "$1"
}

function setup_services() {
    echo "Setting up services..."
    START_BLOCK=${1:-19413571} docker compose up  --force-recreate --build 
}

# Simple argument parsing to control the script
case "$1" in
    start)
        echo "$2"
        start_services "$2"
        ;;
    setup_services)
        setup_services "$2"
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services "$2"
        ;;
    test)
        echo "${2:-19413571}"
        ;;
    *)
        echo "Usage: $0 {setup_services|start|stop|restart} {startBlock}"
        exit 1
esac

exit 0
