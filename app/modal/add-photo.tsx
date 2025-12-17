import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import { API } from '@/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function AddPhotoModal() {
  const router = useRouter();

  const { tripId } = useLocalSearchParams<{ tripId?: string }>();
  const isFixedTrip = Boolean(tripId);

  const [trips, setTrips] = useState<any[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isFixedTrip) return;

    const loadTrips = async () => {
      try {
        const data = await API.getTrips();
        setTrips(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load trips', e);
        setTrips([]);
      }
    };

    loadTrips();
  }, [isFixedTrip]);

  const pickImage = async () => {
    const targetTripId = isFixedTrip ? tripId : selectedTrip?.id;

    if (!targetTripId) {
      Alert.alert('Erreur', 'Sélectionne un voyage');
      return;
    }

    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission refusée');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (result.canceled) return;

    try {
      setLoading(true);

      const imageUri = result.assets[0].uri;
      const uploadedUrl = await API.uploadImage(imageUri);

      await API.addPhotoToTrip(targetTripId, uploadedUrl);

      Alert.alert('Succès', 'Photo ajoutée', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible d’ajouter la photo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Add Photo</Text>

      {/* Fixed trip mode */}
      {isFixedTrip && (
        <Text style={styles.infoText}>
          Ajout de photo au voyage sélectionné
        </Text>
      )}

      {/* Generic mode: select trip */}
      {!isFixedTrip && trips.length === 0 && (
        <Text style={styles.emptyText}>
          Aucun voyage disponible
        </Text>
      )}

      {!isFixedTrip &&
        trips.map(trip => (
          <TouchableOpacity
            key={trip.id}
            style={[
              styles.tripItem,
              selectedTrip?.id === trip.id && styles.selected,
            ]}
            onPress={() => setSelectedTrip(trip)}
          >
            <Text style={styles.tripTitle}>{trip.title}</Text>
          </TouchableOpacity>
        ))}

      {/* Action */}
      <TouchableOpacity
        style={[styles.button, loading && styles.disabled]}
        onPress={pickImage}
        disabled={loading}
      >
        <Ionicons name="image-outline" size={24} color="#fff" />
        <Text style={styles.buttonText}>
          {loading ? 'Upload...' : 'Choose Photo'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoText: {
    color: '#6b7280',
    marginBottom: 16,
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
  },
  tripItem: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginBottom: 8,
  },
  selected: {
    backgroundColor: '#ede9fe',
  },
  tripTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
