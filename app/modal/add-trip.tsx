import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    Platform,
    Linking,
    Alert
} from "react-native";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ThemedView } from "@/components/themed-view";
import { Fonts } from "@/constants/theme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { LinearGradient } from "expo-linear-gradient";
import { API } from "@/services/api";

export default function AddTripModal() {

    const router = useRouter();
    const [tripTitle, setTripTitle] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [selectedImages, setSelectedImages] = useState<Array<string>>([]);
    const [uploadedPhotos, setuploadedPhotos] = useState<Array<string>>([]);
    const [coverImage, setcoverImage] = useState<string>("");

    

    const openAppSettings = () => {
        Linking.openSettings();
    };

    // Fonction pour ouvrir les paraamètres de l'application
    const showPermissionAlert = (title: string, message: string) => {
        Alert.alert(title, message, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les paramètres', onPress: openAppSettings },
        ]
        );
    };

    // Fonction pour vérifier si on est sur simulateur
    const isSimulator = () => {
        return Platform.OS === 'ios' || Platform.OS === 'android';
    }

    // Afficher une alerte simulateur

    const showSimulatorAlert = (feature: string) => {
        Alert.alert('Fonctionnalité non disponible', `La fonctionnalité "${feature}" n'est pas disponible sur un simulateur. Veuillez utiliser un appareil réel pour y accéder.`,
            [
                {
                    text: 'D\'accord ',
                    onPress: () => console.log('OK'),
                    style: 'cancel'
                },
            ]
        );
    }


    const pickImage = async () => {
        try {

            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                showPermissionAlert('Permission Galerie refusée', 'Nous avons besoin de l\'accès à vos photos pour sélectionner des images.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsMultipleSelection: true,
                quality: 1,
            });

            if (!result.canceled) {
                const selectedUris = result.assets.map(asset => asset.uri);
                setSelectedImages(prevImages => [...prevImages, ...selectedUris]);
            }

        } catch (error) {
            console.error("Error picking image: ", error);
            showSimulatorAlert('Galerie');
        }
    };

    const takePhoto = async () => {

        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                showPermissionAlert('Permission refusée', 'Nous avons besoin de l\'accès à la caméra pour prendre des photos.');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [16, 9],
                quality: 1,
            });

            if (!result.canceled) {
                const photoUri = result.assets[0].uri;
                setSelectedImages(prevImages => [...prevImages, photoUri]);
                console.log("Photo taken: ", photoUri);
            }

        } catch (error) {
            console.log("Error taking photo: ", error);
            showSimulatorAlert('Camera');
        }
    };

    const getLocation = async () => {

        try {

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                showPermissionAlert('Permission Localisation refusée', 'Nous avons besoin de l\'accès à votre localisation pour obtenir votre position actuelle.');
                return;
            }
            const location = await Location.getCurrentPositionAsync({});
            console.log("Current location: ", location);

            const address = await Location.reverseGeocodeAsync(location.coords);
            if (address.length > 0) {

                const addr = address[0];
                const city = addr.city || addr.name || '';
                const country = addr.country || '';
                const formattedAddress = `${city}${city && country ? ', ' : ''}${country}`.trim();

                setDestination(formattedAddress);
                console.log("Resolved address: ", formattedAddress);
            }

        } catch (error) {
            console.log("Error getting location: ", error);
            showSimulatorAlert('Localisation');
        }


    };
    

    const uploadImages = async (uploadedPhotos : string[], coverImage:  string) => {
                    if (selectedImages.length > 0) {

                const totalImages = selectedImages.length;

                for (let i = 0; i < selectedImages.length; i++) {
                    const imageUri = selectedImages[i];
                    const uploadedUrl = await API.uploadImage(imageUri);
                    uploadedPhotos.push(uploadedUrl);

                    if (i == 0) {
                        coverImage = uploadedUrl;
                    }

                    const progress = Math.round(((i + 1) / totalImages) * 100);
                    setUploadProgress(progress);
                }

                setuploadedPhotos(uploadedPhotos);
                setcoverImage(coverImage);
            }

    }

    const handleSaveTrip = async () => {


        try {

            setIsUploading(true);
            setUploadProgress(0);

           uploadImages(uploadedPhotos, coverImage);

            let trip = {
                title: tripTitle,
                destination,
                startDate,
                endDate,
                description,
                image: coverImage,
                photos: selectedImages
            };


            const newTrip = await API.createTrip(trip);

            console.log('Voyage créé', newTrip);

            setIsUploading(false);

            setTimeout(() => {
                Alert.alert(
                    'Succès',
                    'Votre voyage a été créé !',
                    [
                        { text: 'OK', onPress: () => router.back }
                    ]
                )
            }, 500);

        } catch (error) {
            console.log('Erreur:', error);
            setIsUploading(false);
            Alert.alert('Erreur', 'Impossible de créer le voyage');

        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['bottom']}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Add New Trip</Text>
            <ScrollView>
                <View style={styles.section}>
                    <Text style={styles.label}>Cover photo</Text>
                    <View style={styles.photoUpload}>
                        <View style={styles.photoButtons}>
                            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
                                <Ionicons name="camera" size={32} color="#a855f7" />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.photoButton} onPress={pickImage}>
                                <Ionicons name="image" size={32} color="#ec4899" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.photoText}>Take a photo or choose from library</Text>
                        <Text style={styles.photoSubText}>Access camera and photos</Text>
                    </View>
                </View>

                {/*Title*/}

                <View style={styles.section}>
                    <Text style={styles.label}>Trip Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter trip title"
                        value={tripTitle}
                        onChangeText={setTripTitle}
                    />
                </View>

                {/* Destination with location */}

                <View style={styles.section}>
                    <Text style={styles.label}>Destination</Text>
                    <View style={styles.inputWithIcon} >
                        <Ionicons name="location-outline" size={16} color="#6b7280" />
                        <TextInput
                            style={styles.inputFlex}
                            placeholder="City, Country"
                            value={destination}
                            onChangeText={setDestination}
                        />
                        <TouchableOpacity onPress={getLocation}>
                            <Text style={styles.gpsButton}>
                                <Ionicons name="location-outline" size={16} color="#6366f1" /> Use Current Location
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.hint}>
                        💡 Utilisez la géolocalisation pour marquer le lieu
                    </Text>
                </View>
                {/* Dates */}
                <View style={styles.section}>
                    <View style={styles.dateRow}>
                        <View style={styles.dateColumn}>
                            <Text style={styles.label}>Date de retour</Text>
                            <View style={styles.inputWithIcon}>
                                <Ionicons name="calendar-outline" size={24} color="#6b7280" />
                                <TextInput
                                    style={styles.inputFlex}
                                    placeholder="JJ/MM/AAAA"
                                    value={endDate}
                                    onChangeText={setEndDate}
                                    placeholderTextColor="#9ca3af"
                                />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Description */}
                <View>
                    <Text style={styles.label}>Description</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Décrivez votre voyage..."
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                        placeholderTextColor="#9ca3af"
                    />
                </View>

                {/* Upload Progress */}

                {isUploading && (
                    <View style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <View style={styles.progressInfo}>
                                <Ionicons name="cloud-upload-outline" size={24} color="#a855f7" />
                                <Text style={styles.progressText}>Téléchargement en cours...</Text>
                            </View>
                            <Text style={styles.progressPercent}>{uploadProgress}%</Text>
                        </View>
                        <View style={styles.progressBarBg}>
                            <LinearGradient
                                colors={['#a855f7', '#ec4899']}
                                style={[styles.progressBarFill, { width: `${uploadProgress}%` }]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            />
                        </View>
                    </View>
                )}

                {/* Save Button */}

                <TouchableOpacity style={styles.saveButton}
                    onPress={handleSaveTrip}
                    disabled={isUploading}
                >
                    <LinearGradient
                        colors={['#a855f7', '#ec4899']}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Text style={styles.saveButtonText}>
                            {isUploading ? 'Enregistrement ...' : 'Créer le voyage'}
                        </Text>
                    </LinearGradient>
                </TouchableOpacity>
                <View style={{ height: 40 }}></View>
            </ScrollView>
        </SafeAreaView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    section: {
        marginBottom: 24,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 24,
    },
    label: {
        fontSize: 14,
        color: '#6b7280',
        marginBottom: 8,
        fontWeight: '600'
    },
    photoUpload: {
        backgroundColor: '#faf5ff',
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e9d5ff',
    },
    photoButtons: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
        paddingVertical: 16,
    },
    photoButton: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    photoText: {
        fontSize: 14,
        color: '#6b7280',
    },
    photoSubText: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 4,
    },
    input: {
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: '#111827',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputWithIcon: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 12
    },
    gpsButton: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: '600',
    },
    inputFlex: {
        flex: 1,
        fontSize: 16,
        color: '#111827',
    },
    hint: {
        fontSize: 12,
        color: '#9ca3af',
        marginTop: 8
    },
    dateRow: {
        flexDirection: 'row',
        gap: 12,
    },
    dateColumn: {
        flex: 1,
    },
    textArea: {
        height: 100,
        paddingTop: 12,
    },
    progressCard: {
        backgroundColor: '#faf5ff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 24,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12
    },
    progressInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    progressText: {
        fontSize: 14,
        color: '#111827'
    },
    progressPercent: {
        fontSize: 14,
        color: '#a855f7',
        fontWeight: '600'
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#e9d5ff',
        borderRadius: 4,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%'
    },
    saveButton: {
        borderRadius: 16,
        overflow: 'hidden'
    },
    gradientButton: {
        paddingVertical: 16,
        alignItems: 'center'
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    }
});