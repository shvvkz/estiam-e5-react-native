import { auth } from "./auth";
import { config } from "@/utils/env";

export interface TripLocation {
  lat: number;
  lng: number;
}

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  description?: string;
  image?: string;
  photos: string[];
  location: TripLocation;
}

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

export const tripsService = {
  async createTrip(payload: CreateTripPayload): Promise<Trip> {
    const response = await auth.fetch(`${config.mockBackendUrl}/trips`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create trip");
    }

    return response.json();
  },

  async getTrips(): Promise<Trip[]> {
    const response = await auth.fetch(`${config.mockBackendUrl}/trips`);
    if (!response.ok) throw new Error("Failed to fetch trips");
    return response.json();
  },
};
