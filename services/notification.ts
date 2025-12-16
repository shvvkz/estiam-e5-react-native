import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface PushToken {
    token: string;
    platform: 'ios' | 'android';
    deviceId?: string;
    createdAt: number;
}

export interface NotificationPreferences {
    enabled: boolean;
    tripReminders: boolean;
    newMessages: boolean;
    promotions: boolean;
    sound: boolean;
}

// Constants

const KEYS = {
    PUSH_TOKEN: '@push_token',
    PREFERENCES: '@notification_prefs',
} as const;

const DEFAULT_PREFS: NotificationPreferences = {
    enabled: true,
    tripReminders: true,
    newMessages: true,
    promotions: true,
    sound: true,
};

// Config

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    })
})

// Notifications services

export const notifications = {

    async initialize(): Promise<PushToken | null> {
        const isSimulator = !Device.isDevice;

        if (isSimulator) {
            console.log('Running on simulator - local notifications will work, but push tokens require a physical device');
        }
        const {status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if ( finalStatus !== 'granted') {
            console.warn('Push permission not granted');
            return null;
        }

        if (Platform.OS == 'android') {
            await this.createAndroidChannels();
        }

        if (isSimulator) {
            const mockToken : PushToken = {
                token: 'SIMULATOR_MOCK_TOKEN',
                platform: Platform.OS as 'ios' | 'android',
                deviceId: Device.deviceName || 'Simulator',
                createdAt: Date.now(),
            };
            
            await AsyncStorage.setItem(KEYS.PUSH_TOKEN, JSON.stringify(mockToken));
            console.log('Simulator mode: Using mock token.');
            return mockToken;
        }

         try {

            const projectId = Constants.expoConfig?.extra?.eas?.projectId;
            const tokenData = await Notifications.getExpoPushTokenAsync({projectId});

            const pushToken: PushToken = {
                token: tokenData.data,
                platform: Platform.OS as 'ios' | 'android',
                deviceId: Device.deviceName || undefined,
                createdAt: Date.now(),
            }

            await AsyncStorage.setItem(KEYS.PUSH_TOKEN, JSON.stringify(pushToken));
            return pushToken;
            
         } catch (error) {
            console.error('Get push token error:', error);
            return null;
         }
    },
    async createAndroidChannels(): Promise<void> {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#a855f7'
        });
        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Rappels de voyage',
            importance: Notifications.AndroidImportance.HIGH
        }); 
    },
    async getToken(): Promise<PushToken | null> {
        const stored = await AsyncStorage.getItem(KEYS.PUSH_TOKEN);
        return stored ? JSON.parse(stored) : null;
    },
    async send(title: string, body: string, data?: Record<string, any>): Promise<string>{
        return Notifications.scheduleNotificationAsync({
            content: { title, body, data: data || {}, sound: 'default'},
            trigger: null,
        })
    },
    async schedule(title: string, body: string, date: Date, data?: Record<string, any>): Promise<string> {
         return Notifications.scheduleNotificationAsync({
            content: { title, body, data: data || {}, sound: 'default'},
            trigger: {type: Notifications.SchedulableTriggerInputTypes.DATE, date},
        })
    },

     async scheduleTripReminder(id: string, title: string, date: Date, daysBefore = 1): Promise<string> {
         const reminderDate = new Date(date);
         reminderDate.setDate(reminderDate.getDate() - daysBefore);
         reminderDate.setHours(9, 0, 0, 0);

         if (reminderDate <= new Date()) {
            console.warn('Reminder date is in the past');
            return '';
         }

         return this.schedule(
            '✈️ Rappel de voyage',
            `Votre voyage "${title}" commence dans ${daysBefore} jour(s) !`,
            reminderDate,
            {id, type: 'trip_reminder'}
         );
    },

    async cancel(id: string): Promise<void> {
        await Notifications.cancelScheduledNotificationAsync(id);
    },

      async cancelAll(): Promise<void> {
        await Notifications.cancelAllScheduledNotificationsAsync();
    },

      async getScheduled(): Promise<Notifications.NotificationRequest[]> {
       return  Notifications.getAllScheduledNotificationsAsync();
    },
      async setBadge(count: number): Promise<void> {
        await Notifications.setBadgeCountAsync(count);
    },
       async getBadge(): Promise<number> {
        return Notifications.getBadgeCountAsync();
    },
       async clearBadge(): Promise<void> {
        await Notifications.setBadgeCountAsync(0);
    },
       async getPreferences(): Promise<NotificationPreferences> {
        const stored = await AsyncStorage.getItem(KEYS.PREFERENCES);
        return stored ? JSON.parse(stored) : DEFAULT_PREFS;
    },
     async savePreferences(prefs: NotificationPreferences): Promise<void> {
       await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(prefs));
    },
    
    setupListeners(
        onReceived?: (notification: Notifications.Notification) => void,
        onTapped?: (response: Notifications.NotificationResponse) => void
    ): () => void {
        const receivedSub = Notifications.addNotificationReceivedListener((n) => {
            console.log('Notification received:', n);
            onReceived?.(n);
        });

        const responseSub = Notifications.addNotificationResponseReceivedListener((r) => {
            console.log('Notification tapped:', r);
            onTapped?.(r);
        });

        return () => {
            receivedSub.remove();
            responseSub.remove();
        }
    }
}