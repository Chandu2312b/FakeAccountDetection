import geoip from 'geoip-lite';

// Offline geolocation lookup using geoip-lite
export const geolocateIp = (ip) => {
  try {
    const geo = geoip.lookup(ip);
    if (!geo) return null;
    return {
      country: geo.country || '',
      region: Array.isArray(geo.region) ? geo.region.join(',') : (geo.region || ''),
      city: geo.city || '',
      ll: geo.ll || []
    };
  } catch {
    return null;
  }
};



