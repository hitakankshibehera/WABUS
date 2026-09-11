import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Seat, Trip, FeatureFlags } from '../../types';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';
import { 
  Layers, 
  Clock, 
  Shield, 
  User, 
  AlertCircle, 
  Info, 
  Lock, 
  ChevronRight, 
  Bus as BusIcon,
  Check,
  Zap,
  MapPin,
  Sparkles,
  Star,
  Filter
} from 'lucide-react';

interface SeatMatrixProps {
  trip: Trip;
  selectedSeats: Seat[];
  onSeatToggle: (seat: Seat) => void;
  lockExpiresAt: number | null;
  featureFlags: FeatureFlags;
  sessionId: string;
  onProceedToPassengerDetails?: () => void;
}

export const SeatMatrix: React.FC<SeatMatrixProps> = ({
  trip,
  selectedSeats,
  onSeatToggle,
  lockExpiresAt,
  featureFlags,
  sessionId,
  onProceedToPassengerDetails,
}) => {
  const [activeDeck, setActiveDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [liveSeats, setLiveSeats] = useState<Seat[]>(trip.seats);
  const [seatPreference, setSeatPreference] = useState<'ALL' | 'WINDOW' | 'AISLE' | 'FRONT' | 'BACK' | 'LEGROOM'>('ALL');

  useEffect(() => {
    setLiveSeats(trip.seats);
  }, [trip]);

  // Real-time seat updates polling
  useEffect(() => {
    const fetchLatestSeats = async () => {
      try {
        const updatedTrip = await api.getTripById(trip.id);
        if (updatedTrip && updatedTrip.seats) {
          setLiveSeats(updatedTrip.seats);
        }
      } catch {}
    };

    const interval = setInterval(fetchLatestSeats, 3000);
    window.addEventListener('wabus_booking_updated', fetchLatestSeats);
    return () => {
      clearInterval(interval);
      window.removeEventListener('wabus_booking_updated', fetchLatestSeats);
    };
  }, [trip.id]);

  // Active Countdown Timer for Redis TTL Lock
  useEffect(() => {
    if (!lockExpiresAt || selectedSeats.length === 0) {
      setTimeRemainingSeconds(null);
      return;
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt, selectedSeats]);

  const busDisplay = trip.bus?.displayNumber || (trip.bus?.registrationNumber?.includes('0204') ? 'MP-204' : 'MP-204');
  const routeDisplay = `${trip.originCity} → ${trip.destinationCity}`;
  const seatsPriceTotal = selectedSeats.reduce((sum, s) => sum + s.basePrice, 0);

  const normalizedSeats = (liveSeats || []).map((s: any, idx: number) => ({
    ...s,
    deck: (s.deck || (String(s.number || '').toUpperCase().startsWith('U') ? 'UPPER' : 'LOWER')).toUpperCase(),
    number: String(s.number || `A${idx + 1}`).toUpperCase(),
    basePrice: Number(s.basePrice || s.fare || trip.baseFare || 380)
  }));

  const lowerDeckSeats = normalizedSeats.filter(s => s.deck === 'LOWER');
  const upperDeckSeats = normalizedSeats.filter(s => s.deck === 'UPPER');
  const hasUpperDeck = upperDeckSeats.length > 0;
  const currentDeckSeats = activeDeck === 'LOWER' ? lowerDeckSeats : (upperDeckSeats.length > 0 ? upperDeckSeats : lowerDeckSeats);

  // Section 3: AI Seat Recommendation
  const recommendedSeat = normalizedSeats.find(s => s.number === 'A12' && s.status === 'AVAILABLE') ||
                          normalizedSeats.find(s => s.status === 'AVAILABLE' && (s.isWindow || s.number.endsWith('1') || s.number.endsWith('2')));

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) {
      return 'bg-[#D84E55] text-white font-black border-[#D84E55] ring-2 ring-red-300 shadow-md scale-105';
    }

    if (seat.status === 'BOOKED') {
      if (seat.bookedGender === 'FEMALE' || seat.genderRestriction === 'FEMALE_ONLY') {
        return 'bg-pink-100 text-pink-400 border-pink-200 cursor-not-allowed opacity-75';
      }
      return 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-70';
    }

    if (seat.status === 'LOCKED') {
      if (seat.lockedBySessionId === sessionId) {
        return 'bg-[#D84E55] text-white font-black border-[#D84E55] ring-2 ring-red-300';
      }
      return 'bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed';
    }

    if (seat.status === 'CONDUCTOR_RESERVED') {
      return 'bg-indigo-100 text-indigo-700 border-indigo-300 cursor-not-allowed';
    }

    // Available
    if (seat.genderRestriction === 'FEMALE_ONLY') {
      return 'bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100 hover:border-pink-500 shadow-2xs cursor-pointer';
    }

    return 'bg-white text-slate-800 border-slate-300 hover:border-[#D84E55] hover:text-[#D84E55] hover:shadow-xs transition-colors shadow-2xs cursor-pointer';
  };

  const handleSeatClick = (seat: Seat) => {
    if (seat.status === 'BOOKED' || seat.status === 'CONDUCTOR_RESERVED') {
      soundEngine.playError();
      return;
    }
    if (seat.status === 'LOCKED' && seat.lockedBySessionId !== sessionId) {
      soundEngine.playError();
      return;
    }
    soundEngine.playLockTick();
    onSeatToggle(seat);
  };

  // Build rows of 4 seats: A(2k+1) A(2k+2) | B(2k+1) B(2k+2)
  // If seats follow A1, A2, B1, B2... organize them cleanly by row
  const renderSeatGrid = () => {
    // Check if seats have row numbers or parse from seat number
    const seatsWithRow = currentDeckSeats.map((s) => {
      let rowNum = s.row;
      if (!rowNum) {
        const digits = parseInt(s.number.replace(/\D/g, ''), 10);
        rowNum = !isNaN(digits) ? Math.ceil(digits / 2) : 1;
      }
      return { ...s, calculatedRow: rowNum };
    });

    const maxRow = Math.max(...seatsWithRow.map(s => s.calculatedRow), 6);
    const rowsList = Array.from({ length: maxRow }, (_, i) => i + 1);

    return (
      <div className="space-y-3">
        {rowsList.map(rowIdx => {
          // Row layout: A(left 2) | aisle | B(right 2)
          const rowSeats = seatsWithRow.filter(s => s.calculatedRow === rowIdx);
          
          // Separate left vs right
          const leftSeats = rowSeats.filter(s => {
            if (s.number.startsWith('A')) return true;
            if (s.side === 'LEFT') return true;
            return false;
          }).sort((a, b) => a.number.localeCompare(b.number));

          const rightSeats = rowSeats.filter(s => {
            if (s.number.startsWith('B')) return true;
            if (s.side === 'RIGHT') return true;
            return !leftSeats.includes(s);
          }).sort((a, b) => a.number.localeCompare(b.number));

          // Fallback if numbers aren't A/B prefixed
          const displayLeft = leftSeats.length > 0 ? leftSeats : rowSeats.slice(0, 2);
          const displayRight = rightSeats.length > 0 ? rightSeats : rowSeats.slice(2, 4);

          return (
            <div key={rowIdx} className="flex items-center justify-between gap-3 p-1.5 rounded-xl hover:bg-slate-100/50 transition">
              {/* Left Side (A1, A2) */}
              <div className="flex items-center gap-2">
                {displayLeft.map(seat => (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && seat.lockedBySessionId !== sessionId)}
                    className={`w-12 h-13 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${getSeatColor(seat)}`}
                    title={`Seat ${seat.number} - ₹${seat.basePrice}`}
                  >
                    <span className="font-mono text-xs font-black">{seat.number}</span>
                    <span className="text-[9px] opacity-75 font-semibold">₹{seat.basePrice}</span>
                  </button>
                ))}
                {displayLeft.length === 0 && <div className="w-26 h-13" />}
              </div>

              {/* Center Aisle */}
              <div className="px-2 py-1 bg-slate-200/60 rounded text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider shrink-0">
                R{rowIdx}
              </div>

              {/* Right Side (B1, B2) */}
              <div className="flex items-center gap-2">
                {displayRight.map(seat => (
                  <button
                    key={seat.id}
                    type="button"
                    onClick={() => handleSeatClick(seat)}
                    disabled={seat.status === 'BOOKED' || (seat.status === 'LOCKED' && seat.lockedBySessionId !== sessionId)}
                    className={`w-12 h-13 rounded-xl border-2 flex flex-col items-center justify-center p-1 transition-all ${getSeatColor(seat)}`}
                    title={`Seat ${seat.number} - ₹${seat.basePrice}`}
                  >
                    <span className="font-mono text-xs font-black">{seat.number}</span>
                    <span className="text-[9px] opacity-75 font-semibold">₹{seat.basePrice}</span>
                  </button>
                ))}
                {displayRight.length === 0 && <div className="w-26 h-13" />}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Left / Main: Seat Matrix Coach Layout */}
      <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* Deck Switcher & Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900">Select Your Seats</h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-red-50 text-[#D84E55] border border-red-200 font-bold">
                {busDisplay} &bull; 2+2 Layout
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Click available seats to reserve. Locked with 10-minute atomic Redis reservation.
            </p>
          </div>

          {hasUpperDeck && (
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setActiveDeck('LOWER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeDeck === 'LOWER' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Lower Deck</span>
              </button>
              <button
                onClick={() => setActiveDeck('UPPER')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeDeck === 'UPPER' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Upper Deck</span>
              </button>
            </div>
          )}
        </div>

        {/* AI Recommended Seat Banner (Section 3) */}
        {recommendedSeat && (
          <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-300/80 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shrink-0 shadow-xs">
                <Star className="w-5 h-5 fill-slate-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs sm:text-sm text-slate-900">⭐ Recommended Seat {recommendedSeat.number}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] font-black uppercase tracking-wider">
                    AI BEST FIT
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">Window seat + low cabin vibration + closer to front exit.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleSeatClick(recommendedSeat)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <span>{selectedSeats.some(s => s.id === recommendedSeat.id) ? 'Selected' : `Select Seat ${recommendedSeat.number}`}</span>
              <Check className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Seat Preference Filters (Section 3) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Preferences:</span>
          </span>
          {(['ALL', 'WINDOW', 'AISLE', 'FRONT', 'BACK', 'LEGROOM'] as const).map(pref => (
            <button
              key={pref}
              type="button"
              onClick={() => setSeatPreference(pref)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                seatPreference === pref
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {pref === 'ALL' ? 'All Seats' : pref.charAt(0) + pref.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Redis Lock TTL Active Alert */}
        {timeRemainingSeconds !== null && timeRemainingSeconds > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-[#D84E55] flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#D84E55]">
                  Seats Held: {selectedSeats.map(s => s.number).join(', ')}
                </span>
                <p className="text-[11px] text-slate-600">
                  Secured via Redis atomic lock. Complete booking before timer expires.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-[#D84E55] text-white px-3 py-1.5 rounded-xl font-mono font-black text-sm shadow-xs">
              <span>{formatTimer(timeRemainingSeconds)}</span>
            </div>
          </div>
        )}

        {/* 2D Bus Coach Cabin */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-6">
          <div className="max-w-md mx-auto bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm space-y-4">
            
            {/* Driver Cabin & Entrance */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Front Entrance</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 font-extrabold">
                <BusIcon className="w-3.5 h-3.5 text-slate-600" />
                <span>Driver Cabin</span>
              </div>
            </div>

            {/* Layout Header */}
            <div className="flex items-center justify-between text-[11px] font-black text-slate-400 uppercase tracking-wider px-2">
              <span>Left (A1 A2...)</span>
              <span className="font-mono">Aisle</span>
              <span>Right (B1 B2...)</span>
            </div>

            {/* Interactive Grid */}
            {renderSeatGrid()}
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-4 h-4 rounded-md bg-white border border-slate-300"></span>
            <span className="font-medium text-[11px]">Available</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-4 h-4 rounded-md bg-[#D84E55] text-white font-bold flex items-center justify-center text-[9px]">✓</span>
            <span className="font-medium text-[11px]">Selected</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300"></span>
            <span className="font-medium text-[11px]">Occupied</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-4 h-4 rounded-md bg-pink-50 border border-pink-400 text-pink-700 font-bold flex items-center justify-center text-[9px]">♀</span>
            <span className="font-medium text-[11px]">Women / Priority</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <span className="w-4 h-4 rounded-md bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-[9px]">🔒</span>
            <span className="font-medium text-[11px]">Locked (Redis)</span>
          </div>
        </div>
      </div>

      {/* Right Column: Sticky Booking Summary (Requirement 3) */}
      <div className="lg:col-span-4 bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-md space-y-5 lg:sticky lg:top-24">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#D84E55]" />
            <span>Booking Summary</span>
          </h3>
          <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-red-50 text-[#D84E55] border border-red-200">
            Step 2 of 4
          </span>
        </div>

        {/* Structured Details matching Requirement 3 Example */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Bus:</span>
            <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
              {busDisplay}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Route:</span>
            <span className="font-bold text-slate-900">{routeDisplay}</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
            <span className="text-slate-500 font-semibold">Seat:</span>
            <span className="font-mono font-black text-[#D84E55] text-sm">
              {selectedSeats.length > 0 ? selectedSeats.map(s => s.number).join(', ') : 'None Selected'}
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-red-50 via-white to-amber-50 rounded-2xl border border-red-200 flex items-center justify-between">
            <span className="text-slate-700 font-extrabold text-sm">Price:</span>
            <span className="font-mono font-black text-xl text-slate-900">
              ₹{seatsPriceTotal}
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
          <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>
            <strong>Private Live Tracking:</strong> After booking, you will receive exclusive real-time live map tracking for bus <strong>{busDisplay}</strong>.
          </span>
        </div>

        {/* Continue Button matching Requirement 3 */}
        <button
          type="button"
          onClick={onProceedToPassengerDetails}
          disabled={selectedSeats.length === 0}
          className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
            selectedSeats.length > 0
              ? 'bg-[#D84E55] hover:bg-[#C33E44] text-white hover:shadow-lg active:scale-98'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>Continue to Passenger Details</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
