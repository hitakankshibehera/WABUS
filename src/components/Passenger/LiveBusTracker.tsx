import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  Radio, 
  Bus as BusIcon, 
  Lock,
  Compass,
  AlertCircle,
  Search,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Share2,
  Navigation
} from 'lucide-react';
import { api } from '../../services/api';
import { LiveTrackingResponse, BusGPSStatus, TripStageStatus } from '../../types';
import { PrivateMapView } from './PrivateMapView';
import { useAuth } from '../../context/AuthContext';

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

const TRIP_STAGES: { key: TripStageStatus; label: string }[] = [
  { key: 'BOOKED', label: 'Booked' },
  { key: 'BUS_ASSIGNED', label: 'Bus Assigned' },
  { key: 'DRIVER_ASSIGNED', label: 'Driver Assigned' },
  { key: 'BUS_APPROACHING', label: 'Bus Approaching' },
  { key: 'ARRIVING', label: 'Arriving' },
  { key: 'BOARDING', label: 'Boarding' },
  { key: 'JOURNEY_STARTED', label: 'Journey Started' },
  { key: 'IN_TRANSIT', label: 'In Transit' },
  { key: 'DESTINATION_APPROACHING', label: 'Near Dest' },
  { key: 'ARRIVED', label: 'Arrived' },
  { key: 'TRIP_COMPLETED', label: 'Completed' },
];

export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ bookingId: initialBookingId, trip, onClose }) => {
  const { currentUser, switchDemoRole } = useAuth();
  const [activeBookingId, setActiveBookingId] = useState<string>(initialBookingId || 'MP100284');
  const [inputBookingId, setInputBookingId] = useState<string>(initialBookingId || 'MP100284');
  const [trackingData, setTrackingData] = useState<LiveTrackingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const fetchTracking = useCallback(async (idToFetch: string) => {
    if (!idToFetch.trim()) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);
      // Calls authorized backend endpoint: GET /api/my-booking/:id/live-location
      const data = await api.getBookingLiveLocation(idToFetch.trim());
      setTrackingData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Unable to fetch live tracking telemetry for this booking.');
      setTrackingData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracking(activeBookingId);

    // Poll live GPS telemetry every 3s
    const interval = setInterval(() => {
      if (activeBookingId) {
        api.getBookingLiveLocation(activeBookingId)
          .then(data => setTrackingData(data))
          .catch(() => {});
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeBookingId, fetchTracking]);

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputBookingId.trim()) {
      setActiveBookingId(inputBookingId.trim());
      fetchTracking(inputBookingId.trim());
    }
  };

  const handleUseDemoBooking = (demoPnr: string) => {
    setInputBookingId(demoPnr);
    setActiveBookingId(demoPnr);
    fetchTracking(demoPnr);
  };

  const busDisplay = trackingData?.bus.displayNumber || (trip ? `WA-${trip.busRegistrationNumber.replace(/[^0-9]/g, '').slice(-2) || '07'}` : 'MP-204');
  const busReg = trackingData?.bus.registrationNumber || trip?.busRegistrationNumber || 'OD-02-MP-0204';
  const seatsDisplay = trackingData?.seatNumbers ? trackingData.seatNumbers.join(', ') : 'A12';
  const origin = trackingData?.route.originCity || trip?.originCity || 'Bhubaneswar';
  const destination = trackingData?.route.destinationCity || trip?.destinationCity || 'Puri';
  const gpsStatus: BusGPSStatus = trackingData?.liveGps.gpsStatus || 'LIVE';
  const currentStage: TripStageStatus = trackingData?.tripStageStatus || 'IN_TRANSIT';

  // Determine active stage index for progression
  const currentStageIndex = TRIP_STAGES.findIndex(s => s.key === currentStage);
  const activeStageIdx = currentStageIndex >= 0 ? currentStageIndex : 7; // default to IN_TRANSIT

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D84E55] to-orange-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
              <BusIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold tracking-tight flex items-center gap-1.5">
                  <span>Track My Bus</span>
                  <span className="text-red-400 font-mono text-xs">#{activeBookingId}</span>
                </h3>

                {/* Privacy Badge */}
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> 🔒 PRIVATE TRIP MODE
                </span>
                
                {/* Live GPS Badge */}
                {gpsStatus === 'LIVE' ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-300 font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                    <Radio className="w-3 h-3 animate-pulse text-emerald-400" /> LIVE GPS ACTIVE
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300 font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30">
                    <Clock className="w-3 h-3 text-amber-400" /> UPDATING
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-medium">
                MargPath Zero-Exposure Telemetry &bull; Only your assigned bus is visible
              </p>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="Close tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-slate-300 px-4 py-2 border-b border-slate-700/60 text-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-amber-400">🔒</span>
            <span className="text-slate-200 font-bold">Privacy Guarantee:</span>
            <span className="text-slate-300 text-[11px]">
              Only the bus assigned to your booking is visible to you. Fleet-wide locations and other customers are cryptographically hidden.
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <span>AIS-140 Certified</span>
            <span>&bull;</span>
            <span className="font-mono text-emerald-400">Pinging every 3s</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">

          {/* Quick PNR Switcher / Lookup Bar */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <form onSubmit={handleLookupSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inputBookingId}
                  onChange={e => setInputBookingId(e.target.value)}
                  placeholder="Enter PNR or Booking ID (e.g. MP100284)..."
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 focus:border-[#D84E55] rounded-xl text-xs font-mono font-bold text-slate-800 placeholder-slate-400 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-[#D84E55] hover:bg-[#C33E44] text-white text-xs font-bold rounded-xl transition cursor-pointer shrink-0 shadow-xs"
              >
                Track
              </button>
            </form>

            <div className="flex items-center gap-1.5 text-xs flex-wrap">
              <span className="text-slate-500 text-[11px] font-bold">1-Click Tests:</span>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('PASSENGER');
                  handleUseDemoBooking('MP100284');
                }}
                className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 font-mono font-bold text-[11px] rounded-lg border border-emerald-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="TEST 1: Customer A tracks Bus MP-204"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Test 1: Customer A (Bus MP-204)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('PASSENGER');
                  handleUseDemoBooking('BR899401');
                }}
                className="px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 font-mono font-bold text-[11px] rounded-lg border border-red-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="TEST 2: Customer A attempts unauthorized access to Bus B (BR899401) → Access Denied!"
              >
                <Lock className="w-3 h-3 text-red-600" />
                <span>Test 2: Access Bus B (Denied)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  switchDemoRole('PASSENGER_B' as any);
                  handleUseDemoBooking('BR899401');
                }}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 font-mono font-bold text-[11px] rounded-lg border border-blue-300 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                title="TEST 3: Customer B tracks Bus MP-108"
              >
                <CheckCircle2 className="w-3 h-3 text-blue-600" />
                <span>Test 3: Customer B (Bus MP-108)</span>
              </button>
            </div>
          </div>

          {/* Access Denied / Error State (Privacy USP Enforcement) */}
          {errorMsg && (
            <div className="p-6 bg-red-50 border-2 border-red-300 rounded-3xl text-center space-y-4 animate-in fade-in shadow-sm">
              <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 border border-red-200 flex items-center justify-center mx-auto shadow-xs">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-black font-mono tracking-wider uppercase border border-red-300">
                  <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
                  <span>Zero Fleet Leakage Enforced</span>
                </div>
                <h4 className="text-base sm:text-lg font-black text-red-950">
                  {errorMsg.includes('Expired') || errorMsg.includes('completed')
                    ? 'Tracking Channel Closed (Trip Completed)'
                    : 'Access Denied: Private Trip Isolation (Rule 19)'}
                </h4>
                <p className="text-xs text-red-800 font-medium leading-relaxed">
                  {errorMsg}
                </p>
                <p className="text-[11px] text-red-700/80 font-mono pt-1">
                  Active Persona: <strong className="text-red-900">{currentUser?.name || 'Customer A (Rahul Sharma)'}</strong> &bull; Booking Target: <strong className="text-red-900">{activeBookingId}</strong>
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const myBooking = (currentUser?.id === 'usr-pass-102') ? 'BR899401' : 'MP100284';
                    handleUseDemoBooking(myBooking);
                  }}
                  className="px-5 py-2.5 bg-[#D84E55] hover:bg-[#C33E44] text-white text-xs font-black rounded-xl shadow-md transition cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Track My Authorized Bus ({currentUser?.id === 'usr-pass-102' ? 'BR899401 (MP-108)' : 'MP100284 (MP-204)'})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                {currentUser?.id === 'usr-pass-101' && (
                  <button
                    type="button"
                    onClick={() => {
                      switchDemoRole('PASSENGER_B' as any);
                      handleUseDemoBooking('BR899401');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <span>Switch to Customer B Persona</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !errorMsg && (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#D84E55] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-600">Verifying booking authentication &amp; locking telemetry to your assigned bus...</p>
            </div>
          )}

          {/* Successful Tracking Telemetry View */}
          {trackingData && !errorMsg && (
            <div className="space-y-4">
              
              {/* Trip Progression Stage Bar */}
              <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">Trip Journey Progression</span>
                  <span className="text-amber-400 font-mono flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    Status: {currentStage.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Progress Pipeline */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex items-center min-w-[650px] gap-1">
                    {TRIP_STAGES.map((st, idx) => {
                      const isPast = idx < activeStageIdx;
                      const isCurrent = idx === activeStageIdx;
                      return (
                        <div key={st.key} className="flex-1 flex flex-col items-center gap-1 text-center">
                          <div className={`w-full h-1.5 rounded-full transition-colors ${
                            isPast ? 'bg-emerald-500' : isCurrent ? 'bg-amber-400 animate-pulse' : 'bg-slate-800'
                          }`} />
                          <span className={`text-[10px] font-bold truncate max-w-[70px] ${
                            isCurrent ? 'text-amber-300 font-extrabold' : isPast ? 'text-emerald-400' : 'text-slate-500'
                          }`}>
                            {st.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Vector Interactive Live Map with Real Route & Moving Directional Bus */}
              <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                <PrivateMapView 
                  data={trackingData} 
                  onRefresh={() => fetchTracking(activeBookingId)} 
                />
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
