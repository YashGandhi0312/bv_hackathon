import React, { useState } from 'react';
import axios from 'axios';
import { CloudRain, LocateFixed, TrendingUp } from 'lucide-react';
import { Navbar } from './components/ui/mini-navbar';
import TextType from './components/ui/TextType';
import { LightRays } from './components/ui/LightRays';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

// Fix typical leaflet icon issue in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface PredictionResult {
  risk_score: number;
  uncertainty: number;
  contributions: { feature: string; impact: number }[];
}

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [trackingId, setTrackingId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [routeInfo, setRouteInfo] = useState<any>(null);
  const [historyData, setHistoryData] = useState<any[]>([]);

  // Toggle Theme
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');


  // Coordinates Mapping
  const REGIONS = {
    north: { center: [29.7, 76.9], origin: [28.7041, 77.1025], dest: [30.7333, 76.7794] },
    south: { center: [12.6, 77.1], origin: [12.9716, 77.5946], dest: [12.2958, 76.6394] },
    west: { center: [18.8, 73.3], origin: [19.0760, 72.8777], dest: [18.5204, 73.8567] },
    east: { center: [21.4, 87.0], origin: [22.5726, 88.3639], dest: [20.2961, 85.8245] },
  };

  const getRiskColor = (score: number) => {
    if (score < 0.3) return 'text-emerald-400';
    if (score < 0.6) return 'text-amber-400';
    return 'text-rose-500';
  };
  const getHexColor = (score: number) => {
    if (score < 0.3) return '#34d399';
    if (score < 0.6) return '#fbbf24';
    return '#fb7185';
  };

  const hashString = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  };

  const trackParcel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;

    setLoading(true);
    setResult(null);

    let fetchedRoute: any = null;

    try {
      // 1. Attempt to fetch REAL historical data for this ID from the Kaggle dataset
      const dbRes = await axios.get(`http://localhost:8000/delivery/${trackingId}`);
      const data = dbRes.data;

      const regionName = data.region.toLowerCase();
      const coords = (REGIONS as any)[regionName] || REGIONS.north;
      const progressPercent = (hashString(trackingId.trim()) % 70) + 15;

      const origin = coords.origin as [number, number];
      const dest = coords.dest as [number, number];
      const currentPos: [number, number] = [
        origin[0] + (dest[0] - origin[0]) * (progressPercent / 100),
        origin[1] + (dest[1] - origin[1]) * (progressPercent / 100)
      ];

      fetchedRoute = {
        distance_km: data.distance_km,
        weather_condition: data.weather_condition.toLowerCase(),
        vehicle_type: data.vehicle_type.toLowerCase(),
        region: regionName,
        package_weight_kg: data.package_weight_kg,
        delivery_partner: data.delivery_partner.toLowerCase(),
        delivery_mode: data.delivery_mode.toLowerCase(),
        coords,
        currentPos,
        progress: progressPercent
      };
    } catch (err) {
      // 2. Fallback to hash simulation if ID not found in database (for demo flexibility)
      console.log("ID not in database, falling back to neural simulation...");
      const hash = hashString(trackingId.trim());
      const weathers = ['clear', 'rainy', 'foggy', 'stormy', 'snow'];
      const vehicles = ['truck', 'bike'];
      const regionsList = ['north', 'south', 'east', 'west'];

      const weather = weathers[hash % weathers.length];
      const vehicle = vehicles[hash % vehicles.length];
      const regionName = regionsList[hash % regionsList.length];

      const coords = (REGIONS as any)[regionName];
      const distanceKm = Math.floor(100 + (hash % 400));
      const progressPercent = (hash % 70) + 15;

      const origin = coords.origin as [number, number];
      const dest = coords.dest as [number, number];
      const currentPos: [number, number] = [
        origin[0] + (dest[0] - origin[0]) * (progressPercent / 100),
        origin[1] + (dest[1] - origin[1]) * (progressPercent / 100)
      ];

      fetchedRoute = {
        distance_km: distanceKm,
        weather_condition: weather,
        vehicle_type: vehicle,
        region: regionName,
        package_weight_kg: 1 + (hash % 50),
        delivery_partner: 'fedex',
        delivery_mode: 'standard',
        coords: coords,
        currentPos: currentPos,
        progress: progressPercent
      };
    }

    if (fetchedRoute) {
      setRouteInfo(fetchedRoute);
      try {
        const res = await axios.post('http://localhost:8000/predict', fetchedRoute);
        setResult(res.data);

        // Trend simulation
        let hist = [];
        let curScore = res.data.risk_score;
        for (let i = 6; i >= 1; i--) {
          let prev = Math.max(0.05, Math.min(0.95, curScore + ((Math.random() * 0.15) - 0.07)));
          hist.unshift({ time: `T-${i}h`, risk: prev * 100 });
          curScore = prev;
        }
        hist.push({ time: "Live API", risk: res.data.risk_score * 100 });
        setHistoryData(hist);
      } catch (predictErr) {
        console.error(predictErr);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-black text-neutral-100 relative overflow-x-hidden">


      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <LightRays
          raysOrigin="top-center"
          raysColor={theme === 'dark' ? "#3b82f6" : "#60a5fa"}
          raysSpeed={0.4}

          lightSpread={1.2}
          rayLength={1.8}
          noiseAmount={0.05}
          distortion={0.1}
        />
      </div>

      <Navbar />
      <div className="w-full max-w-7xl px-6 pt-32 pb-12 md:pt-40 md:pb-16 flex flex-col items-center">
        <header className="mb-10 w-full max-w-4xl animate-slide-up flex flex-col items-center text-center">
          <TextType
            as="h1"
            text="Delay Risk Prognosis"
            className="text-5xl font-black text-neutral-900 dark:text-white mb-3 tracking-tighter"
            typingSpeed={100}
            cursorClassName="text-blue-500"
            showCursor={true}
          />
          <p className="text-neutral-500 dark:text-neutral-400 text-lg max-w-2xl">
            Empowering dispatchers with hybrid ML intelligence and uncertainty-aware logistics telemetry.
          </p>

        </header>

        <form onSubmit={trackParcel} className="w-full max-w-3xl mb-12 flex gap-4">
          <input
            type="text"
            placeholder="Enter Tracking ID (e.g. TRK-8A92)..."
            className="flex-1 bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 rounded-xl py-4 px-6 text-neutral-900 dark:text-white focus:outline-none focus:border-blue-500 shadow-xl transition-all"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
          />
          <button
            type="submit" disabled={loading || !trackingId}
            className="group relative bg-blue-600 hover:bg-blue-500 px-8 rounded-xl font-bold flex items-center gap-2 text-white transition-all shadow-lg active:scale-95"
          >
            {loading ? 'Locating...' : 'Track'}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-4 rounded-xl glass-panel flex items-center justify-center hover:scale-110 transition-transform active:scale-90"
            title="Toggle Theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
            )}
          </button>
        </form>


        {routeInfo && (
          <div className="w-full max-w-7xl grid grid-cols-1 xl:grid-cols-3 gap-6 mb-12">

            {/* MAP AND TELEMETRY COLUMN */}
            <div className="flex flex-col gap-6 xl:col-span-1">
              <div className="glass-panel p-5 animate-slide-up flex flex-col gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 border-b border-slate-700 pb-3">
                  <LocateFixed className="w-5 h-5 text-indigo-400" /> Live Route Map
                </h2>

                <div className="h-[250px] w-full rounded-xl overflow-hidden border border-[var(--panel-border)] relative z-0">
                  <MapContainer center={routeInfo.currentPos} zoom={7} scrollWheelZoom={false} className="h-full w-full">
                    <TileLayer url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"} />

                    <Marker position={routeInfo.coords.origin} opacity={0.5} />
                    <Marker position={routeInfo.coords.dest} />
                    <Marker
                      position={routeInfo.currentPos}
                      icon={L.divIcon({
                        html: `<div class="bg-blue-500 p-2 rounded-full border-2 border-white shadow-lg animate-pulse"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg></div>`,
                        className: 'custom-div-icon',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                      })}
                    >
                      <Popup>Current Package Location ({routeInfo.progress}% Route Complete)</Popup>
                    </Marker>
                    <Polyline positions={[routeInfo.coords.origin, routeInfo.currentPos]} color="#3b82f6" weight={4} />
                    <Polyline positions={[routeInfo.currentPos, routeInfo.coords.dest]} color="#334155" weight={4} dashArray="5, 10" />
                  </MapContainer>
                </div>

                <div className="flex justify-between items-center px-1">
                  <span className="text-xs text-slate-500 font-bold">In-Transit</span>
                  <span className="text-xs text-blue-400 font-bold">{routeInfo.progress}% Complete</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-[-8px]">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    style={{ width: `${routeInfo.progress}%` }}
                  ></div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="bg-neutral-900/80 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-neutral-500">Weather</span>
                    <span className="font-semibold capitalize flex items-center gap-2"><CloudRain className="w-4 h-4 text-sky-400" /> {routeInfo.weather_condition}</span>
                  </div>
                  <div className="bg-neutral-900/80 p-3 rounded-lg flex flex-col">
                    <span className="text-xs text-neutral-500">Distance</span>
                    <span className="font-semibold">{routeInfo.distance_km} km</span>
                  </div>

                </div>
              </div>
            </div>

            {/* AI SCORING COLUMN */}
            <div className="xl:col-span-2 flex flex-col gap-6">

              {/* Top row: Score + Trend Graph */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Score Box */}
                <div className="glass-panel p-6 animate-slide-up flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[220px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-rose-500/5 pointer-events-none" />
                  <h3 className="text-neutral-500 dark:text-neutral-400 text-sm uppercase font-semibold mb-3 z-10">Live AI Delay Risk</h3>


                  {loading ? (
                    <div className="w-12 h-12 border-4 border-neutral-200 dark:border-neutral-800 border-t-blue-500 rounded-full animate-spin z-10" />
                  ) : result ? (

                    <div className="flex flex-col items-center z-10">
                      <div className="flex items-center gap-3">
                        <span className={`text-6xl font-black ${getRiskColor(result.risk_score)}`}>
                          {(result.risk_score * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="mt-3 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-3 py-1 rounded-full border border-[var(--panel-border)] shadow flex items-center gap-1 text-xs">
                        ±{(result.uncertainty * 100).toFixed(1)}% Monte Carlo Dropout Margin
                      </div>

                    </div>
                  ) : null}
                </div>

                {/* Trend Graph Box */}
                <div className="glass-panel p-6 animate-slide-up h-full min-h-[220px] flex flex-col">
                  <h3 className="text-slate-400 text-sm uppercase font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Real-Time Risk Trend
                  </h3>
                  {loading ? null : result && (
                    <div className="flex-1 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={historyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? "#334155" : "#e5e7eb"} vertical={false} />
                          <XAxis dataKey="time" stroke={theme === 'dark' ? "#64748b" : "#9ca3af"} fontSize={11} tickLine={false} />
                          <YAxis stroke={theme === 'dark' ? "#64748b" : "#9ca3af"} fontSize={11} tickLine={false} domain={[0, 100]} />
                          <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff', borderColor: theme === 'dark' ? '#334155' : '#e5e7eb', color: theme === 'dark' ? '#ffffff' : '#000000' }} />
                          <Line type="monotone" dataKey="risk" stroke={getHexColor(result.risk_score)} strokeWidth={3} dot={{ r: 4, fill: theme === 'dark' ? '#0f172a' : '#ffffff', strokeWidth: 2 }} />
                        </LineChart>

                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: SHAP Graph */}
              {!loading && result && (
                <div className="glass-panel p-6 animate-slide-up flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold mb-4 text-slate-200 border-b border-slate-700 pb-3">
                    Variables Influencing this Delivery right now (SHAP Engine)
                  </h3>
                  <div className="w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={result.contributions} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="feature" type="category" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 500 }} width={140} />
                        <Tooltip
                          cursor={{ fill: '#334155', opacity: 0.3 }}
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                          formatter={(val: any) => [`${(Number(val) * 100).toFixed(1)}%`, 'Impact Factor']}
                        />
                        <Bar dataKey="impact" radius={[0, 4, 4, 0]} barSize={20}>
                          {result.contributions.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.impact > 0 ? '#f43f5e' : '#10b981'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div >
  );
}
