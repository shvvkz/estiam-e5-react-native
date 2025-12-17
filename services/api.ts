import { config } from "@/utils/env";
import { OFFLINE } from "./offline";
import { auth } from './auth';

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

            const tokens = await auth.getTokens();

            if (!tokens?.accessToken) {
                throw new Error('Utilisateur non authentifié');
            }

            const response = await fetch(`${config.mockBackendUrl}/trips`, {
                method: 'POST',
                body: JSON.stringify(trip),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens.accessToken}`,
                }
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                console.error('API /trips error:', error);
                throw new Error(error.error || 'Erreur création voyage');
            }

            return response.json();
        }

    },

    async getTrips() {
        const isOnline = await OFFLINE.checkIsOnline();

        if (isOnline) {
            try {
                const response = await auth.fetch(`${config.mockBackendUrl}/trips`);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const trips = await response.json();

                await OFFLINE.cacheTrips(trips);
                return Array.isArray(trips) ? trips : [];

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
    },

    async addPhotoToTrip(tripId: string, imageUrl: string) {
        const response = await auth.fetch(
            `${config.mockBackendUrl}/trips/${tripId}/photos`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ uri: imageUrl }),
            }
        );

        if (!response.ok) {
            throw new Error('Erreur ajout photo');
        }

        return response.json();
    }

}