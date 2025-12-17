import { auth } from "./auth";
import { config } from "@/utils/env";
import { Trip } from "@/models/trip";
import { HomeActivity, HomeStats } from "@/models/home-activity";

export interface HomeData {
  stats: HomeStats;
  upcomingTrips: Trip[];
  activities: HomeActivity[];
}

/**
 * homeService
 *
 * Provides aggregated data used by the Home screen.
 *
 * This service acts as a view-model layer:
 * - It fetches raw trip data from the backend
 * - It computes derived statistics
 * - It prepares structured data ready for UI consumption
 *
 * No UI logic should be placed here.
 */
export const homeService = {
  /**
   * getHomeData
   *
   * Fetches all trips and derives Home screen data from them.
   *
   * Responsibilities:
   * - Compute global statistics (trips count, photos count, countries count)
   * - Extract upcoming trips sorted by start date
   * - Generate recent activity entries for display
   *
   * Throws:
   * - Error if the backend request fails
   *
   * Returns:
   * - HomeData object ready to be consumed by the Home screen
   */
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
