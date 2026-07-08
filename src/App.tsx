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
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}
      <div style={{ height: '10vh', display: 'flex', alignItems: 'center', paddingLeft: '16px', justifyContent: 'space-between' }}>
        <h1 className="text-2xl font-bold w-1/2">Summer Game Bus Tracker</h1>
        <div onClick={() => setIsInfoModalOpen(true)} className="mr-4 z-1001 bg-white p-2 rounded-full cursor-pointer">
          <img width="24px" height="24px" src="images/question.png" />
        </div>
      </div>
      <MapContainer center={ANN_ARBOR_COORDS} zoom={13} style={{ height: '85vh' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Markers buses={data} />
      </MapContainer>
      <div style={{ height: '5vh', display: 'flex', alignItems: 'center', paddingLeft: '16px' }} className="text-xs text-gray-500">
        This is an independent project by Gaurav Kulkarni, with help from friends. We are not affiliated with either the Ann Arbor District Library, or the Ann Arbor Area Transportation Authority. We just think they're really cool.
      </div>
    </div>
  );
}

function InfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-6000" onClick={onClose}>
      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-70" onClick={onClose}></div>
      <div className="bg-white p-4 rounded-lg z-6001 max-w-5/6 w-3xl">
        <h2 className="text-2xl font-bold mb-4">About the Summer Game Bus Tracker</h2>
        <p className="mb-4 text-sm">This is a map of buses that are carrying summer game codes. We've separately marked which buses have outside codes (aka a banner on the side of the bus) and those with inside codes (check the advertisements above the seats near the back of the bus).</p>
        <p className="mb-4 text-sm">You can click or tap on any marker to get additional information, like what route the bus is on and what direction it's going.</p>
        <p className="mb-4 text-sm">As a reminder, the bus is free on the weekends if you show your AADL library card.</p>
        <h2 className="text-lg font-bold mb-2">How it works</h2>
        <p className="mb-4 text-sm">Throughout the summer, my friends and I have been noting down the bus IDs of any bus carrying a summer game code. We then use the AAATA bus tracking API to show you the real-time location of the bus.</p>
        <p className="mb-4 text-sm">If you notice anything wrong about the buses, or find a bus that has a code but is missing from this map, please email me at gaurav@gauravkulkarni.com</p>
        <h2 className="text-lg font-bold mb-2">Who am I?</h2>
        <p className="mb-4 text-sm">I'm Gaurav Kulkarni. I grew up in Ann Arbor and I love the library, love the summer game, and love the bus. If you want to get in touch, you can email me at gaurav@gauravkulkarni.com</p>
        <p className="mb-4 text-sm">Also I want to be clear that this project is not affiliated with the Ann Arbor District Library or the Ann Arbor Area Transportation Authority. I made this as a fan and does not represent either organization. I just think they're really cool.</p>
      </div>
    </div>
  )
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
