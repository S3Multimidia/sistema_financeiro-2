-- Migration: Add subscription and credit card fields to transactions table
-- Execute this in Supabase SQL Editor

-- Add subscription columns
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_id TEXT;

-- Add credit card invoice columns
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS is_credit_card_bill BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS related_card_id TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_subscription 
ON transactions(subscription_id) 
WHERE subscription_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_credit_card 
ON transactions(related_card_id) 
WHERE related_card_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN transactions.is_subscription IS 'Indicates if this transaction is part of a recurring subscription';
COMMENT ON COLUMN transactions.subscription_id IS 'Foreign key to subscriptions table';
COMMENT ON COLUMN transactions.is_credit_card_bill IS 'Indicates if this is a credit card invoice payment';
COMMENT ON COLUMN transactions.related_card_id IS 'Foreign key to credit_cards table';
