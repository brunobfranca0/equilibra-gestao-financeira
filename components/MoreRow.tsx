import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeColors } from '../constants/colors';

interface MoreRowProps {
  label: string;
  onPress?: () => void;
  colors: ThemeColors;
}

export const MoreRow = ({ label, onPress, colors }: MoreRowProps) => {
  const styles = createStyles(colors);
  
  return (
    <TouchableOpacity style={styles.moreRow} onPress={onPress} disabled={!onPress}>
      <Text style={styles.moreRowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.gray} />
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  moreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  moreRowLabel: { color: colors.text, fontSize: 16 },
});