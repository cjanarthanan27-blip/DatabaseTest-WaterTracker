# Water Tracker Deployment Guide (IT Department)

This repository contains the production-ready, dual-container Docker deployment for the Water Tracker application. It is configured to run the React frontend and Django backend as separate, interconnected containers mirroring the successful Railway cloud deployment.

## Prerequisites
- Docker and Docker Compose installed on the host machine.

## Quick Start Setup

1. **Clone the project** to your server:
   ```bash
   git clone https://github.com/cjanarthanan27-blip/DatabaseTest-WaterTracker
   cd DatabaseTest-WaterTracker
   ```

2. **Configure Environment Variables:**
   - Copy the provided template to create your `.env` file:
     ```bash
     cp .env.template .env
     ```
   - Open `.env` and fill in secure values (especially `DJANGO_SECRET_KEY` and the `DJANGO_ADMIN_PASSWORD`).
   - If deploying to a remote server, update `VITE_API_URL` to point to the server's backend public domain/IP (e.g., `https://your-server-api.com/api/`). Leave it as `http://localhost:8080/api/` if testing locally.

3. **Start the application:**
   ```bash
   docker-compose up -d --build
   ```
   This command will automatically:
   - Boot a PostgreSQL 15 database.
   - Build and start the Django REST API backend (Port 8080).
   - Run all necessary database migrations automatically on startup once the DB is healthy.
   - Build and start the React Nginx frontend (Port 3000).

4. **Verify Deployment:**
   - Frontend is accessible at: `http://<your-server-ip>:3000`
   - Backend API/Admin is accessible at: `http://<your-server-ip>:8080/admin/`

## Loading Existing Database Dumps
If you have a previous PostgreSQL dump (`water_tracker_dump.sql`):
1. Ensure the containers are running (`docker-compose up -d`).
2. Copy the dump into the database container and restore it:
   ```bash
   cat water_tracker_dump.sql | docker exec -i <db_container_name> psql -U postgres -d water_tracker
   ```
*(Note: Replace `<db_container_name>` with the actual name, usually something like `database-test-watertracker-db-1`)*
