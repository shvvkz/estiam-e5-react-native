import { config } from "@/utils/env";
import { OFFLINE } from "./offline";
import { auth } from "./auth";
import { Trip, TripLocation } from "@/models/trip";

export interface CreateTripPayload {
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  image?: string;
  photos?: string[];
  location: TripLocation;
}

/**
 * API
 *
 * Centralized service layer responsible for all trip-related
 * network operations and offline synchronization.
 *
 * This module abstracts:
 * - Remote API calls
 * - Authentication handling
 * - Offline fallback logic
 * - Local cache synchronization
 *
 * It is designed to be the single source of truth
 * for trip data access across the application.
 */
export const API = {
  /**
   * uploadImage
   *
   * Uploads a local image file to the backend and returns its public URL.
   *
   * This method uses multipart/form-data and relies on a relaxed typing
   * strategy due to React Native FormData limitations.
   *
   * Throws an error if the upload fails.
   */
  async uploadImage(uri: string): Promise<string> {
    const formData = new FormData();

    const filename = uri.split("/").pop() || "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append(
      "file",
      {
        uri,
        name: filename,
        type,
      } as any
    );

    const response = await fetch(`${config.mockBackendUrl}/uploads`, {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (!response.ok) {
      throw new Error("Erreur upload image");
    }

    const data = await response.json();
    return data.url;
  },

  /**
   * createTrip
   *
   * Creates a new trip on the backend.
   *
   * Responsibilities:
   * - Ensure the user is online
   * - Ensure the user is authenticated
   * - Send the trip payload to the API
   * - Refresh and synchronize the local offline cache after creation
   *
   * Throws an error if:
   * - The user is offline
   * - The user is not authenticated
   * - The API request fails
   */
  async createTrip(payload: CreateTripPayload): Promise<Trip> {
    const isOnline = await OFFLINE.checkIsOnline();

    if (!isOnline) {
      throw new Error("Création impossible hors ligne");
    }

    const tokens = await auth.getTokens();
    if (!tokens?.accessToken) {
      throw new Error("Utilisateur non authentifié");
    }

    const response = await fetch(`${config.mockBackendUrl}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokens.accessToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error("API /trips error:", error);
      throw new Error(error.error || "Erreur création voyage");
    }

    const createdTrip = await response.json();

    try {
      const trips = await this.getTrips();
      await OFFLINE.cacheTrips(
        trips.map((trip: Trip) => ({
          ...trip,
          description: trip.description ?? "",
        }))
      );
    } catch (error) {
      throw new Error("Erreur lors de la mise à jour du cache des voyages");
    }

    return createdTrip;
  },

  /**
   * getTrips
   *
   * Retrieves the list of trips with offline-first behavior.
   *
   * Behavior:
   * - If online: fetch trips from the backend and update local cache
   * - If offline or fetch fails: return cached trips
   *
   * Notes:
   * - Cached data is mapped defensively to ensure a valid Trip shape
   * - A loose typing strategy is used when reading cached data
   *   due to the absence of runtime schema validation
   *
   * Returns an empty array if no data is available.
   */
  async getTrips(): Promise<Trip[]> {
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
        console.log("Erreur fetch, utilisation du cache", error);
        const cached = await OFFLINE.getCachedTrips();
        return (cached || []).map((trip: Trip) => ({
          id: trip.id ?? "",
          title: trip.title ?? "",
          destination: trip.destination ?? "",
          startDate: trip.startDate ?? "",
          endDate: trip.endDate ?? "",
          description: trip.description ?? "",
          image: trip.image,
          photos: Array.isArray(trip.photos) ? trip.photos : [],
          location: trip.location ?? { lat: 0, lng: 0 },
        }));
      }
    } else {
      console.log("Offline, utilisation du cache");
      const cached = await OFFLINE.getCachedTrips();
      return (cached || []).map((trip: Trip) => ({
        id: trip.id ?? "",
        title: trip.title ?? "",
        destination: trip.destination ?? "",
        startDate: trip.startDate ?? "",
        endDate: trip.endDate ?? "",
        description: trip.description ?? "",
        image: trip.image,
        photos: Array.isArray(trip.photos) ? trip.photos : [],
        location: trip.location ?? { lat: 0, lng: 0 },
      }));
    }
  },

  async addPhotoToTrip(tripId: string, imageUrl: string) {
    const response = await auth.fetch(
      `${config.mockBackendUrl}/trips/${tripId}/photos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uri: imageUrl }),
      }
    );

    if (!response.ok) {
      throw new Error("Erreur ajout photo");
    }

    return response.json();
  },
};
