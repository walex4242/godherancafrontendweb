declare module '@mapbox/mapbox-sdk/services/directions' {
  type Coordinates = [number, number];

  interface Waypoint {
    coordinates: Coordinates;
    approach?: string;
  }

  interface DirectionsRequest {
    profile: 'driving' | 'cycling' | 'walking' | 'driving-traffic';
    waypoints: Waypoint[];
    alternatives?: boolean;
    geometries?: 'geojson' | 'polyline';
    overview?: 'full' | 'simplified';
    steps?: boolean;
  }

  interface DirectionsResponse {
    routes: Array<{
      distance: number; // in meters
      duration: number; // in seconds
      geometry: {
        coordinates: Coordinates[];
        type: 'LineString';
      };
    }>;
  }

  export default function Directions(config: { accessToken: string }): {
    getDirections: (
      options: DirectionsRequest,
    ) => Promise<{ body: DirectionsResponse }>;
  };
}

declare module '@mapbox/mapbox-sdk/services/geocoding' {
  interface GeocodeResponse {
    features: Array<{
      geometry: { coordinates: [number, number] };
    }>;
  }

  export default function Geocoding(config: { accessToken: string }): {
    forwardGeocode: (options: { query: string; limit?: number }) => {
      send: () => Promise<{ body: GeocodeResponse }>;
    };
  };
}
