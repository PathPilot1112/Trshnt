/**
 * Global System Configuration for Admin Test Dev Mode & Geofence Settings
 */

let systemState = {
  testDevMode: false,
  coordMappingEnabled: false,
  coordRadiusMeters: 35,
};

export const getSystemState = () => ({ ...systemState });

export const setSystemState = (newState) => {
  systemState = {
    ...systemState,
    ...newState,
  };
  return getSystemState();
};
