"use client";

import { useCallback, useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

const PUSAT_INDONESIA: [number, number] = [-2.5, 118];

function PerbaruiPusat({ posisi }: { posisi: [number, number] | null }) {
  const map = useMap();
  const latitude = posisi?.[0] ?? null;
  const longitude = posisi?.[1] ?? null;
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      map.setView([latitude, longitude], Math.max(map.getZoom(), 15));
    }
  }, [map, latitude, longitude]);
  return null;
}

function KlikPeta({ saatPilih }: { saatPilih: (posisi: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      saatPilih([event.latlng.lat, event.latlng.lng]);
    },
  });
  return null;
}

export default function PetaLokasiProyek({
  latitude,
  longitude,
  saatPilih,
}: {
  latitude: number | null;
  longitude: number | null;
  saatPilih: (latitude: number, longitude: number) => void;
}) {
  const posisi: [number, number] | null =
    latitude !== null && longitude !== null ? [latitude, longitude] : null;
  const pilih = useCallback(
    (nilai: [number, number]) => saatPilih(nilai[0], nilai[1]),
    [saatPilih],
  );

  return (
    <MapContainer
      center={posisi ?? PUSAT_INDONESIA}
      zoom={posisi ? 15 : 4}
      scrollWheelZoom={false}
      className="z-0 h-64 w-full rounded-lg"
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <KlikPeta saatPilih={pilih} />
      <PerbaruiPusat posisi={posisi} />
      {posisi ? (
        <CircleMarker center={posisi} radius={9} pathOptions={{ color: "#b45309" }} />
      ) : null}
    </MapContainer>
  );
}
