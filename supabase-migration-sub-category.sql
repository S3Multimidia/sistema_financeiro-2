-- ADICIONAR COLUNA SUB_CATEGORY NA TABELA TRANSACTIONS
-- Execute este comando no SQL Editor do Supabase para habilitar suporte global a subcategorias

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS sub_category TEXT;

-- Comentário para controle de versão:
-- Esta coluna permite que a IA e os relatórios detalhem os gastos dentro de categorias maiores.
