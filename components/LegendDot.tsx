import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface LegendDotProps {
  color: string;
  label: string;
}

export const LegendDot = ({ color, label }: LegendDotProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={[styles.legendLabel, { color: colors.gray }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: {},
});