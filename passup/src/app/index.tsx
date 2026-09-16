import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { getToken } from '../apis/apis';
import { colors } from '../theme';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await getToken();
      if (cancelled) return;

      if (token) {
        router.replace('/pages/mainpage');
      } else {
        router.replace('/pages/login');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.label}>Opening PassUp…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  glow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(37,99,235,0.14)',
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
