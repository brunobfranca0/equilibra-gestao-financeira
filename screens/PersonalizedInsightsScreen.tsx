import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { transactionService, Transaction } from '../services/transactionService';
import { categoryService } from '../services/categoryService';

interface PersonalizedInsightsScreenProps {
  onBack: () => void;
  userId: string;
}

interface Insight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  icon: string;
}

export default function PersonalizedInsightsScreen({ onBack, userId }: PersonalizedInsightsScreenProps) {
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const insights = useMemo(() => {
    const insightsList: Insight[] = [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Filtrar transações do mês atual
    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startOfMonth && date <= endOfMonth;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = monthTransactions
      .filter((t) => t.type === 'expense' || t.type === 'card_expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;

    // Insight 1: Saldo positivo ou negativo
    if (balance > 0) {
      insightsList.push({
        type: 'positive',
        title: 'Ótimo trabalho!',
        description: `Você está com saldo positivo de R$ ${balance.toFixed(2).replace('.', ',')} este mês. Continue mantendo esse controle financeiro!`,
        icon: 'checkmark-circle',
      });
    } else if (balance < 0) {
      insightsList.push({
        type: 'warning',
        title: 'Atenção ao orçamento',
        description: `Você está com saldo negativo de R$ ${Math.abs(balance).toFixed(2).replace('.', ',')} este mês. Considere revisar seus gastos e criar um plano para equilibrar suas finanças.`,
        icon: 'warning',
      });
    }

    // Insight 2: Categoria mais gastadora
    const categoryMap = new Map<string, number>();
    monthTransactions
      .filter((t) => t.type === 'expense' || t.type === 'card_expense')
      .forEach((t) => {
        if (t.category) {
          categoryMap.set(t.category, (categoryMap.get(t.category) || 0) + t.amount);
        }
      });

    let topCategory: { id: string; amount: number } | null = null;
    categoryMap.forEach((amount, categoryId) => {
      if (!topCategory || amount > topCategory.amount) {
        topCategory = { id: categoryId, amount };
      }
    });

    if (topCategory && topCategory.amount > 0) {
      const category = categories.find((c) => c.id === topCategory!.id);
      const percentage = expenses > 0 ? (topCategory.amount / expenses) * 100 : 0;
      
      if (percentage > 40) {
        insightsList.push({
          type: 'warning',
          title: 'Categoria com maior gasto',
          description: `Você está gastando ${percentage.toFixed(0)}% do seu orçamento em ${category?.name || 'categoria sem nome'}. Considere revisar esses gastos para melhorar seu controle financeiro.`,
          icon: 'pricetag',
        });
      } else {
        insightsList.push({
          type: 'info',
          title: 'Distribuição de gastos',
          description: `Sua maior categoria de gastos este mês foi ${category?.name || 'categoria sem nome'}, representando ${percentage.toFixed(0)}% do total.`,
          icon: 'analytics',
        });
      }
    }

    // Insight 3: Comparação com mês anterior
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type === 'expense' || t.type === 'card_expense')
      .reduce((sum, t) => sum + t.amount, 0);

    if (lastMonthExpenses > 0 && expenses > 0) {
      const change = ((expenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (change > 20) {
        insightsList.push({
          type: 'warning',
          title: 'Aumento nos gastos',
          description: `Seus gastos aumentaram ${Math.abs(change).toFixed(0)}% em relação ao mês anterior. Analise onde está gastando mais para manter o controle.`,
          icon: 'trending-up',
        });
      } else if (change < -20) {
        insightsList.push({
          type: 'positive',
          title: 'Redução nos gastos',
          description: `Parabéns! Você reduziu seus gastos em ${Math.abs(change).toFixed(0)}% em relação ao mês anterior. Continue assim!`,
          icon: 'trending-down',
        });
      }
    }

    // Insight 4: Média de gastos diários
    const daysInMonth = now.getDate();
    const dailyAverage = expenses / daysInMonth;
    if (dailyAverage > 0) {
      insightsList.push({
        type: 'info',
        title: 'Média diária de gastos',
        description: `Você está gastando em média R$ ${dailyAverage.toFixed(2).replace('.', ',')} por dia este mês. Isso pode ajudar a planejar melhor seus gastos futuros.`,
        icon: 'calendar',
      });
    }

    // Insight 5: Receitas vs Despesas
    if (income > 0 && expenses > 0) {
      const ratio = (expenses / income) * 100;
      if (ratio > 90) {
        insightsList.push({
          type: 'warning',
          title: 'Gastos próximos da receita',
          description: `Você está gastando ${ratio.toFixed(0)}% da sua receita. Considere economizar mais para ter uma reserva de emergência.`,
          icon: 'wallet',
        });
      } else if (ratio < 70) {
        insightsList.push({
          type: 'positive',
          title: 'Boa gestão financeira',
          description: `Você está gastando apenas ${ratio.toFixed(0)}% da sua receita, o que é excelente! Continue mantendo esse controle.`,
          icon: 'thumbs-up',
        });
      }
    }

    // Insight 6: Número de transações
    if (monthTransactions.length > 50) {
      insightsList.push({
        type: 'info',
        title: 'Muitas transações',
        description: `Você realizou ${monthTransactions.length} transações este mês. Considere agrupar alguns gastos para simplificar seu controle.`,
        icon: 'receipt',
      });
    } else if (monthTransactions.length < 10 && expenses > 0) {
      insightsList.push({
        type: 'info',
        title: 'Poucas transações registradas',
        description: `Você registrou apenas ${monthTransactions.length} transações este mês. Lembre-se de registrar todos os gastos para ter um controle mais preciso.`,
        icon: 'add-circle',
      });
    }

    return insightsList;
  }, [transactions, categories]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Insights Personalizados</Text>
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
        <Text style={styles.title}>Insights Personalizados</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {insights.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="analytics-outline" size={64} color={colors.gray} />
            <Text style={styles.emptyTitle}>Nenhum insight disponível</Text>
            <Text style={styles.emptySubtitle}>
              Adicione mais transações para receber insights personalizados
            </Text>
          </View>
        ) : (
          insights.map((insight, index) => (
            <View
              key={index}
              style={[
                styles.insightCard,
                insight.type === 'positive' && styles.insightCardPositive,
                insight.type === 'warning' && styles.insightCardWarning,
                insight.type === 'info' && styles.insightCardInfo,
              ]}
            >
              <View style={styles.insightHeader}>
                <View
                  style={[
                    styles.insightIcon,
                    insight.type === 'positive' && { backgroundColor: colors.green + '20' },
                    insight.type === 'warning' && { backgroundColor: colors.red + '20' },
                    insight.type === 'info' && { backgroundColor: colors.purple + '20' },
                  ]}
                >
                  <Ionicons
                    name={insight.icon as any}
                    size={24}
                    color={
                      insight.type === 'positive'
                        ? colors.green
                        : insight.type === 'warning'
                        ? colors.red
                        : colors.purple
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.insightTitle,
                    insight.type === 'positive' && { color: colors.green },
                    insight.type === 'warning' && { color: colors.red },
                    insight.type === 'info' && { color: colors.purple },
                  ]}
                >
                  {insight.title}
                </Text>
              </View>
              <Text style={styles.insightDescription}>{insight.description}</Text>
            </View>
          ))
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
    placeholder: {
      width: 32,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
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
    insightCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
    },
    insightCardPositive: {
      borderColor: colors.green + '40',
      backgroundColor: colors.green + '10',
    },
    insightCardWarning: {
      borderColor: colors.red + '40',
      backgroundColor: colors.red + '10',
    },
    insightCardInfo: {
      borderColor: colors.purple + '40',
      backgroundColor: colors.purple + '10',
    },
    insightHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    insightIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '700',
    },
    insightDescription: {
      color: colors.text,
      fontSize: 14,
      lineHeight: 20,
    },
  });

