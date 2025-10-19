.PHONY: help build up down restart logs clean test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

build: ## Build all Docker images
	docker-compose build

up: ## Start all services
	docker-compose up -d

down: ## Stop all services
	docker-compose down

down-v: ## Stop all services and remove volumes
	docker-compose down -v

restart: ## Restart all services
	docker-compose restart

logs: ## View logs from all services
	docker-compose logs -f

logs-backend: ## View backend logs
	docker-compose logs -f backend

logs-frontend: ## View frontend logs
	docker-compose logs -f frontend

ps: ## List running services
	docker-compose ps

shell-backend: ## Open a shell in the backend container
	docker-compose exec backend /bin/bash

shell-frontend: ## Open a shell in the frontend container
	docker-compose exec frontend /bin/sh

db-shell: ## Open PostgreSQL shell
	docker-compose exec postgres psql -U sante_user -d sante_db

redis-shell: ## Open Redis CLI
	docker-compose exec redis redis-cli

migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (usage: make migrate-create MSG="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MSG)"

migrate-down: ## Rollback last migration
	docker-compose exec backend alembic downgrade -1

test-backend: ## Run backend tests
	docker-compose exec backend pytest

test-frontend: ## Run frontend tests
	docker-compose exec frontend npm test

lint-backend: ## Lint backend code
	docker-compose exec backend black app/ && \
	docker-compose exec backend isort app/ && \
	docker-compose exec backend flake8 app/

lint-frontend: ## Lint frontend code
	docker-compose exec frontend npm run lint

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --rmi all

health: ## Check health of all services
	@echo "Checking service health..."
	@curl -s http://localhost:8000/health | python3 -m json.tool || echo "❌ Backend not responding"
	@curl -s http://localhost:3000 > /dev/null && echo "✅ Frontend is up" || echo "❌ Frontend not responding"

init: ## Initialize the project (first time setup)
	@echo "🚀 Initializing Santé Medical Application..."
	@echo "📋 Copying environment file..."
	@cp -n .env.example .env || echo "⚠️  .env already exists, skipping..."
	@echo "🐳 Building Docker images..."
	@docker-compose build
	@echo "⬆️  Starting services..."
	@docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@echo "🗄️  Running database migrations..."
	@docker-compose exec backend alembic upgrade head || echo "⚠️  Migration failed, database might not be ready yet"
	@echo ""
	@echo "✅ Setup complete!"
	@echo ""
	@echo "🌐 Access the application:"
	@echo "   Frontend: http://localhost:3000"
	@echo "   Backend API: http://localhost:8000"
	@echo "   API Docs: http://localhost:8000/docs"
	@echo ""
	@echo "📖 Run 'make help' to see all available commands"

dev: up ## Start development environment (alias for up)

stop: down ## Stop all services (alias for down)

status: ps ## Show service status (alias for ps)
