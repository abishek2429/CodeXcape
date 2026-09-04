-- Fix invalid 'ACTIVE' status in events table that crashes Hibernate EventStatus mapping
UPDATE events SET status = 'READY' WHERE status = 'ACTIVE';
