# 🏗 Arquitetura do Projeto

Este documento descreve a arquitetura e estrutura do código do Equilibra.

## 📐 Visão Geral

O Equilibra é uma aplicação React Native construída com Expo, utilizando TypeScript para tipagem estática e Supabase como backend.

## 🎯 Padrões Arquiteturais

### Estrutura de Pastas

```
equilibra/
├── assets/          # Recursos estáticos (imagens, ícones)
├── components/      # Componentes reutilizáveis
├── constants/       # Constantes e configurações
├── contexts/        # Contextos React (Auth, Theme)
├── database/        # Scripts SQL para Supabase
├── lib/             # Configurações de bibliotecas externas
├── screens/         # Telas da aplicação
├── services/        # Serviços de API e lógica de negócio
└── types/           # Definições TypeScript
```

### Fluxo de Dados

```
UI (Screens)
    ↓
Services (API Calls)
    ↓
Supabase (Backend)
    ↓
PostgreSQL (Database)
```

## 🔄 Gerenciamento de Estado

### Contextos Globais

1. **AuthContext**: Gerencia autenticação do usuário
   - Sessão atual
   - Funções de login/logout
   - Estado de carregamento

2. **ThemeContext**: Gerencia tema da aplicação
   - Modo claro/escuro
   - Cores dinâmicas
   - Preferências do sistema

### Estado Local

- Cada tela gerencia seu próprio estado com `useState`
- Dados compartilhados via props ou contextos
- Cache local com AsyncStorage quando necessário

## 🔌 Serviços

Os serviços encapsulam toda a comunicação com o Supabase:

- `transactionService.ts` - CRUD de transações
- `accountService.ts` - CRUD de contas bancárias
- `cardService.ts` - CRUD de cartões de crédito
- `categoryService.ts` - CRUD de categorias
- `profileService.ts` - CRUD de perfis
- `savingsGoalService.ts` - CRUD de metas
- `alertService.ts` - CRUD de alertas

### Padrão de Serviço

```typescript
export const serviceName = {
  async getAll(userId: string) { ... },
  async getById(id: string) { ... },
  async create(data: CreateType) { ... },
  async update(id: string, updates: Partial<Type>) { ... },
  async delete(id: string) { ... },
};
```

## 🎨 Componentes

### Componentes Reutilizáveis

- `BottomNavigation` - Navegação inferior
- `HighlightPill` - Pílula de destaque (receitas/despesas)
- `LoadingScreen` - Tela de carregamento
- `ActionMenu` - Menu de ações

### Padrão de Componente

```typescript
interface ComponentProps {
  // Props tipadas
}

export default function Component({ props }: ComponentProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  // Lógica do componente
  
  return (
    // JSX
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  // Estilos
});
```

## 🗄 Banco de Dados

### Estrutura

- **PostgreSQL** via Supabase
- **Row Level Security (RLS)** para segurança
- **Triggers** para atualização automática de timestamps
- **Índices** para otimização de queries

### Relacionamentos

```
auth.users (1) ──→ (N) profiles
auth.users (1) ──→ (N) accounts
auth.users (1) ──→ (N) credit_cards
auth.users (1) ──→ (N) transactions
auth.users (1) ──→ (N) categories
auth.users (1) ──→ (N) savings_goals
auth.users (1) ──→ (1) spending_alerts

transactions (N) ──→ (1) accounts (opcional)
transactions (N) ──→ (1) credit_cards (opcional)
transactions (N) ──→ (1) categories (opcional)
```

## 🔐 Segurança

### Autenticação
- Supabase Auth para gerenciamento de usuários
- Tokens JWT para sessões
- Refresh automático de tokens

### Autorização
- Row Level Security (RLS) no banco
- Políticas por usuário
- Validação no cliente e servidor

### Dados Sensíveis
- Variáveis de ambiente para credenciais
- `.env` no `.gitignore`
- Chaves nunca commitadas

## 🎯 Navegação

### Estrutura

- **Tabs**: Home, Reports, Accounts, More
- **Screens**: Telas secundárias (Categories, Goals, etc.)
- **Modals**: Modais de adição/edição

### Tipos

```typescript
type TabKey = 'home' | 'reports' | 'accounts' | 'more';
type ScreenKey = 'main' | 'categories' | 'savings-goals' | ...;
```

## 🧪 Testes

## 📦 Dependências

### Produção
- React Native core
- Expo SDK
- Supabase client
- Vector Icons
- Linear Gradient

### Desenvolvimento
- TypeScript
- Expo CLI

## 🚀 Build e Deploy

### Desenvolvimento
```bash
npm start
```

### Produção
```bash
expo build:android
expo build:ios
```

## 🔄 Fluxo de Dados Típico

1. Usuário interage com a UI
2. Event handler é acionado
3. Service faz chamada ao Supabase
4. Supabase valida e processa
5. Dados retornam ao service
6. Service retorna dados ao componente
7. Componente atualiza estado
8. UI re-renderiza

## 📝 Convenções

### Nomenclatura
- Componentes: `PascalCase` (ex: `HomeScreen.tsx`)
- Funções: `camelCase` (ex: `handleSave`)
- Constantes: `UPPER_SNAKE_CASE` (ex: `MONTH_NAMES`)
- Arquivos: `camelCase.ts` ou `PascalCase.tsx`

### Estrutura de Arquivo
1. Imports
2. Types/Interfaces
3. Componente principal
4. Funções auxiliares
5. Estilos

### Comentários
- Use comentários para lógica complexa
- Documente funções públicas
- Mantenha código auto-explicativo

## 🔮 Melhorias Futuras
- [ ] Cache offline com AsyncStorage
- [ ] Sincronização em background
- [ ] Notificações push
- [ ] Exportação de relatórios (PDF/CSV)
- [ ] Backup automático na nuvem
- [ ] Relatórios com IA
- [ ] Previsão de gastos futuros

