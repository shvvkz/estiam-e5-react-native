import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "favorite_trips";

export const favoritesService = {
  async getFavorites(): Promise<string[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  },

  async isFavorite(tripId: string): Promise<boolean> {
    const favs = await this.getFavorites();
    return favs.includes(tripId);
  },

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
