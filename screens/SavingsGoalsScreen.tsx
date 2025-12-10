import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import {
  SavingsGoal,
  savingsGoalService,
  GOAL_COLORS,
  GOAL_ICONS,
  Achievement,
} from '../services/savingsGoalService';

interface SavingsGoalsScreenProps {
  onBack: () => void;
  userId: string;
}

type TabType = 'active' | 'completed' | 'achievements';

export default function SavingsGoalsScreen({ onBack, userId }: SavingsGoalsScreenProps) {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, achievements: 0 });
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('');
  const [formIcon, setFormIcon] = useState(GOAL_ICONS[0].name);
  const [formColor, setFormColor] = useState(GOAL_COLORS[0]);
  const [depositAmount, setDepositAmount] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    const [statsData, goalsData, achievementsData] = await Promise.all([
      savingsGoalService.getStats(userId),
      activeTab === 'achievements'
        ? Promise.resolve([])
        : savingsGoalService.getByStatus(userId, activeTab === 'active' ? 'active' : 'completed'),
      activeTab === 'achievements'
        ? savingsGoalService.getAchievements(userId)
        : Promise.resolve([]),
    ]);
    setStats(statsData);
    setGoals(goalsData);
    setAchievements(achievementsData);
    setLoading(false);
  }, [userId, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (goal?: SavingsGoal) => {
    if (goal) {
      setEditingGoal(goal);
      setFormName(goal.name);
      setFormTarget(goal.target_amount.toString());
      setFormIcon(goal.icon);
      setFormColor(goal.color);
    } else {
      setEditingGoal(null);
      setFormName('');
      setFormTarget('');
      setFormIcon(GOAL_ICONS[0].name);
      setFormColor(GOAL_COLORS[0]);
    }
    setModalVisible(true);
  };

  const handleOpenDepositModal = (goal: SavingsGoal) => {
    setSelectedGoal(goal);
    setDepositAmount('');
    setDepositModalVisible(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Erro', 'O nome da meta é obrigatório');
      return;
    }

    const targetAmount = parseFloat(formTarget);
    if (isNaN(targetAmount) || targetAmount <= 0) {
      Alert.alert('Erro', 'O valor da meta deve ser maior que zero');
      return;
    }

    if (editingGoal) {
      await savingsGoalService.update(editingGoal.id, {
        name: formName.trim(),
        target_amount: targetAmount,
        icon: formIcon,
        color: formColor,
      });
    } else {
      await savingsGoalService.create({
        user_id: userId,
        name: formName.trim(),
        target_amount: targetAmount,
        current_amount: 0,
        icon: formIcon,
        color: formColor,
        status: 'active',
      });
    }

    setModalVisible(false);
    loadData();
  };

  const handleDeposit = async () => {
    if (!selectedGoal) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'O valor deve ser maior que zero');
      return;
    }

    await savingsGoalService.addAmount(selectedGoal.id, amount);
    setDepositModalVisible(false);
    loadData();
  };

  const handleDelete = (goal: SavingsGoal) => {
    Alert.alert(
      'Excluir Meta',
      `Tem certeza que deseja excluir "${goal.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            await savingsGoalService.delete(goal.id);
            loadData();
          },
        },
      ]
    );
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const getProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const styles = createStyles(colors);

  const renderGoalCard = (goal: SavingsGoal) => {
    const progress = getProgress(goal.current_amount, goal.target_amount);

    return (
      <View key={goal.id} style={styles.goalCard}>
        <View style={styles.goalHeader}>
          <View style={[styles.goalIcon, { backgroundColor: goal.color + '20' }]}>
            <Ionicons name={goal.icon as any} size={24} color={goal.color} />
          </View>
          <View style={styles.goalInfo}>
            <Text style={styles.goalName}>{goal.name}</Text>
            <Text style={styles.goalProgress}>
              {formatCurrency(goal.current_amount)} / {formatCurrency(goal.target_amount)}
            </Text>
          </View>
          {goal.status === 'active' && (
            <View style={styles.goalActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenDepositModal(goal)}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.green} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleOpenModal(goal)}
              >
                <Ionicons name="pencil-outline" size={20} color={colors.gray} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(goal)}
              >
                <Ionicons name="trash-outline" size={20} color={colors.gray} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress}%`, backgroundColor: goal.color },
            ]}
          />
        </View>

        <View style={styles.goalFooter}>
          <Text style={styles.progressText}>{progress.toFixed(0)}% concluído</Text>
          {goal.deadline && (
            <Text style={styles.deadlineText}>
              Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderContent = () => {
    if (loading) {
      return <Text style={styles.loadingText}>Carregando...</Text>;
    }

    if (activeTab === 'achievements') {
      if (achievements.length === 0) {
        return (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="trophy-outline" size={48} color={colors.gray} />
            </View>
            <Text style={styles.emptyTitle}>Nenhuma conquista ainda</Text>
            <Text style={styles.emptySubtitle}>
              Complete suas metas para desbloquear conquistas
            </Text>
          </View>
        );
      }

      return achievements.map((achievement) => (
        <View key={achievement.id} style={styles.achievementCard}>
          <View style={styles.achievementIcon}>
            <Ionicons name={achievement.icon as any} size={32} color={colors.purple} />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementTitle}>{achievement.title}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
          </View>
        </View>
      ));
    }

    if (goals.length === 0) {
      return (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <Ionicons name="flag-outline" size={48} color={colors.gray} />
          </View>
          <Text style={styles.emptyTitle}>
            {activeTab === 'active' ? 'Nenhuma meta ativa' : 'Nenhuma meta concluída'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'active'
              ? 'Crie uma meta de economia para começar a poupar dinheiro com objetivos claros'
              : 'Quando você completar uma meta, ela aparecerá aqui'}
          </Text>
          {activeTab === 'active' && (
            <TouchableOpacity style={styles.createButton} onPress={() => handleOpenModal()}>
              <Text style={styles.createButtonText}>Criar Primeira Meta</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return goals.map(renderGoalCard);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Metas de Economia</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => handleOpenModal()}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.purple }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Metas Ativas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: colors.green }]}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Concluídas</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FECA57' }]}>{stats.achievements}</Text>
          <Text style={styles.statLabel}>Conquistas</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
            Ativas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
          onPress={() => setActiveTab('completed')}
        >
          <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
            Concluídas
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'achievements' && styles.tabActive]}
          onPress={() => setActiveTab('achievements')}
        >
          <Text style={[styles.tabText, activeTab === 'achievements' && styles.tabTextActive]}>
            Conquistas
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {renderContent()}
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingGoal ? 'Editar Meta' : 'Nova Meta'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Nome da Meta</Text>
              <TextInput
                style={styles.input}
                value={formName}
                onChangeText={setFormName}
                placeholder="Ex: Viagem para Paris"
                placeholderTextColor={colors.gray}
              />

              <Text style={styles.inputLabel}>Valor Alvo (R$)</Text>
              <TextInput
                style={styles.input}
                value={formTarget}
                onChangeText={setFormTarget}
                placeholder="0,00"
                placeholderTextColor={colors.gray}
                keyboardType="decimal-pad"
              />

              <Text style={styles.inputLabel}>Ícone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconPicker}>
                {GOAL_ICONS.map((icon) => (
                  <TouchableOpacity
                    key={icon.name}
                    style={[
                      styles.iconOption,
                      formIcon === icon.name && styles.iconOptionSelected,
                    ]}
                    onPress={() => setFormIcon(icon.name)}
                  >
                    <Ionicons
                      name={icon.name as any}
                      size={24}
                      color={formIcon === icon.name ? colors.purple : colors.text}
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Cor</Text>
              <View style={styles.colorPicker}>
                {GOAL_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorOption,
                      { backgroundColor: color },
                      formColor === color && styles.colorOptionSelected,
                    ]}
                    onPress={() => setFormColor(color)}
                  >
                    {formColor === color && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {editingGoal ? 'Salvar Alterações' : 'Criar Meta'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        visible={depositModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDepositModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setDepositModalVisible(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Adicionar Valor</Text>
              <TouchableOpacity onPress={() => setDepositModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View style={styles.depositInfo}>
                <Text style={styles.depositGoalName}>{selectedGoal.name}</Text>
                <Text style={styles.depositProgress}>
                  {formatCurrency(selectedGoal.current_amount)} / {formatCurrency(selectedGoal.target_amount)}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Valor a adicionar (R$)</Text>
            <TextInput
              style={styles.input}
              value={depositAmount}
              onChangeText={setDepositAmount}
              placeholder="0,00"
              placeholderTextColor={colors.gray}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleDeposit}>
              <Text style={styles.saveButtonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
  addButton: {
    backgroundColor: colors.purple,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.gray,
    fontSize: 12,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  tabActive: {
    backgroundColor: colors.cardAlt,
  },
  tabText: {
    color: colors.gray,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.text,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  loadingText: {
    color: colors.gray,
    textAlign: 'center',
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.gray,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: colors.purple,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 24,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  goalCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  goalName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  goalProgress: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 2,
  },
  goalActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.cardAlt,
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  progressText: {
    color: colors.gray,
    fontSize: 12,
  },
  deadlineText: {
    color: colors.gray,
    fontSize: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  achievementIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.purple + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 16,
  },
  achievementTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  achievementDescription: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  depositInfo: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  depositGoalName: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  depositProgress: {
    color: colors.gray,
    fontSize: 14,
    marginTop: 4,
  },
  inputLabel: {
    color: colors.gray,
    fontSize: 14,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.cardAlt,
    borderRadius: 12,
    padding: 16,
    color: colors.text,
    fontSize: 16,
  },
  iconPicker: {
    flexDirection: 'row',
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.cardAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconOptionSelected: {
    borderWidth: 2,
    borderColor: colors.purple,
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: colors.purple,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});