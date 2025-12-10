# 📊 Scripts SQL do Banco de Dados

Este diretório contém todos os scripts SQL necessários para configurar o banco de dados no Supabase.

## 📋 Ordem de Execução

Execute os scripts na seguinte ordem no **SQL Editor** do Supabase:

### 1. Perfis (`profiles.sql`)
Cria a tabela de perfis de usuário e configura RLS.

```sql
-- Execute: profiles.sql
```

### 2. Contas Bancárias (`accounts.sql`)
Cria a tabela de contas bancárias.

```sql
-- Execute: accounts.sql
```

### 3. Cartões de Crédito (`credit_cards.sql`)
Cria a tabela de cartões de crédito.

```sql
-- Execute: credit_cards.sql
```

### 4. Alertas de Gastos (`spending_alerts.sql`)
Cria a tabela de alertas inteligentes.

```sql
-- Execute: spending_alerts.sql
```

### 5. Outras Tabelas
As seguintes tabelas devem ser criadas manualmente ou já existem no seu projeto:
- `transactions` - Transações financeiras
- `categories` - Categorias de transações
- `savings_goals` - Metas de economia

## 🔒 Segurança

Todos os scripts incluem:
- ✅ Row Level Security (RLS) habilitado
- ✅ Políticas de acesso configuradas
- ✅ Triggers para atualização automática de timestamps
- ✅ Índices para otimização de performance

## 📝 Notas Importantes

- Execute os scripts na ordem especificada
- Verifique se as políticas RLS estão funcionando corretamente
- Teste as operações CRUD após executar cada script
- Mantenha backups do banco de dados antes de executar scripts em produção

