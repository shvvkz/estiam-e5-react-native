export const mapTripsByDate = (trips: any[]) => {
  const map: Record<string, any[]> = {};

  trips.forEach(trip => {
    let current = new Date(trip.startDate);
    const end = new Date(trip.endDate);

    while (current <= end) {
      const key = current.toISOString().split("T")[0];
      map[key] = map[key] ? [...map[key], trip] : [trip];
      current.setDate(current.getDate() + 1);
    }
  });

  return map;
};
