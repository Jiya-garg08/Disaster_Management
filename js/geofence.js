/* ============================================================
   geofence.js — location validation
   Phase 2 equivalent: MongoDB $geoWithin / $near on a 2dsphere
   index over the ACTIVE_ZONES collection.
   ============================================================ */

// Haversine distance between two lat/lng points, in km.
function haversineDistanceKm(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius, km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bounding-box check: is (lat, lng) inside a zone's box?
function isInsideBounds(lat, lng, bounds) {
  return (
    lat >= bounds.minLat &&
    lat <= bounds.maxLat &&
    lng >= bounds.minLng &&
    lng <= bounds.maxLng
  );
}

// Returns the matching zone object, or null if the point falls
// outside every active disaster zone.
function findActiveZone(lat, lng) {
  return ACTIVE_ZONES.find((zone) => isInsideBounds(lat, lng, zone.bounds)) || null;
}

// Distance (km) from a point to the center of its nearest zone —
// useful for showing "X km inside zone boundary" in the UI.
function distanceToZoneCenter(lat, lng, zone) {
  const centerLat = (zone.bounds.minLat + zone.bounds.maxLat) / 2;
  const centerLng = (zone.bounds.minLng + zone.bounds.maxLng) / 2;
  return haversineDistanceKm(lat, lng, centerLat, centerLng);
}