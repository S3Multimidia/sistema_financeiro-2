-- Migration to add 'time' column to transactions table
-- Run this in your Supabase SQL Editor

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS time TEXT;

-- Also ensure sub_category and other columns match our camelCase to snake_case mappings
-- Commented out unless you need to fix existing structure:
-- ALTER TABLE transactions RENAME COLUMN installments_total TO total_installments; 
-- (Our code now expects total_installments)
