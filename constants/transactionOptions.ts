import { COLORS } from './colors';
import { Transaction } from '../services/transactionService';

export const TRANSACTION_OPTIONS: { icon: string; label: string; color: string; type: Transaction['type'] }[] = [
  { icon: 'trending-up', label: 'Receita', color: COLORS.green, type: 'income' },
  { icon: 'trending-down', label: 'Despesa', color: COLORS.red, type: 'expense' },
  { icon: 'card-outline', label: 'Despesa Cartão', color: COLORS.white, type: 'card_expense' },
  { icon: 'swap-horizontal', label: 'Transferência', color: COLORS.white, type: 'transfer' },
];