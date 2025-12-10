import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const tabs = [
  { key: 'home', label: 'Principal', icon: 'home-outline', activeIcon: 'home' },
  {
    key: 'reports',
    label: 'Relatórios',
    icon: 'stats-chart-outline',
    activeIcon: 'stats-chart',
  },
  { key: 'accounts', label: 'Contas', icon: 'wallet-outline', activeIcon: 'wallet' },
  { key: 'more', label: 'Mais', icon: 'ellipsis-horizontal', activeIcon: 'ellipsis-horizontal' },
] as const;

interface BottomNavigationProps {
  activeTab: (typeof tabs)[number]['key'];
  onSelectTab: (tab: (typeof tabs)[number]['key']) => void;
  onFabPress: () => void;
}

export const BottomNavigation = ({ activeTab, onSelectTab, onFabPress }: BottomNavigationProps) => {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  return (
    <View style={styles.bottomBar}>
      {tabs.slice(0, 2).map((tab) => (
        <NavItem key={tab.key} tab={tab} activeTab={activeTab} onPress={() => onSelectTab(tab.key)} />
      ))}

      <TouchableOpacity style={styles.fabButton} onPress={onFabPress}>
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {tabs.slice(2).map((tab) => (
        <NavItem key={tab.key} tab={tab} activeTab={activeTab} onPress={() => onSelectTab(tab.key)} />
      ))}
    </View>
  );
};

const NavItem = ({
  tab,
  activeTab,
  onPress,
}: {
  tab: (typeof tabs)[number];
  activeTab: string;
  onPress: () => void;
}) => {
  const { colors } = useTheme();
  const isActive = activeTab === tab.key;
  
  return (
    <TouchableOpacity style={navItemStyles.navItem} onPress={onPress}>
      <Ionicons name={isActive ? tab.activeIcon : tab.icon} size={20} color={isActive ? colors.purple : colors.gray} />
      <Text style={[navItemStyles.navLabel, { color: isActive ? colors.purple : colors.gray }, isActive && navItemStyles.navLabelActive]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

const navItemStyles = StyleSheet.create({
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navLabel: { fontSize: 12 },
  navLabelActive: { fontWeight: '600' },
});

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: isDark ? '#080809' : '#FFFFFF',
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'android' ? 20 : 20,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: isDark ? 0 : 1,
    borderTopColor: colors.border,
    // Garantir que a barra não seja sobreposta pelos botões do sistema
    marginBottom: Platform.OS === 'android' ? 0 : 0,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    elevation: 4,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});