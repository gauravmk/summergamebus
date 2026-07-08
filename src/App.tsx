import { MapContainer, Marker, TileLayer, useMapEvents, Popup } from 'react-leaflet';
import { Icon, type LatLngTuple } from 'leaflet';
import insidePng from './images/inside.png';
import outsidePng from './images/outside.png';
import bothPng from './images/both.png';

import "./index.css";
import "leaflet/dist/leaflet.css";
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { Bus, BusCoordinates } from './Bus';

const ANN_ARBOR_COORDS: LatLngTuple = [42.276837, -83.733089];
const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BusTracker />
    </QueryClientProvider>
  );
}

function BusTracker() {
  const { data, isLoading, error } = useQuery<BusCoordinates>({
    refetchInterval: 3000,
    queryKey: ['bus-coords'],
    queryFn: () => fetch('/api/buses').then(res => res.json()),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data) {
    return <div>No data</div>;
  }

  return (
    <div>
      <div style={{ height: '10vh', display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
        <h1 className="text-2xl font-bold">Summer Game Bus Tracker</h1>
      </div>
      <MapContainer center={ANN_ARBOR_COORDS} zoom={13} style={{ height: '90vh' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Markers buses={data} />
      </MapContainer>
    </div>
  );
}

function Markers({ buses }: { buses: BusCoordinates }) {
  const { outside, inside, both } = buses ?? {};
  const [zoomLevel, setZoomLevel] = useState(13)
  useMapEvents({
    zoom: (e) => {
      setZoomLevel(e.target.getZoom())
    }
  })

  return (
    <>
      {outside.map((bus) => (
        <BusMarker key={bus.id} bus={bus} type="outside" zoomLevel={zoomLevel} />
      ))}
      {inside.map((bus) => (
        <BusMarker key={bus.id} bus={bus} type="inside" zoomLevel={zoomLevel} />
      ))}
      {both.map((bus) => (
        <BusMarker key={bus.id} bus={bus} type="both" zoomLevel={zoomLevel} />
      ))}</>
  )
}

function BusMarker({ bus, type, zoomLevel }: { bus: Bus, type: "inside" | "outside" | "both", zoomLevel: number }) {
  return (
    <Marker key={bus.id} position={[bus.lat, bus.lon]} icon={getIcon(type, zoomLevel)} >
      <Popup>
        {
          bus.direction === "Not In Service" ? <div>Sleeping. Please do not disturb ❤️</div> : <div>Route {bus.routeNum} {bus.direction}</div>
        }
      </Popup>
    </Marker>
  )
}

function getIcon(type: "inside" | "outside" | "both", zoomLevel: number) {
  const png = type === "inside" ? insidePng : type === "outside" ? outsidePng : bothPng;

  const baseSize = zoomLevel < 15 ? 64 : 90;

  return new Icon({
    iconUrl: png,
    iconSize: [baseSize, baseSize],       // adjust to your image size
    iconAnchor: [baseSize / 2, baseSize],     // tip of the marker (center-bottom)
    popupAnchor: [0, -baseSize],
  });
}



export default App;
