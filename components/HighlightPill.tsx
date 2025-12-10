import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HighlightPillProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

export const HighlightPill = ({ label, value, color, icon }: HighlightPillProps) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);

  return (
    <View style={styles.highlightPill}>
      <View style={[styles.highlightIcon, { backgroundColor: `${color}1A` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={styles.highlightLabel}>{label}</Text>
      <Text style={[styles.highlightValue, { color }]}>{value}</Text>
    </View>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  highlightPill: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: colors.cardAlt,
  },
  highlightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  highlightLabel: { color: colors.gray, fontSize: 13 },
  highlightValue: { fontSize: 18, fontWeight: '600' },
});