import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { LegendDot } from '../components/LegendDot';
import { Transaction, transactionService } from '../services/transactionService';

interface ReportsScreenProps {
  userId: string;
  activeAccountId?: string | null;
  activeCardId?: string | null;
}

const TIMEFRAME_OPTIONS = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
];

export default function ReportsScreen({ userId, activeAccountId, activeCardId }: ReportsScreenProps) {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(30);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await transactionService.getAll(userId);
        setTransactions(data || []);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar os relatórios agora.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  const { filteredTransactions, incomeTotal, expenseTotal, balance, averageTicket, biggestExpense } =
    useMemo(() => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (timeframe - 1));

      const filtered = transactions.filter((t) => {
        const date = new Date(t.date);
        const matchesAccount = activeAccountId ? t.account_id === activeAccountId : true;
        const matchesCard = activeCardId ? t.card_id === activeCardId : true;
        return date >= startDate && matchesAccount && matchesCard;
      });

      const income = filtered
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const expense = filtered
        .filter((t) => t.type === 'expense' || t.type === 'card_expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const avgTicket =
        filtered.length === 0 ? 0 : (income + expense) / filtered.length;

      const biggestExp = filtered
        .filter((t) => t.type === 'expense' || t.type === 'card_expense')
        .sort((a, b) => b.amount - a.amount)[0];

      return {
        filteredTransactions: filtered,
        incomeTotal: income,
        expenseTotal: expense,
        balance: income - expense,
        averageTicket: avgTicket,
        biggestExpense: biggestExp,
      };
    }, [transactions, timeframe, activeAccountId, activeCardId]);

  const trendData = useMemo(() => {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (timeframe - 1));

    const points: { key: string; label: string; income: number; expense: number }[] = [];
    const byDay: Record<string, { income: number; expense: number }> = {};

    filteredTransactions.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().slice(0, 10);
      if (!byDay[dateKey]) byDay[dateKey] = { income: 0, expense: 0 };
      if (t.type === 'income') {
        byDay[dateKey].income += t.amount;
      } else if (t.type === 'expense' || t.type === 'card_expense') {
        byDay[dateKey].expense += t.amount;
      }
    });

    for (let i = 0; i < timeframe; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      const key = day.toISOString().slice(0, 10);
      const label = `${String(day.getDate()).padStart(2, '0')}/${String(
        day.getMonth() + 1
      ).padStart(2, '0')}`;
      points.push({
        key,
        label,
        income: byDay[key]?.income || 0,
        expense: byDay[key]?.expense || 0,
      });
    }

    return points;
  }, [filteredTransactions, timeframe]);

  const categoryBreakdown = useMemo(() => {
    const totals: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === 'expense' || t.type === 'card_expense')
      .forEach((t) => {
        const key = t.category || 'Sem categoria';
        totals[key] = (totals[key] || 0) + t.amount;
      });

    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [filteredTransactions]);

  const monthlySummary = useMemo(() => {
    const months: { label: string; income: number; expense: number }[] = [];
    const now = new Date();

    for (let i = 2; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = monthDate.toLocaleString('pt-BR', { month: 'short' });

      const monthTransactions = transactions.filter((t) => {
        const d = new Date(t.date);
        return d >= monthDate && d < nextMonth;
      });

      months.push({
        label,
        income: monthTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0),
        expense: monthTransactions
          .filter((t) => t.type === 'expense' || t.type === 'card_expense')
          .reduce((sum, t) => sum + t.amount, 0),
      });
    }

    return months;
  }, [transactions]);

  const maxTrendValue = useMemo(() => {
    const values = trendData.flatMap((p) => [p.income, p.expense]);
    return Math.max(...values, 1);
  }, [trendData]);

  const maxCategoryValue = useMemo(() => {
    const values = categoryBreakdown.map((c) => c.value);
    return Math.max(...values, 1);
  }, [categoryBreakdown]);

  const formatCurrency = (value: number) =>
    `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;

  const styles = createStyles(colors);

  const KpiCard = ({ icon, label, value, color, helper }: KpiCardProps) => (
    <View style={[styles.kpiCard, { borderColor: color + '55' }]}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      {helper ? <Text style={styles.kpiHelper}>{helper}</Text> : null}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.reportsTitle}>Relatórios</Text>
        <View style={styles.timeframeRow}>
          {TIMEFRAME_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeframePill,
                timeframe === option.value && styles.timeframePillActive,
              ]}
              onPress={() => setTimeframe(option.value)}
            >
              <Text
                style={[
                  styles.timeframeText,
                  timeframe === option.value && styles.timeframeTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <LinearGradient colors={['#A259FF', '#7C3AED']} style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <Text style={styles.heroLabel}>Saldo no período</Text>
          <Ionicons name="pie-chart-outline" size={20} color="#FFFFFF" />
        </View>
        <Text style={styles.heroValue}>
          {balance < 0 ? '-' : ''}
          {formatCurrency(balance)}
        </Text>
        <View style={styles.heroBadges}>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeLabel}>
              <View style={[styles.heroBadgeDot, { backgroundColor: colors.green }]} />
              <Text style={styles.heroBadgeLabelText}>Receitas</Text>
            </View>
            <Text style={styles.heroBadgeValue}>{formatCurrency(incomeTotal)}</Text>
          </View>
          <View style={styles.heroBadge}>
            <View style={styles.heroBadgeLabel}>
              <View style={[styles.heroBadgeDot, { backgroundColor: colors.red }]} />
              <Text style={styles.heroBadgeLabelText}>Despesas</Text>
            </View>
            <Text style={styles.heroBadgeValue}>{formatCurrency(expenseTotal)}</Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.kpiGrid}>
        <KpiCard
          icon="swap-vertical"
          label="Ticket médio"
          value={formatCurrency(averageTicket)}
          color={colors.purple}
        />
        <KpiCard
          icon="trending-down"
          label="Maior despesa"
          value={biggestExpense ? formatCurrency(biggestExpense.amount) : 'R$ 0,00'}
          color={colors.red}
          helper={biggestExpense?.description}
        />
        <KpiCard
          icon="card-outline"
          label="Qtd. lançamentos"
          value={`${filteredTransactions.length}`}
          color={colors.green}
          helper="no período"
        />
        <KpiCard
          icon="stats-chart"
          label="Média diária"
          value={formatCurrency((incomeTotal - expenseTotal) / timeframe)}
          color={colors.gray}
        />
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fluxo diário</Text>
          <View style={styles.reportsLegend}>
            <LegendDot color={colors.green} label="Receitas" />
            <LegendDot color={colors.red} label="Despesas" />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.purple} style={{ marginVertical: 24 }} />
        ) : filteredTransactions.length === 0 ? (
          <Text style={styles.emptyText}>Sem movimentos no período selecionado.</Text>
        ) : (
          <View style={styles.trendChart}>
            {trendData.map((point) => (
              <View key={point.key} style={styles.trendColumn}>
                <View style={styles.trendBarArea}>
                  <View
                    style={[
                      styles.trendBar,
                      styles.trendBarExpense,
                      {
                        height: `${(point.expense / maxTrendValue) * 100}%`,
                        backgroundColor: colors.red,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.trendBar,
                      {
                        height: `${(point.income / maxTrendValue) * 100}%`,
                        backgroundColor: colors.green,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.trendLabel}>{point.label}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categorias mais caras</Text>
          <Text style={styles.sectionHint}>Top 6 despesas</Text>
        </View>
        {categoryBreakdown.length === 0 ? (
          <Text style={styles.emptyText}>Ainda não há despesas categorizadas.</Text>
        ) : (
          categoryBreakdown.map((category) => (
            <View key={category.name} style={styles.categoryRow}>
              <Text style={styles.categoryLabel}>{category.name}</Text>
              <View style={styles.categoryBar}>
                <View
                  style={[
                    styles.categoryBarFill,
                    {
                      width: `${(category.value / maxCategoryValue) * 100}%`,
                      backgroundColor: colors.red,
                    },
                  ]}
                />
              </View>
              <Text style={styles.categoryValue}>{formatCurrency(category.value)}</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumo mensal</Text>
          <Text style={styles.sectionHint}>Últimos 3 meses</Text>
        </View>

        <View style={styles.monthsGrid}>
          {monthlySummary.map((month) => {
            const max = Math.max(month.income, month.expense, 1);
            return (
              <View key={month.label} style={styles.monthCard}>
                <Text style={styles.monthLabel}>{month.label}</Text>
                <View style={styles.monthBars}>
                  <View style={styles.monthBarTrack}>
                    <View
                      style={[
                        styles.monthBarFill,
                        {
                          height: `${(month.income / max) * 100}%`,
                          backgroundColor: colors.green,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.monthBarTrack}>
                    <View
                      style={[
                        styles.monthBarFill,
                        {
                          height: `${(month.expense / max) * 100}%`,
                          backgroundColor: colors.red,
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.monthLegend}>
                  <LegendDot color={colors.green} label={formatCurrency(month.income)} />
                  <LegendDot color={colors.red} label={formatCurrency(month.expense)} />
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

interface KpiCardProps {
  icon: any;
  label: string;
  value: string;
  color: string;
  helper?: string;
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    scroll: { padding: 20, paddingBottom: 120 },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    reportsTitle: { color: colors.text, fontSize: 22, fontWeight: '700' },
    timeframeRow: { flexDirection: 'row', gap: 10 },
    timeframePill: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    timeframePillActive: {
      backgroundColor: colors.purple,
      borderColor: colors.purple,
    },
    timeframeText: { color: colors.text, fontWeight: '600' },
    timeframeTextActive: { color: '#FFFFFF' },
    heroCard: {
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
    },
    heroHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLabel: { color: '#FFFFFF', opacity: 0.9 },
    heroValue: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginVertical: 12 },
    heroBadges: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    heroBadge: {
      flex: 1,
      backgroundColor: 'rgba(255,255,255,0.12)',
      borderRadius: 16,
      padding: 12,
    },
    heroBadgeLabel: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    heroBadgeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    heroBadgeLabelText: {
      color: '#FFFFFF',
      fontSize: 14,
    },
    heroBadgeValue: { color: '#FFFFFF', fontWeight: '700', marginTop: 8 },
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 20,
    },
    kpiCard: {
      width: '47%',
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      gap: 4,
    },
    kpiIcon: {
      width: 36,
      height: 36,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 6,
    },
    kpiLabel: { color: colors.gray, fontSize: 12 },
    kpiValue: { fontSize: 18, fontWeight: '700' },
    kpiHelper: { color: colors.gray, fontSize: 12 },
    sectionCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      marginBottom: 20,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    sectionHint: { color: colors.gray, fontSize: 12 },
    reportsLegend: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    emptyText: { color: colors.gray, textAlign: 'center' },
    trendChart: { flexDirection: 'row', gap: 10, alignItems: 'flex-end', minHeight: 180 },
    trendColumn: { flex: 1, alignItems: 'center' },
    trendBarArea: {
      width: '100%',
      height: 150,
      flexDirection: 'row',
      gap: 4,
      alignItems: 'flex-end',
    },
    trendBar: { flex: 1, borderRadius: 8, backgroundColor: colors.cardAlt },
    trendBarExpense: { opacity: 0.85 },
    trendLabel: { color: colors.gray, fontSize: 10, marginTop: 6 },
    categoryRow: {
      marginBottom: 14,
    },
    categoryLabel: { color: colors.text, marginBottom: 6, fontWeight: '600' },
    categoryBar: {
      height: 14,
      backgroundColor: colors.cardAlt,
      borderRadius: 8,
      overflow: 'hidden',
    },
    categoryBarFill: {
      height: '100%',
      borderRadius: 8,
    },
    categoryValue: { color: colors.gray, marginTop: 6, fontSize: 12 },
    monthsGrid: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
    monthCard: {
      flex: 1,
      backgroundColor: colors.cardAlt,
      borderRadius: 16,
      padding: 12,
    },
    monthLabel: { color: colors.text, fontWeight: '700', marginBottom: 8, textTransform: 'capitalize' },
    monthBars: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-end',
      height: 120,
    },
    monthBarTrack: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 12,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    monthBarFill: {
      width: '100%',
      borderRadius: 12,
    },
    monthLegend: {
      marginTop: 10,
      gap: 6,
    },
  });