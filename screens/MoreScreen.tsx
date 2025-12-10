import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { profileService, Profile } from '../services/profileService';
import { ScreenKey } from '../types/navigation';

interface MoreScreenProps {
  onSignOut: () => void;
  userId: string;
  onNavigate: (screen: ScreenKey) => void;
  onNavigateTab?: (tab: 'accounts') => void;
}

export default function MoreScreen({ onSignOut, userId, onNavigate, onNavigateTab }: MoreScreenProps) {
  const { colors, theme, setTheme, isDark } = useTheme();
  const [section, setSection] = useState<'gerenciar' | 'acompanhar' | 'sobre'>('gerenciar');
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async () => {
    const data = await profileService.get(userId);
    setProfile(data);
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleItemPress = (label: string) => {
    switch (label) {
      case 'Categorias':
        onNavigate('categories');
        break;
      case 'Objetivos':
        onNavigate('savings-goals');
        break;
      case 'Cartões de Crédito':
        onNavigate('cards');
        break;
      case 'Resumo mensal':
        onNavigate('monthly-summary');
        break;
      case 'Alertas inteligentes':
        onNavigate('spending-alerts');
        break;
      case 'Insights personalizados':
        onNavigate('personalized-insights');
        break;
      default:
        break;
    }
  };

  const getItemIcon = (label: string) => {
    switch (label) {
      case 'Categorias':
        return 'folder-outline';
      case 'Objetivos':
        return 'flag-outline';
      case 'Cartões de Crédito':
        return 'card-outline';
      case 'Resumo mensal':
        return 'calendar-outline';
      case 'Alertas inteligentes':
        return 'notifications-outline';
      case 'Insights personalizados':
        return 'analytics-outline';
      case 'Central de Ajuda':
        return 'help-circle-outline';
      case 'Termos de Uso':
        return 'document-text-outline';
      case 'Política de Privacidade':
        return 'shield-checkmark-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const handleThemeChange = (value: boolean) => {
    // Se ativado (escuro), usa 'dark', senão usa 'light'
    setTheme(value ? 'dark' : 'light');
  };

  const handleUseSystemTheme = () => {
    setTheme('system');
  };

  const styles = createStyles(colors);

  const renderContent = () => {
    if (section === 'sobre') {
      return (
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Equilibra</Text>
          <Text style={styles.sectionSubtitle}>Versão 2.0.0</Text>
          
          {/* Theme Settings */}
          <View style={styles.themeSection}>
            <Text style={styles.themeSectionTitle}>Aparência</Text>
            
            <View style={styles.themeRow}>
              <View style={styles.themeRowLeft}>
                <Ionicons 
                  name={isDark ? 'moon' : 'sunny'} 
                  size={22} 
                  color={colors.purple} 
                />
                <Text style={styles.themeRowLabel}>Modo Escuro</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={handleThemeChange}
                trackColor={{ false: colors.border, true: colors.purple + '60' }}
                thumbColor={isDark ? colors.purple : colors.gray}
              />
            </View>

            <TouchableOpacity 
              style={[
                styles.systemThemeButton,
                theme === 'system' && styles.systemThemeButtonActive
              ]}
              onPress={handleUseSystemTheme}
            >
              <Ionicons name="phone-portrait-outline" size={18} color={theme === 'system' ? colors.purple : colors.gray} />
              <Text style={[
                styles.systemThemeText,
                theme === 'system' && styles.systemThemeTextActive
              ]}>
                Usar tema do sistema
              </Text>
              {theme === 'system' && (
                <Ionicons name="checkmark" size={18} color={colors.purple} />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.moreList}>
            {['Central de Ajuda', 'Termos de Uso', 'Política de Privacidade'].map((item) => (
              <TouchableOpacity key={item} style={styles.moreRow}>
                <View style={styles.moreRowLeft}>
                  <View style={[styles.moreRowIcon, { backgroundColor: colors.purple + '15' }]}>
                    <Ionicons name={getItemIcon(item) as any} size={20} color={colors.purple} />
                  </View>
                  <Text style={styles.moreRowLabel}>{item}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.gray} />
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              Alert.alert('Sair', 'Tem certeza que deseja sair?', [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Sair', style: 'destructive', onPress: onSignOut },
              ]);
            }}
          >
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      );
    }

    const items =
      section === 'gerenciar'
        ? ['Cartões de Crédito', 'Objetivos', 'Categorias']
        : ['Resumo mensal', 'Alertas inteligentes', 'Insights personalizados'];

    return (
      <View style={styles.sectionCard}>
        <View style={styles.moreList}>
          {items.map((label) => (
            <TouchableOpacity
              key={label}
              style={styles.moreRow}
              onPress={() => handleItemPress(label)}
            >
              <View style={styles.moreRowLeft}>
                <View style={[styles.moreRowIcon, { backgroundColor: colors.purple + '15' }]}>
                  <Ionicons name={getItemIcon(label) as any} size={20} color={colors.purple} />
                </View>
                <Text style={styles.moreRowLabel}>{label}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.gray} />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Text style={styles.reportsTitle}>Mais Opções</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>
            {profile?.name ? profile.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.profileName}>{profile?.name || 'Carregando...'}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
        <TouchableOpacity onPress={() => onNavigate('edit-profile')}>
          <Text style={styles.sectionLink}>Editar perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.segmentedControl}>
        {[
          { key: 'gerenciar', label: 'Gerenciar' },
          { key: 'acompanhar', label: 'Acompanhar' },
          { key: 'sobre', label: 'Sobre' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.segmentButton, section === item.key && styles.segmentButtonActive]}
            onPress={() => setSection(item.key as typeof section)}
          >
            <Text style={[styles.segmentLabel, section === item.key && styles.segmentLabelActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {renderContent()}
    </ScrollView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  scroll: { padding: 20, paddingBottom: 120 },
  reportsTitle: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 24 },
  profileCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    alignItems: 'center',
    padding: 24,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  profileName: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  profileEmail: { color: colors.gray, fontSize: 14, marginBottom: 12 },
  sectionLink: { color: colors.purple, fontWeight: '600' },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 6,
    marginBottom: 24,
  },
  segmentButton: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    alignItems: 'center',
  },
  segmentButtonActive: { backgroundColor: colors.cardAlt },
  segmentLabel: { color: colors.gray, fontWeight: '600' },
  segmentLabelActive: { color: colors.text },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionSubtitle: { color: colors.gray, marginBottom: 16 },
  themeSection: {
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  themeSectionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  themeRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeRowLabel: {
    color: colors.text,
    fontSize: 16,
  },
  systemThemeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.card,
    borderRadius: 10,
  },
  systemThemeButtonActive: {
    backgroundColor: colors.purple + '15',
  },
  systemThemeText: {
    flex: 1,
    color: colors.gray,
    fontSize: 14,
  },
  systemThemeTextActive: {
    color: colors.purple,
  },
  moreList: { 
    borderRadius: 18, 
    overflow: 'hidden',
    backgroundColor: colors.cardAlt,
  },
  moreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  moreRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  moreRowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreRowLabel: { 
    color: colors.text, 
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#351515',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  logoutText: { color: '#FF4D4F', fontWeight: '700' },
});