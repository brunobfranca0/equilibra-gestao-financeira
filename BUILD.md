# 📱 Guia de Build - Gerar APK do Equilibra

Este guia explica como gerar um arquivo APK do aplicativo Equilibra para Android.

## 🚀 Método 1: EAS Build (Recomendado)

O EAS Build é o método oficial e mais moderno do Expo para gerar builds.

### Pré-requisitos

1. **Conta no Expo**
   - Crie uma conta em: https://expo.dev/signup
   - É gratuito para builds de desenvolvimento

2. **Instalar EAS CLI**
```bash
npm install -g eas-cli
```

3. **Login no Expo**
```bash
eas login
```

### Passo a Passo

#### 1. Configurar o projeto

O arquivo `eas.json` já foi criado com as configurações necessárias.

#### 2. Inicializar o projeto no EAS (se necessário)

```bash
eas build:configure
```

#### 3. Gerar o APK

Para gerar um APK de preview/teste:
```bash
eas build --platform android --profile preview
```

Para gerar um APK de produção:
```bash
eas build --platform android --profile production
```

#### 4. Acompanhar o build

O build será processado na nuvem. Você receberá um link para acompanhar o progresso.

#### 5. Download do APK

Após o build concluir, você pode:
- Baixar diretamente pelo link fornecido
- Ou usar: `eas build:list` para ver todos os builds

### Opções de Build

- **Preview**: APK para testes internos (mais rápido, gratuito)
- **Production**: APK otimizado para produção

## 🔧 Método 2: Build Local (Avançado)

Se preferir gerar localmente, você precisará:

### Pré-requisitos

1. **Android Studio** instalado
2. **Java JDK** configurado
3. **Variáveis de ambiente** do Android configuradas

### Comandos

```bash
# Instalar dependências do Android
npx expo prebuild --platform android

# Gerar APK de debug
cd android
./gradlew assembleDebug

# O APK estará em: android/app/build/outputs/apk/debug/app-debug.apk
```

## 📦 Método 3: Expo Build (Legado)

⚠️ **Nota**: Este método está sendo descontinuado em favor do EAS Build.

```bash
expo build:android -t apk
```

## 🎯 Configurações Importantes

### app.json

O arquivo `app.json` já está configurado com:
- `package`: `com.equilibra.gestaofinanceira` (identificador único)
- `versionCode`: 1 (incrementar a cada nova versão)
- `version`: 2.0.0 (versão visível ao usuário)

### Variáveis de Ambiente

Certifique-se de que o arquivo `.env` está configurado com suas credenciais do Supabase antes de gerar o build.

## 📝 Checklist Antes do Build

- [ ] Variáveis de ambiente configuradas (`.env`)
- [ ] Ícone e splash screen configurados
- [ ] `app.json` atualizado com informações corretas
- [ ] Testado localmente com `expo start`
- [ ] Todas as funcionalidades testadas

## 🔐 Assinatura do APK

### Para Testes (Debug)
- Não precisa assinar
- Pode instalar diretamente no dispositivo

### Para Produção (Release)
- Precisa de uma keystore assinada
- O EAS Build pode gerar automaticamente ou você pode fornecer uma

## 📱 Instalação do APK

1. **Habilitar fontes desconhecidas** no Android:
   - Configurações → Segurança → Fontes desconhecidas (habilitar)

2. **Transferir o APK** para o dispositivo

3. **Abrir o arquivo** e instalar

## 🐛 Troubleshooting

### Erro: "No credentials found"
- Configure as credenciais: `eas credentials`

### Erro: "Build failed"
- Verifique os logs no dashboard do Expo
- Confirme que todas as dependências estão corretas

### APK muito grande
- Use `eas build --profile production` para otimização
- Remova assets não utilizados

## 📚 Recursos

- [Documentação EAS Build](https://docs.expo.dev/build/introduction/)
- [Expo Dashboard](https://expo.dev/)
- [Guia de Publicação Android](https://docs.expo.dev/distribution/app-stores/)

## 💡 Dicas

1. **Primeira vez**: Use o perfil `preview` para testes rápidos
2. **Produção**: Use `production` apenas quando estiver pronto para distribuir
3. **Versionamento**: Incremente `versionCode` a cada novo build
4. **Testes**: Sempre teste o APK em um dispositivo real antes de distribuir

---

**Nota**: O primeiro build pode levar alguns minutos. Builds subsequentes são mais rápidos devido ao cache.

