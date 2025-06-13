// GoogleMapWidget.jsx
import React from "react";
import { MapContainer, TileLayer, Marker as LeafletMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const officeLocation = {
  lat: 32.0852999,
  lng: 34.7817677
};

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const MapComponent = () => {
  const position = [32.0852999, 34.7817677];

  return (
    <div style={{ width: "250px", height: "150px" }}>
      <MapContainer 
        center={position} 
        zoom={15} 
        style={{ 
          height: "100%",
          width: "100%",
          borderRadius: "8px",
          overflow: "hidden"
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LeafletMarker position={position}>
          <Popup>
              Office Location
          </Popup>
        </LeafletMarker>
      </MapContainer>
    </div>
  );
};

export default MapComponent;
