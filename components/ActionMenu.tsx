import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { Transaction, transactionService } from '../services/transactionService';

interface ActionMenuProps {
  options: { icon: string; label: string; color: string; type: Transaction['type'] }[];
  onClose: () => void;
  userId: string;
}

export const ActionMenu = ({ options, onClose, userId }: ActionMenuProps) => {
  const handleCreateTransaction = async (type: Transaction['type']) => {
    Alert.prompt(
      'Nova Transação',
      'Digite a descrição:',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'OK',
          onPress: async (description?: string) => {
            if (!description) return;

            Alert.prompt(
              'Valor',
              'Digite o valor:',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'OK',
                  onPress: async (amountStr?: string) => {
                    const amount = parseFloat(amountStr?.replace(',', '.') || '0');
                    if (isNaN(amount) || amount <= 0) {
                      Alert.alert('Erro', 'Valor inválido');
                      return;
                    }

                    try {
                      await transactionService.create({
                        user_id: userId,
                        description,
                        amount,
                        type,
                        date: new Date().toISOString().split('T')[0],
                      });
                      Alert.alert('Sucesso', 'Transação criada com sucesso!');
                      onClose();
                    } catch (error: any) {
                      Alert.alert('Erro', error.message || 'Não foi possível criar a transação');
                    }
                  },
                },
              ],
              'plain-text'
            );
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <View style={styles.actionOverlay}>
      <TouchableOpacity style={styles.actionBackdrop} onPress={onClose} />
      <View style={styles.actionSheet}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={styles.actionButton}
            onPress={() => handleCreateTransaction(option.type)}
          >
            <View style={[styles.actionIcon, { borderColor: option.color }]}>
              <MaterialCommunityIcons name={option.icon as any} size={20} color={option.color} />
            </View>
            <Text style={styles.actionLabel}>{option.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  actionOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  actionBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  actionSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 100,
    paddingHorizontal: 40,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});