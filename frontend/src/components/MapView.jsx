import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getGeo } from '../api.js';
import L from 'leaflet';
// Use CDN icons for reliability in dev and static hosting
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

export default function MapView() {
  const [markers, setMarkers] = useState([]);

  useEffect(() => {
    getGeo().then(setMarkers);
  }, []);

  return (
    <div className="panel">
      <h3>Suspicious Logins (last 30 days)</h3>
      <div style={{ width: '100%', height: 420 }}>
        <MapContainer center={[20, 0]} zoom={2} style={{ width: '100%', height: '100%' }}>
          <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {markers.map((m, idx) => (
            <Marker key={idx} position={[m.lat, m.lon]}>
              <Popup>
                <div><strong>{m.accountId}</strong></div>
                <div>{m.city}, {m.country}</div>
                <div>{new Date(m.happenedAt).toLocaleString()}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}


