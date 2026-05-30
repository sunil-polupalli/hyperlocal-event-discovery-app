import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';

interface EventDetails {
  id: string;
  name: string;
  venue: string;
  category: string;
  date?: string;
  description?: string;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams();
  const [event, setEvent] = useState<EventDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000';

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/events/${id}`);
        setEvent(response.data);
      } catch (error) {
        console.error("Error fetching event details:", error);
        setErrorMsg('Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [id]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        await axios.post(`${API_URL}/api/signals`, {
          eventId: id,
          type: 'view'
        });
        console.log(`5-second view signal recorded for event ${id}`);
      } catch (error) {
        console.error("Failed to log view signal:", error);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [id]);

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" style={styles.centered} />;
  }

  if (errorMsg || !event) {
    return <Text style={styles.error}>{errorMsg || 'Event not found'}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.category}>{event.category}</Text>
      <Text style={styles.venue}>📍 {event.venue}</Text>
      {event.date && <Text style={styles.date}>📅 {event.date}</Text>}
      {event.description && <Text style={styles.description}>{event.description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: '#333' },
  category: { fontSize: 14, color: '#007AFF', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 15 },
  venue: { fontSize: 16, color: '#555', marginBottom: 8 },
  date: { fontSize: 16, color: '#555', marginBottom: 20 },
  description: { fontSize: 15, color: '#666', lineHeight: 22 },
  error: { color: 'red', textAlign: 'center', marginTop: 20, fontSize: 16 }
});