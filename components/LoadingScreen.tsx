import { ActivityIndicator, SafeAreaView, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants/colors';

export const LoadingScreen = () => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.purple} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});