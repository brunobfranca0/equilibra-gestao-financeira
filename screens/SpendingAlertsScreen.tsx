import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { alertService, SpendingAlert } from '../services/alertService';
import { transactionService, Transaction } from '../services/transactionService';

interface SpendingAlertsScreenProps {
  onBack: () => void;
  userId: string;
}

export default function SpendingAlertsScreen({ onBack, userId }: SpendingAlertsScreenProps) {
  const { colors } = useTheme();
  const [alert, setAlert] = useState<SpendingAlert | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [currentMonthSpending, setCurrentMonthSpending] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [alertData, transactions] = await Promise.all([
        alertService.get(userId),
        transactionService.getAll(userId),
      ]);

      if (alertData) {
        setAlert(alertData);
        setMonthlyLimit(alertData.monthly_limit.toString());
        setEnabled(alertData.enabled);
      }

      // Calcular gastos do mês atual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const monthTransactions = transactions.filter((t) => {
        const date = new Date(t.date);
        return (
          date >= startOfMonth &&
          date <= endOfMonth &&
          (t.type === 'expense' || t.type === 'card_expense')
        );
      });

      const spending = monthTransactions.reduce((sum, t) => sum + t.amount, 0);
      setCurrentMonthSpending(spending);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os alertas.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async () => {
    const limit = parseFloat(monthlyLimit.replace(',', '.'));
    if (isNaN(limit) || limit <= 0) {
      Alert.alert('Erro', 'Informe um limite válido maior que zero.');
      return;
    }

    try {
      setSaving(true);
      await alertService.upsert(userId, {
        monthly_limit: limit,
        enabled,
      });
      Alert.alert('Sucesso', 'Alerta configurado com sucesso!');
      loadData();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o alerta.');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;
  };

  const percentageUsed = useMemo(() => {
    if (!alert || !alert.monthly_limit || alert.monthly_limit === 0) return 0;
    return Math.min((currentMonthSpending / alert.monthly_limit) * 100, 100);
  }, [alert, currentMonthSpending]);

  const isOverLimit = useMemo(() => {
    return alert && alert.enabled && currentMonthSpending > alert.monthly_limit;
  }, [alert, currentMonthSpending]);

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Alertas Inteligentes</Text>
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
        <Text style={styles.title}>Alertas Inteligentes</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Card de Status */}
        {alert && alert.enabled && (
          <View style={[styles.statusCard, isOverLimit && styles.statusCardWarning]}>
            <View style={styles.statusHeader}>
              <Ionicons
                name={isOverLimit ? 'warning' : 'checkmark-circle'}
                size={32}
                color={isOverLimit ? colors.red : colors.green}
              />
              <Text style={[styles.statusTitle, isOverLimit && styles.statusTitleWarning]}>
                {isOverLimit ? 'Limite Ultrapassado!' : 'Dentro do Limite'}
              </Text>
            </View>
            <Text style={styles.statusSubtitle}>
              {isOverLimit
                ? `Você ultrapassou o limite de ${formatCurrency(alert.monthly_limit)} em ${formatCurrency(currentMonthSpending - alert.monthly_limit)}`
                : `Você ainda pode gastar ${formatCurrency(Math.max(0, alert.monthly_limit - currentMonthSpending))}`}
            </Text>
          </View>
        )}

        {/* Card de Progresso */}
        {alert && alert.enabled && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Gastos do Mês</Text>
              <Text style={styles.progressValue}>
                {formatCurrency(currentMonthSpending)} / {formatCurrency(alert.monthly_limit)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${percentageUsed}%`,
                    backgroundColor: isOverLimit ? colors.red : colors.purple,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{percentageUsed.toFixed(0)}% utilizado</Text>
          </View>
        )}

        {/* Configurações */}
        <View style={styles.configCard}>
          <Text style={styles.configTitle}>Configurações</Text>

          <View style={styles.configRow}>
            <View style={styles.configRowLeft}>
              <Ionicons name="notifications-outline" size={22} color={colors.purple} />
              <Text style={styles.configLabel}>Ativar Alertas</Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              trackColor={{ false: colors.border, true: colors.purple + '60' }}
              thumbColor={enabled ? colors.purple : colors.gray}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Limite Mensal (R$)</Text>
            <TextInput
              style={styles.input}
              value={monthlyLimit}
              onChangeText={setMonthlyLimit}
              placeholder="0,00"
              placeholderTextColor={colors.gray}
              keyboardType="decimal-pad"
            />
            <Text style={styles.inputHint}>
              Você receberá um alerta quando ultrapassar este valor no mês
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Salvando...' : 'Salvar Configurações'}</Text>
          </TouchableOpacity>
        </View>

        {/* Informações */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color={colors.purple} />
          <Text style={styles.infoText}>
            Os alertas são calculados automaticamente com base nos seus gastos do mês atual. Você
            receberá notificações quando ultrapassar o limite configurado.
          </Text>
        </View>
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
    statusCard: {
      backgroundColor: colors.green + '20',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.green + '40',
    },
    statusCardWarning: {
      backgroundColor: colors.red + '20',
      borderColor: colors.red + '40',
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
      gap: 12,
    },
    statusTitle: {
      color: colors.green,
      fontSize: 20,
      fontWeight: '700',
    },
    statusTitleWarning: {
      color: colors.red,
    },
    statusSubtitle: {
      color: colors.text,
      fontSize: 14,
    },
    progressCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    progressHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    progressLabel: {
      color: colors.gray,
      fontSize: 14,
    },
    progressValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    progressBar: {
      height: 12,
      backgroundColor: colors.cardAlt,
      borderRadius: 6,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressFill: {
      height: '100%',
      borderRadius: 6,
    },
    progressPercentage: {
      color: colors.gray,
      fontSize: 12,
      textAlign: 'right',
    },
    configCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    configTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 20,
    },
    configRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24,
    },
    configRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    configLabel: {
      color: colors.text,
      fontSize: 16,
    },
    inputContainer: {
      marginBottom: 24,
    },
    inputLabel: {
      color: colors.gray,
      fontSize: 14,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 16,
      color: colors.text,
      fontSize: 16,
    },
    inputHint: {
      color: colors.gray,
      fontSize: 12,
      marginTop: 8,
    },
    saveButton: {
      backgroundColor: colors.purple,
      borderRadius: 16,
      paddingVertical: 16,
      alignItems: 'center',
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    infoCard: {
      flexDirection: 'row',
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    infoText: {
      flex: 1,
      color: colors.gray,
      fontSize: 14,
      lineHeight: 20,
    },
  });

