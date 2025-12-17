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

    const openAppSettings = () => Linking.openSettings();

    const showPermissionAlert = (title: string, message: string) => {
        Alert.alert(title, message, [
            { text: "Annuler", style: "cancel" },
            { text: "Ouvrir les paramètres", onPress: openAppSettings },
        ]);
    };

    const getLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                showPermissionAlert("Permission refusée", "Accès localisation requis");
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const address = await Location.reverseGeocodeAsync(location.coords);

            if (address.length > 0) {
                const city = address[0].city || address[0].name || "";
                const country = address[0].country || "";
                setDestination(`${city}${city && country ? ", " : ""}${country}`);
            }
        } catch {
            Alert.alert("Erreur", "Localisation indisponible");
        }
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
            setSelectedImages(prev => [
                ...prev,
                ...result.assets.map(a => a.uri),
            ]);
        }
    };

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

    const onDayPress = (day: any) => {
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

        const marked: any = {};
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

    const handleSaveTrip = async () => {
        if (!tripTitle || !destination || !startDate || !endDate) {
            Alert.alert("Erreur", "Tous les champs obligatoires sont requis");
            return;
        }

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const { photos, coverImage } = await uploadImages();

            await API.createTrip({
                title: tripTitle,
                destination,
                startDate,
                endDate,
                description,
                image: coverImage,
                photos,
            });

            Alert.alert("Succès", "Voyage créé", [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch {
            Alert.alert("Erreur", "Impossible de créer le voyage");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>Add New Trip</Text>

                {/* Photos */}
                <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                    <Ionicons name="image-outline" size={28} color="#a855f7" />
                    <Text>Select photos</Text>
                </TouchableOpacity>

                {selectedImages.length > 0 && (
                    <View style={styles.photosPreview}>
                        <Text style={styles.photosCount}>
                            {selectedImages.length} photo
                            {selectedImages.length > 1 ? "s" : ""} sélectionnée
                            {selectedImages.length > 1 ? "s" : ""}
                        </Text>

                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {selectedImages.map((uri, index) => (
                                <Image
                                    key={index}
                                    source={{ uri }}
                                    style={styles.photoThumb}
                                />
                            ))}
                        </ScrollView>
                    </View>
                )}

                {/* Title */}
                <Text style={styles.label}>
                    Trip title
                    <Text style={{ color: "red" }}>*</Text>
                </Text>
                <TextInput
                    style={styles.input}
                    value={tripTitle}
                    onChangeText={setTripTitle}
                    placeholder="Trip title"
                    placeholderTextColor="#6b7280"
                />

                {/* Destination */}
                <Text style={styles.label}>
                    Destination
                    <Text style={{ color: "red" }}>*</Text>
                </Text>
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

                {/* Calendar */}
                <Text style={styles.label}>
                    {selectingEnd ? "Select return date" : "Select start date"}
                    <Text style={{ color: "red" }}>*</Text>
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

                {/* Description */}
                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={[styles.input, styles.textArea]}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                    placeholderTextColor="#6b7280"
                />

                {/* Save */}
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
