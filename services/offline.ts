import { config } from "@/utils/env";
import AsyncStorage from '@react-native-async-storage/async-storage'


// Config
const STORAGE_KEYS = {
    OFFLINE_QUEUE: '@offline_queue',
    CACHED_TRIPS: '@cached_trips'
};

// Types

interface QueueAction {
    id: string,
    type: 'CREATE' | 'UPDATE' | 'DELETE',
    endpoint: string,
    method: 'POST' | 'PUT' | 'DELETE',
    payload: any,
    timestamp: number
}

interface Trip {
    title: string,
    destination: string,
    startDate: string,
    endDate: string,
    description: string,
    image?: string,
    photos?: string[]
}

// Network helpers

const checkIsOnline = async (): Promise<QueueAction[]> => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return stored ? JSON.parse(stored) : [];
}

// Queue offline

const getQueue = async (): Promise<QueueAction[]> => {
     const stored = await AsyncStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
    return stored ? JSON.parse(stored) : [];
}

const addToQueue = async (action: Omit<QueueAction, 'id' | 'timestamp'>): Promise<void> => {
    const queue = await getQueue();

    const newAction: QueueAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`,
        timestamp: Date.now()
    }

    queue.push(newAction);

    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
    console.log('Action ajoutée à la queue offline:', newAction.type)
}

const removeFromQueue = async (actionId : string): Promise<void> => {
    const queue = await getQueue();
    const filtered = queue.filter(a => a.id !== actionId);
    await AsyncStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(filtered));
}

// Sync

const syncQueue = async (): Promise<{synced: number; failed: number}> => {
    const isOnline = await checkIsOnline();
    if (!isOnline) {
        return {synced: 0, failed: 0};
    }
    const queue = await getQueue();

    if (queue.length == 0) {
        return {synced: 0, failed: 0};
    }

    console.log(`🔄 Synchronisation de ${queue.length} action(s)...`);

    let synced = 0;
    let failed = 0;

    for (const action of queue) {
        try {
            const response = await fetch(`${config.mockBackendUrl}${action.endpoint}`, {
            method: action.method,
            body: JSON.stringify(action.payload),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            await removeFromQueue(action.id);
            synced++;
            console.log(`✅ synced: ${action.type}`);
        }
        } catch (error) {
            failed++;
            console.log(`✅ failed: ${action.type}`, error);
        }
    }
    return {synced, failed};
}


// cache trips


const cacheTrips = async (trips: Trip[]): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.CACHED_TRIPS, JSON.stringify({
        data: trips,
        cachedAt: Date.now()
    }))
};


const getCachedTrips = async (): Promise<Trip[] | null> => {
    const stored = await AsyncStorage.getItem(STORAGE_KEYS.CACHED_TRIPS);
    if (stored) {
        const { data } = JSON.parse(stored);
        return data;
    }
    return null;
};


export const OFFLINE = {
    
    checkIsOnline,
    getQueue,
    addToQueue,
    removeFromQueue,
    syncQueue,
    cacheTrips,
    getCachedTrips
}
