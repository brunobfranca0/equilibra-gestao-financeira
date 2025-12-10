# 🔧 Configurar Variáveis de Ambiente no EAS Build

Este guia explica como configurar as variáveis de ambiente do Supabase no EAS Build para que o aplicativo funcione corretamente.

## ⚠️ Problema Comum

Se o app está abrindo e fechando imediatamente no Android, provavelmente as variáveis de ambiente do Supabase não estão configuradas no build.

## 📋 Solução: Configurar Variáveis de Ambiente

### Método 1: Via EAS Secrets (Recomendado)

1. **Configurar secrets no EAS:**

```bash
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://seu-projeto.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "sua_chave_anonima_aqui"
```

2. **Verificar secrets configurados:**

```bash
eas secret:list
```

3. **Gerar novo build:**

```bash
eas build --platform android --profile preview
```

### Método 2: Via eas.json (Alternativo)

1. **Editar `eas.json`:**

```json
{
  "build": {
    "preview": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://seu-projeto.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sua_chave_anonima_aqui"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "EXPO_PUBLIC_SUPABASE_URL": "https://seu-projeto.supabase.co",
        "EXPO_PUBLIC_SUPABASE_ANON_KEY": "sua_chave_anonima_aqui"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

⚠️ **Atenção**: Este método expõe as credenciais no código. Use apenas para testes ou se o repositório for privado.

### Método 3: Via Dashboard do Expo

1. Acesse: https://expo.dev/accounts/[seu-usuario]/projects/equilibra-gestao-financeira
2. Vá em **Settings** → **Secrets**
3. Adicione as variáveis:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
4. Gere um novo build

## 🔍 Verificar se Está Configurado

Após configurar, você pode verificar se as variáveis estão sendo usadas:

1. Gere um novo build
2. Instale o APK
3. Se o app abrir normalmente (mostrar tela de login), está configurado corretamente
4. Se ainda fechar, verifique os logs do build no dashboard do Expo

## 📝 Onde Encontrar as Credenciais

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Settings** → **API**
3. Copie:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** key → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 🐛 Troubleshooting

### App ainda fecha após configurar

1. **Verifique se as variáveis estão corretas:**
   ```bash
   eas secret:list
   ```

2. **Gere um novo build** (não reutilize builds antigos):
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

3. **Verifique os logs do build** no dashboard do Expo

4. **Teste localmente primeiro:**
   - Crie um arquivo `.env` com as variáveis
   - Teste com `expo start`
   - Se funcionar localmente, o problema é a configuração do build

### Erro: "Secret not found"

- Certifique-se de que criou os secrets com o nome exato:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Verifique o escopo (deve ser `project`)

## ✅ Checklist

- [ ] Credenciais do Supabase obtidas
- [ ] Secrets criados no EAS (ou configurados no eas.json)
- [ ] Novo build gerado após configurar
- [ ] APK testado e funcionando
- [ ] App abre e mostra tela de login

## 🔒 Segurança

- **Nunca** commite credenciais no código
- Use EAS Secrets para builds de produção
- Mantenha o `.env` no `.gitignore`
- Rotacione as chaves periodicamente

---

**Última atualização**: Dezembro 2024

