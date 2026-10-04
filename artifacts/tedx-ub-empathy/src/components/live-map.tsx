import { useEffect, useRef, useState } from 'react';

// Approximate coordinates for Bayanzurkh District, Ulaanbaatar.
// Swap these for the school's exact latitude/longitude once surveyed —
// nothing else in this component needs to change.
export const SCHOOL_LOCATION = {
  lat: 47.9203,
  lng: 106.963,
  name: 'Ulaanbaatar Empathy School',
};

const LEAFLET_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
const LEAFLET_JS = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';

declare global {
  interface Window {
    L?: any;
  }
}

let leafletLoadPromise: Promise<any> | null = null;

function loadLeaflet(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('no window'));
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoadPromise) return leafletLoadPromise;
  leafletLoadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[data-leaflet]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS;
      link.setAttribute('data-leaflet', 'true');
      document.head.appendChild(link);
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-leaflet]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.L));
      existing.addEventListener('error', () => reject(new Error('Failed to load map library')));
      return;
    }
    const script = document.createElement('script');
    script.src = LEAFLET_JS;
    script.async = true;
    script.setAttribute('data-leaflet', 'true');
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error('Failed to load map library'));
    document.body.appendChild(script);
  });
  return leafletLoadPromise;
}

function haversineKm(a: { lat: number; lng: number }, c: { lat: number; lng: number }): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(c.lat - a.lat);
  const dLng = toRad(c.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(c.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

type Status = 'loading-map' | 'ready' | 'map-error' | 'requesting' | 'granted' | 'denied' | 'unsupported' | 'position-error';

export interface LiveMapLabels {
  shareButton: string;
  sharing: string;
  granted: (distanceKm: string) => string;
  denied: string;
  unsupported: string;
  positionError: string;
  mapError: string;
  schoolPopup: string;
  userPopup: string;
}

export function LiveMap({ labels }: { labels: LiveMapLabels }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [status, setStatus] = useState<Status>('loading-map');
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
          [SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng],
          15,
        );
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);
        const schoolIcon = L.divIcon({ className: 'map-pin map-pin-school', html: '<span></span>', iconSize: [18, 18] });
        L.marker([SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng], { icon: schoolIcon })
          .addTo(map)
          .bindPopup(labels.schoolPopup);
        mapRef.current = map;
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) setStatus('map-error');
      });
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const shareLocation = () => {
    if (!('geolocation' in navigator)) {
      setStatus('unsupported');
      return;
    }
    setStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const user = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDistanceKm(haversineKm(SCHOOL_LOCATION, user));
        setStatus('granted');
        const L = window.L;
        const map = mapRef.current;
        if (L && map) {
          userMarkerRef.current?.remove();
          const userIcon = L.divIcon({ className: 'map-pin map-pin-user', html: '<span></span>', iconSize: [18, 18] });
          userMarkerRef.current = L.marker([user.lat, user.lng], { icon: userIcon }).addTo(map).bindPopup(labels.userPopup);
          map.fitBounds(
            L.latLngBounds([
              [SCHOOL_LOCATION.lat, SCHOOL_LOCATION.lng],
              [user.lat, user.lng],
            ]),
            { padding: [48, 48], maxZoom: 16 },
          );
        }
      },
      (error) => setStatus(error.code === error.PERMISSION_DENIED ? 'denied' : 'position-error'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div className="live-map">
      <div ref={containerRef} className="live-map-canvas" data-testid="live-map-canvas" />
      <div className="live-map-controls">
        <button
          type="button"
          className="button small ghost"
          onClick={shareLocation}
          disabled={status === 'requesting' || status === 'loading-map'}
          data-testid="button-share-location"
        >
          {status === 'requesting' ? labels.sharing : labels.shareButton}
        </button>
        {status === 'granted' && distanceKm !== null && (
          <span className="live-map-status ok" data-testid="status-live-map">
            {labels.granted(distanceKm.toFixed(1))}
          </span>
        )}
        {status === 'denied' && <span className="live-map-status warn">{labels.denied}</span>}
        {status === 'unsupported' && <span className="live-map-status warn">{labels.unsupported}</span>}
        {status === 'position-error' && <span className="live-map-status warn">{labels.positionError}</span>}
        {status === 'map-error' && <span className="live-map-status warn">{labels.mapError}</span>}
      </div>
    </div>
  );
}
