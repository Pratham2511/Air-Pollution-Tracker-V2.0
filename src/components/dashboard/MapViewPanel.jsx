import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import { getAqiLevel } from '../../utils/aqi';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
  if (!window.L) {
    window.L = L;
  }
  // eslint-disable-next-line global-require
  require('leaflet.markercluster');
}

const defaultCenter = [28.6139, 77.209]; // New Delhi

const markerIcon = (color) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:2px solid #fff;box-shadow:0 6px 14px -6px rgba(15,23,42,0.45);"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const userLocationIcon = L.divIcon({
  className: '',
  html: '<span style="display:block;width:18px;height:18px;border-radius:9999px;background:#1f4f8b;border:3px solid #60a5fa;box-shadow:0 10px 18px -12px rgba(15,23,42,0.65);"></span>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const clusterIcon = (count, maxAqi, color, label) =>
  L.divIcon({
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        width:52px;
        height:52px;
        border-radius:999px;
        background:linear-gradient(145deg, rgba(255,255,255,0.95), rgba(255,255,255,0.68));
        box-shadow:0 18px 32px -18px rgba(15,23,42,0.45);
        border:3px solid ${color};
        color:#0f172a;
        font-family:'Inter',system-ui;
      ">
        <span style="font-size:16px;font-weight:700;line-height:1">${count}</span>
        <span style="font-size:11px;font-weight:600;color:${color};line-height:1;margin-top:2px">${label} · ${maxAqi}</span>
      </div>
    `,
    className: '',
    iconSize: [52, 52],
    iconAnchor: [26, 26],
  });

export const MapViewPanel = ({ cities, isLoading }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const clusterGroupRef = useRef(null);

    const markers = useMemo(() =>
      cities.map((city) => {
        const level = getAqiLevel(city.aqi);
        return {
          id: city.id,
          position: [city.lat, city.lng],
          icon: markerIcon(city.color),
          popup: `${city.name} · AQI ${city.aqi}`,
          aqi: city.aqi,
          color: city.color,
          levelLabel: level.label,
          colorToken: level.color,
        };
      }), [cities]);

  const focusMap = useCallback(
    (lat, lng) => {
      if (!mapInstance) return;
      mapInstance.flyTo([lat, lng], 8, { duration: 1.1 });
    },
    [mapInstance],
  );

  const locateViaIp = useCallback(async () => {
    try {
      const response = await fetch('https://ipwho.is/?fields=latitude,longitude,city,success');
      const data = await response.json();

      if (!data.success) {
        throw new Error('IP lookup failed');
      }

      const nextLocation = { lat: data.latitude, lng: data.longitude, source: 'ip', label: data.city };
      setUserLocation(nextLocation);
      setStatusMessage(`Centered on approximate location${nextLocation.label ? ` near ${nextLocation.label}` : ''}.`);
      setErrorMessage('');
      focusMap(nextLocation.lat, nextLocation.lng);
    } catch (ipError) {
      setErrorMessage('We could not determine your location automatically. Please select a city manually.');
    }
  }, [focusMap]);

  const handleLocate = useCallback(() => {
    if (isLocating) return;

    setIsLocating(true);
    setStatusMessage('Locating…');
    setErrorMessage('');

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setStatusMessage('');
      locateViaIp().finally(() => setIsLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: 'gps',
        };
        setUserLocation(nextLocation);
        setStatusMessage('Centered on your current location.');
        setErrorMessage('');
        focusMap(nextLocation.lat, nextLocation.lng);
        setIsLocating(false);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setErrorMessage('Location permission denied. Falling back to approximate location.');
        } else {
          setErrorMessage('Unable to access precise location. Using approximate location instead.');
        }
        setStatusMessage('');
        locateViaIp().finally(() => setIsLocating(false));
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
    );
  }, [focusMap, isLocating, locateViaIp]);

  useEffect(() => {
    if (userLocation) {
      focusMap(userLocation.lat, userLocation.lng);
    }
  }, [focusMap, userLocation]);

  useEffect(() => {
    if (!mapInstance || isLoading) {
      return undefined;
    }

    if (!clusterGroupRef.current) {
      clusterGroupRef.current = L.markerClusterGroup({
        chunkedLoading: true,
        spiderfyOnMaxZoom: true,
        disableClusteringAtZoom: 8,
        showCoverageOnHover: false,
      });
      mapInstance.addLayer(clusterGroupRef.current);
    }

    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();

    let maxAqi = 0;
    let dominantColor = '#1f4f8b';
    let label = 'AQI';

    const leafletMarkers = markers.map((marker) => {
      const leafletMarker = L.marker(marker.position, { icon: marker.icon, metadata: { aqi: marker.aqi, color: marker.color, label: marker.levelLabel } }).bindPopup(
        `<div style="min-width:140px;font-family:'Inter',system-ui;color:#0f172a">
          <p style="margin:0;font-weight:600">${marker.popup}</p>
          <p style="margin-top:4px;font-size:12px;color:#64748b">Tap for insights or track changes.</p>
        </div>`,
      );
      if (marker.aqi > maxAqi) {
        maxAqi = marker.aqi;
        dominantColor = marker.color;
        label = marker.levelLabel;
      }
      return leafletMarker;
    });

    leafletMarkers.forEach((leafletMarker) => clusterGroup.addLayer(leafletMarker));

    clusterGroup.options.iconCreateFunction = (cluster) => {
      const children = cluster.getAllChildMarkers();
      let highestAqi = maxAqi;
      let clusterColor = dominantColor;
      let clusterLabel = label;

      children.forEach((child) => {
        const meta = child.options?.metadata ?? {};
        if (typeof meta.aqi === 'number' && meta.aqi > highestAqi) {
          highestAqi = meta.aqi;
          clusterColor = meta.color ?? clusterColor;
          clusterLabel = meta.label ?? clusterLabel;
        }
      });

      return clusterIcon(cluster.getChildCount(), highestAqi || maxAqi, clusterColor, clusterLabel);
    };

    return () => {
      clusterGroup.clearLayers();
    };
  }, [isLoading, mapInstance, markers]);

  useEffect(() => () => {
    if (mapInstance && clusterGroupRef.current) {
      mapInstance.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
  }, [mapInstance]);

  const mapSection = isLoading ? (
    <div className="h-[28rem] rounded-3xl overflow-hidden border border-white/60 bg-gradient-to-br from-slate-100 via-white to-slate-200">
      <div className="h-full w-full animate-pulse bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_60%)]" />
    </div>
  ) : (
    <div className="relative h-[28rem] rounded-3xl overflow-hidden shadow-lg border border-white/60">
      <MapContainer
        center={defaultCenter}
        zoom={5}
        scrollWheelZoom
        className="h-full w-full"
        whenCreated={(map) => {
          if (!mapInstance) {
            setMapInstance(map);
          }
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userLocationIcon}
          >
            <Popup>
              {userLocation.source === 'gps' ? 'Your precise location' : 'Approximate location'}
            </Popup>
          </Marker>
        )}
      </MapContainer>

      <div className="pointer-events-none absolute inset-0 flex items-start justify-end p-4">
        <button
          type="button"
          onClick={handleLocate}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition hover:bg-white"
          disabled={isLocating}
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-user-primary" aria-hidden />
          {isLocating ? 'Locating…' : 'Locate me'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {mapSection}

      {(statusMessage || errorMessage) && (
        <div className="space-y-1 text-sm">
          {statusMessage && <p className="text-slate-600">{statusMessage}</p>}
          {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        </div>
      )}
    </div>
  );
};

MapViewPanel.propTypes = {
  cities: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      aqi: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    }),
  ).isRequired,
  isLoading: PropTypes.bool,
};

MapViewPanel.defaultProps = {
  isLoading: false,
};
