import Ionicons from "@expo/vector-icons/Ionicons";
import { LinearGradient } from "expo-linear-gradient";
import {  useRouter } from "expo-router";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Device from 'expo-device';
import { useNotifications } from "@/hooks/use-notifications";
import { useEffect, useState } from "react";


export default function NotificationScreen()    {

    const router = useRouter();
    const [testResults, setTestResults] = useState<string[]>([]);
    const isSimulator = !Device.isDevice;

    const {
        pushToken,
        isLoading,
        hasPermission,
        initialize,
        send,
        schedule,
        scheduled,
        badgeCount,
        setBadgeCount,
        clearBadge,
        refreshScheduled,
    } = useNotifications(
        (notification) => {
            addTestResult(`✅ Notification reçue: ${ notification.request.content.title }`);
        },
        (data) => {
            addTestResult(`👆 Notification cliquée: ${JSON.stringify(data)}`);
        }
    );

    const addTestResult = (message : string) => {
        setTestResults((prev) => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    }

    useEffect(() => {
        refreshScheduled();
    });

    const handleInitialize = async () => {
        addTestResult('🔄 Initialisation des notifications ...');
        const token = await initialize();

         if (token) {
            addTestResult(`✅ Token obtenu: ${token.token.substring(0, 20)}...`);
            addTestResult(`📱 Plateforme: ${token.platform}`);
            addTestResult(`🆔 Device: ${token.deviceId || 'N/A'}`);
         } else {
            addTestResult(`❌ Echec de l\'intialisation`);
         }
    };

    const handleSendImmediate = async () => {
        try {
            const id = await send(
                'Test Notification',
                'Ceci est une notification de test immediate !',
            );
            addTestResult(`✅ Notification envoyée (ID: ${id.substring(0, 8)}...`);
        } catch (error) {
            addTestResult(`❌ Erreur: ${error}`);
        }
    };


     const handleSchedule5Seconds = async () => {
        const date = new Date();
        date.setSeconds(date.getSeconds() + 5);

        try {

            const id = await schedule(
                'Notification Programmée',
                'Cette notification apparaîtra dans 5 secondes',
                date,
                {testType: 'scheduled_5s'}
            );
            addTestResult(`✅ Notification Programmée pour ${date.toLocaleTimeString()}`);
            await refreshScheduled();
        } catch (error) {
            addTestResult(`❌ Erreur: ${error}`);
        }
    };

       const handleSchedule30Seconds = async () => {
        const date = new Date();
        date.setSeconds(date.getSeconds() + 30);

        try {

            const id = await schedule(
                'Rappel de voyage',
                'Cette notification apparaîtra dans 30 secondes',
                date,
                {testType: 'trip_reminder'}
            );
            addTestResult(`✅ Notification Programmée pour ${date.toLocaleTimeString()}`);
            await refreshScheduled();
        } catch (error) {
            addTestResult(`❌ Erreur: ${error}`);
        }
    };

     const handleSetBadge = async () => {
       await setBadgeCount(5);
        addTestResult('✅ Badge défini 5');
    };

      const handleClearBadge = async () => {
       await clearBadge();
        addTestResult('✅ Badge effacé');
    };
      const handleClearResults = async () => {
       await setTestResults([]);
    };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient colors={['#a855f7', '#ec4899']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Test Notifications</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons 
              name={isSimulator ? "phone-portrait-outline" : "phone-portrait"} 
              size={20} 
              color={isSimulator ? "#f59e0b" : "#10b981"} 
            />
            <Text style={styles.statusText}>
              {isSimulator ? 'Simulateur' : 'Appareil physique'}
            </Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons 
              name={hasPermission ? "checkmark-circle" : "close-circle"} 
              size={20} 
              color={hasPermission ? "#10b981" : "#ef4444"} 
            />
            <Text style={styles.statusText}>
              Permissions: {hasPermission ? 'Accordées' : 'Non accordées'}
            </Text>
          </View>
          {pushToken && (
            <View style={styles.tokenContainer}>
              <Text style={styles.tokenLabel}>Token:</Text>
              <Text style={styles.tokenText} numberOfLines={1}>
                {pushToken.token}
              </Text>
            </View>
          )}
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeLabel}>Badge count: {badgeCount}</Text>
          </View>
          {scheduled.length > 0 && (
            <View style={styles.scheduledContainer}>
              <Text style={styles.scheduledLabel}>
                Notifications programmées: {scheduled.length}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          
          <TouchableOpacity 
            onPress={handleInitialize} 
            disabled={isLoading}
            style={[styles.button, styles.buttonPrimary]}
          >
            <Ionicons name="notifications-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Initialiser les notifications</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSendImmediate}
            style={[styles.button, styles.buttonSuccess]}
          >
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Notification immédiate</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSchedule5Seconds}
            style={[styles.button, styles.buttonInfo]}
          >
            <Ionicons name="time-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Programmer (5 secondes)</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleSchedule30Seconds}
            style={[styles.button, styles.buttonInfo]}
          >
            <Ionicons name="calendar-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Programmer (30 secondes)</Text>
          </TouchableOpacity>

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              onPress={handleSetBadge}
              style={[styles.button, styles.buttonSmall, styles.buttonWarning]}
            >
              <Ionicons name="ellipse" size={16} color="#fff" />
              <Text style={styles.buttonTextSmall}>Badge: 5</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleClearBadge}
              style={[styles.button, styles.buttonSmall, styles.buttonDanger]}
            >
              <Ionicons name="close-circle-outline" size={16} color="#fff" />
              <Text style={styles.buttonTextSmall}>Effacer badge</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Test Results */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Résultats des tests</Text>
            {testResults.length > 0 && (
              <TouchableOpacity onPress={handleClearResults}>
                <Text style={styles.clearButton}>Effacer</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {testResults.length === 0 ? (
            <View style={styles.emptyResults}>
              <Ionicons name="document-text-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Aucun résultat pour le moment</Text>
              <Text style={styles.emptySubtext}>
                Utilisez les boutons ci-dessus pour tester les notifications
              </Text>
            </View>
          ) : (
            <View style={styles.resultsContainer}>
              {testResults.map((result, index) => (
                <View key={index} style={styles.resultItem}>
                  <Text style={styles.resultText}>{result}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Info Box */}
        {isSimulator && (
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#3b82f6" />
            <Text style={styles.infoText}>
              Mode simulateur: Les notifications locales fonctionnent, mais les push tokens Expo nécessitent un appareil physique.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    placeholder: {
        width: 40,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    statusCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    statusText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    tokenContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    tokenLabel: {
        fontSize: 12,
        color: '#6b7280',
        marginBottom: 4,
    },
    tokenText: {
        fontSize: 11,
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    badgeContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    badgeLabel: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    scheduledContainer: {
        marginTop: 8,
    },
    scheduledLabel: {
        fontSize: 14,
        color: '#6b7280',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        marginBottom: 12,
        gap: 8,
    },
    buttonPrimary: {
        backgroundColor: '#a855f7',
    },
    buttonSuccess: {
        backgroundColor: '#10b981',
    },
    buttonInfo: {
        backgroundColor: '#3b82f6',
    },
    buttonWarning: {
        backgroundColor: '#f59e0b',
    },
    buttonDanger: {
        backgroundColor: '#ef4444',
    },
    buttonSmall: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonTextSmall: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    resultsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        maxHeight: 300,
    },
    resultItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    resultText: {
        fontSize: 12,
        color: '#111827',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    emptyResults: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 32,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        marginTop: 12,
        fontWeight: '500',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 4,
        textAlign: 'center',
    },
    clearButton: {
        color: '#a855f7',
        fontSize: 14,
        fontWeight: '600',
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#dbeafe',
        borderRadius: 12,
        padding: 16,
        gap: 12,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#1e40af',
        lineHeight: 20,
    },
});