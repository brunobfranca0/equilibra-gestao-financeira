import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Account, accountService } from '../services/accountService';
import { transactionService } from '../services/transactionService';

type AccountKind = 'checking' | 'savings';

interface AccountsScreenProps {
  userId: string;
  activeAccountId: string | null;
  onSelectActiveAccount: (id: string | null) => void;
}

export default function AccountsScreen({ userId, activeAccountId, onSelectActiveAccount }: AccountsScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formInstitution, setFormInstitution] = useState('');
  const [formType, setFormType] = useState<AccountKind>('checking');
  const [formBalance, setFormBalance] = useState('');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await accountService.getAll(userId);
      setAccounts(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as contas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Erro', 'Informe o nome da conta.');
      return;
    }
    const balance = parseFloat(formBalance.replace(',', '.')) || 0;
    try {
      const created = await accountService.create({
        user_id: userId,
        name: formName.trim(),
        institution: formInstitution.trim() || undefined,
        type: formType,
        balance,
      });
      if (balance > 0) {
        try {
          await transactionService.create({
            user_id: userId,
            description: `Saldo inicial (${formName.trim()})`,
            amount: balance,
            type: 'income',
            category: 'Saldo inicial',
            account_id: created.id,
            date: new Date().toISOString().split('T')[0],
          });
        } catch (err) {
          console.warn('Falha ao registrar saldo inicial como transação', err);
        }
      }
      setModalVisible(false);
      setFormName('');
      setFormInstitution('');
      setFormBalance('');
      setFormType('checking');
      loadAccounts();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a conta.');
    }
  };

  const formatCurrency = (value: number | undefined) =>
    `R$ ${(value || 0).toFixed(2).replace('.', ',')}`;

  const handleDelete = async (id: string) => {
    Alert.alert('Excluir', 'Deseja excluir esta conta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await accountService.delete(id);
          if (activeAccountId === id) onSelectActiveAccount(null);
          loadAccounts();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Contas bancárias</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.emptySubtitle}>Carregando...</Text>
        ) : accounts.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhuma conta cadastrada</Text>
            <Text style={styles.emptySubtitle}>
              Adicione suas contas bancárias para começar a organizar suas finanças
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.primaryButtonText}>Adicionar conta</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[
                styles.accountCard,
                !activeAccountId && { borderColor: colors.purple, borderWidth: 1 },
              ]}
              onPress={() => onSelectActiveAccount(null)}
            >
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: colors.cardAlt }]}>
                  <Ionicons name="list" size={20} color={colors.purple} />
                </View>
                <View>
                  <Text style={styles.accountName}>Todas as contas</Text>
                  <Text style={styles.accountMeta}>Mostrar lançamentos de todas</Text>
                </View>
              </View>
            </TouchableOpacity>
            {accounts.map((account) => (
              <TouchableOpacity
                key={account.id}
                style={[
                  styles.accountCard,
                  activeAccountId === account.id && { borderColor: colors.purple, borderWidth: 1 },
                ]}
                onPress={() => onSelectActiveAccount(account.id)}
              >
                <View style={styles.accountLeft}>
                  <View style={[styles.accountIcon, { backgroundColor: colors.cardAlt }]}>
                    <Ionicons name="wallet-outline" size={20} color={colors.purple} />
                  </View>
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountMeta}>
                      {account.institution || 'Instituição não informada'} •{' '}
                      {account.type === 'savings' ? 'Poupança' : 'Conta corrente'}
                    </Text>
                  </View>
                </View>
                <View style={styles.accountActions}>
                  <TouchableOpacity onPress={() => handleDelete(account.id)}>
                    <Ionicons name="trash-outline" size={20} color={colors.red} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
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
              <Text style={styles.modalTitle}>Nova conta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.label}>Nome</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Nubank, Itaú, Carteira"
                  placeholderTextColor={colors.gray}
                  value={formName}
                  onChangeText={setFormName}
                />

                <Text style={styles.label}>Instituição</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Opcional"
                  placeholderTextColor={colors.gray}
                  value={formInstitution}
                  onChangeText={setFormInstitution}
                />

                <Text style={styles.label}>Tipo</Text>
                <View style={styles.typeRow}>
                  {[
                    { key: 'checking', label: 'Corrente' },
                    { key: 'savings', label: 'Poupança' },
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.typePill, formType === t.key && styles.typePillActive]}
                      onPress={() => setFormType(t.key as AccountKind)}
                    >
                      <Text style={[styles.typePillText, formType === t.key && styles.typePillTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Saldo inicial</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0,00"
                  placeholderTextColor={colors.gray}
                  keyboardType="decimal-pad"
                  value={formBalance}
                  onChangeText={setFormBalance}
                />

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { padding: 20, paddingBottom: 120 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    title: { color: colors.text, fontSize: 22, fontWeight: '700' },
    addButton: {
      backgroundColor: colors.purple,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 24,
    },
    emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700', marginBottom: 12 },
    emptySubtitle: { color: colors.gray, marginBottom: 20 },
    primaryButton: {
      backgroundColor: colors.purple,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: { color: '#FFFFFF', fontWeight: '700' },
    accountCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    accountLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    accountIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    accountName: { color: colors.text, fontWeight: '700', fontSize: 16 },
    accountMeta: { color: colors.gray, fontSize: 12, marginTop: 2 },
    accountActions: { flexDirection: 'row', gap: 10 },
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
      maxHeight: '80%',
    },
    modalScrollContent: {
      padding: 24,
      paddingBottom: 40,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 24, paddingTop: 24 },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    label: { color: colors.gray, fontSize: 14, marginTop: 10, marginBottom: 6 },
    input: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontSize: 16,
    },
    typeRow: { flexDirection: 'row', gap: 8 },
    typePill: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: 'center',
      backgroundColor: colors.cardAlt,
    },
    typePillActive: { backgroundColor: colors.purple + '20' },
    typePillText: { color: colors.text },
    typePillTextActive: { color: colors.purple, fontWeight: '700' },
    saveButton: {
      backgroundColor: colors.purple,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginTop: 20,
    },
    saveButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  });