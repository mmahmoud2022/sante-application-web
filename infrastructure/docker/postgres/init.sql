-- Initialize database
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schema
CREATE SCHEMA IF NOT EXISTS sante;

-- Set search path
SET search_path TO sante, public;

-- Grant permissions
GRANT ALL PRIVILEGES ON SCHEMA sante TO sante_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA sante TO sante_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA sante TO sante_user;

-- Enable TimescaleDB extension for analytics (optional)
-- CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
