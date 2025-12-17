import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "favorite_trips";

/**
 * favoritesService
 *
 * Manages the persistence of favorite trips using local storage.
 *
 * Responsibilities:
 * - Store favorite trip identifiers
 * - Retrieve and update favorite state
 * - Provide a simple API for toggling favorites
 *
 * This service is fully local and does not rely on the backend.
 */
export const favoritesService = {
  async getFavorites(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async isFavorite(tripId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    return favs.includes(tripId);
  },

  /**
   * toggleFavorite
   *
   * Toggles the favorite state of a trip.
   *
   * Behavior:
   * - Adds the trip ID if it is not currently a favorite
   * - Removes the trip ID if it is already a favorite
   *
   * Returns:
   * - true if the trip is now a favorite
   * - false if the trip was removed from favorites
   */
  async toggleFavorite(tripId: string): Promise<boolean> {
    const favs = await this.getFavorites();

    let updated: string[];
    let isFav: boolean;

    if (favs.includes(tripId)) {
      updated = favs.filter(id => id !== tripId);
      isFav = false;
    } else {
      updated = [...favs, tripId];
      isFav = true;
    }

    await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    return isFav;
  },
};
