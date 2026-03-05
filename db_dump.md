# Development Database Dump
# Place your `water_tracker_dump.sql` file in this directory and it will automatically be loaded by Postgres upon first boot.
# Alternatively, you can run migrations and log in with the default admin account created via environment variables.

To restore a specific dump:
`docker exec -i <db_container_name> psql -U postgres -d water_tracker < water_tracker_dump.sql`
