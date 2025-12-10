import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ReportsScreen from './screens/ReportsScreen';
import AccountsScreen from './screens/AccountsScreen';
import MoreScreen from './screens/MoreScreen';
import CategoriesScreen from './screens/CategoriesScreen';
import SavingsGoalsScreen from './screens/SavingsGoalsScreen';
import CardsScreen from './screens/CardsScreen';
import AddTransactionScreen from './screens/AddTransactionScreen';
import AllTransactionsScreen from './screens/AllTransactionsScreen';
import TransactionDetailsScreen from './screens/TransactionDetailsScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import MonthlySummaryScreen from './screens/MonthlySummaryScreen';
import SpendingAlertsScreen from './screens/SpendingAlertsScreen';
import PersonalizedInsightsScreen from './screens/PersonalizedInsightsScreen';
import { BottomNavigation } from './components/BottomNavigation';
import { LoadingScreen } from './components/LoadingScreen';
import { TRANSACTION_OPTIONS } from './constants/transactionOptions';
import { TabKey, ScreenKey } from './types/navigation';
import { Transaction } from './services/transactionService';

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { session, loading, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [currentScreen, setCurrentScreen] = useState<ScreenKey>('main');
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);

  const handleNavigate = (screen: ScreenKey) => {
    setCurrentScreen(screen);
  };

  const handleGoToAccounts = () => {
    setActiveTab('accounts');
    setCurrentScreen('main');
  };

  const handleBack = () => {
    setCurrentScreen('main');
  };

  const handleTransactionSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Calcular screen ANTES dos returns condicionais para evitar erro de hooks
  const screen = useMemo(() => {
    if (!session) return null;

    // Verificar se está em uma tela secundária
    if (currentScreen === 'categories') {
      return <CategoriesScreen onBack={handleBack} userId={session.user.id} />;
    }

    if (currentScreen === 'savings-goals') {
      return <SavingsGoalsScreen onBack={handleBack} userId={session.user.id} />;
    }

    if (currentScreen === 'cards') {
      return (
        <CardsScreen
          onBack={handleBack}
          onSelectActiveCard={setActiveCardId}
          activeCardId={activeCardId}
          userId={session.user.id}
        />
      );
    }

    if (currentScreen === 'all-transactions') {
      return (
        <AllTransactionsScreen
          onBack={handleBack}
          userId={session.user.id}
          activeAccountId={activeAccountId}
          activeCardId={activeCardId}
          onSelectTransaction={(transaction) => {
            setSelectedTransaction(transaction);
            setShowTransactionDetails(true);
          }}
        />
      );
    }

    if (currentScreen === 'edit-profile') {
      return (
        <EditProfileScreen
          onBack={handleBack}
          userId={session.user.id}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
          }}
        />
      );
    }

    if (currentScreen === 'monthly-summary') {
      return <MonthlySummaryScreen onBack={handleBack} userId={session.user.id} />;
    }

    if (currentScreen === 'spending-alerts') {
      return <SpendingAlertsScreen onBack={handleBack} userId={session.user.id} />;
    }

    if (currentScreen === 'personalized-insights') {
      return <PersonalizedInsightsScreen onBack={handleBack} userId={session.user.id} />;
    }

    switch (activeTab) {
      case 'reports':
        return (
          <ReportsScreen
            userId={session.user.id}
            activeAccountId={activeAccountId}
            activeCardId={activeCardId}
          />
        );
      case 'accounts':
        return (
          <AccountsScreen
            userId={session.user.id}
            activeAccountId={activeAccountId}
            onSelectActiveAccount={setActiveAccountId}
          />
        );
      case 'more':
        return (
          <MoreScreen
            key={refreshKey}
            onSignOut={signOut}
            userId={session.user.id}
            onNavigate={handleNavigate}
            onNavigateTab={(tab) => {
              if (tab === 'accounts') handleGoToAccounts();
            }}
          />
        );
      default:
        return (
          <HomeScreen
            key={refreshKey}
            isBalanceVisible={isBalanceVisible}
            onToggleBalance={() => setIsBalanceVisible((prev) => !prev)}
            userId={session.user.id}
            activeAccountId={activeAccountId}
            activeCardId={activeCardId}
            onSelectActiveAccount={setActiveAccountId}
            onSelectActiveCard={setActiveCardId}
            onNavigate={handleNavigate}
          />
        );
    }
  }, [
    activeTab,
    isBalanceVisible,
    session,
    signOut,
    currentScreen,
    refreshKey,
    activeAccountId,
    activeCardId,
  ]);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setCurrentScreen('main');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!session) {
    return <LoginScreen />;
  }

  // Esconder navegação inferior em telas secundárias
  const showBottomNav = currentScreen === 'main';

  const styles = createStyles(colors);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        {screen}
        {showBottomNav && (
          <BottomNavigation
            activeTab={activeTab}
            onSelectTab={handleTabChange}
            onFabPress={() => setShowAddTransaction(true)}
          />
        )}
        <AddTransactionScreen
          visible={showAddTransaction}
          onClose={() => setShowAddTransaction(false)}
          userId={session.user.id}
          onSuccess={handleTransactionSuccess}
        />
        <TransactionDetailsScreen
          visible={showTransactionDetails}
          transaction={selectedTransaction}
          userId={session.user.id}
          onClose={() => {
            setShowTransactionDetails(false);
            setSelectedTransaction(null);
          }}
          onSuccess={() => {
            setRefreshKey((prev) => prev + 1);
            setShowTransactionDetails(false);
            setSelectedTransaction(null);
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background, paddingBottom: 96 },
});