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
import { useTheme } from '../contexts/ThemeContext';
import { Transaction, transactionService } from '../services/transactionService';
import { Account, accountService } from '../services/accountService';
import { CreditCard, cardService } from '../services/cardService';
import { Category, categoryService } from '../services/categoryService';

interface AllTransactionsScreenProps {
  onBack: () => void;
  userId: string;
  activeAccountId: string | null;
  activeCardId: string | null;
  onSelectTransaction: (transaction: Transaction) => void;
}

export default function AllTransactionsScreen({
  onBack,
  userId,
  activeAccountId,
  activeCardId,
  onSelectTransaction,
}: AllTransactionsScreenProps) {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterAccountId, setFilterAccountId] = useState<string | null>(activeAccountId);
  const [filterCardId, setFilterCardId] = useState<string | null>(activeCardId);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  // Estados temporários para o modal
  const [tempFilterType, setTempFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [tempFilterAccountId, setTempFilterAccountId] = useState<string | null>(activeAccountId);
  const [tempFilterCardId, setTempFilterCardId] = useState<string | null>(activeCardId);
  const [tempFilterCategoryId, setTempFilterCategoryId] = useState<string | null>(null);
  const [tempFilterStartDate, setTempFilterStartDate] = useState<string>('');
  const [tempFilterEndDate, setTempFilterEndDate] = useState<string>('');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transData, accData, cardData, catData] = await Promise.all([
        transactionService.getAll(userId),
        accountService.getAll(userId),
        cardService.getAll(userId),
        categoryService.getAll(userId),
      ]);
      setTransactions(transData || []);
      setAccounts(accData || []);
      setCards(cardData || []);
      setCategories(catData || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType =
        filterType === 'all' ||
        (filterType === 'income' && t.type === 'income') ||
        (filterType === 'expense' && (t.type === 'expense' || t.type === 'card_expense'));
      const matchesAccount = filterAccountId ? t.account_id === filterAccountId : true;
      const matchesCard = filterCardId ? t.card_id === filterCardId : true;
      const matchesCategory = filterCategoryId ? t.category === filterCategoryId : true;
      const matchesDate =
        (!filterStartDate || t.date >= filterStartDate) &&
        (!filterEndDate || t.date <= filterEndDate);
      return matchesSearch && matchesType && matchesAccount && matchesCard && matchesCategory && matchesDate;
    });
  }, [transactions, searchQuery, filterType, filterAccountId, filterCardId, filterCategoryId, filterStartDate, filterEndDate]);

  const formatCurrency = (value: number) => `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const handleOpenFilterModal = () => {
    setTempFilterType(filterType);
    setTempFilterAccountId(filterAccountId);
    setTempFilterCardId(filterCardId);
    setTempFilterCategoryId(filterCategoryId);
    setTempFilterStartDate(filterStartDate);
    setTempFilterEndDate(filterEndDate);
    setShowFilterModal(true);
  };

  const handleApplyFilters = () => {
    setFilterType(tempFilterType);
    setFilterAccountId(tempFilterAccountId);
    setFilterCardId(tempFilterCardId);
    setFilterCategoryId(tempFilterCategoryId);
    setFilterStartDate(tempFilterStartDate);
    setFilterEndDate(tempFilterEndDate);
    setShowFilterModal(false);
  };

  const handleClearFilters = () => {
    setTempFilterType('all');
    setTempFilterAccountId(null);
    setTempFilterCardId(null);
    setTempFilterCategoryId(null);
    setTempFilterStartDate('');
    setTempFilterEndDate('');
  };

  const hasActiveFilters =
    filterType !== 'all' ||
    filterAccountId !== null ||
    filterCardId !== null ||
    filterCategoryId !== null ||
    filterStartDate !== '' ||
    filterEndDate !== '';

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Todas as Transações</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search-outline" size={18} color={colors.gray} />
          <TextInput
            placeholder="Buscar por descrição..."
            placeholderTextColor={colors.gray}
            style={styles.searchText}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, hasActiveFilters && styles.filterButtonActive]}
          onPress={handleOpenFilterModal}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveFilters ? '#FFFFFF' : colors.text}
          />
          <Text style={[styles.filterButtonText, hasActiveFilters && styles.filterButtonTextActive]}>
            Filtrar
          </Text>
          {hasActiveFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {(filterType !== 'all' ? 1 : 0) +
                  (filterAccountId ? 1 : 0) +
                  (filterCardId ? 1 : 0) +
                  (filterCategoryId ? 1 : 0) +
                  (filterStartDate ? 1 : 0) +
                  (filterEndDate ? 1 : 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginVertical: 40 }} />
        ) : filteredTransactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>Nenhuma transação encontrada</Text>
            <Text style={styles.emptySubtitle}>Tente ajustar os filtros</Text>
          </View>
        ) : (
          filteredTransactions.map((transaction) => (
            <TouchableOpacity
              key={transaction.id}
              style={styles.transactionCard}
              onPress={() => onSelectTransaction(transaction)}
            >
              <View style={styles.transactionIcon}>
                <Text style={styles.transactionSymbol}>$</Text>
              </View>
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionTitle}>{transaction.description}</Text>
                <Text style={styles.transactionDate}>{formatDate(transaction.date)}</Text>
                <Text style={styles.transactionCategory}>{transaction.category || 'Sem categoria'}</Text>
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
                <Ionicons name="chevron-forward" size={20} color={colors.gray} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Modal de Filtros */}
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

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Filtro por Tipo */}
              <Text style={styles.filterSectionTitle}>Tipo de Transação</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    tempFilterType === 'all' && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterType('all')}
                >
                  <Ionicons
                    name={tempFilterType === 'all' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={tempFilterType === 'all' ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempFilterType === 'all' && styles.filterOptionTextActive,
                    ]}
                  >
                    Todas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    tempFilterType === 'income' && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterType('income')}
                >
                  <Ionicons
                    name={tempFilterType === 'income' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={tempFilterType === 'income' ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempFilterType === 'income' && styles.filterOptionTextActive,
                    ]}
                  >
                    Receitas
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    tempFilterType === 'expense' && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterType('expense')}
                >
                  <Ionicons
                    name={tempFilterType === 'expense' ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={tempFilterType === 'expense' ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      tempFilterType === 'expense' && styles.filterOptionTextActive,
                    ]}
                  >
                    Despesas
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Filtro por Conta */}
              <Text style={styles.filterSectionTitle}>Conta</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !tempFilterAccountId && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterAccountId(null)}
                >
                  <Ionicons
                    name={!tempFilterAccountId ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={!tempFilterAccountId ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      !tempFilterAccountId && styles.filterOptionTextActive,
                    ]}
                  >
                    Todas as contas
                  </Text>
                </TouchableOpacity>
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    style={[
                      styles.filterOption,
                      tempFilterAccountId === account.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilterAccountId(account.id)}
                  >
                    <Ionicons
                      name={tempFilterAccountId === account.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={tempFilterAccountId === account.id ? colors.purple : colors.gray}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempFilterAccountId === account.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {account.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtro por Cartão */}
              <Text style={styles.filterSectionTitle}>Cartão de Crédito</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !tempFilterCardId && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterCardId(null)}
                >
                  <Ionicons
                    name={!tempFilterCardId ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={!tempFilterCardId ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      !tempFilterCardId && styles.filterOptionTextActive,
                    ]}
                  >
                    Todos os cartões
                  </Text>
                </TouchableOpacity>
                {cards.map((card) => (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.filterOption,
                      tempFilterCardId === card.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilterCardId(card.id)}
                  >
                    <Ionicons
                      name={tempFilterCardId === card.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={tempFilterCardId === card.id ? colors.purple : colors.gray}
                    />
                    <Text
                      style={[
                        styles.filterOptionText,
                        tempFilterCardId === card.id && styles.filterOptionTextActive,
                      ]}
                    >
                      {card.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtro por Categoria */}
              <Text style={styles.filterSectionTitle}>Categoria</Text>
              <View style={styles.filterOptions}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    !tempFilterCategoryId && styles.filterOptionActive,
                  ]}
                  onPress={() => setTempFilterCategoryId(null)}
                >
                  <Ionicons
                    name={!tempFilterCategoryId ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={!tempFilterCategoryId ? colors.purple : colors.gray}
                  />
                  <Text
                    style={[
                      styles.filterOptionText,
                      !tempFilterCategoryId && styles.filterOptionTextActive,
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
                      tempFilterCategoryId === category.id && styles.filterOptionActive,
                    ]}
                    onPress={() => setTempFilterCategoryId(category.id)}
                  >
                    <Ionicons
                      name={tempFilterCategoryId === category.id ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={tempFilterCategoryId === category.id ? colors.purple : colors.gray}
                    />
                    <View style={styles.categoryFilterItem}>
                      <View style={[styles.categoryFilterIcon, { backgroundColor: category.color + '20' }]}>
                        <Ionicons name={category.icon as any} size={16} color={category.color} />
                      </View>
                      <Text
                        style={[
                          styles.filterOptionText,
                          tempFilterCategoryId === category.id && styles.filterOptionTextActive,
                        ]}
                      >
                        {category.name}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Filtro por Data */}
              <Text style={styles.filterSectionTitle}>Período</Text>
              <View style={styles.dateInputsContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>Data inicial</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowStartDatePicker(true)}
                  >
                    <Text
                      style={[
                        styles.dateInputText,
                        !tempFilterStartDate && styles.dateInputPlaceholder,
                      ]}
                    >
                      {tempFilterStartDate
                        ? new Date(tempFilterStartDate + 'T00:00:00').toLocaleDateString('pt-BR')
                        : 'Selecione a data inicial'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.gray} />
                  </TouchableOpacity>
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={
                        tempFilterStartDate
                          ? new Date(tempFilterStartDate + 'T00:00:00')
                          : new Date()
                      }
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowStartDatePicker(Platform.OS === 'ios');
                        if (selectedDate && event.type !== 'dismissed') {
                          const dateStr = selectedDate.toISOString().split('T')[0];
                          setTempFilterStartDate(dateStr);
                        }
                      }}
                    />
                  )}
                </View>
                <View style={styles.dateInputWrapper}>
                  <Text style={styles.dateLabel}>Data final</Text>
                  <TouchableOpacity
                    style={styles.dateInput}
                    onPress={() => setShowEndDatePicker(true)}
                  >
                    <Text
                      style={[
                        styles.dateInputText,
                        !tempFilterEndDate && styles.dateInputPlaceholder,
                      ]}
                    >
                      {tempFilterEndDate
                        ? new Date(tempFilterEndDate + 'T00:00:00').toLocaleDateString('pt-BR')
                        : 'Selecione a data final'}
                    </Text>
                    <Ionicons name="calendar-outline" size={20} color={colors.gray} />
                  </TouchableOpacity>
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={
                        tempFilterEndDate ? new Date(tempFilterEndDate + 'T00:00:00') : new Date()
                      }
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={(event, selectedDate) => {
                        setShowEndDatePicker(Platform.OS === 'ios');
                        if (selectedDate && event.type !== 'dismissed') {
                          const dateStr = selectedDate.toISOString().split('T')[0];
                          setTempFilterEndDate(dateStr);
                        }
                      }}
                    />
                  )}
                </View>
              </View>
            </ScrollView>

            {/* Botões de Ação */}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClearFilters}>
                <Ionicons name="refresh-outline" size={18} color={colors.gray} />
                <Text style={styles.clearButtonText}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      )}
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
    },
    backButton: {
      padding: 4,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    searchRow: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      marginBottom: 16,
      gap: 12,
    },
    searchInput: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      gap: 8,
      height: 52,
    },
    searchText: {
      flex: 1,
      color: colors.text,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 18,
      paddingHorizontal: 16,
      height: 52,
      borderWidth: 1,
      borderColor: colors.border,
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
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
      marginLeft: 4,
    },
    filterBadgeText: {
      color: colors.purple,
      fontSize: 12,
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
      maxHeight: '85%',
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
    filterSectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 20,
    },
    filterOptions: {
      paddingHorizontal: 20,
    },
    filterOption: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingVertical: 14,
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
    dateInputsContainer: {
      paddingHorizontal: 20,
      gap: 16,
    },
    dateInputWrapper: {
      marginBottom: 16,
    },
    dateLabel: {
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
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      padding: 20,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    clearButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.cardAlt,
      borderRadius: 16,
      paddingVertical: 16,
    },
    clearButtonText: {
      color: colors.gray,
      fontSize: 16,
      fontWeight: '600',
    },
    applyButton: {
      flex: 2,
      backgroundColor: colors.purple,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    applyButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: 20,
      paddingBottom: 100,
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
    emptyState: {
      alignItems: 'center',
      marginTop: 60,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 16,
    },
    emptySubtitle: {
      color: colors.gray,
      fontSize: 14,
      marginTop: 8,
    },
    transactionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
    },
    transactionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.cardAlt,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    transactionSymbol: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 18,
    },
    transactionDetails: {
      flex: 1,
    },
    transactionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    transactionDate: {
      color: colors.gray,
      marginTop: 2,
      fontSize: 12,
    },
    transactionCategory: {
      color: colors.gray,
      marginTop: 4,
      fontSize: 12,
    },
    transactionMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    transactionValue: {
      fontWeight: '700',
      fontSize: 16,
    },
  });

