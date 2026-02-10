-- ==========================================================
-- FULL MIGRATION: DATABASE SCHEMA FOR FINANCEIRO PRO 2026
-- Execute this in your Supabase SQL Editor
-- ==========================================================

-- 1. ADICIONAR COLUNA 'TIME' NA TABELA TRANSACTIONS
-- Isso resolve o erro ao salvar compromissos com horário
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS time TEXT;

-- 2. GARANTIR QUE COLUNAS DE INSTALMENT/RECORRÊNCIA EXISTEM
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS installment_number INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_installments INTEGER; 
-- (Nota: Se sua versão anterior usava installments_total, esta migração garante o novo padrão)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS debt_id TEXT;

-- 3. AJUSTAR COLUNAS DE ASSINATURA E CARTÃO
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS is_credit_card_bill BOOLEAN DEFAULT FALSE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS related_card_id TEXT;

-- 4. CRIAR TABELA DE PERFIS (PROFILES) SE NÃO EXISTIR
-- Para armazenar o saldo inicial e outras configurações
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  starting_balance DECIMAL(15,2) DEFAULT 0,
  gemini_api_key TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. CRIAR TABELA DE CREDIÁRIOS (DEBTS)
CREATE TABLE IF NOT EXISTS debts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. CRIAR TABELA DE CARTÕES (CREDIT_CARDS)
CREATE TABLE IF NOT EXISTS credit_cards (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  closing_day INTEGER DEFAULT 1,
  due_day INTEGER DEFAULT 10,
  "limit" DECIMAL(15,2) DEFAULT 0,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. CRIAR TABELA DE ASSINATURAS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  day INTEGER DEFAULT 1,
  category TEXT,
  active BOOLEAN DEFAULT TRUE,
  last_generated_month INTEGER,
  last_generated_year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. CRIAR TABELA DE LANÇAMENTOS DO CARTÃO (CARD_TRANSACTIONS)
CREATE TABLE IF NOT EXISTS card_transactions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  card_id TEXT REFERENCES credit_cards(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount DECIMAL(15,2) DEFAULT 0,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  installment_number INTEGER,
  total_installments INTEGER,
  category TEXT,
  original_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. HABILITAR RLS (ROW LEVEL SECURITY) - OPCIONAL MAS RECOMENDADO
-- Certifique-se de configurar as políces no painel do Supabase 
-- para que os usuários só vejam seus próprios dados.

-- 10. INDEXES PARA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(year, month, day);
CREATE INDEX IF NOT EXISTS idx_debts_user_id ON debts(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_subs_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_card_trans_card_id ON card_transactions(card_id);
