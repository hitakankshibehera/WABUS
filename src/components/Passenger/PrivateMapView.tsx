import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Flag, 
  ShieldCheck, 
  Radio, 
  Clock, 
  Compass, 
  Share2, 
  Bell, 
  Footprints, 
  ExternalLink, 
  Copy, 
  Check, 
  Maximize2, 
  Minimize2, 
  ZoomIn, 
  ZoomOut,
  AlertCircle
} from 'lucide-react';
import { LiveTrackingResponse } from '../../types';

interface PrivateMapViewProps {
  data: LiveTrackingResponse;
  onRefresh?: () => void;
}

export const PrivateMapView: React.FC<PrivateMapViewProps> = ({ data }) => {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'TELEMETRY' | 'NOTIFICATIONS' | 'WALKING'>('TELEMETRY');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Derive coordinates or use default Bhubaneswar-Puri path
  const rawCoords = (data.route.coordinates && data.route.coordinates.length > 0)
    ? data.route.coordinates
    : [
        [20.2668, 85.8436],
        [20.2520, 85.8385],
        [20.2180, 85.8450],
        [20.2014, 85.8488],
        [20.1585, 85.8340],
        [20.1172, 85.8315],
        [20.0889, 85.8284],
        [20.0152, 85.8310],
        [19.9540, 85.8295],
        [19.8920, 85.8300],
        [19.8520, 85.8310],
        [19.8250, 85.8315],
        [19.8135, 85.8312],
      ];

  // Bounding box for mapping coordinates to SVG viewBox (width 800, height 500)
  const lats = rawCoords.map(c => c[0]);
  const lngs = rawCoords.map(c => c[1]);
  const minLat = Math.min(...lats) - 0.03;
  const maxLat = Math.max(...lats) + 0.03;
  const minLng = Math.min(...lngs) - 0.03;
  const maxLng = Math.max(...lngs) + 0.03;

  const svgWidth = 800;
  const svgHeight = 460;

  // Convert GPS [lat, lng] to SVG [x, y]
  const projectCoord = (lat: number, lng: number): [number, number] => {
    // Invert lat for SVG y-axis (north is up)
    const normX = (lng - minLng) / (maxLng - minLng || 1);
    const normY = 1 - (lat - minLat) / (maxLat - minLat || 1);
    const padding = 60;
    const x = padding + normX * (svgWidth - padding * 2);
    const y = padding + normY * (svgHeight - padding * 2);
    return [x, y];
  };

  const polylinePoints = rawCoords
    .map(c => projectCoord(c[0], c[1]).join(','))
    .join(' ');

  const currentBusLat = data.liveGps.latitude || 20.1585;
  const currentBusLng = data.liveGps.longitude || 85.8340;
  const [busX, busY] = projectCoord(currentBusLat, currentBusLng);

  const startCoord = rawCoords[0];
  const [startX, startY] = projectCoord(startCoord[0], startCoord[1]);

  const endCoord = rawCoords[rawCoords.length - 1];
  const [endX, endY] = projectCoord(endCoord[0], endCoord[1]);

  // Passenger walking location (offset near boarding point)
  const passengerX = startX + 28;
  const passengerY = startY + 22;

  const headingDegrees = data.liveGps.headingDegrees ?? 165;
  const speed = data.liveGps.speedKmph || 42;
  const distance = data.liveGps.distanceFromBoardingKm || 4.8;
  const eta = data.liveGps.etaBoardingMinutes || 18;
  const progress = data.liveGps.routeProgressPercentage || 68;

  const handleCopyShareLink = () => {
    const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://margpath.vercel.app';
    const link = `${originUrl}/?track=${data.pnrNumber}&share=${data.shareToken || 'demo'}`;
    navigator.clipboard.writeText(link).catch(() => {});
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  return (
    <div 
      ref={mapContainerRef}
      className={`relative bg-slate-950 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 ${
        isFullScreen ? 'fixed inset-0 z-50 rounded-none' : 'w-full'
      }`}
    >
      {/* 1. TOP PRIVACY GUARANTEE BANNER (Product USP) */}
      <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2.5 z-20 relative">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0 shadow-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black tracking-wide text-white uppercase">
                🔒 PRIVATE LIVE TRACKING
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                ZERO FLEET LEAKAGE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Only the bus assigned to your booking ({data.bus.displayNumber || 'MP-204'}) is visible to you.
            </p>
          </div>
        </div>

        {/* Live GPS Heartbeat & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-mono font-bold text-emerald-400">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>AIS-140 GPS LIVE</span>
          </div>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
            title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 2. MAIN MAP CANVAS (High-Tech Vector Viewport) */}
      <div className="relative w-full h-[360px] sm:h-[440px] md:h-[480px] bg-slate-950 overflow-hidden select-none">
        
        {/* Subtle Map Grid Background */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        {/* Highway Corridor Ambient Glow */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(216, 78, 85, 0.25) 0%, rgba(15, 23, 42, 0) 70%)'
          }}
        />

        {/* Zoom & Pan Controls */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5 bg-slate-900/80 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 2.0))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.75))}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setZoomLevel(1); setPanOffset({ x: 0, y: 0 }); }}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer text-[10px] font-mono font-bold"
            title="Reset View"
          >
            1x
          </button>
        </div>

        {/* SVG Interactive Visualizer */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full object-cover transition-transform duration-500 ease-out"
          style={{
            transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            transformOrigin: `${busX}px ${busY}px`
          }}
        >
          <defs>
            {/* Road path gradient */}
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#D84E55" stopOpacity="1" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dotted Walking Path from Passenger to Boarding Point */}
          <line
            x1={passengerX}
            y1={passengerY}
            x2={startX}
            y2={startY}
            stroke="#10b981"
            strokeWidth="2.5"
            strokeDasharray="4 4"
            className="animate-pulse"
          />

          {/* Highway Polyline Outline */}
          <polyline
            fill="none"
            stroke="#1e293b"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />

          {/* Active Colored Route Polyline */}
          <polyline
            fill="none"
            stroke="url(#routeGradient)"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
            filter="url(#glow)"
          />

          {/* Intermediate Checkpoints */}
          {rawCoords.slice(1, -1).map((coord, idx) => {
            if (idx % 3 !== 0) return null;
            const [cx, cy] = projectCoord(coord[0], coord[1]);
            return (
              <circle
                key={`waypoint-${idx}`}
                cx={cx}
                cy={cy}
                r="3.5"
                fill="#0f172a"
                stroke="#64748b"
                strokeWidth="2"
              />
            );
          })}

          {/* 1. START / BOARDING POINT MARKER 📍 */}
          <g transform={`translate(${startX}, ${startY})`}>
            {/* Pulsing ring */}
            <circle r="16" fill="#38bdf8" opacity="0.2" className="animate-ping" />
            <circle r="8" fill="#0284c7" stroke="#ffffff" strokeWidth="2.5" />
            <circle r="3" fill="#ffffff" />
            <text x="12" y="-10" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              📍 {data.boardingPoint?.name || data.route.originCity} (Boarding)
            </text>
            <text x="12" y="4" fill="#38bdf8" fontSize="9.5" fontFamily="sans-serif">
              {data.boardingPoint?.time || 'Departure Point'}
            </text>
          </g>

          {/* 2. PASSENGER LOCATION MARKER (Walking) 🚶 */}
          <g transform={`translate(${passengerX}, ${passengerY})`}>
            <circle r="6" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            <text x="10" y="4" fill="#34d399" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              🚶 You (120m away)
            </text>
          </g>

          {/* 3. DESTINATION MARKER 🏁 */}
          <g transform={`translate(${endX}, ${endY})`}>
            <circle r="8" fill="#D84E55" stroke="#ffffff" strokeWidth="2.5" />
            <text x="12" y="-6" fill="#e2e8f0" fontSize="11" fontWeight="bold" fontFamily="sans-serif">
              🏁 {data.droppingPoint?.name || data.route.destinationCity} (Destination)
            </text>
            <text x="12" y="7" fill="#f87171" fontSize="9.5" fontFamily="sans-serif">
              {data.droppingPoint?.time || 'End of Journey'}
            </text>
          </g>

          {/* 4. ASSIGNED BUS MARKER WITH RADAR & HEADING ARROW 🚌 ─────────→ */}
          <g transform={`translate(${busX}, ${busY})`}>
            {/* Outer radar pulse rings */}
            <circle r="32" fill="#D84E55" opacity="0.15" className="animate-ping" />
            <circle r="20" fill="#D84E55" opacity="0.25" />
            
            {/* Bus Base Disc */}
            <circle r="14" fill="#D84E55" stroke="#ffffff" strokeWidth="3" filter="url(#glow)" />

            {/* Rotatable Bus Direction Indicator (Requirement 7) */}
            <g transform={`rotate(${headingDegrees})`}>
              {/* Direction Pointer / Arrow */}
              <polygon points="0,-22 -5,-13 5,-13" fill="#fbbf24" stroke="#ffffff" strokeWidth="1" />
              {/* Sleek Bus Outline */}
              <rect x="-6" y="-8" width="12" height="16" rx="3" fill="#ffffff" />
              <rect x="-4.5" y="-6.5" width="9" height="4" rx="1" fill="#0f172a" />
              <rect x="-4.5" y="1" width="9" height="4" rx="1" fill="#0f172a" />
              {/* Front headlights beam */}
              <polygon points="-4,-8 0,-16 4,-8" fill="#fef08a" opacity="0.6" />
            </g>

            {/* Vehicle Floating Label Tag */}
            <g transform="translate(18, -12)">
              <rect x="0" y="0" width="118" height="28" rx="6" fill="#0f172a" stroke="#D84E55" strokeWidth="1.5" />
              <text x="8" y="13" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace">
                🚌 {data.bus.displayNumber || 'MP-204'}
              </text>
              <text x="8" y="23" fill="#fbbf24" fontSize="8.5" fontWeight="bold" fontFamily="sans-serif">
                {speed} km/h • Bearing {headingDegrees}°
              </text>
            </g>
          </g>
        </svg>

        {/* FLOATING TELEMETRY HUD (Requirement 8) */}
        <div className="absolute top-4 left-4 z-20 max-w-xs w-[calc(100%-2rem)] sm:w-auto">
          <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-3.5 shadow-xl space-y-2">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                YOUR ASSIGNED BUS
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#D84E55] text-white font-mono font-black text-xs">
                {data.bus.displayNumber || 'MP-204'}
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div>
                <div className="text-xl sm:text-2xl font-black text-white font-mono tracking-tight">
                  {distance} km
                </div>
                <div className="text-[10px] text-slate-400">away from boarding point</div>
              </div>
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono tracking-tight">
                  ~{eta} min
                </div>
                <div className="text-[10px] text-slate-400">Estimated Arrival</div>
              </div>
            </div>

            {/* Progress Bar & Status */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                <span className="text-amber-400 font-bold">● Approaching your boarding point</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#D84E55] rounded-full transition-all duration-700" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* FLOATING QUICK ACTIONS (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleCopyShareLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-xs font-bold text-white shadow-lg transition cursor-pointer active:scale-95"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-rose-400" />}
            <span>{isCopied ? 'Link Copied!' : 'Share My Journey'}</span>
          </button>
        </div>
      </div>

      {/* 3. LOWER TABBED CONTROL DECK (Telemetry, Notifications, Walking) */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 sm:p-5 space-y-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('TELEMETRY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'TELEMETRY'
                ? 'bg-[#D84E55] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Telemetry &amp; Bus Details</span>
          </button>

          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer relative ${
              activeTab === 'NOTIFICATIONS'
                ? 'bg-[#D84E55] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Smart Arrival Alerts</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          </button>

          <button
            onClick={() => setActiveTab('WALKING')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
              activeTab === 'WALKING'
                ? 'bg-[#D84E55] text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Footprints className="w-3.5 h-3.5" />
            <span>Boarding Point Navigation</span>
          </button>
        </div>

        {/* Tab 1: Telemetry Details */}
        {activeTab === 'TELEMETRY' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Current Location</span>
              <span className="text-xs font-bold text-white truncate block mt-0.5">
                {data.liveGps.currentLocationName || 'Near Pipili Toll (NH-316)'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Speed &amp; Heading</span>
              <span className="text-xs font-mono font-bold text-amber-400 block mt-0.5">
                {speed} km/h • {headingDegrees}° SSE ➔
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Next Scheduled Stop</span>
              <span className="text-xs font-bold text-blue-400 truncate block mt-0.5">
                {data.liveGps.nextStopName || 'Puri Grand Road'}
              </span>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-2xl">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Assigned Driver</span>
              <span className="text-xs font-bold text-slate-300 truncate block mt-0.5">
                {data.bus.driverName} ({data.bus.conductorName})
              </span>
            </div>
          </div>
        )}

        {/* Tab 2: 6-Stage Smart Notifications (Requirement 9) */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold">Automated Distance &amp; Arrival Ticker</span>
              <span>Trip: {data.tripCode || 'TRIP-20491'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(data.notifications || [
                { id: 'n1', title: '30 min alert', message: 'Your MargPath bus is approaching your boarding area.', time: '30 mins ago' },
                { id: 'n2', title: '15 min alert', message: 'Your bus is 4.8 km away (Approaching Pipili Square Toll).', time: '15 mins ago' },
                { id: 'n3', title: '5 min alert', message: 'Your bus will arrive in approximately 5 minutes.', time: '5 mins ago' },
                { id: 'n4', title: '500 metres', message: 'Your bus is almost here. Please be ready at Master Canteen.', time: 'Just now' }
              ]).map((notif, idx) => (
                <div 
                  key={notif.id || idx}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2.5"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-[#D84E55] flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3 h-3" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-white uppercase text-[11px]">{notif.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{notif.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{notif.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Boarding Point Navigation (Requirement 15) */}
        {activeTab === 'WALKING' && (
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0">
                <Footprints className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-sm text-white">How to reach your boarding point</h4>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px]">
                    120m away • ~2 min walk
                  </span>
                </div>
                <p className="text-slate-300 text-xs">
                  {data.walkingDirections?.instruction || 'Your boarding point at Master Canteen Platform 1 Exit is 120m away. Walk approximately 2 minutes from Station Concourse to Bay A.'}
                </p>
                <div className="text-[11px] text-slate-400">
                  Boarding Point: <strong>{data.boardingPoint?.name || 'Bhubaneswar Railway Station'}</strong> ({data.boardingPoint?.landmark || 'Master Canteen'})
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                const query = encodeURIComponent(`${data.boardingPoint?.name || 'Bhubaneswar Railway Station'}, Bhubaneswar`);
                window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
              }}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
            >
              <span>Open Walking Map</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
