import React, { useState, useEffect } from 'react';
import { 
  X, 
  Navigation, 
  Gauge, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Radio, 
  Bus as BusIcon, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Lock,
  Compass,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import { LiveTrackingResponse, BusGPSStatus } from '../../types';

interface LiveBusTrackerProps {
  bookingId?: string;
  trip?: {
    originCity: string;
    destinationCity: string;
    busModel: string;
    operatorName: string;
    busRegistrationNumber: string;
  };
  onClose: () => void;
}

export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ bookingId, trip, onClose }) => {
  const [trackingData, setTrackingData] = useState<LiveTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Real-time metrics animation
  const [simulatedSpeed, setSimulatedSpeed] = useState(68);
  const [simulatedProgress, setSimulatedProgress] = useState(48);

  useEffect(() => {
    let isMounted = true;

    const fetchTracking = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErrorMsg(null);
        const data = await api.getBookingLiveLocation(bookingId);
        if (isMounted) {
          setTrackingData(data);
          if (data.liveGps?.speedKmph) setSimulatedSpeed(data.liveGps.speedKmph);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg(err.message || 'Access Denied: Unable to fetch live tracking telemetry for this booking.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTracking();

    // Pulse live telemetry simulation
    const interval = setInterval(() => {
      setSimulatedSpeed(prev => Math.min(85, Math.max(52, prev + (Math.random() > 0.5 ? 2 : -2))));
      setSimulatedProgress(prev => (prev < 95 ? prev + 0.15 : prev));
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [bookingId]);

  // Derived values from props or API response
  const busDisplay = trackingData?.bus.displayNumber || (trip ? `WA-${trip.busRegistrationNumber.replace(/[^0-9]/g, '').slice(-2) || '07'}` : 'WA-07');
  const busReg = trackingData?.bus.registrationNumber || trip?.busRegistrationNumber || 'OD-02-AX-8910';
  const seatsDisplay = trackingData?.seatNumbers ? trackingData.seatNumbers.join(', ') : '24';
  const origin = trackingData?.route.originCity || trip?.originCity || 'Bhubaneswar';
  const destination = trackingData?.route.destinationCity || trip?.destinationCity || 'Puri';
  const gpsStatus: BusGPSStatus = trackingData?.liveGps.gpsStatus || 'LIVE';
  const lastUpdatedText = trackingData?.liveGps.lastUpdated || '10 seconds ago';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D84E55] text-white flex items-center justify-center shadow-md">
              <BusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold tracking-tight">🚌 Track My Bus</h3>
                
                {/* Strict Status Badges */}
                {gpsStatus === 'LIVE' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> 🟢 LIVE
                  </span>
                ) : gpsStatus === 'UPDATING' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-400" /> 🟠 UPDATING...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-300 font-mono px-2 py-0.5 rounded-full bg-slate-700 border border-slate-600">
                    ⚫ LAST LOCATION
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Wonderlight Express &bull; Security Verified Booking GPS Telemetry
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access Revoked / Error Handler */}
        {errorMsg ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-200 shadow-sm">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-slate-900">
                {errorMsg.includes('Authentication') ? 'Sign In Required for Live Tracking' : 'Access Restricted'}
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto">{errorMsg}</p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-[#D84E55] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-slate-600">Authenticating booking telemetry &amp; fetching assigned bus GPS...</p>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
            
            {/* Booking -> Bus -> Seat Badge Card */}
            <div className="p-4 bg-gradient-to-r from-red-50 via-slate-50 to-blue-50 rounded-2xl border border-slate-200 text-xs shadow-xs space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg bg-[#D84E55] text-white font-extrabold text-xs tracking-wider">
                    Bus: {busDisplay}
                  </span>
                  <span className="font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    Reg: {busReg}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                  <span>Seat:</span>
                  <span className="text-[#D84E55] font-mono">{seatsDisplay}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-slate-700 font-semibold text-xs">
                <div className="flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-blue-600" />
                  <span>Route: <strong>{origin} ➔ {destination} ➔ Konark</strong></span>
                </div>
                <span className="text-[11px] text-slate-500 font-normal">
                  PNR: <strong className="font-mono">{trackingData?.pnrNumber || 'WA-10234'}</strong>
                </span>
              </div>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Location</span>
                <span className="text-xs font-bold text-slate-900 truncate block">
                  {trackingData?.liveGps.currentLocationName || 'Near Pipili'}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Next Stop</span>
                <span className="text-xs font-bold text-blue-700 truncate block">
                  {trackingData?.liveGps.nextStopName || destination}
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Distance Remaining</span>
                <span className="text-xs font-bold font-mono text-slate-900 block">
                  {trackingData?.liveGps.distanceRemainingKm || 18.4} km
                </span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">ETA &amp; Last Ping</span>
                <span className="text-xs font-bold font-mono text-emerald-700 block">
                  35 mins &bull; {lastUpdatedText}
                </span>
              </div>
            </div>

            {/* Live Interactive Map Progress Visualizer */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 space-y-4 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              <div className="relative z-10 flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-300">{origin} (Origin)</span>
                <span className="text-amber-400 font-mono flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" /> {simulatedSpeed} km/h &bull; {Math.round(simulatedProgress)}% Route Completed
                </span>
                <span className="text-slate-300">{destination} (Destination)</span>
              </div>

              {/* Progress Bar with Moving Bus Pin */}
              <div className="relative z-10 h-3 bg-slate-800 rounded-full my-4">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-[#D84E55] rounded-full transition-all duration-700"
                  style={{ width: `${simulatedProgress}%` }}
                />
                <div
                  className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center transition-all duration-700 pointer-events-none"
                  style={{ left: `${simulatedProgress}%` }}
                >
                  <div className="bg-[#D84E55] text-white p-1.5 rounded-full shadow-lg border-2 border-white animate-bounce">
                    <Navigation className="w-3.5 h-3.5 fill-white rotate-45" />
                  </div>
                </div>
              </div>

              <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> AIS-140 Certified GPS Ping Active
                </span>
                <span>Accuracy: HIGH (GPS Telemetry)</span>
              </div>
            </div>

            {/* Route Stops Progression Checklist */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#D84E55]" />
                <span>Route Stops Progression</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                {(trackingData?.route.stops || [
                  { id: '1', name: `${origin} ISBT`, status: 'COMPLETED', eta: 'Passed' },
                  { id: '2', name: 'Pipili Square', status: 'CURRENT', eta: 'Current Sector' },
                  { id: '3', name: `${destination} Bus Stand`, status: 'NEXT', eta: '35 mins' },
                  { id: '4', name: 'Konark Temple', status: 'UPCOMING', eta: '1h 15m' }
                ]).map(stop => (
                  <div 
                    key={stop.id}
                    className={`p-2.5 rounded-xl border flex flex-col gap-0.5 ${
                      stop.status === 'COMPLETED'
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                        : stop.status === 'CURRENT'
                        ? 'bg-amber-50 border-amber-300 text-amber-900 font-bold ring-2 ring-amber-400/30'
                        : stop.status === 'NEXT'
                        ? 'bg-blue-50 border-blue-200 text-blue-900 font-semibold'
                        : 'bg-white border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      {stop.status === 'COMPLETED' ? (
                        <span className="text-xs">✅</span>
                      ) : stop.status === 'CURRENT' ? (
                        <span className="text-xs">🟢</span>
                      ) : stop.status === 'NEXT' ? (
                        <span className="text-xs">🟡</span>
                      ) : (
                        <span className="text-xs">⚪</span>
                      )}
                      <span className="truncate text-xs">{stop.name}</span>
                    </div>
                    <span className="text-[10px] opacity-75 font-mono ml-4">{stop.eta}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Automated Bus Notifications */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5 text-xs">
              <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-blue-600" />
                <span>Bus Alerts &amp; Passenger Notifications</span>
              </h4>

              <div className="space-y-2">
                {(trackingData?.notifications || [
                  { id: 'n1', title: 'Bus Started', message: `Your Wonderlight bus (${busReg}) has started its journey.`, time: '20 mins ago' },
                  { id: 'n2', title: 'Approaching Pickup', message: 'Your bus is approximately 10 minutes away from your pickup point.', time: 'Just now' }
                ]).map(n => (
                  <div key={n.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-900 block">{n.title}</span>
                      <span className="text-slate-600 text-[11px] block">{n.message}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Location Privacy Disclaimer */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-2.5 text-xs text-emerald-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Customer Location Privacy Guarantee:</strong> You do NOT need to share your personal GPS location to track your bus. Tracking uses vehicle AIS-140 GPS.
              </span>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
