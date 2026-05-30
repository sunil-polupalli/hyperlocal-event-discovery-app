import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import axios from 'axios';

interface EventData {
  id: string;
  name: string;
  venue: string;
  category: string;
}

export default function ForYouScreen() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';
  
  // Using the test user for now so it hooks into the views you already logged!
  const currentUserId = 'test-user';

  useEffect(() => {
    fetchPersonalizedEvents();
  }, []);

  const fetchPersonalizedEvents = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/events/foryou`, {
        params: { userId: currentUserId }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching recommended events:", error);
      setErrorMsg('Failed to fetch your personalized feed');
    } finally {
      setLoading(false);
    }
  };

  const renderItem: ListRenderItem<EventData> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/event/${item.id}`)}
    >
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.venue}>{item.venue}</Text>
      <Text style={styles.category}>{item.category}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Recommended For You</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : events.length === 0 ? (
        <Text style={styles.empty}>Go view some events to get personalized recommendations!</Text>
      ) : (
        <View style={{ flex: 1, width: '100%' }}>
          <FlashList
            data={events}
            renderItem={renderItem}
            // @ts-ignore
            estimatedItemSize={100}
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  venue: { fontSize: 14, color: '#666', marginBottom: 5 },
  category: { fontSize: 12, color: '#007AFF', textTransform: 'uppercase' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 },
  empty: { textAlign: 'center', marginTop: 20, color: '#666', fontSize: 16 }
});