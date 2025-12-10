import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
// As credenciais devem ser configuradas via variáveis de ambiente
// Crie um arquivo .env com EXPO_PUBLIC_SUPABASE_URL e EXPO_PUBLIC_SUPABASE_ANON_KEY
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validação das credenciais
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  const errorMessage = '⚠️ ERRO: Credenciais do Supabase não configuradas!\n\n' +
    'Configure as variáveis de ambiente:\n' +
    'EXPO_PUBLIC_SUPABASE_URL\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY\n\n' +
    'No build, essas variáveis devem ser configuradas no EAS Build.';
  
  console.error(errorMessage);
  
  // Em produção, ainda criamos o cliente para evitar crash imediato
  // mas ele não funcionará até as credenciais serem configuradas
}

// Criar cliente Supabase mesmo sem credenciais para evitar crash
// O app mostrará erro na tela de login se as credenciais estiverem faltando
export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key'
);

// Verificar se as credenciais são válidas
export const isSupabaseConfigured = () => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY && 
    SUPABASE_URL !== 'https://placeholder.supabase.co' &&
    SUPABASE_ANON_KEY !== 'placeholder-key');
};