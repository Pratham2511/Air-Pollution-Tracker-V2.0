import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import PropTypes from 'prop-types';
import { getAqiLevel } from '../../utils/aqi';
import { Skeleton } from '../common';
import { resolveUserLocation } from '../../services/geolocationService';

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

const markerIcon = ({ color, isTracked }) => {
  const size = isTracked ? 22 : 16;
  const border = isTracked ? 3 : 2;
  const shadow = isTracked ? '0 14px 28px -18px rgba(15,23,42,0.55)' : '0 6px 14px -6px rgba(15,23,42,0.45)';
  const ring = isTracked
    ? `<span style="position:absolute;inset:-6px;border-radius:9999px;border:2px solid rgba(31,79,139,0.45);"></span>`
    : '';

  return L.divIcon({
    className: 'aq-map-marker',
    html: `
      <span style="position:relative;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${border}px solid #fff;box-shadow:${shadow};">
        ${ring}
      </span>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const mapboxToken = process.env.REACT_APP_MAPBOX_TOKEN;

const getTileLayer = () => {
  if (!mapboxToken) {
    return {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    };
  }

  return {
    attribution:
      '© <a href="https://www.mapbox.com/about/maps/">Mapbox</a> © <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: `https://api.mapbox.com/styles/v1/mapbox/light-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`,
    options: {
      tileSize: 512,
      zoomOffset: -1,
    },
  };
};
const tileLayerConfig = getTileLayer();

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

export const MapViewPanel = ({ cities, isLoading, onSelectCity }) => {
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const clusterGroupRef = useRef(null);
  const trackedCount = useMemo(() => cities.filter((city) => city.isTracked).length, [cities]);

  const markers = useMemo(
    () =>
      cities.map((city) => {
        const level = getAqiLevel(city.aqi);
        return {
          id: city.id,
          position: [city.lat, city.lng],
          icon: markerIcon({ color: city.color, isTracked: city.isTracked }),
          popup: `${city.name} · AQI ${city.aqi}`,
          aqi: city.aqi,
          color: city.color,
          levelLabel: level.label,
          colorToken: level.color,
          isTracked: city.isTracked,
          dominantPollutant: city.dominantPollutant,
          updatedAt: city.updatedAt,
        };
      }),
    [cities],
  );

  const focusMap = useCallback(
    (lat, lng) => {
      if (!mapInstance) return;
      mapInstance.flyTo([lat, lng], 8, { duration: 1.1 });
    },
    [mapInstance],
  );

  const handleLocate = useCallback(() => {
    if (isLocating) return;

    setIsLocating(true);
    setStatusMessage('Locating…');
    setErrorMessage('');

    resolveUserLocation()
      .then((result) => {
        if (!result?.location) {
          if (result?.error) {
            setErrorMessage(result.error);
          }
          setStatusMessage('');
          return;
        }

        setUserLocation(result.location);
        focusMap(result.location.lat, result.location.lng);
        setStatusMessage(
          result.fallback
            ? `Centered on approximate location${result.location.label ? ` near ${result.location.label}` : ''}.`
            : 'Centered on your current location.',
        );
        setErrorMessage(result.fallback && result.error ? result.error : '');
      })
      .catch((error) => {
        setErrorMessage(error?.message ?? 'Unable to determine your location automatically.');
        setStatusMessage('');
      })
      .finally(() => {
        setIsLocating(false);
      });
  }, [focusMap, isLocating]);

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
      const leafletMarker = L.marker(marker.position, {
        icon: marker.icon,
        metadata: { aqi: marker.aqi, color: marker.color, label: marker.levelLabel, isTracked: marker.isTracked },
      }).bindPopup(
        `<div style="min-width:160px;font-family:'Inter',system-ui;color:#0f172a">
          <p style="margin:0;font-weight:600">${marker.popup}</p>
          <p style="margin-top:4px;font-size:12px;color:#64748b">Dominant: ${marker.dominantPollutant ?? '—'}</p>
        </div>`,
      );

      if (onSelectCity) {
        leafletMarker.on('click', () => {
          onSelectCity(marker.id);
        });
      }

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

      let trackedInside = false;

      children.forEach((child) => {
        const meta = child.options?.metadata ?? {};
        if (typeof meta.aqi === 'number' && meta.aqi > highestAqi) {
          highestAqi = meta.aqi;
          clusterColor = meta.color ?? clusterColor;
          clusterLabel = meta.label ?? clusterLabel;
        }
        if (meta.isTracked) {
          trackedInside = true;
        }
      });

      return clusterIcon(
        cluster.getChildCount(),
        highestAqi || maxAqi,
        trackedInside ? '#1f4f8b' : clusterColor,
        clusterLabel,
      );
    };

    return () => {
      clusterGroup.clearLayers();
    };
  }, [isLoading, mapInstance, markers, onSelectCity]);

  useEffect(() => () => {
    if (mapInstance && clusterGroupRef.current) {
      mapInstance.removeLayer(clusterGroupRef.current);
      clusterGroupRef.current = null;
    }
  }, [mapInstance]);

  const mapSection = isLoading ? (
    <Skeleton className="h-[28rem] rounded-3xl overflow-hidden border border-white/60" shimmer={false}>
      Loading map
    </Skeleton>
  ) : (
    <div className="relative h-[28rem] rounded-3xl overflow-hidden border border-white/60 shadow-lg" aria-busy={isLoading} aria-live="polite">
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
          attribution={tileLayerConfig.attribution}
          url={tileLayerConfig.url}
          {...(tileLayerConfig.options ?? {})}
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

      {!isLoading && trackedCount === 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 text-sm text-slate-600 shadow-sm">
          Add cities to your watchlist from the Tracking tab to highlight them here.
        </div>
      )}

      {(statusMessage || errorMessage) && (
        <div className="space-y-1 text-sm" aria-live="polite">
          {statusMessage && <p className="text-slate-600" role="status">{statusMessage}</p>}
          {errorMessage && <p className="text-red-500" role="alert">{errorMessage}</p>}
        </div>
      )}

      {!isLoading && (
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm">
            <span className="inline-flex h-3 w-3 rounded-full border-2 border-user-primary bg-white" aria-hidden />
            Tracked cities
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 shadow-sm">
            <span className="inline-flex h-3 w-3 rounded-full bg-slate-400" aria-hidden />
            Catalog cities
          </span>
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
      dominantPollutant: PropTypes.string,
      isTracked: PropTypes.bool,
    }),
  ).isRequired,
  isLoading: PropTypes.bool,
  onSelectCity: PropTypes.func,
};

MapViewPanel.defaultProps = {
  isLoading: false,
  onSelectCity: undefined,
};
