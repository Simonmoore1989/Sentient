-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- Adds notification throttling columns to the supervisors table

ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS last_notified_at timestamp with time zone;
ALTER TABLE supervisors ADD COLUMN IF NOT EXISTS notif_interval integer DEFAULT 2;
