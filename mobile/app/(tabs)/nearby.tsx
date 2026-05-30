import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import axios from 'axios';

interface EventData {
  id: string;
  name: string;
  venue: string;
  category: string;
}

export default function NearbyScreen() {
  const [location, setLocation] = useState<Location.LocationObjectCoords | null>(null);
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [radius, setRadius] = useState<number>(5000); 
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const router = useRouter();

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

  // Live GPS Tracking Restored!
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        setLoading(false);
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();
  }, []);

  useEffect(() => {
    if (location) {
      fetchEvents();
    }
  }, [location, radius]);

  const fetchEvents = async () => {
    if (!location) return; 

    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/events/nearby`, {
        params: {
          lat: location.latitude,
          lon: location.longitude,
          radius: radius
        }
      });
      setEvents(response.data);
    } catch (error) {
      console.error("Error fetching events:", error);
      setErrorMsg('Failed to fetch nearby events');
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
      <View style={styles.filterContainer}>
        {[1000, 5000, 10000].map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.filterButton, radius === r && styles.filterButtonActive]}
            onPress={() => setRadius(r)}
          >
            <Text style={[styles.filterText, radius === r && styles.filterTextActive]}>
              {r / 1000}km
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && events.length === 0 ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
      ) : errorMsg ? (
        <Text style={styles.error}>{errorMsg}</Text>
      ) : (
        <View style={{ flex: 1, width: '100%' }}>
          <FlashList
            data={events}
            renderItem={renderItem}
            // @ts-ignore
            estimatedItemSize={100}
            testID="event-feed-list"
            data-testid="event-feed-list"
            keyExtractor={(item) => item.id.toString()}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 10 },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  filterButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterButtonActive: { backgroundColor: '#007AFF' },
  filterText: { color: '#333', fontWeight: 'bold' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 10, marginBottom: 10, elevation: 2 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  venue: { fontSize: 14, color: '#666', marginBottom: 5 },
  category: { fontSize: 12, color: '#007AFF', textTransform: 'uppercase' },
  error: { color: 'red', textAlign: 'center', marginTop: 20 }
});