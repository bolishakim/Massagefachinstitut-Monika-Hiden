-- Initial database setup for Practice Management System
-- This file is executed when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant necessary permissions to the practice_user
GRANT ALL PRIVILEGES ON DATABASE practice_management TO practice_user;
GRANT USAGE, CREATE ON SCHEMA public TO practice_user;