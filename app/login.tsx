import { useAuth } from "@/contexts/auth-context";
import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * LoginScreen
 *
 * Authentication screen handling both login and registration flows.
 *
 * Features:
 * - Toggle between login and register modes
 * - Form validation for required fields
 * - Secure password input with visibility toggle
 * - Integration with authentication context
 *
 * This screen does not handle navigation guards directly.
 * Redirection logic is managed at the root layout level.
 */
export default function LoginScreen() {
    const router = useRouter();
    const { login, register, isLoading, refreshAuth } = useAuth();

    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [showPassword, setshowPassword] = useState(false);

    /**
     * handleSubmit
     *
     * Handles form submission for authentication.
     *
     * Behavior:
     * - Validates required fields depending on the current mode
     * - Calls login or registration logic through the auth context
     * - Refreshes authentication state after success
     * - Displays user-friendly error messages on failure
     *
     * This function is intentionally kept UI-agnostic
     * and focuses only on authentication logic.
     */
    const handleSubmit = async () => {

        if (!email || !password) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        if (!isLoginMode && !name) {
            Alert.alert('Erreur', 'Veuillez entrer votre nom');
            return;
        }

        try {

            if (isLoginMode) {
                await login({ email, password });
            } else {
                await register({ email, password, name });
            }

            await refreshAuth();

        } catch (error) {
            const errorMessage = error instanceof Error
                ? error.message
                : 'Une erreur est survenue';

            Alert.alert('Erreur', errorMessage, [{ text: 'OK' }])
        }
    };

    return (

        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps='handled'
                >
                    <LinearGradient
                        colors={['#a855f7', '#ec4899']}
                        style={styles.header}
                    >
                        <Text style={styles.headerTitle}>
                            {isLoginMode
                                ? 'Connectez-vous à votre compte'
                                : 'Créez un nouveau compte'
                            }
                        </Text>
                    </LinearGradient>
                    <View style={styles.form}>
                        {
                            !isLoginMode && (
                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={24} color="#6b7280" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Nom complet"
                                        placeholderTextColor="#9ca3af"
                                        value={name}
                                        onChangeText={setName}
                                        autoCapitalize="words"
                                        editable={!isLoading}
                                    />

                                </View>
                            )
                        }

                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={24} color="#6b7280" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Email"
                                placeholderTextColor="#9ca3af"
                                value={email}
                                keyboardType="email-address"
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                editable={!isLoading}
                            />

                        </View>

                        <View style={styles.inputContainer}>
                            <Ionicons
                                name="lock-closed-outline"
                                size={24}
                                color="#6b7280"
                                style={styles.inputIcon}
                            />

                            <TextInput
                                style={styles.input}
                                placeholder="Mot de passe"
                                placeholderTextColor="#9ca3af"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoComplete="password"
                                autoCapitalize="none"
                                editable={!isLoading}
                            />

                            <TouchableOpacity
                                onPress={() => setshowPassword(!showPassword)}
                                style={styles.eyeButton}
                                hitSlop={10}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={22}
                                    color="#6b7280"
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={handleSubmit}
                            style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                            disabled={isLoading}
                        >
                            <LinearGradient
                                colors={['#a855f7', '#ec4899']}
                                style={styles.submitButtonGradient}
                            >
                                {isLoading ? (
                                    <Text style={styles.submitButtonText}>Chargement...</Text>
                                ) : (
                                    <Text style={styles.submitButtonText}>
                                        {isLoginMode ? 'Se connecter' : "S'inscrire"}
                                    </Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => setIsLoginMode(!isLoginMode)}
                            style={styles.switchModeButton}
                            disabled={isLoading}
                        >
                            <Text style={styles.switchModeText}>
                                {
                                    isLoginMode
                                        ? 'Pas encore de compte ? S\'inscrire'
                                        : 'Déjà un compte ? Se connecter'
                                }
                            </Text>
                        </TouchableOpacity>

                        {isLoginMode && (
                            <TouchableOpacity style={styles.forgotPasswordButton}
                            >
                                <Text style={styles.forgotPasswordText}>
                                    Mot de passe oublié ?
                                </Text>
                            </TouchableOpacity>
                        )}

                    </View>
                </ScrollView>

            </KeyboardAvoidingView>


        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 48,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 8,
    },
    headerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
    },
    form: {
        padding: 24,
        flex: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e5e7eb',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: 16,
        color: '#111827',
    },
    eyeButton: {
        padding: 4,
    },
    submitButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8,
        marginBottom: 16,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonGradient: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    switchModeButton: {
        alignItems: 'center',
        paddingVertical: 12,
    },
    switchModeText: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: '600',
    },
    forgotPasswordButton: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    forgotPasswordText: {
        color: '#6b7280',
        fontSize: 14,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 16,
        gap: 8,
    },
    testButtonText: {
        color: '#6b7280',
        fontSize: 12,
    },
});
