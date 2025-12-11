-- Create separate database for Umami Analytics
-- This runs BEFORE init.sql (00- prefix)

CREATE DATABASE umami;
GRANT ALL PRIVILEGES ON DATABASE umami TO kathrin;
