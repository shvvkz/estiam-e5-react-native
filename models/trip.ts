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
  photos?: string[];
  location: TripLocation;
  isFavorite?: boolean;
}
