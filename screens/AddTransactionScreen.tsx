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
import { accountService, Account } from '../services/accountService';
import { cardService, CreditCard } from '../services/cardService';

interface AddTransactionScreenProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

type TransactionType = 'income' | 'expense' | 'card_expense';

export default function AddTransactionScreen({
  visible,
  onClose,
  userId,
  onSuccess,
}: AddTransactionScreenProps) {
  const { colors } = useTheme();
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [cardId, setCardId] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    const categoryType = type === 'income' ? 'income' : 'expense';
    const data = await categoryService.getByType(userId, categoryType);
    setCategories(data);
    setCategoryId(null); // Reset category when type changes
  }, [userId, type]);

  const loadAccountsAndCards = useCallback(async () => {
    const [accData, cardData] = await Promise.all([
      accountService.getAll(userId),
      cardService.getAll(userId),
    ]);
    setAccounts(accData || []);
    setCards(cardData || []);
    if (!accountId && accData && accData.length > 0) {
      setAccountId(accData[0].id);
    }
    if (!cardId && cardData && cardData.length > 0) {
      setCardId(cardData[0].id);
    }
  }, [userId, accountId, cardId]);

  useEffect(() => {
    if (visible) {
      loadCategories();
      loadAccountsAndCards();
    }
  }, [visible, loadCategories, loadAccountsAndCards]);

  useEffect(() => {
    if (type !== 'card_expense') {
      setCardId(null);
    }
  }, [type]);

  const handleClose = () => {
    setDescription('');
    setAmount('');
    setCategoryId(null);
    setType('expense');
    setAccountId(null);
    setCardId(null);
    setShowCategoryPicker(false);
    onClose();
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Digite uma descrição');
      return;
    }

    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Digite um valor válido');
      return;
    }

    if (type === 'card_expense' && !cardId) {
      Alert.alert('Erro', 'Selecione um cartão para lançar a despesa.');
      return;
    }

    setLoading(true);

    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);

      await transactionService.create({
        user_id: userId,
        description: description.trim(),
        amount: amountValue,
        type,
        category: selectedCategory?.name,
        date: new Date().toISOString().split('T')[0],
        account_id: accountId,
        card_id: type === 'card_expense' ? cardId : null,
      });

      Alert.alert('Sucesso', 'Transação criada com sucesso!');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Não foi possível criar a transação');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = categories.find((c) => c.id === categoryId);

  const styles = createStyles(colors);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
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
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Adicionar Transação</Text>
              <TouchableOpacity onPress={handleClose}>
                <Ionicons name="close" size={24} color={colors.gray} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.modalScrollContent}
            >
              {/* Type Selector */}
              <Text style={styles.label}>Tipo</Text>
              <View style={styles.typeRow}>
                {[
                  { key: 'expense', label: 'Despesa' },
                  { key: 'income', label: 'Receita' },
                  { key: 'card_expense', label: 'Cartão' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.typePill, type === option.key && styles.typePillActive]}
                    onPress={() => setType(option.key as TransactionType)}
                  >
                    <Text style={[styles.typePillText, type === option.key && styles.typePillTextActive]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Description */}
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Almoço, Salário..."
                placeholderTextColor={colors.gray}
              />

              {/* Amount */}
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

              {/* Account */}
              <Text style={styles.label}>Conta</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => {
                  if (accounts.length === 0) {
                    Alert.alert('Conta', 'Cadastre uma conta na aba Contas.');
                  }
                }}
              >
                <Text style={styles.dropdownText}>
                  {accountId
                    ? accounts.find((a) => a.id === accountId)?.name || 'Conta selecionada'
                    : 'Selecione uma conta'}
                </Text>
                <Ionicons name="swap-vertical" size={20} color={colors.gray} />
              </TouchableOpacity>
              {accounts.length > 0 && (
                <View style={styles.chipsRow}>
                  {accounts.map((acc) => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.chip, accountId === acc.id && styles.chipActive]}
                      onPress={() => setAccountId(acc.id)}
                    >
                      <Text style={[styles.chipText, accountId === acc.id && styles.chipTextActive]}>{acc.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Card (only card expense) */}
              {type === 'card_expense' && (
                <>
                  <Text style={styles.label}>Cartão de crédito</Text>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => {
                      if (cards.length === 0) {
                        Alert.alert('Cartão', 'Cadastre um cartão na aba Cartões.');
                      }
                    }}
                  >
                    <Text style={styles.dropdownText}>
                      {cardId
                        ? cards.find((c) => c.id === cardId)?.name || 'Cartão selecionado'
                        : 'Selecione um cartão'}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.gray} />
                  </TouchableOpacity>
                  {cards.length > 0 && (
                    <View style={styles.chipsRow}>
                      {cards.map((card) => (
                        <TouchableOpacity
                          key={card.id}
                          style={[styles.chip, cardId === card.id && styles.chipActive]}
                          onPress={() => setCardId(card.id)}
                        >
                          <Text style={[styles.chipText, cardId === card.id && styles.chipTextActive]}>
                            {card.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </>
              )}

              {/* Category */}
              <Text style={styles.label}>Categoria</Text>
              <TouchableOpacity
                style={styles.dropdown}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                {selectedCategory ? (
                  <View style={styles.selectedCategory}>
                    <View
                      style={[
                        styles.categoryIconSmall,
                        { backgroundColor: selectedCategory.color + '20' },
                      ]}
                    >
                      <Ionicons
                        name={selectedCategory.icon as any}
                        size={16}
                        color={selectedCategory.color}
                      />
                    </View>
                    <Text style={styles.dropdownText}>{selectedCategory.name}</Text>
                  </View>
                ) : (
                  <Text style={[styles.dropdownText, { color: colors.gray }]}>
                    Selecione uma categoria
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.gray} />
              </TouchableOpacity>

              {/* Category Picker */}
              {showCategoryPicker && (
                <View style={styles.categoryPicker}>
                  {categories.length === 0 ? (
                    <Text style={styles.noCategoriesText}>
                      Nenhuma categoria encontrada
                    </Text>
                  ) : (
                    categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryOption,
                          categoryId === category.id && styles.categoryOptionSelected,
                        ]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setShowCategoryPicker(false);
                        }}
                      >
                        <View
                          style={[
                            styles.categoryIcon,
                            { backgroundColor: category.color + '20' },
                          ]}
                        >
                          <Ionicons
                            name={category.icon as any}
                            size={20}
                            color={category.color}
                          />
                        </View>
                        <Text style={styles.categoryName}>{category.name}</Text>
                        {categoryId === category.id && (
                          <Ionicons name="checkmark" size={20} color={colors.purple} />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={loading}
              >
                <Text style={styles.saveButtonText}>
                  {loading ? 'Salvando...' : 'Adicionar'}
                </Text>
              </TouchableOpacity>
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
    typeRow: { flexDirection: 'row', gap: 8 },
    typePill: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    typePillActive: {
      backgroundColor: colors.purple + '20',
      borderWidth: 1,
      borderColor: colors.purple,
    },
    typePillText: { color: colors.text, fontWeight: '600' },
    typePillTextActive: { color: colors.purple },
    dropdownText: {
      color: colors.text,
      fontSize: 16,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
    chip: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.inputBackground,
    },
    chipActive: { borderColor: colors.purple, backgroundColor: colors.purple + '15' },
    chipText: { color: colors.text },
    chipTextActive: { color: colors.purple, fontWeight: '700' },
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
    categoryPicker: {
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      marginTop: 8,
      overflow: 'hidden',
    },
    categoryOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 14,
      gap: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryOptionSelected: {
      backgroundColor: colors.purple + '10',
    },
    categoryIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    categoryName: {
      flex: 1,
      color: colors.text,
      fontSize: 15,
    },
    noCategoriesText: {
      color: colors.gray,
      padding: 16,
      textAlign: 'center',
    },
    saveButton: {
      backgroundColor: colors.purple,
      borderRadius: 16,
      paddingVertical: 18,
      paddingHorizontal: 24,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 16,
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