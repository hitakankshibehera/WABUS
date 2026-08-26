import React, { useState, useEffect } from 'react';
import { X, Navigation, Gauge, MapPin, Phone, ShieldCheck, Clock, Radio } from 'lucide-react';

interface LiveBusTrackerProps {
  trip: {
    originCity: string;
    destinationCity: string;
    busModel: string;
    operatorName: string;
    busRegistrationNumber: string;
  };
  onClose: () => void;
}

export const LiveBusTracker: React.FC<LiveBusTrackerProps> = ({ trip, onClose }) => {
  const [speed, setSpeed] = useState(72);
  const [progress, setProgress] = useState(45); // percentage along route

  // Simulate real-time GPS telemetry pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeed(prev => Math.min(88, Math.max(55, prev + (Math.random() > 0.5 ? 2 : -2))));
      setProgress(prev => (prev < 95 ? prev + 0.2 : prev));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-gray-900">Live AIS-140 GPS Telemetry</h3>
                <span className="flex items-center gap-1 text-[10px] text-emerald-800 font-mono px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200">
                  <Radio className="w-2.5 h-2.5 animate-pulse text-emerald-600" /> LIVE
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                {trip.operatorName} &bull; {trip.busRegistrationNumber}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Metrics Bar */}
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl flex items-center gap-3">
              <Gauge className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">Current Speed</span>
                <span className="text-lg font-black font-mono text-gray-900">{speed} km/h</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl flex items-center gap-3">
              <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">Current Sector</span>
                <span className="text-xs font-bold text-gray-900 truncate max-w-[120px] block">NH-16 Express</span>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 p-3 rounded-2xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <span className="text-[10px] text-gray-500 font-bold block">Next Stop ETA</span>
                <span className="text-xs font-bold text-blue-700">18 Mins</span>
              </div>
            </div>
          </div>

          {/* Interactive Route Waypoint Visualizer */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold text-gray-800">
              <span>{trip.originCity} (Origin)</span>
              <span className="text-[#D84E55] font-mono">{Math.round(progress)}% Journey Completed</span>
              <span>{trip.destinationCity} (Destination)</span>
            </div>

            {/* Simulated Route Progress Bar with moving Bus Pin */}
            <div className="relative h-3 bg-gray-200 rounded-full overflow-visible my-4">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-[#D84E55] rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute -top-3.5 -translate-x-1/2 flex flex-col items-center transition-all duration-700 pointer-events-none"
                style={{ left: `${progress}%` }}
              >
                <div className="bg-[#D84E55] text-white p-1.5 rounded-full shadow-md border-2 border-white">
                  <Navigation className="w-3.5 h-3.5 fill-white rotate-45" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
              <span>Departed: On Schedule</span>
              <span className="text-emerald-700 font-semibold">GPS Ping: Active (AIS-140 Certified)</span>
              <span>Expected Arrival: On Time</span>
            </div>
          </div>

          {/* Crew Contacts & Emergency SOS */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-gray-900">Conductor Support</span>
                <span className="text-gray-500 ml-2 font-mono">+91 94371 89201</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-600 text-[11px]">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>SOS & 24x7 Control Room Enabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
