
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { notifications, NotificationPreferences, PushToken } from "@/services/notification";

export const useNotifications = (
    onReceived?: (notification: Notifications.Notification) => void,
    onTapped?: (datam: any) => void
) => {
    const [pushToken, setPushToken] = useState<PushToken | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasPermission, setHasPermission] = useState(false);
    const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
    const [scheduled, setScheduled] = useState<Notifications.NotificationRequest[]>([]);
    const [badgeCount, setBadgeCount] = useState(0);

    const cleanupRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        loadData();
        setupListeners();
        return () => cleanupRef.current?.();
    }, []);

    const loadData = async () => {
        try {

            const [token, prefs, badge, scheduledList] = await Promise.all([
                notifications.getToken(),
                notifications.getPreferences(),
                notifications.getBadge(),
                notifications.getScheduled(),
            ]);

            setPushToken(token);
            setPreferences(prefs);
            setBadgeCount(badge);
            setScheduled(scheduledList);
            setHasPermission(!!token);
        } finally {
            setIsLoading(false);
        }
    };

    const setupListeners = () => {
        cleanupRef.current = notifications.setupListeners(
            (n) => onReceived?.(n),
            (r) => onTapped?.(r.notification.request.content.data)
        );
    };

    const initialize = useCallback(async () => {
        setIsLoading(true);
        try {
            const token = await notifications.initialize();
            if (token) {
                setPushToken(token);
                setHasPermission(true);
            }
            return token;

        } finally {
            setIsLoading(false);
        }
    }, []);

    const send = useCallback((title: string, body: string, data?: any) => {
        return notifications.send(title, body, data);
    }, []);

    const schedule = useCallback(async (title: string, body: string, date: Date, data?: any) => {
        const id = await notifications.schedule(title, body, date, data);
        await refreshScheduled();
        return id;
    }, []);



    const scheduleTripReminder = useCallback(async (id: string, title: string, date: Date) => {
        const id_ = await notifications.scheduleTripReminder(id, title, date);
        await refreshScheduled();
        return id_;
    }, []);


    const cancel = useCallback(async (id: string) => {
        await notifications.cancel(id);
        await refreshScheduled();
    }, []);

    const cancelAll = useCallback(async () => {
        await notifications.cancelAll();
        await setScheduled([]);
    }, []);

    const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
        const current = preferences || await notifications.getPreferences();
        const updated = { ...current, ...updates };
        await notifications.savePreferences(updated);
        setPreferences(updated);
    }, [preferences]);

    const updateBadge = useCallback(async (count: number) => {
        await notifications.setBadge(count);
        setBadgeCount(count)
    }, []);

    const clearBadge = useCallback(async () => {
        await notifications.clearBadge();
        setBadgeCount(0)
    }, []);


    const refreshScheduled = useCallback(async () => {
        const list = await notifications.getScheduled();
        setScheduled(list);
    }, []);

    return {
        pushToken,
        isLoading,
        hasPermission,
        preferences,
        scheduled,
        badgeCount,
        initialize,
        send,
        schedule,
        scheduleTripReminder,
        cancel,
        cancelAll,
        updatePreferences,
        setBadgeCount: updateBadge,
        clearBadge,
        refreshScheduled,
    };
}

export const useLastNotificationResponse = () => {
    const [response, setResponse] = useState<Notifications.NotificationResponse | null>(null);
    useEffect(() => {
        Notifications.getLastNotificationResponseAsync().then((r) => {
            if (r) setResponse(r);
        });
    }, []);

    return response;
}