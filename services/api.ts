import { config } from "@/utils/env";
import { OFFLINE } from "./offline";


interface Trip {
    title: string,
    destination: string,
    startDate: string,
    endDate: string,
    description: string,
    image?: string,
    photos?: string[]
}


export const API = {

    async uploadImage(uri: string): Promise<string> {

        const formData = new FormData();

        const filename = uri.split('/').pop() || 'photo.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append(
            'file',
            {
                uri,
                name: filename,
                type,
            } as any
        );

        const response = await fetch(`${config.mockBackendUrl}/uploads`, {
            method: 'POST',
            body: formData,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        if (!response.ok) {
            throw new Error('Error upload image');
        }

        const data = await response.json();
        return data.url;
    },
    async createTrip(trip: Trip) {

        const isOnline = await OFFLINE.checkIsOnline();

        if (isOnline) {
            const response = await fetch(`${config.mockBackendUrl}/trips`, {
                method: 'POST',
                body: JSON.stringify(trip),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erreur création voyage');
            }

            return response.json();
        } else {
            console.log('Offline: Add to queue');

            await OFFLINE.addToQueue({
                type: 'CREATE',
                endpoint: '/trips',
                method: 'POST',
                payload: trip,
            });

            return {
                ...trip,
                id: `local-${Date.now()}`,
            }
        }
    },
    async getTrips() {
        const isOnline = await OFFLINE.checkIsOnline();

        if (isOnline) {

            try {
                const response = await fetch(`${config.mockBackendUrl}/trips`);
                const trips = await response.json();

                await OFFLINE.cacheTrips(trips);

                return trips;
            } catch (error) {
                console.log('Erreur fetch, utilisation du cache', error);
                const cached = await OFFLINE.getCachedTrips();

                return cached || [];
            }
        } else {
            console.log('Offline, utilisation du cache');
            const cached = await OFFLINE.getCachedTrips();
            return cached || [];
        }

    }
}