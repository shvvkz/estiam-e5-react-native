import { auth } from "./auth";
import { config } from "@/utils/env";
import { Trip } from "@/models/trip";

export interface HomeStats {
  trips: number;
  photos: number;
  countries: number;
}

export interface HomeActivity {
  id: string;
  icon: string;
  text: string;
  time: string;
}

export interface HomeData {
  stats: HomeStats;
  upcomingTrips: Trip[];
  activities: HomeActivity[];
}

export const homeService = {
  async getHomeData(): Promise<HomeData> {
    const response = await auth.fetch(`${config.mockBackendUrl}/trips`);

    if (!response.ok) {
      throw new Error("Failed to load trips");
    }

    const trips: Trip[] = await response.json();

    const stats: HomeStats = {
      trips: trips.length,
      photos: trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0),
      countries: new Set(trips.map(t => t.destination)).size,
    };

    const upcomingTrips = trips
      .filter(t => new Date(t.startDate).getTime() > Date.now())
      .sort(
        (a, b) =>
          new Date(a.startDate).getTime() -
          new Date(b.startDate).getTime()
      )
      .slice(0, 3);

    const activities: HomeActivity[] = trips
      .slice(0, 5)
      .map(trip => ({
        id: trip.id,
        icon: "airplane-outline",
        text: `Trip created: ${trip.title}`,
        time: new Date(trip.startDate).toLocaleDateString("fr-FR"),
      }));

    return {
      stats,
      upcomingTrips,
      activities,
    };
  },
};
