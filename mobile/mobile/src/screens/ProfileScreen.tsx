import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fetchMe } from '@/api/auth';

export function ProfileScreen() {
  const [profile, setProfile] = useState<any | null>(null);

  useEffect(() => {
    fetchMe().then(setProfile).catch(() => setProfile(null));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      <Text selectable>{JSON.stringify(profile, null, 2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 8 }
});


