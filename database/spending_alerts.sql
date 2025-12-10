-- Script SQL para configurar a tabela spending_alerts
-- Execute este script no SQL Editor do Supabase

-- 1. Criar a tabela spending_alerts
CREATE TABLE IF NOT EXISTS spending_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_limit NUMERIC(12, 2) NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. Configurar Row Level Security (RLS)
ALTER TABLE spending_alerts ENABLE ROW LEVEL SECURITY;

-- 3. Política: Usuários podem ver apenas seus próprios alertas
DROP POLICY IF EXISTS "Users can view own spending alerts" ON spending_alerts;
CREATE POLICY "Users can view own spending alerts"
  ON spending_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Política: Usuários podem inserir apenas seus próprios alertas
DROP POLICY IF EXISTS "Users can insert own spending alerts" ON spending_alerts;
CREATE POLICY "Users can insert own spending alerts"
  ON spending_alerts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Política: Usuários podem atualizar apenas seus próprios alertas
DROP POLICY IF EXISTS "Users can update own spending alerts" ON spending_alerts;
CREATE POLICY "Users can update own spending alerts"
  ON spending_alerts
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Política: Usuários podem deletar apenas seus próprios alertas
DROP POLICY IF EXISTS "Users can delete own spending alerts" ON spending_alerts;
CREATE POLICY "Users can delete own spending alerts"
  ON spending_alerts
  FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_spending_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_spending_alerts_updated_at ON spending_alerts;
CREATE TRIGGER update_spending_alerts_updated_at
  BEFORE UPDATE ON spending_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_spending_alerts_updated_at();

-- 9. Índices para melhorar performance
CREATE INDEX IF NOT EXISTS spending_alerts_user_id_idx ON spending_alerts(user_id);
CREATE INDEX IF NOT EXISTS spending_alerts_enabled_idx ON spending_alerts(enabled);

