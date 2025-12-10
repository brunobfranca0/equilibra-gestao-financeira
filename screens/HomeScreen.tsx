import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { transactionService, Transaction } from '../services/transactionService';
import { accountService, Account } from '../services/accountService';
import { cardService, CreditCard } from '../services/cardService';
import { categoryService, Category } from '../services/categoryService';
import { useTheme } from '../contexts/ThemeContext';
import { HighlightPill } from '../components/HighlightPill';

interface HomeScreenProps {
  isBalanceVisible: boolean;
  onToggleBalance: () => void;
  userId: string;
  activeAccountId: string | null;
  activeCardId: string | null;
  onSelectActiveAccount: (id: string | null) => void;
  onSelectActiveCard: (id: string | null) => void;
  onNavigate: (screen: 'all-transactions') => void;
}

export default function HomeScreen({
  isBalanceVisible,
  onToggleBalance,
  userId,
  activeAccountId,
  activeCardId,
  onSelectActiveAccount,
  onSelectActiveCard,
  onNavigate,
}: HomeScreenProps) {
  const { colors, isDark } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await transactionService.getAll(userId);
      setTransactions(data || []);
    } catch (error: any) {
      Alert.alert('Erro', 'Não foi possível carregar as transações');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadAccountsAndCards = useCallback(async () => {
    try {
      const [accData, cardData, catData] = await Promise.all([
        accountService.getAll(userId),
        cardService.getAll(userId),
        categoryService.getAll(userId),
      ]);
      setAccounts(accData || []);
      setCards(cardData || []);
      setCategories(catData || []);
    } catch (error) {
      // Apenas registra o erro, sem bloquear a tela
      console.warn('Erro ao carregar contas/cartões', error);
    }
  }, [userId]);

  useEffect(() => {
    loadTransactions();
    loadAccountsAndCards();
  }, [loadTransactions, loadAccountsAndCards]);

  // Filtrar por mês atual ou período selecionado
  const dateRange = useMemo(() => {
    if (filterStartDate && filterEndDate) {
      return { start: filterStartDate, end: filterEndDate };
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      start: startOfMonth.toISOString().split('T')[0],
      end: endOfMonth.toISOString().split('T')[0],
    };
  }, [filterStartDate, filterEndDate]);

  const recentTransactions = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesAccount = activeAccountId ? t.account_id === activeAccountId : true;
        const matchesCard = activeCardId ? t.card_id === activeCardId : true;
        const matchesDate = t.date >= dateRange.start && t.date <= dateRange.end;
        const matchesCategory = filterCategoryId ? t.category === filterCategoryId : true;
        return matchesAccount && matchesCard && matchesDate && matchesCategory;
      })
      .slice(0, 5);
  }, [transactions, activeAccountId, activeCardId, dateRange, filterCategoryId]);

  const totalIncome = transactions
    .filter((t) => {
      const matchesAccount = activeAccountId ? t.account_id === activeAccountId : true;
      const matchesCard = activeCardId ? t.card_id === activeCardId : true;
      const matchesDate = t.date >= dateRange.start && t.date <= dateRange.end;
      const matchesCategory = filterCategoryId ? t.category === filterCategoryId : true;
      return matchesAccount && matchesCard && matchesDate && matchesCategory && t.type === 'income';
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => {
      const matchesAccount = activeAccountId ? t.account_id === activeAccountId : true;
      const matchesCard = activeCardId ? t.card_id === activeCardId : true;
      const matchesDate = t.date >= dateRange.start && t.date <= dateRange.end;
      const matchesCategory = filterCategoryId ? t.category === filterCategoryId : true;
      return matchesAccount && matchesCard && matchesDate && matchesCategory && (t.type === 'expense' || t.type === 'card_expense');
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const styles = createStyles(colors, isDark);

  const activeAccount = accounts.find((a) => a.id === activeAccountId);
  const activeCard = cards.find((c) => c.id === activeCardId);

  const cycleAccount = () => {
    if (accounts.length === 0) {
      onSelectActiveAccount(null);
      return;
    }
    if (!activeAccountId) {
      onSelectActiveAccount(accounts[0].id);
      return;
    }
    const idx = accounts.findIndex((a) => a.id === activeAccountId);
    const nextIdx = idx + 1;
    if (nextIdx >= accounts.length) {
      onSelectActiveAccount(null); // volta para "todas"
    } else {
      onSelectActiveAccount(accounts[nextIdx].id);
    }
  };

  const cycleCard = () => {
    if (cards.length === 0) {
      onSelectActiveCard(null);
      return;
    }
    if (!activeCardId) {
      onSelectActiveCard(cards[0].id);
      return;
    }
    const idx = cards.findIndex((c) => c.id === activeCardId);
    const nextIdx = idx + 1;
    if (nextIdx >= cards.length) {
      onSelectActiveCard(null); // volta para "todos"
    } else {
      onSelectActiveCard(cards[nextIdx].id);
    }
  };


  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.monthSelector}>
        <View style={styles.monthBadge}>
          <Ionicons name="cash" size={18} color={colors.purple} />
        </View>
        <View>
          <Text style={styles.monthLabel}>
            {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
          </Text>
          <Text style={styles.monthSubLabel}>{activeAccount ? activeAccount.name : 'Todas as contas'}</Text>
        </View>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#FF00FF', '#A259FF', '#00BFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoGradient}
          >
            <Ionicons name="wallet" size={24} color="#FFFFFF" />
          </LinearGradient>
        </View>
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, activeAccountId && styles.filterChipActive]}
          onPress={cycleAccount}
          onLongPress={() => onSelectActiveAccount(null)}
        >
          <Ionicons name="wallet-outline" size={16} color={activeAccountId ? '#FFFFFF' : colors.text} />
          <Text style={[styles.filterChipText, activeAccountId && styles.filterChipTextActive]}>
            {activeAccount ? activeAccount.name : 'Todas as contas'}
          </Text>
        </TouchableOpacity>

        {cards.length > 0 && (
          <TouchableOpacity
            style={[styles.filterChip, activeCardId && styles.filterChipActive]}
            onPress={cycleCard}
            onLongPress={() => onSelectActiveCard(null)}
          >
            <Ionicons name="card-outline" size={16} color={activeCardId ? '#FFFFFF' : colors.text} />
            <Text style={[styles.filterChipText, activeCardId && styles.filterChipTextActive]}>
              {activeCard ? activeCard.name : 'Todos os cartões'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.filterButton,
          (filterStartDate || filterEndDate || filterCategoryId) && styles.filterButtonActive,
        ]}
        onPress={() => setShowFilterModal(true)}
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={filterStartDate || filterEndDate || filterCategoryId ? '#FFFFFF' : colors.text}
        />
        <Text
          style={[
            styles.filterButtonText,
            (filterStartDate || filterEndDate || filterCategoryId) && styles.filterButtonTextActive,
          ]}
        >
          Filtrar
        </Text>
        {(filterStartDate || filterEndDate || filterCategoryId) && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>
              {(filterStartDate ? 1 : 0) + (filterEndDate ? 1 : 0) + (filterCategoryId ? 1 : 0)}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo atual em contas</Text>
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceValue, balance < 0 && { color: colors.red }]}>
            {isBalanceVisible ? `${balance < 0 ? '-' : ''}${formatCurrency(balance)}` : '•••••••••'}
          </Text>
          <TouchableOpacity style={styles.eyeButton} onPress={onToggleBalance}>
            <Ionicons name={isBalanceVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.highlightsRow}>
          <HighlightPill
            label="Receitas"
            value={isBalanceVisible ? formatCurrency(totalIncome) : '••••••'}
            color={colors.green}
            icon="trending-up"
          />
          <HighlightPill
            label="Despesas"
            value={isBalanceVisible ? formatCurrency(totalExpenses) : '••••••'}
            color={colors.red}
            icon="trending-down"
          />
        </View>
      </View>

      <LinearGradient colors={['#C084FC', '#9333EA']} style={styles.ctaCard}>
        <Text style={styles.ctaTitle}>Organize suas finanças!</Text>
        <Text style={styles.ctaSubtitle}>Controle completo do seu dinheiro</Text>
      </LinearGradient>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transações Recentes</Text>
          <TouchableOpacity onPress={() => onNavigate('all-transactions')}>
            <Text style={styles.sectionLink}>Ver todas</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginVertical: 20 }} />
        ) : recentTransactions.length === 0 ? (
          <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
        ) : (
          recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionSymbol}>$</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
              </View>
              <View style={styles.transactionMeta}>
                <Text
                  style={[
                    styles.transactionValue,
                    transaction.type === 'income' ? { color: colors.green } : { color: colors.red },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </Text>
                <View style={styles.transactionBadge}>
                  <Text style={styles.transactionBadgeText}>
                    {transaction.category || 'Sem categoria'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>

    {/* Modal de Filtros - Fora do ScrollView */}
    {showFilterModal && (
    <Modal
      visible={showFilterModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowFilterModal(false)}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar Transações</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <Ionicons name="close" size={24} color={colors.gray} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Filtro por Categoria */}
            <Text style={styles.filterLabel}>Categoria</Text>
            <View style={styles.filterOptions}>
              <TouchableOpacity
                style={[styles.filterOption, !filterCategoryId && styles.filterOptionActive]}
                onPress={() => setFilterCategoryId(null)}
              >
                <Ionicons
                  name={!filterCategoryId ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={!filterCategoryId ? colors.purple : colors.gray}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    !filterCategoryId && styles.filterOptionTextActive,
                  ]}
                >
                  Todas as categorias
                </Text>
              </TouchableOpacity>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.filterOption,
                    filterCategoryId === category.id && styles.filterOptionActive,
                  ]}
                  onPress={() => setFilterCategoryId(category.id)}
                >
                  <Ionicons
                    name={filterCategoryId === category.id ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={filterCategoryId === category.id ? colors.purple : colors.gray}
                  />
                  <View style={styles.categoryFilterItem}>
                    <View style={[styles.categoryFilterIcon, { backgroundColor: category.color + '20' }]}>
                      <Ionicons name={category.icon as any} size={16} color={category.color} />
                    </View>
                    <Text
                      style={[
                        styles.filterOptionText,
                        filterCategoryId === category.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.filterLabel, { marginTop: 24 }]}>Data inicial</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateInputText, !filterStartDate && styles.dateInputPlaceholder]}>
                {filterStartDate
                  ? new Date(filterStartDate + 'T00:00:00').toLocaleDateString('pt-BR')
                  : 'Selecione a data inicial'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.gray} />
            </TouchableOpacity>
            {filterStartDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setFilterStartDate('')}
              >
                <Ionicons name="close-circle" size={16} color={colors.gray} />
                <Text style={styles.clearDateButtonText}>Limpar data inicial</Text>
              </TouchableOpacity>
            )}

            {showStartDatePicker && (
              <DateTimePicker
                value={filterStartDate ? new Date(filterStartDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowStartDatePicker(Platform.OS === 'ios');
                  if (selectedDate && event.type !== 'dismissed') {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    setFilterStartDate(dateStr);
                  }
                }}
              />
            )}

            <Text style={[styles.filterLabel, { marginTop: 20 }]}>Data final</Text>
            <TouchableOpacity
              style={styles.dateInput}
              onPress={() => setShowEndDatePicker(true)}
            >
              <Text style={[styles.dateInputText, !filterEndDate && styles.dateInputPlaceholder]}>
                {filterEndDate
                  ? new Date(filterEndDate + 'T00:00:00').toLocaleDateString('pt-BR')
                  : 'Selecione a data final'}
              </Text>
              <Ionicons name="calendar-outline" size={20} color={colors.gray} />
            </TouchableOpacity>
            {filterEndDate && (
              <TouchableOpacity
                style={styles.clearDateButton}
                onPress={() => setFilterEndDate('')}
              >
                <Ionicons name="close-circle" size={16} color={colors.gray} />
                <Text style={styles.clearDateButtonText}>Limpar data final</Text>
              </TouchableOpacity>
            )}

            {showEndDatePicker && (
              <DateTimePicker
                value={filterEndDate ? new Date(filterEndDate + 'T00:00:00') : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowEndDatePicker(Platform.OS === 'ios');
                  if (selectedDate && event.type !== 'dismissed') {
                    const dateStr = selectedDate.toISOString().split('T')[0];
                    setFilterEndDate(dateStr);
                  }
                }}
              />
            )}

            <TouchableOpacity
              style={styles.clearAllDatesButton}
              onPress={() => {
                setFilterStartDate('');
                setFilterEndDate('');
                setFilterCategoryId(null);
              }}
            >
              <Ionicons name="refresh-outline" size={18} color={colors.gray} />
              <Text style={styles.clearDateButtonText}>Limpar todos os filtros</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalApplyButton}
              onPress={() => setShowFilterModal(false)}
            >
              <Text style={styles.modalApplyButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
    )}
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: { padding: 20, paddingBottom: 100 },
  emptyText: { color: colors.gray, textAlign: 'center', marginVertical: 20 },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  monthBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthLabel: { color: colors.gray, fontSize: 14 },
  monthSubLabel: { color: colors.text, fontSize: 16, fontWeight: '600' },
  logoContainer: {
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 24,
    marginBottom: 20,
  },
  balanceLabel: { color: colors.gray, fontSize: 14, marginBottom: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceValue: { color: colors.text, fontSize: 32, fontWeight: '700' },
  eyeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 24,
  },
  ctaCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  ctaTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  ctaSubtitle: { color: '#FFFFFF', opacity: 0.9 },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  sectionLink: { color: colors.purple, fontWeight: '600' },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardAlt,
    borderRadius: 18,
    padding: 16,
    gap: 16,
    marginBottom: 12,
  },
  transactionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionSymbol: { color: colors.text, fontWeight: '700', fontSize: 18 },
  transactionDetails: { flex: 1 },
  transactionTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  transactionDate: { color: colors.gray, marginTop: 2 },
  transactionMeta: { alignItems: 'flex-end' },
  transactionValue: { fontWeight: '700', fontSize: 16 },
  transactionBadge: {
    marginTop: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  transactionBadgeText: { color: colors.gray, fontSize: 12 },
  filterRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterChipText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  filterButtonActive: {
    backgroundColor: colors.purple,
    borderColor: colors.purple,
  },
  filterButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    marginLeft: 4,
  },
  filterBadgeText: {
    color: colors.purple,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  filterOptions: {
    marginTop: 8,
    marginBottom: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: colors.cardAlt,
  },
  filterOptionActive: {
    backgroundColor: colors.purple + '15',
  },
  filterOptionText: {
    color: colors.text,
    fontSize: 16,
    flex: 1,
  },
  filterOptionTextActive: {
    color: colors.purple,
    fontWeight: '600',
  },
  categoryFilterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryFilterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  dateInput: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateInputText: {
    color: colors.text,
    fontSize: 16,
  },
  dateInputPlaceholder: {
    color: colors.gray,
  },
  clearDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
  },
  clearAllDatesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    paddingVertical: 12,
  },
  clearDateButtonText: {
    color: colors.gray,
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: colors.cardAlt,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalApplyButton: {
    flex: 1,
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalApplyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});