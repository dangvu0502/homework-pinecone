.PHONY: help install dev frontend backend build clean lint typecheck test migrate show check setup

# Default target
help: ## Show this help message
	@echo "Available commands:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Installation
install: ## Install dependencies for both frontend and backend
	@echo "Installing backend dependencies..."
	cd backend && npm install
	@echo "Installing frontend dependencies..."
	cd frontend && npm install

# Development servers
dev: ## Start both frontend and backend in development mode
	@echo "Starting backend first..."
	@make backend & \
	BACKEND_PID=$$! && \
	sleep 3 && \
	if kill -0 $$BACKEND_PID 2>/dev/null; then \
		echo "Backend started successfully, starting frontend..."; \
		make frontend; \
	else \
		echo "Backend failed to start, aborting frontend"; \
		exit 1; \
	fi

frontend: ## Start frontend development server
	@echo "Starting frontend development server..."
	cd frontend && npm run dev

backend: ## Start backend development server  
	@echo "Starting backend development server..."
	cd backend && npm run dev

# Linting and type checking
lint: ## Run linting for both frontend and backend
	@echo "Linting backend..."
	cd backend && npm run lint
	@echo "Linting frontend..."
	cd frontend && npm run lint

typecheck: ## Run type checking for both frontend and backend
	@echo "Type checking backend..."
	cd backend && npm run typecheck
	@echo "Type checking frontend..."
	cd frontend && npm run typecheck

# Database operations
migrate: ## Run database migrations
	@echo "Running database migrations..."
	cd backend && npm run migrate:latest

show: ## Show available commands
	@make help

# Quality checks
check: lint typecheck ## Run all quality checks (lint + typecheck)

# Full setup
setup: install migrate ## Full project setup (install dependencies and run migrations)
	@echo "Project setup complete!"