import { auth } from './auth';
import { config } from '@/utils/env';

export interface Trip {
  id: string;
  title: string;
  destination: string;
  startDate: string;
  endDate: string;
  image?: string;
  photos: string[];
}

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

const parseDate = (date: string): Date => {
  const [day, month, year] = date.split('/');
  return new Date(`${year}-${month}-${day}`);
};

export const homeService = {
  async getHomeData(): Promise<HomeData> {
    const response = await auth.fetch(`${config.mockBackendUrl}/trips`);

    if (!response.ok) {
      throw new Error('Failed to load trips');
    }

    const trips: Trip[] = await response.json();

    const stats: HomeStats = {
      trips: trips.length,
      photos: trips.reduce((sum, t) => sum + (t.photos?.length || 0), 0),
      countries: new Set(trips.map(t => t.destination)).size,
    };

    const upcomingTrips = trips
      .filter(t => {
        const start = parseDate(t.startDate);
        return start.getTime() > Date.now();
      })
      .sort((a, b) => {
        return (
          parseDate(a.startDate).getTime() -
          parseDate(b.startDate).getTime()
        );
      })
      .slice(0, 3);

    const activities: HomeActivity[] = trips
      .slice()
      .reverse()
      .slice(0, 5)
      .map(trip => ({
        id: trip.id,
        icon: 'airplane-outline',
        text: `Trip created: ${trip.title}`,
        time: parseDate(trip.startDate).toLocaleDateString(),
      }));

    return {
      stats,
      upcomingTrips,
      activities,
    };
  },
};
