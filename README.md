# 💰 Equilibra - Aplicativo de Gestão Financeira Pessoal

<div align="center">
  <img src="./assets/logo.png" alt="Equilibra Logo" width="120" height="120">
  
  **Sua vida financeira organizada em um só lugar**
  
  [![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue.svg)](https://reactnative.dev/)
  [![Expo](https://img.shields.io/badge/Expo-~54.0.27-black.svg)](https://expo.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-blue.svg)](https://www.typescriptlang.org/)
  [![Supabase](https://img.shields.io/badge/Supabase-2.84.0-green.svg)](https://supabase.com/)
</div>

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Banco de Dados](#-banco-de-dados)
- [Downloads](#-downloads)
- [Licença](#-licença)

## 🎯 Sobre o Projeto

O **Equilibra** é um aplicativo mobile desenvolvido em React Native com Expo para gestão financeira pessoal. Permite que os usuários controlem suas receitas, despesas, contas bancárias, cartões de crédito e metas de economia de forma intuitiva e organizada.

## ✨ Funcionalidades

### 📊 Dashboard e Relatórios
- **Tela Inicial**: Visualização do saldo atual, receitas e despesas do mês
- **Relatórios**: Dashboard completo com gráficos e métricas financeiras
- **Resumo Mensal**: Análise detalhada de gastos e receitas por mês
- **Insights Personalizados**: Análises automáticas sobre seus hábitos financeiros

### 💳 Gestão de Contas e Cartões
- **Contas Bancárias**: Cadastro e gerenciamento de múltiplas contas
- **Cartões de Crédito**: Controle de cartões com limite e datas de fechamento/vencimento
- **Filtros**: Visualização de transações por conta ou cartão específico

### 💰 Transações
- **Cadastro**: Adição de receitas, despesas e gastos com cartão
- **Categorização**: Organização por categorias personalizáveis
- **Filtros Avançados**: Por data, categoria, conta, cartão e tipo
- **Edição**: Modificação e exclusão de transações
- **Histórico Completo**: Visualização de todas as transações

### 🎯 Metas e Objetivos
- **Metas de Economia**: Criação e acompanhamento de objetivos financeiros
- **Progresso Visual**: Barras de progresso e indicadores de conclusão
- **Conquistas**: Sistema de achievements para motivar a economia

### 🔔 Alertas Inteligentes
- **Limite de Gastos**: Configuração de alertas quando ultrapassar o limite mensal
- **Notificações**: Avisos automáticos sobre seus gastos

### 👤 Perfil
- **Edição de Perfil**: Alteração de nome, email e senha
- **Tema**: Suporte a modo claro e escuro
- **Personalização**: Interface adaptável às preferências do usuário

## 🛠 Tecnologias

### Frontend
- **React Native** (0.81.5) - Framework mobile
- **Expo** (~54.0.27) - Plataforma de desenvolvimento
- **TypeScript** (~5.9.2) - Tipagem estática
- **React** (19.1.0) - Biblioteca UI

### Bibliotecas Principais
- **@supabase/supabase-js** (^2.84.0) - Cliente Supabase
- **@expo/vector-icons** (^15.0.3) - Ícones
- **expo-linear-gradient** (~15.0.8) - Gradientes
- **@react-native-community/datetimepicker** (^8.5.1) - Seletor de data
- **@react-native-async-storage/async-storage** (2.2.0) - Armazenamento local

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL - Banco de dados
  - Row Level Security (RLS) - Segurança
  - Authentication - Autenticação de usuários

## 📦 Pré-requisitos

Antes de começar, você precisará ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** ou **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Git**
- Conta no **Supabase** (para backend)

### Para desenvolvimento mobile:
- **Expo Go** (app para iOS/Android) ou
- **Android Studio** (para emulador Android) ou
- **Xcode** (para simulador iOS - apenas macOS)

## 🚀 Instalação

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/equilibra.git
cd equilibra
```

2. **Instale as dependências**
```bash
npm install
# ou
yarn install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Supabase:
```env
EXPO_PUBLIC_SUPABASE_URL=sua_url_do_supabase
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

4. **Execute o projeto**
```bash
npm start
# ou
yarn start
```

## ⚙️ Configuração

### Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com)
2. Execute os scripts SQL na ordem abaixo no SQL Editor do Supabase:

#### 1. Tabela de Perfis
```sql
-- Execute o script: database/profiles.sql
```

#### 2. Tabela de Contas Bancárias
```sql
-- Execute o script: database/accounts.sql
```

#### 3. Tabela de Cartões de Crédito
```sql
-- Execute o script: database/credit_cards.sql
```

#### 4. Tabela de Alertas de Gastos
```sql
-- Execute o script: database/spending_alerts.sql
```

#### 5. Outras tabelas necessárias
- `transactions` - Transações financeiras
- `categories` - Categorias de transações
- `savings_goals` - Metas de economia

> **Nota**: Os scripts SQL completos estão disponíveis na pasta `database/` do projeto.

### Configuração de Autenticação

O Supabase gerencia a autenticação automaticamente. Certifique-se de que:
- A autenticação por email está habilitada no Supabase
- As políticas RLS estão configuradas corretamente

## 📁 Estrutura do Projeto

```
equilibra/
├── assets/                 # Imagens e recursos visuais
│   ├── logo.png
│   ├── icon.png
│   └── ...
├── components/             # Componentes reutilizáveis
│   ├── BottomNavigation.tsx
│   ├── HighlightPill.tsx
│   ├── LoadingScreen.tsx
│   └── ...
├── constants/             # Constantes e configurações
│   ├── colors.ts
│   └── transactionOptions.ts
├── contexts/              # Contextos React
│   ├── AuthContext.tsx    # Autenticação
│   └── ThemeContext.tsx   # Tema (claro/escuro)
├── lib/                   # Bibliotecas e configurações
│   └── supabase.ts        # Cliente Supabase
├── screens/               # Telas da aplicação
│   ├── HomeScreen.tsx
│   ├── ReportsScreen.tsx
│   ├── AccountsScreen.tsx
│   ├── CardsScreen.tsx
│   ├── MonthlySummaryScreen.tsx
│   ├── SpendingAlertsScreen.tsx
│   ├── PersonalizedInsightsScreen.tsx
│   └── ...
├── services/               # Serviços de API
│   ├── transactionService.ts
│   ├── accountService.ts
│   ├── cardService.ts
│   ├── categoryService.ts
│   ├── profileService.ts
│   ├── savingsGoalService.ts
│   └── alertService.ts
├── types/                 # Definições de tipos TypeScript
│   └── navigation.ts
├── App.tsx                # Componente principal
├── app.json               # Configuração Expo
├── package.json           # Dependências
├── tsconfig.json          # Configuração TypeScript
└── README.md              # Este arquivo
```

## 📱 Scripts Disponíveis

```bash
# Iniciar o servidor de desenvolvimento
npm start

# Executar no Android
npm run android

# Executar no iOS
npm run ios

# Executar no navegador
npm run web
```

## 🗄 Banco de Dados

### Tabelas Principais

#### `profiles`
Armazena informações do perfil do usuário.
- `id` (UUID, PK, FK → auth.users)
- `name` (TEXT)
- `email` (TEXT)
- `created_at`, `updated_at` (TIMESTAMP)

#### `accounts`
Contas bancárias do usuário.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `institution` (TEXT, opcional)
- `type` (TEXT: 'checking' | 'savings')
- `balance` (NUMERIC)
- `created_at`, `updated_at` (TIMESTAMP)

#### `credit_cards`
Cartões de crédito do usuário.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `brand` (TEXT, opcional)
- `last4` (TEXT, opcional)
- `credit_limit` (NUMERIC, opcional)
- `due_day` (INTEGER, opcional)
- `closing_day` (INTEGER, opcional)
- `created_at`, `updated_at` (TIMESTAMP)

#### `transactions`
Transações financeiras.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `description` (TEXT)
- `amount` (NUMERIC)
- `type` (TEXT: 'income' | 'expense' | 'card_expense' | 'transfer')
- `category` (UUID, FK → categories, opcional)
- `account_id` (UUID, FK → accounts, opcional)
- `card_id` (UUID, FK → credit_cards, opcional)
- `date` (DATE)
- `created_at`, `updated_at` (TIMESTAMP)

#### `categories`
Categorias de transações.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `icon` (TEXT)
- `color` (TEXT)
- `created_at` (TIMESTAMP)

#### `savings_goals`
Metas de economia.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users)
- `name` (TEXT)
- `target_amount` (NUMERIC)
- `current_amount` (NUMERIC)
- `icon` (TEXT)
- `color` (TEXT)
- `deadline` (DATE, opcional)
- `created_at`, `updated_at` (TIMESTAMP)

#### `spending_alerts`
Alertas de gastos mensais.
- `id` (UUID, PK)
- `user_id` (UUID, FK → auth.users, UNIQUE)
- `monthly_limit` (NUMERIC)
- `enabled` (BOOLEAN)
- `created_at`, `updated_at` (TIMESTAMP)

### Segurança (RLS)

Todas as tabelas possuem **Row Level Security (RLS)** habilitado, garantindo que:
- Usuários só podem acessar seus próprios dados
- Políticas de SELECT, INSERT, UPDATE e DELETE configuradas
- Segurança em nível de banco de dados

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

## 🎨 Temas

O aplicativo suporta modo claro e escuro, configurável em:
- **Mais** → **Sobre** → **Aparência**

O tema é salvo localmente e sincronizado com as preferências do sistema.

## 📝 Convenções de Código

- **TypeScript**: Tipagem estrita habilitada
- **Componentes**: Funcionais com Hooks
- **Estilos**: StyleSheet do React Native
- **Nomenclatura**: 
  - Componentes: PascalCase (`HomeScreen.tsx`)
  - Funções: camelCase (`handleSave`)
  - Constantes: UPPER_SNAKE_CASE (`MONTH_NAMES`)

## 📥 Downloads

### Versão Atual: 2.0.0

**APK para Android disponível:**

- 📱 [Download APK (Preview)](https://expo.dev/accounts/brunobfranca/projects/equilibra-gestao-financeira/builds/3dc81509-88d1-449b-9ff9-e7f41f308833)
- 🔗 [Ver Build no Expo](https://expo.dev/accounts/brunobfranca/projects/equilibra-gestao-financeira/builds/3dc81509-88d1-449b-9ff9-e7f41f308833)

### Instalação

1. Baixe o arquivo APK do link acima
2. No seu dispositivo Android, habilite "Fontes desconhecidas" nas configurações de segurança
3. Abra o arquivo APK baixado e instale
4. Configure suas credenciais do Supabase no primeiro uso

> **Nota**: Este é um build de preview/teste. Para builds de produção, consulte o [guia de build](./BUILD.md).

## 📄 Licença

Este projeto está sob a licença **0BSD** (Zero-Clause BSD License).

## 👨‍💻 Autor

Desenvolvido para ajudar pessoas a organizarem suas finanças pessoais.

## 🙏 Agradecimentos

- [Expo](https://expo.dev/) - Plataforma de desenvolvimento
- [Supabase](https://supabase.com/) - Backend e banco de dados
- [React Native](https://reactnative.dev/) - Framework mobile
- Comunidade open source

---

<div align="center">
  <p>Feito cusando React Native e Expo</p>
</div>
