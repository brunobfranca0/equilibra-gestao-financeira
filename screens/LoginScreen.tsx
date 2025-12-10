import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';

const LOGO = require('../assets/logosemfundo.png');

const COLORS = {
  background: '#0F0F10',
  card: '#1A1A1C',
  purple: '#A259FF',
  green: '#31D158',
  red: '#FF4D4F',
  gray: '#6A6A70',
  white: '#FFFFFF',
  border: '#242428',
};

export default function LoginScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async () => {
    if (isLogin) {
      if (!email || !password) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }
    } else {
      if (!name || !email || !password) {
        Alert.alert('Erro', 'Por favor, preencha todos os campos');
        return;
      }
    }

    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          Alert.alert('Erro', error.message);
          setLoading(false);
        } else {
          // Login bem-sucedido - o redirecionamento acontecerá automaticamente
          // Não precisamos fazer nada aqui, o onAuthStateChange vai atualizar
        }
      } else {
        const { error, data } = await signUp(email, password, name);
        if (error) {
          Alert.alert('Erro', error.message);
          setLoading(false);
        } else if (data?.session) {
          // Sessão criada imediatamente (sem confirmação de email)
          // O redirecionamento acontecerá automaticamente via onAuthStateChange
          // Não precisamos fazer nada aqui
        } else {
          // Email de confirmação necessário
          Alert.alert(
            'Confirmação necessária',
            'Por favor, verifique seu email para confirmar a conta antes de fazer login.'
          );
          setIsLogin(true);
          setLoading(false);
        }
      }
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Ocorreu um erro inesperado');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#0F0F10', '#1A1A1C']} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
            </View>
            <Text style={styles.title}>Equilibra</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Entre na sua conta' : 'Crie sua conta'}
            </Text>
            
            {!isSupabaseConfigured() && (
              <View style={styles.warningContainer}>
                <Ionicons name="warning-outline" size={20} color="#FFA500" />
                <Text style={styles.warningText}>
                  Credenciais do Supabase não configuradas. Configure as variáveis de ambiente.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.form}>
            {!isLogin && (
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nome"
                  placeholderTextColor={COLORS.gray}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </View>
            )}

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.gray}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.gray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor={COLORS.gray}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isLogin ? 'Entrar' : 'Criar conta'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => {
                setIsLogin(!isLogin);
                // Limpar campos ao alternar entre login e cadastro
                if (!isLogin) {
                  setName('');
                }
              }}
            >
              <Text style={styles.switchText}>
                {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
                <Text style={styles.switchLink}>
                  {isLogin ? 'Cadastre-se' : 'Entre'}
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoContainer: {
    marginBottom: 10,
  },
  logoImage: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    color: COLORS.white,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  switchLink: {
    color: COLORS.purple,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFA50020',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FFA50040',
  },
  warningText: {
    color: '#FFA500',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
});