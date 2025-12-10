import { useCallback, useEffect, useState } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { Transaction, transactionService } from '../services/transactionService';
import { Category, categoryService } from '../services/categoryService';
import { Account, accountService } from '../services/accountService';
import { CreditCard, cardService } from '../services/cardService';

interface TransactionDetailsScreenProps {
  visible: boolean;
  transaction: Transaction | null;
  userId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TransactionDetailsScreen({
  visible,
  transaction,
  userId,
  onClose,
  onSuccess,
}: TransactionDetailsScreenProps) {
  const { colors } = useTheme();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);
  const [date, setDate] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showAccountPicker, setShowAccountPicker] = useState(false);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadData = useCallback(async () => {
    if (!transaction) return;
    try {
      const [catData, accData, cardData] = await Promise.all([
        categoryService.getByType(userId, transaction.type === 'income' ? 'income' : 'expense'),
        accountService.getAll(userId),
        cardService.getAll(userId),
      ]);
      setCategories(catData || []);
      setAccounts(accData || []);
      setCards(cardData || []);
    } catch (error) {
      console.warn('Erro ao carregar dados', error);
    }
  }, [userId, transaction]);

  useEffect(() => {
    if (visible && transaction) {
      loadData();
    }
  }, [visible, transaction, loadData]);

  useEffect(() => {
    if (visible && transaction && categories.length > 0) {
      setDescription(transaction.description || '');
      setAmount(transaction.amount.toString().replace('.', ','));
      setCategoryId(categories.find((c) => c.name === transaction.category)?.id || null);
      setAccountId(transaction.account_id || null);
      setCardId(transaction.card_id || null);
      setDate(transaction.date || '');
    }
  }, [visible, transaction, categories]);

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCategoryId(null);
    setAccountId(null);
    setCardId(null);
    setDate('');
    setShowCategoryPicker(false);
    setShowAccountPicker(false);
    setShowCardPicker(false);
    onClose();
  };

  const handleSave = async () => {
    if (!transaction?.id) return;
    if (!description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição');
      return;
    }

    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      await transactionService.update(transaction.id, {
        description: description.trim(),
        amount: amountValue,
        category: selectedCategory?.name,
        account_id: accountId,
        card_id: cardId,
        date,
      });

      Alert.alert('Sucesso', 'Transação atualizada com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível atualizar a transação');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!transaction?.id) return;
    Alert.alert('Excluir Transação', 'Tem certeza que deseja excluir esta transação?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await transactionService.delete(transaction.id!);
            Alert.alert('Sucesso', 'Transação excluída com sucesso!');
            handleClose();
            onSuccess?.();
          } catch (error: any) {
            Alert.alert('Erro', 'Não foi possível excluir a transação');
          }
        },
      },
    ]);
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const selectedCard = cards.find((c) => c.id === cardId);

  const styles = createStyles(colors);

  if (!transaction) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Detalhes da Transação</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Almoço, Salário..."
                placeholderTextColor={colors.gray}
              />

              <Text style={styles.label}>Valor (R$)</Text>
              <View style={styles.amountContainer}>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  value={amount}
                  onChangeText={setAmount}
                  placeholder="0.00"
                  placeholderTextColor={colors.gray}
                  keyboardType="decimal-pad"
                />
                <View style={styles.currencyIcon}>
                  <Ionicons name="logo-usd" size={20} color={colors.gray} />
                </View>
              </View>

              <Text style={styles.label}>Data</Text>
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.gray}
              />

              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                {selectedCategory ? (
                  <View style={styles.selectedCategory}>
                    <View
                      style={[styles.categoryIconSmall, { backgroundColor: selectedCategory.color + '20' }]}
                    >
                      <Ionicons name={selectedCategory.icon as any} size={16} color={selectedCategory.color} />
                    </View>
                    <Text style={styles.dropdownText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={[styles.dropdownText, { color: colors.gray }]}>Selecione uma categoria</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.gray} />
              </TouchableOpacity>

              {showCategoryPicker && (
                <View style={styles.picker}>
                  {categories.length === 0 ? (
                    <Text style={styles.noItemsText}>Nenhuma categoria encontrada</Text>
                  ) : (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[styles.pickerOption, categoryId === category.id && styles.pickerOptionSelected]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                          <Ionicons name={category.icon as any} size={20} color={category.color} />
                        </View>
                        <Text style={styles.pickerOptionText}>{category.name}</Text>
                        {categoryId === category.id && <Ionicons name="checkmark" size={20} color={colors.purple} />}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {transaction.type !== 'card_expense' && (
                <>
                  <Text style={styles.label}>Conta</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setShowAccountPicker(!showAccountPicker)}
                  >
                    <Text style={styles.dropdownText}>
                      {selectedAccount ? selectedAccount.name : 'Nenhuma conta'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.gray} />
                  </TouchableOpacity>

                  {showAccountPicker && (
                    <View style={styles.picker}>
                      <TouchableOpacity
                        style={[styles.pickerOption, !accountId && styles.pickerOptionSelected]}
                        onPress={() => {
                          setAccountId(null);
                          setShowAccountPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>Nenhuma conta</Text>
                        {!accountId && <Ionicons name="checkmark" size={20} color={colors.purple} />}
                      </TouchableOpacity>
                      {accounts.map((account) => (
                        <TouchableOpacity
                          key={account.id}
                          style={[styles.pickerOption, accountId === account.id && styles.pickerOptionSelected]}
                          onPress={() => {
                            setAccountId(account.id);
                            setShowAccountPicker(false);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{account.name}</Text>
                          {accountId === account.id && <Ionicons name="checkmark" size={20} color={colors.purple} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {transaction.type === 'card_expense' && (
                <>
                  <Text style={styles.label}>Cartão de Crédito</Text>
                  <TouchableOpacity style={styles.dropdown} onPress={() => setShowCardPicker(!showCardPicker)}>
                    <Text style={styles.dropdownText}>{selectedCard ? selectedCard.name : 'Nenhum cartão'}</Text>
                    <Ionicons name="chevron-down" size={20} color={colors.gray} />
                  </TouchableOpacity>

                  {showCardPicker && (
                    <View style={styles.picker}>
                      <TouchableOpacity
                        style={[styles.pickerOption, !cardId && styles.pickerOptionSelected]}
                        onPress={() => {
                          setCardId(null);
                          setShowCardPicker(false);
                        }}
                      >
                        <Text style={styles.pickerOptionText}>Nenhum cartão</Text>
                        {!cardId && <Ionicons name="checkmark" size={20} color={colors.purple} />}
                      </TouchableOpacity>
                      {cards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[styles.pickerOption, cardId === card.id && styles.pickerOptionSelected]}
                          onPress={() => {
                            setCardId(card.id);
                            setShowCardPicker(false);
                          }}
                        >
                          <Text style={styles.pickerOptionText}>{card.name}</Text>
                          {cardId === card.id && <Ionicons name="checkmark" size={20} color={colors.purple} />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              <View style={styles.actionsRow}>
                <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={20} color={colors.red} />
                  <Text style={styles.deleteButtonText}>Excluir</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>{loading ? 'Salvando...' : 'Salvar'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
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
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingTop: 24,
      marginBottom: 0,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    label: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 8,
      marginTop: 16,
    },
    input: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      color: colors.text,
      fontSize: 16,
    },
    amountContainer: {
      position: 'relative',
    },
    amountInput: {
      paddingRight: 48,
    },
    currencyIcon: {
      position: 'absolute',
      right: 16,
      top: 16,
    },
    dropdown: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dropdownText: {
      color: colors.text,
      fontSize: 16,
    },
    selectedCategory: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryIconSmall: {
      width: 28,
      height: 28,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    picker: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      marginTop: 8,
      overflow: 'hidden',
    },
    pickerOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pickerOptionSelected: {
      backgroundColor: colors.purple + '10',
    },
    pickerOptionText: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    noItemsText: {
      color: colors.gray,
      padding: 16,
      textAlign: 'center',
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
      marginBottom: 16,
    },
    deleteButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.cardAlt,
      borderRadius: 16,
      paddingVertical: 16,
      borderWidth: 1,
      borderColor: colors.red + '40',
    },
    deleteButtonText: {
      color: colors.red,
      fontSize: 16,
      fontWeight: '700',
    },
    saveButton: {
      flex: 2,
      backgroundColor: colors.purple,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
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
  });

