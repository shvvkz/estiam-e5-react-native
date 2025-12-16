import { useCallback, useEffect, useState } from "react";
import NetInfo from '@react-native-community/netinfo'
import { OFFLINE } from "@/services/offline";

export const useOffline = () => {

    const [isOnline, setIsOnline] = useState(true);
    const [pendingCount, setPendingCount] = useState(0);
    const [isSyncing, setIsSyncing] = useState(false);


    // Ecouter les changements de connexion

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const online = state.isConnected ?? false;
            setIsOnline(online);

            if (online && pendingCount > 0) {
                syncNow();
            }
        });

        loadPendingCount();

        return () => unsubscribe();
    }, []);

    const loadPendingCount = async () => {
        const queue = await OFFLINE.getQueue();
        setPendingCount(queue.length);
    }

    const syncNow = useCallback(async () => {
        if (isSyncing || !isOnline) return;
        setIsSyncing(true);

        try {

            const result = await OFFLINE.syncQueue();
            console.log(`Sync terminée : ${result.synced} réussi, ${result.failed} échoué`);
            await loadPendingCount();
            
        } catch (error) {
            console.log('Sync error', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isSyncing]);

    return {
        isOnline,
        pendingCount,
        isSyncing,
        syncNow,
        refreshPendingCount: loadPendingCount
    }
}