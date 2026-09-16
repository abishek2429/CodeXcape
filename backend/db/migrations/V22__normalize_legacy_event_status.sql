-- Older seed data used ACTIVE, which is not a valid EventStatus enum value.
UPDATE events SET status = 'READY' WHERE status = 'ACTIVE';