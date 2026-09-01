import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Seat, Trip, FeatureFlags } from '../../types';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';
import { Layers, Clock, Shield, User, AlertCircle, Info, Lock, ChevronRight } from 'lucide-react';

interface SeatMatrixProps {
  trip: Trip;
  selectedSeats: Seat[];
  onSeatToggle: (seat: Seat) => void;
  lockExpiresAt: number | null;
  featureFlags: FeatureFlags;
  sessionId: string;
}

export const SeatMatrix: React.FC<SeatMatrixProps> = ({
  trip,
  selectedSeats,
  onSeatToggle,
  lockExpiresAt,
  featureFlags,
  sessionId,
}) => {
  const [activeDeck, setActiveDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);
  const [liveSeats, setLiveSeats] = useState<Seat[]>(trip.seats);

  useEffect(() => {
    setLiveSeats(trip.seats);
  }, [trip]);

  // Real-time seat updates polling & cross-tab event listener
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

  const normalizedSeats = (liveSeats || []).map((s: any, idx: number) => ({
    ...s,
    deck: (s.deck || (String(s.number || '').toUpperCase().startsWith('U') ? 'UPPER' : 'LOWER')).toUpperCase(),
    number: String(s.number || `L${idx + 1}`).toUpperCase(),
    basePrice: Number(s.basePrice || s.fare || trip.baseFare || 450)
  }));

  const lowerDeckSeats = normalizedSeats.filter(s => s.deck === 'LOWER');
  const upperDeckSeats = normalizedSeats.filter(s => s.deck === 'UPPER');
  const hasUpperDeck = upperDeckSeats.length > 0;

  const currentDeckSeats = activeDeck === 'LOWER' ? lowerDeckSeats : (upperDeckSeats.length > 0 ? upperDeckSeats : lowerDeckSeats);

  // Group by rows
  const maxRow = Math.max(...currentDeckSeats.map(s => s.row), 1);
  const rows = Array.from({ length: maxRow }, (_, i) => i + 1);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSeatColor = (seat: Seat) => {
    const isSelected = selectedSeats.some(s => s.id === seat.id);
    if (isSelected) {
      return 'bg-[#D84E55] text-white font-bold border-[#D84E55] ring-2 ring-red-300 shadow-sm';
    }

    if (seat.status === 'BOOKED') {
      if (seat.bookedGender === 'FEMALE' || seat.genderRestriction === 'FEMALE_ONLY') {
        return 'bg-pink-100 text-pink-400 border-pink-200 cursor-not-allowed opacity-75';
      }
      return 'bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed opacity-75';
    }

    if (seat.status === 'LOCKED') {
      if (seat.lockedBySessionId === sessionId) {
        return 'bg-[#D84E55] text-white font-bold border-[#D84E55] ring-2 ring-red-300';
      }
      return 'bg-amber-100 text-amber-800 border-amber-300 cursor-not-allowed';
    }

    if (seat.status === 'CONDUCTOR_RESERVED') {
      return 'bg-indigo-100 text-indigo-700 border-indigo-300 cursor-not-allowed';
    }

    // Available
    if (seat.genderRestriction === 'FEMALE_ONLY') {
      return 'bg-pink-50 text-pink-700 border-pink-300 hover:bg-pink-100 hover:border-pink-500 shadow-2xs';
    }

    return 'bg-white text-slate-800 border-slate-300 hover:border-[#D84E55] hover:shadow-xs transition-colors shadow-2xs';
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

  return (
    <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-xs space-y-5 sm:space-y-6">
      {/* Top Deck Switcher & Redis TTL countdown bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-extrabold text-slate-900">Select Seats / Berths</h3>
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold">
              {(trip.bus?.busType || 'VOLVO_AC').replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Click available berths or seats to lock with real-time Redis TTL.
          </p>
        </div>

        {/* Deck Switch Tabs */}
        {hasUpperDeck && (
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setActiveDeck('LOWER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDeck === 'LOWER'
                  ? 'bg-white text-[#D84E55] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Lower Deck ({lowerDeckSeats.length})</span>
            </button>
            <button
              onClick={() => setActiveDeck('UPPER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeDeck === 'UPPER'
                  ? 'bg-white text-[#D84E55] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Upper Deck ({upperDeckSeats.length})</span>
            </button>
          </div>
        )}
      </div>

      {/* Redis Lock TTL Active Alert */}
      {timeRemainingSeconds !== null && timeRemainingSeconds > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 text-[#D84E55] flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#D84E55]">
                Seats Reserved ({selectedSeats.map(s => s.number).join(', ')})
              </span>
              <p className="text-[11px] text-slate-600 hidden sm:block">
                Held exclusively for your session via Redis distributed lock.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-[#D84E55] text-white px-3 py-1.5 rounded-lg font-mono font-bold text-xs sm:text-sm shadow-xs">
            <span>{formatTimer(timeRemainingSeconds)}</span>
          </div>
        </div>
      )}

      {/* 2D Bus Layout Canvas */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 overflow-x-auto">
        <div className="min-w-[320px] max-w-md mx-auto bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs">
          {/* Driver Cabin Indicator */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-4 px-2">
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Passenger Entry</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200 font-bold">
              <span>Driver Cabin</span>
            </div>
          </div>

          {/* Seat Grid Rows & Universal Seat Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
            {currentDeckSeats.map((seat) => {
              const isSelected = selectedSeats.some(s => s.id === seat.id);
              const isBooked = seat.status === 'BOOKED';
              const isLocked = seat.status === 'LOCKED' && seat.lockedBySessionId !== sessionId;
              const isConductor = seat.status === 'CONDUCTOR_RESERVED';

              return (
                <button
                  key={seat.id}
                  type="button"
                  onClick={() => handleSeatClick(seat)}
                  disabled={isBooked || isLocked || isConductor}
                  className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-between transition cursor-pointer shadow-xs hover:scale-105 active:scale-95 ${getSeatColor(seat)}`}
                >
                  <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-75">
                    {seat.isSleeper ? 'Berth' : 'Seat'}
                  </div>

                  <div className="font-mono text-sm font-black tracking-tight my-1">
                    {seat.number}
                  </div>

                  <div className="text-[10px] font-extrabold">
                    ₹{seat.basePrice}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Realistic Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-white border border-slate-400 shadow-2xs"></span>
          <span className="font-medium">Available</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-[#D84E55] text-white font-bold flex items-center justify-center text-[10px]">✓</span>
          <span className="font-medium">Selected</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-pink-50 border border-pink-400 text-pink-700 font-bold flex items-center justify-center text-[9px]">♀</span>
          <span className="font-medium">Female Only</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-slate-200 border border-slate-300"></span>
          <span className="font-medium">Booked</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center text-[9px]">🔒</span>
          <span className="font-medium">Redis Locked</span>
        </div>
        <div className="flex items-center gap-2 text-slate-700">
          <span className="w-4 h-4 rounded-md bg-indigo-100 border border-indigo-300"></span>
          <span className="font-medium">Conductor</span>
        </div>
      </div>
    </div>
  );
};
