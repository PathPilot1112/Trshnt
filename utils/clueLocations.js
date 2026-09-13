/**
 * GPS Coordinates Mapping for Campus Locations with Haversine distance calculator.
 */

export const LOCATION_COORDINATES = {
  // ZONE 1
  "Mahatma Gandhi Statue": { lat: 12.82304852317362, lng: 80.04119850284714, zone: "Zone 1" },
  "Genz": { lat: 12.822841913197491, lng: 80.04249400973585, zone: "Zone 1" },
  "Genz Cafe": { lat: 12.822841913197491, lng: 80.04249400973585, zone: "Zone 1" },
  "Rajaraja Chola": { lat: 12.823009293444368, lng: 80.04281319259249, zone: "Zone 1" },
  "Rajaraja Chola Statue": { lat: 12.823009293444368, lng: 80.04281319259249, zone: "Zone 1" },
  "Central Library": { lat: 12.823691889871549, lng: 80.04247255211634, zone: "Zone 1" },
  "Perignar Anna": { lat: null, lng: null, zone: "Zone 1", missingGps: true },
  "Periyar": { lat: null, lng: null, zone: "Zone 1", missingGps: true },

  // ZONE 2
  "Sports Complex": { lat: null, lng: null, zone: "Zone 2", missingGps: true },
  "Arts & Science Block": { lat: 12.825873105125622, lng: 80.04357516477907, zone: "Zone 2" },
  "Sai Temple": { lat: 12.825278767134366, lng: 80.04184707996356, zone: "Zone 2" },
  "Law Block": { lat: 12.825918205196725, lng: 80.04594281310993, zone: "Zone 2" },

  // ZONE 3
  "Aaruush Logo (TP)": { lat: null, lng: null, zone: "Zone 3", missingGps: true },
  "#SRM (TP)": { lat: null, lng: null, zone: "Zone 3", missingGps: true },
  "Vendhar Square": { lat: 12.824056115180442, lng: 80.04531785843815, zone: "Zone 3" },
  "Fab Lab": { lat: 12.822479081518516, lng: 80.04566922780847, zone: "Zone 3" },
  "Noon Meal Scheme (M Block)": { lat: 12.821493, lng: 80.045679, zone: "Zone 3" },
  "Noon Meal Scheme": { lat: 12.821493, lng: 80.045679, zone: "Zone 3" },

  // ZONE 4
  "Slice of Life": { lat: 12.821907633229062, lng: 80.04775732746997, zone: "Zone 4" },
  "TP Auditorium Gate": { lat: 12.824376, lng: 80.047331, zone: "Zone 4" },
  "Dental College": { lat: 12.825311458267803, lng: 80.04754275076432, zone: "Zone 4" },
  "Gym": { lat: 12.825912974626478, lng: 80.04903942337197, zone: "Zone 4" },
  "Pickleball Court": { lat: null, lng: null, zone: "Zone 4", missingGps: true },

  // ZONE 5
  "Bell Block": { lat: 12.823287214422754, lng: 80.04406929003538, zone: "Zone 5" },
  "MBA Gate": { lat: 12.823629, lng: 80.044732, zone: "Zone 5" },
  "Architecture Stonehenge": { lat: 12.824048269271172, lng: 80.04447028029426, zone: "Zone 5" },
  "Clock Tower": { lat: 12.823026990716777, lng: 80.04482433186632, zone: "Zone 5" },
  "Architecture #SRM": { lat: null, lng: null, zone: "Zone 5", missingGps: true }
};

/**
 * Calculates distance in meters between two lat/lng coordinates using the Haversine formula.
 */
export const calculateDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Looks up target coordinates for a location name with fuzzy cleaning.
 */
export const getCoordinatesForLocation = (locationName) => {
  if (!locationName) return null;
  if (LOCATION_COORDINATES[locationName]) return LOCATION_COORDINATES[locationName];

  const cleanName = locationName.toLowerCase().replace(/[^a-z0-9]/g, "");
  for (const [key, coords] of Object.entries(LOCATION_COORDINATES)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleanName.includes(cleanKey) || cleanKey.includes(cleanName)) {
      return coords;
    }
  }
  return null;
};

/**
 * Checks if user coordinates match a location within range meters (default 3.5m radius).
 */
export const isWithinGeofenceRange = (userLat, userLng, locationName, maxDistanceMeters = 3.5) => {
  const targetCoords = getCoordinatesForLocation(locationName);
  // If target has no GPS coordinates defined, or missingGps is flagged
  if (!targetCoords || targetCoords.lat == null || targetCoords.lng == null) {
    return {
      hasCoordinates: false,
      isWithin: false,
      distance: null,
      targetCoords: null
    };
  }

  // If user lat or lng is missing/invalid
  if (userLat == null || userLng == null || isNaN(userLat) || isNaN(userLng)) {
    return {
      hasCoordinates: true,
      isWithin: false,
      distance: null,
      targetCoords
    };
  }

  const distance = calculateDistanceMeters(userLat, userLng, targetCoords.lat, targetCoords.lng);
  return {
    hasCoordinates: true,
    isWithin: distance <= maxDistanceMeters,
    distance: Math.round(distance * 10) / 10,
    targetCoords
  };
};
