-- V1__initial_setup.sql
-- Baseline Flyway migration for Technical Escape Room

CREATE TABLE IF NOT EXISTS system_health_log (
    id BIGSERIAL PRIMARY KEY,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    message VARCHAR(255)
);

INSERT INTO system_health_log (status, message) 
VALUES ('INITIALIZED', 'Technical Escape Room database foundation successfully initialized.');
