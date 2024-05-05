.PHONY: build-backend build-frontend

build-frontend:
	cd frontend && npm run build

build-backend:
	cd backend && npm run dev

build-all: build-frontend build-backend