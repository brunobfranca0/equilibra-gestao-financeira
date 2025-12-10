import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { transactionService, Transaction } from '../services/transactionService';
import { categoryService } from '../services/categoryService';

interface MonthlySummaryScreenProps {
  onBack: () => void;
  userId: string;
}

interface MonthlyData {
  month: string;
  year: number;
  income: number;
  expenses: number;
  balance: number;
  transactionCount: number;
  topCategory: { name: string; amount: number } | null;
}

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export default function MonthlySummaryScreen({ onBack, userId }: MonthlySummaryScreenProps) {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState<{ month: number; year: number } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [transData, catData] = await Promise.all([
        transactionService.getAll(userId),
        categoryService.getAll(userId),
      ]);
      setTransactions(transData || []);
      setCategories(catData || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os dados.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const monthlyData = useMemo(() => {
    const months: MonthlyData[] = [];
    const monthMap = new Map<string, Transaction[]>();

    // Agrupar transações por mês
    transactions.forEach((t) => {
      const date = new Date(t.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthMap.has(key)) {
        monthMap.set(key, []);
      }
      monthMap.get(key)!.push(t);
    });

    // Calcular dados para cada mês
    monthMap.forEach((monthTransactions, key) => {
      const [year, month] = key.split('-').map(Number);
      const income = monthTransactions
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = monthTransactions
        .filter((t) => t.type === 'expense' || t.type === 'card_expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calcular categoria mais gastadora
      const categoryMap = new Map<string, number>();
      monthTransactions
        .filter((t) => t.type === 'expense' || t.type === 'card_expense')
        .forEach((t) => {
          if (t.category) {
            categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
          }
        });

      let topCategory: { name: string; amount: number } | null = null;
      categoryMap.forEach((amount, categoryId) => {
        if (!topCategory || amount > topCategory.amount) {
          const category = categories.find((c) => c.id === categoryId);
          topCategory = {
            name: category?.name || 'Sem categoria',
            amount,
          };
        }
      });

      months.push({
        month: MONTH_NAMES[month],
        year,
        income,
        expenses,
        balance: income - expenses,
        transactionCount: monthTransactions.length,
        topCategory,
      });
    });

    // Ordenar por data (mais recente primeiro)
    return months.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const monthIndex = (m: string) => MONTH_NAMES.indexOf(m);
      return monthIndex(b.month) - monthIndex(a.month);
    });
  }, [transactions, categories]);

  // Gerar lista de todos os meses disponíveis (do primeiro mês com dados até o mês atual)
  const allAvailableMonths = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    if (monthlyData.length === 0) {
      // Se não há dados, retornar apenas o mês atual
      return [{ month: currentMonth, year: currentYear }];
    }

    // Encontrar o primeiro mês com dados
    const firstMonthData = monthlyData[monthlyData.length - 1];
    const firstMonthIndex = MONTH_NAMES.indexOf(firstMonthData.month);
    const firstYear = firstMonthData.year;

    // Gerar todos os meses do primeiro até o atual
    const months: { month: number; year: number }[] = [];
    let year = firstYear;
    let month = firstMonthIndex;

    while (year < currentYear || (year === currentYear && month <= currentMonth)) {
      months.push({ month, year });
      month++;
      if (month > 11) {
        month = 0;
        year++;
      }
    }

    return months.reverse(); // Mais recente primeiro
  }, [monthlyData]);


  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (!selectedMonth || allAvailableMonths.length === 0) return;

    const currentIndex = allAvailableMonths.findIndex(
      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
    );
    if (currentIndex === -1) return;

    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < allAvailableMonths.length) {
      const selected = allAvailableMonths[newIndex];
      setSelectedMonth({ month: selected.month, year: selected.year });
    }
  };

  const selectedMonthData = useMemo(() => {
    if (!selectedMonth) return null;
    return (
      monthlyData.find(
        (m) => m.month === MONTH_NAMES[selectedMonth.month] && m.year === selectedMonth.year
      ) || {
        month: MONTH_NAMES[selectedMonth.month],
        year: selectedMonth.year,
        income: 0,
        expenses: 0,
        balance: 0,
        transactionCount: 0,
        topCategory: null,
      }
    );
  }, [monthlyData, selectedMonth]);

  // Inicializar selectedMonth quando allAvailableMonths estiver disponível
  useEffect(() => {
    if (allAvailableMonths.length > 0 && !selectedMonth) {
      const firstMonth = allAvailableMonths[0];
      setSelectedMonth({ month: firstMonth.month, year: firstMonth.year });
    }
  }, [allAvailableMonths, selectedMonth]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Resumo Mensal</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Resumo Mensal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {allAvailableMonths.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>Nenhum dado disponível</Text>
            <Text style={styles.emptySubtitle}>
              Adicione transações para ver o resumo mensal
            </Text>
          </View>
        ) : (
          <>
            {/* Seletor de Mês */}
            <View style={styles.monthSelector}>
              <TouchableOpacity
                onPress={() => navigateMonth('prev')}
                disabled={
                  !selectedMonth ||
                  allAvailableMonths.findIndex(
                    (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                  ) === 0
                }
                style={[
                  styles.monthNavButton,
                  (!selectedMonth ||
                    allAvailableMonths.findIndex(
                      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                    ) === 0) && styles.monthNavButtonDisabled
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={24}
                  color={
                    !selectedMonth ||
                    allAvailableMonths.findIndex(
                      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                    ) === 0
                      ? colors.gray + '40'
                      : colors.text
                  }
                />
              </TouchableOpacity>
              <View style={styles.monthLabelContainer}>
                <Text style={styles.monthLabel}>
                  {selectedMonthData?.month || MONTH_NAMES[selectedMonth?.month || 0] || 'Carregando...'}{' '}
                  {selectedMonthData?.year || selectedMonth?.year || ''}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateMonth('next')}
                disabled={
                  !selectedMonth ||
                  allAvailableMonths.findIndex(
                    (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                  ) === allAvailableMonths.length - 1
                }
                style={[
                  styles.monthNavButton,
                  (!selectedMonth ||
                    allAvailableMonths.findIndex(
                      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                    ) === allAvailableMonths.length - 1) && styles.monthNavButtonDisabled
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={24}
                  color={
                    !selectedMonth ||
                    allAvailableMonths.findIndex(
                      (m) => m.month === selectedMonth.month && m.year === selectedMonth.year
                    ) === allAvailableMonths.length - 1
                      ? colors.gray + '40'
                      : colors.text
                  }
                />
              </TouchableOpacity>
            </View>

            {/* Card de Resumo */}
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={[colors.purple, colors.purple + 'CC']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.summaryGradient}
              >
                <Text style={styles.summaryTitle}>Saldo do Mês</Text>
                <Text
                  style={[
                    styles.summaryBalance,
                    {
                      color: (selectedMonthData?.balance || 0) >= 0 ? colors.green : colors.red,
                    },
                  ]}
                >
                  {formatCurrency(selectedMonthData?.balance || 0)}
                </Text>
              </LinearGradient>
            </View>

            {/* Cards de Receitas e Despesas */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: colors.green + '20' }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.green }]}>
                  <Ionicons name="arrow-down-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statLabel}>Receitas</Text>
                <Text style={[styles.statValue, { color: colors.green }]}>
                  {formatCurrency(selectedMonthData?.income || 0)}
                </Text>
              </View>

              <View style={[styles.statCard, { backgroundColor: colors.red + '20' }]}>
                <View style={[styles.statIcon, { backgroundColor: colors.red }]}>
                  <Ionicons name="arrow-up-circle" size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.statLabel}>Despesas</Text>
                <Text style={[styles.statValue, { color: colors.red }]}>
                  {formatCurrency(selectedMonthData?.expenses || 0)}
                </Text>
              </View>
            </View>

            {/* Informações Adicionais */}
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Detalhes do Mês</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="receipt-outline" size={20} color={colors.gray} />
                <Text style={styles.infoLabel}>Total de transações</Text>
                <Text style={styles.infoValue}>{selectedMonthData?.transactionCount || 0}</Text>
              </View>

              {selectedMonthData?.topCategory && (
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={20} color={colors.gray} />
                  <Text style={styles.infoLabel}>Categoria mais gastadora</Text>
                  <Text style={styles.infoValue}>{selectedMonthData.topCategory.name}</Text>
                </View>
              )}

              {selectedMonthData?.topCategory && (
                <View style={styles.infoRow}>
                  <Ionicons name="cash-outline" size={20} color={colors.gray} />
                  <Text style={styles.infoLabel}>Gasto na categoria</Text>
                  <Text style={styles.infoValue}>
                    {formatCurrency(selectedMonthData.topCategory.amount || 0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Lista de Meses */}
            <View style={styles.monthsList}>
              <Text style={styles.monthsListTitle}>Histórico de Meses</Text>
              {allAvailableMonths.map((monthKey) => {
                const monthData = monthlyData.find(
                  (m) => m.month === MONTH_NAMES[monthKey.month] && m.year === monthKey.year
                );
                return (
                  <TouchableOpacity
                    key={`${monthKey.year}-${monthKey.month}`}
                    style={styles.monthItem}
                    onPress={() => {
                      setSelectedMonth({ month: monthKey.month, year: monthKey.year });
                    }}
                  >
                    <View style={styles.monthItemLeft}>
                      <Text style={styles.monthItemMonth}>{MONTH_NAMES[monthKey.month]}</Text>
                      <Text style={styles.monthItemYear}>{monthKey.year}</Text>
                    </View>
                    <View style={styles.monthItemRight}>
                      <Text
                        style={[
                          styles.monthItemBalance,
                          { color: (monthData?.balance || 0) >= 0 ? colors.green : colors.red },
                        ]}
                      >
                        {formatCurrency(monthData?.balance || 0)}
                      </Text>
                      <Text style={styles.monthItemTransactions}>
                        {monthData?.transactionCount || 0} transações
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
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
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 4,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    placeholder: {
      width: 32,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      color: colors.gray,
      fontSize: 16,
    },
    scroll: {
      padding: 20,
      paddingBottom: 40,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
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
      textAlign: 'center',
    },
    monthSelector: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      marginBottom: 20,
    },
    monthNavButton: {
      padding: 8,
      minWidth: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    monthNavButtonDisabled: {
      opacity: 0.3,
    },
    monthLabelContainer: {
      flex: 1,
      alignItems: 'center',
    },
    monthLabel: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
    },
    summaryCard: {
      borderRadius: 24,
      overflow: 'hidden',
      marginBottom: 20,
    },
    summaryGradient: {
      padding: 24,
      alignItems: 'center',
    },
    summaryTitle: {
      color: '#FFFFFF',
      fontSize: 14,
      opacity: 0.9,
      marginBottom: 8,
    },
    summaryBalance: {
      fontSize: 36,
      fontWeight: '700',
    },
    statsRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      padding: 16,
    },
    statIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    statLabel: {
      color: colors.gray,
      fontSize: 12,
      marginBottom: 4,
    },
    statValue: {
      fontSize: 18,
      fontWeight: '700',
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    infoTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      gap: 12,
    },
    infoLabel: {
      flex: 1,
      color: colors.gray,
      fontSize: 14,
    },
    infoValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    monthsList: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
    },
    monthsListTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 16,
    },
    monthItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    monthItemLeft: {
      flex: 1,
    },
    monthItemMonth: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
    },
    monthItemYear: {
      color: colors.gray,
      fontSize: 12,
      marginTop: 2,
    },
    monthItemRight: {
      alignItems: 'flex-end',
    },
    monthItemBalance: {
      fontSize: 16,
      fontWeight: '700',
    },
    monthItemTransactions: {
      color: colors.gray,
      fontSize: 12,
      marginTop: 2,
    },
  });

