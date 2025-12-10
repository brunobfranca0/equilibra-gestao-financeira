-- Script SQL para configurar a tabela credit_cards
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela credit_cards
CREATE TABLE IF NOT EXISTS credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  last4 TEXT,
  credit_limit NUMERIC(12, 2),
  due_day INTEGER CHECK (due_day >= 1 AND due_day <= 31),
  closing_day INTEGER CHECK (closing_day >= 1 AND closing_day <= 31),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Configurar Row Level Security (RLS)
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuários podem ver apenas seus próprios cartões
DROP POLICY IF EXISTS "Users can view own credit cards" ON credit_cards;
CREATE POLICY "Users can view own credit cards"
  ON credit_cards
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: Usuários podem inserir apenas seus próprios cartões
DROP POLICY IF EXISTS "Users can insert own credit cards" ON credit_cards;
CREATE POLICY "Users can insert own credit cards"
  ON credit_cards
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: Usuários podem atualizar apenas seus próprios cartões
DROP POLICY IF EXISTS "Users can update own credit cards" ON credit_cards;
CREATE POLICY "Users can update own credit cards"
  ON credit_cards
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: Usuários podem deletar apenas seus próprios cartões
DROP POLICY IF EXISTS "Users can delete own credit cards" ON credit_cards;
CREATE POLICY "Users can delete own credit cards"
  ON credit_cards
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_credit_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_credit_cards_updated_at ON credit_cards;
CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_cards_updated_at();

-- 9. Índices para melhorar performance
CREATE INDEX IF NOT EXISTS credit_cards_user_id_idx ON credit_cards(user_id);
CREATE INDEX IF NOT EXISTS credit_cards_created_at_idx ON credit_cards(created_at);

