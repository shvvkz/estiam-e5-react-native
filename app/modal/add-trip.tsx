import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Calendar } from "react-native-calendars";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { API } from "@/services/api";
import { ExistingTrip, TripLocation } from "@/models/trip";

/**
 * AddTripModal
 *
 * Modal screen responsible for creating a new trip.
 *
 * This screen allows the user to:
 * - Define basic trip information (title, destination, description)
 * - Select a date range using a calendar
 * - Pick multiple photos and upload them
 * - Automatically determine geographic coordinates either from
 *   the user's current location or by geocoding the destination text
 *
 * The first uploaded image is used as the trip cover image.
 * Once the trip is successfully created, the modal closes automatically.
 */
export default function AddTripModal() {
  const router = useRouter();

  const [tripTitle, setTripTitle] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");

  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const DESTINATION_REGEX = /^[A-Za-zÀ-ÿ' -]+,\s*[A-Za-zÀ-ÿ' -]+$/;

  const [tripLocation, setTripLocation] =
    useState<TripLocation | null>(null);

  const openAppSettings = () => Linking.openSettings();

  const showPermissionAlert = (title: string, message: string) => {
    Alert.alert(title, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Ouvrir les paramètres", onPress: openAppSettings },
    ]);
  };

  /**
   * getLocation
   *
   * Requests foreground location permission and retrieves the user's
   * current geographic position.
   *
   * The function also performs reverse geocoding in order to infer
   * a human-readable destination (city and country), which is then
   * automatically filled into the destination field.
   *
   * If permission is denied, the user is prompted to open the system settings.
   */
  const getLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        showPermissionAlert("Permission refusée", "Accès localisation requis");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync(loc.coords);

      if (address.length > 0) {
        const city = address[0].city || address[0].name || "";
        const country = address[0].country || "";

        setDestination(`${city}${city && country ? ", " : ""}${country}`);
        setTripLocation({
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      }
    } catch {
      Alert.alert("Erreur", "Localisation indisponible");
    }
  };
  /**
   * geocodeDestination
   *
   * Converts a textual destination (city, country) into geographic
   * coordinates using the OpenStreetMap Nominatim API.
   *
   * This function is used as a fallback when the user does not
   * explicitly provide their current location.
   *
   * @param query - Destination string in the format "City, Country"
   * @returns Geographic coordinates corresponding to the destination
   * @throws Error if the destination cannot be resolved
   */
  const geocodeDestination = async (
    query: string
  ): Promise<TripLocation> => {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    const res = await fetch(url, {
      headers: { "User-Agent": "travel-app" },
    });

    const data = await res.json();

    if (!data || data.length === 0) {
      throw new Error("Impossible de localiser la destination");
    }

    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showPermissionAlert("Permission refusée", "Accès aux photos requis");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setSelectedImages((prev) => [
        ...prev,
        ...result.assets.map((a) => a.uri),
      ]);
    }
  };

  /**
   * uploadImages
   *
   * Uploads all selected images sequentially to the backend.
   *
   * Responsibilities:
   * - Upload each image individually
   * - Track and update upload progress
   * - Determine the cover image (first uploaded image)
   *
   * @returns An object containing the uploaded photo URLs and the cover image URL
   */
  const uploadImages = async () => {
    const photos: string[] = [];
    let coverImage = "";

    for (let i = 0; i < selectedImages.length; i++) {
      const url = await API.uploadImage(selectedImages[i]);
      photos.push(url);
      if (i === 0) coverImage = url;
      setUploadProgress(Math.round(((i + 1) / selectedImages.length) * 100));
    }

    return { photos, coverImage };
  };

  const onDayPress = (day: { dateString: string }) => {
    const date = day.dateString;

    if (!startDate || endDate) {
      setStartDate(date);
      setEndDate(null);
      setSelectingEnd(true);
      return;
    }

    if (date < startDate) {
      setStartDate(date);
      setEndDate(null);
      return;
    }

    setEndDate(date);
    setSelectingEnd(false);
  };

  const getMarkedDates = () => {
    if (!startDate) return {};

    if (!endDate) {
      return {
        [startDate]: {
          selected: true,
          selectedColor: "#a855f7",
          textColor: "#fff",
        },
      };
    }

    const marked: Record<string, object> = {};
    let current = new Date(startDate);
    const last = new Date(endDate);

    while (current <= last) {
      const iso = current.toISOString().split("T")[0];
      marked[iso] = {
        selected: true,
        color: "#e9d5ff",
        textColor: "#111827",
      };
      current.setDate(current.getDate() + 1);
    }

    marked[startDate] = {
      startingDay: true,
      color: "#a855f7",
      textColor: "#fff",
    };

    marked[endDate] = {
      endingDay: true,
      color: "#a855f7",
      textColor: "#fff",
    };

    return marked;
  };

  /**
   * handleSaveTrip
   *
   * Validates the trip form and orchestrates the full trip creation process.
   *
   * Steps:
   * - Validate required fields, destination format and date overlaps
   * - Upload selected images
   * - Resolve geographic location (user location or geocoding)
   * - Send the final payload to the backend API
   *
   * Displays appropriate success or error feedback to the user.
   */
  const handleSaveTrip = async () => {
    if (!tripTitle || !destination || !startDate || !endDate) {
      Alert.alert("Erreur", "Tous les champs obligatoires sont requis");
      return;
    }

    if (!DESTINATION_REGEX.test(destination)) {
      Alert.alert(
        "Erreur",
        "La destination doit être au format : Ville, Pays"
      );
      return;
    }

    try {
      setIsUploading(true);

      const existingTrips = await API.getTrips();

      const overlappingTrip = isTripOverlapping(
        startDate,
        endDate,
        existingTrips
      );

      if (overlappingTrip) {
        Alert.alert(
          "Conflit de dates",
          `Ce voyage entre en conflit avec "${overlappingTrip.title}" (${overlappingTrip.startDate} → ${overlappingTrip.endDate})`
        );
        setIsUploading(false);
        return;
      }

      setUploadProgress(0);

      const { photos, coverImage } = await uploadImages();

      let finalLocation = tripLocation;
      if (!finalLocation) {
        finalLocation = await geocodeDestination(destination);
      }

      await API.createTrip({
        title: tripTitle,
        destination,
        startDate,
        endDate,
        description,
        image: coverImage,
        photos,
        location: finalLocation,
      });

      Alert.alert("Succès", "Voyage créé", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert(
        "Erreur",
        e instanceof Error ? e.message : "Impossible de créer le voyage"
      );
    } finally {
      setIsUploading(false);
    }
  };


  const isTripOverlapping = (
    newStart: string,
    newEnd: string,
    existingTrips: ExistingTrip[]
  ): ExistingTrip | null => {
    const start = new Date(newStart).getTime();
    const end = new Date(newEnd).getTime();

    return (
      existingTrips.find((trip) => {
        const tripStart = new Date(trip.startDate).getTime();
        const tripEnd = new Date(trip.endDate).getTime();

        return start <= tripEnd && end >= tripStart;
      }) || null
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <Text style={styles.title}>Add New Trip</Text>

        <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
          <Ionicons name="image-outline" size={28} color="#a855f7" />
          <Text>Select photos</Text>
        </TouchableOpacity>

        {selectedImages.length > 0 && (
          <View style={styles.photosPreview}>
            <Text style={styles.photosCount}>
              {selectedImages.length} photo
              {selectedImages.length > 1 ? "s" : ""}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {selectedImages.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.label}>Trip title *</Text>
        <TextInput
          style={styles.input}
          value={tripTitle}
          onChangeText={setTripTitle}
          placeholder="Trip title"
          placeholderTextColor="#6b7280"
        />

        <Text style={styles.label}>Destination *</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            value={destination}
            onChangeText={setDestination}
            placeholder="Destination"
            placeholderTextColor="#6b7280"
          />
          <TouchableOpacity onPress={getLocation}>
            <Ionicons name="location-outline" size={24} color="#7c3aed" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>
          {selectingEnd ? "Select return date" : "Select start date"} *
        </Text>

        <Calendar
          markingType="period"
          markedDates={getMarkedDates()}
          onDayPress={onDayPress}
          theme={{
            dayTextColor: "#111827",
            textDisabledColor: "#9ca3af",
            monthTextColor: "#111827",
            arrowColor: "#a855f7",
            todayTextColor: "#7c3aed",
          }}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={description}
          onChangeText={setDescription}
          placeholder="Description"
          placeholderTextColor="#6b7280"
        />

        <TouchableOpacity onPress={handleSaveTrip} disabled={isUploading}>
          <LinearGradient
            colors={["#a855f7", "#ec4899"]}
            style={styles.saveBtn}
          >
            <Text style={styles.saveText}>
              {isUploading
                ? `Uploading ${uploadProgress}%`
                : "Create trip"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  label: { marginTop: 16, marginBottom: 8, fontWeight: "600" },
  input: {
    backgroundColor: "#f9fafb",
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  imageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  photosPreview: { marginBottom: 16 },
  photosCount: { fontSize: 14, color: "#6b7280", marginBottom: 8 },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 8,
    backgroundColor: "#e5e7eb",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  saveBtn: {
    marginTop: 24,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
