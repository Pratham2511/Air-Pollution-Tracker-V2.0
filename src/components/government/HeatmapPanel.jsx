import PropTypes from 'prop-types';
import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const HeatLayer = ({ points }) => {
  const map = useMap();

  useEffect(() => {
    let layer;
    let isMounted = true;

    const ensureHeatLayer = async () => {
      if (typeof window !== 'undefined') {
        window.L = window.L ?? L;
      }

      if (typeof L.heatLayer !== 'function') {
        await import('leaflet.heat');
      }

      if (!isMounted) {
        return;
      }

      layer = L.heatLayer(
        points.map((point) => [point.lat, point.lng, Math.max(point.intensity, 0.01)]),
        {
          radius: 22,
          blur: 18,
          maxZoom: 12,
          gradient: {
            0.2: '#34d399',
            0.4: '#facc15',
            0.6: '#f97316',
            0.8: '#fb7185',
            1: '#b91c1c',
          },
        },
      );
      layer.addTo(map);
    };

    ensureHeatLayer();

    return () => {
      isMounted = false;
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, [map, points]);

  return null;
};

HeatLayer.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
      intensity: PropTypes.number.isRequired,
    }),
  ).isRequired,
};

const topHotspots = (points) =>
  [...points]
    .sort((a, b) => b.intensity - a.intensity)
    .slice(0, 4)
    .map((point) => ({
      id: point.cityId ?? `${point.lat}-${point.lng}`,
      name: point.name ?? 'Unknown location',
      aqi: point.aqi ?? Math.round(point.intensity * 400),
    }));

export const HeatmapPanel = ({ points }) => {
  const hotspots = useMemo(() => topHotspots(points), [points]);
  const center = useMemo(() => {
    if (!points.length) {
      return [20.5937, 78.9629];
    }
    const avgLat = points.reduce((sum, point) => sum + point.lat, 0) / points.length;
    const avgLng = points.reduce((sum, point) => sum + point.lng, 0) / points.length;
    return [avgLat, avgLng];
  }, [points]);

  return (
    <section id="heatmap" className="glass-panel p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gov-primary">Heatmap Visualization</h2>
          <p className="mt-1 text-sm text-slate-500">
            Leaflet heat layer rendering live AQI intensity across the monitored network.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-gov-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-gov-primary">
          GeoStack Active
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_1fr]">
        <div className="relative h-96 overflow-hidden rounded-3xl border border-slate-200/60">
          <MapContainer center={center} zoom={5} className="h-full w-full" zoomControl={false} scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {points.length > 0 && <HeatLayer points={points} />}
          </MapContainer>
        </div>

        <div className="space-y-4 text-sm text-slate-600">
          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Gradient Legend</p>
            <ul className="mt-4 space-y-3">
              <li className="flex items-center gap-3">
                <span className="h-2 w-10 rounded-full bg-rose-500" />
                <span>Critical hotspot (AQI &gt; 300)</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-10 rounded-full bg-amber-400" />
                <span>Emerging hotspot (AQI 200-300)</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="h-2 w-10 rounded-full bg-emerald-400" />
                <span>Stabilizing zone (AQI &lt; 150)</span>
              </li>
            </ul>
          </div>

          <div className="rounded-3xl border border-slate-200/60 bg-white/70 p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Top Hotspots</p>
            <ul className="mt-3 space-y-3 text-xs">
              {hotspots.length ? (
                hotspots.map((spot) => (
                  <li key={spot.id} className="flex items-center justify-between rounded-2xl bg-slate-100/70 px-3 py-2">
                    <span className="font-semibold text-slate-700">{spot.name}</span>
                    <span className="text-rose-600">AQI {spot.aqi}</span>
                  </li>
                ))
              ) : (
                <li className="rounded-2xl bg-slate-100/70 px-3 py-2 text-slate-500">
                  Awaiting geo-tagged readings.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

HeatmapPanel.propTypes = {
  points: PropTypes.arrayOf(
    PropTypes.shape({
      cityId: PropTypes.string,
      name: PropTypes.string,
      lat: PropTypes.number,
      lng: PropTypes.number,
      intensity: PropTypes.number,
      aqi: PropTypes.number,
    }),
  ),
};

HeatmapPanel.defaultProps = {
  points: [],
};
