import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { CreditCard, cardService } from '../services/cardService';

interface CardsScreenProps {
  userId: string;
  activeCardId: string | null;
  onSelectActiveCard: (id: string | null) => void;
  onBack?: () => void;
}

export default function CardsScreen({ userId, activeCardId, onSelectActiveCard, onBack }: CardsScreenProps) {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [formName, setFormName] = useState('');
  const [formBrand, setFormBrand] = useState('');
  const [formLast4, setFormLast4] = useState('');
  const [formLimit, setFormLimit] = useState('');
  const [formDueDay, setFormDueDay] = useState('');
  const [formClosingDay, setFormClosingDay] = useState('');

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await cardService.getAll(userId);
      setCards(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os cartões.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleSave = async () => {
    if (!formName.trim()) {
      Alert.alert('Erro', 'Informe o nome do cartão.');
      return;
    }
    try {
      await cardService.create({
        user_id: userId,
        name: formName.trim(),
        brand: formBrand.trim() || undefined,
        last4: formLast4.trim() || undefined,
        credit_limit: formLimit ? parseFloat(formLimit.replace(',', '.')) : undefined,
        due_day: formDueDay ? Number(formDueDay) : undefined,
        closing_day: formClosingDay ? Number(formClosingDay) : undefined,
      });
      setModalVisible(false);
      setFormName('');
      setFormBrand('');
      setFormLast4('');
      setFormLimit('');
      setFormDueDay('');
      setFormClosingDay('');
      loadCards();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar o cartão.');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Excluir', 'Deseja excluir este cartão?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await cardService.delete(id);
          if (activeCardId === id) onSelectActiveCard(null);
          loadCards();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>Cartões de crédito</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <Text style={styles.emptySubtitle}>Carregando...</Text>
        ) : cards.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum cartão cadastrado</Text>
            <Text style={styles.emptySubtitle}>Cadastre seus cartões para controlar gastos</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.primaryButtonText}>Adicionar cartão</Text>
            </TouchableOpacity>
          </View>
        ) : (
          cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={[
                styles.cardItem,
                activeCardId === card.id && { borderColor: colors.purple, borderWidth: 1 },
              ]}
              onPress={() => onSelectActiveCard(card.id)}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.cardIcon, { backgroundColor: colors.cardAlt }]}>
                  <Ionicons name="card-outline" size={20} color={colors.purple} />
                </View>
                <View>
                  <Text style={styles.cardName}>{card.name}</Text>
                  <Text style={styles.cardMeta}>
                    {card.brand || 'Marca indefinida'} • {card.last4 ? `•••• ${card.last4}` : 'Sem final'}
                  </Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity onPress={() => handleDelete(card.id)}>
                  <Ionicons name="trash-outline" size={20} color={colors.red} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
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
              <Text style={styles.modalTitle}>Novo cartão</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Nubank, Itaú"
                placeholderTextColor={colors.gray}
                value={formName}
                onChangeText={setFormName}
              />

              <Text style={styles.label}>Bandeira</Text>
              <TextInput
                style={styles.input}
                placeholder="Visa, Master..."
                placeholderTextColor={colors.gray}
                value={formBrand}
                onChangeText={setFormBrand}
              />

              <Text style={styles.label}>Final do cartão</Text>
              <TextInput
                style={styles.input}
                placeholder="1234"
                placeholderTextColor={colors.gray}
                keyboardType="number-pad"
                maxLength={4}
                value={formLast4}
                onChangeText={setFormLast4}
              />

              <Text style={styles.label}>Limite (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="0,00"
                placeholderTextColor={colors.gray}
                keyboardType="decimal-pad"
                value={formLimit}
                onChangeText={setFormLimit}
              />

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Fechamento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: 10"
                    placeholderTextColor={colors.gray}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={formClosingDay}
                    onChangeText={setFormClosingDay}
                  />
                </View>
                <View style={styles.rowItem}>
                  <Text style={styles.label}>Vencimento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="ex: 20"
                    placeholderTextColor={colors.gray}
                    keyboardType="number-pad"
                    maxLength={2}
                    value={formDueDay}
                    onChangeText={setFormDueDay}
                  />
                </View>
              </View>

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
    backButton: {
      marginRight: 12,
      padding: 4,
    },
    title: { color: colors.text, fontSize: 22, fontWeight: '700', flex: 1 },
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
    cardItem: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    cardIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    cardName: { color: colors.text, fontWeight: '700', fontSize: 16 },
    cardMeta: { color: colors.gray, fontSize: 12, marginTop: 2 },
    cardActions: { flexDirection: 'row', gap: 10 },
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
      maxHeight: '90%',
    },
    modalHeader: { 
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginBottom: 24,
    },
    modalTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
    label: { color: colors.gray, fontSize: 14, marginTop: 16, marginBottom: 6 },
    input: {
      backgroundColor: colors.cardAlt,
      borderRadius: 12,
      padding: 14,
      color: colors.text,
      fontSize: 16,
    },
    row: { flexDirection: 'row', gap: 10 },
    rowItem: { flex: 1 },
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

