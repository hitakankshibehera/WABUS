import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Seat, Trip, FeatureFlags } from '../../types';
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

  const lowerDeckSeats = trip.seats.filter(s => s.deck === 'LOWER');
  const upperDeckSeats = trip.seats.filter(s => s.deck === 'UPPER');
  const hasUpperDeck = upperDeckSeats.length > 0;

  const currentDeckSeats = activeDeck === 'LOWER' ? lowerDeckSeats : upperDeckSeats;

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

          {/* Seat Grid Rows */}
          <div className="space-y-3">
            {rows.map(rowNum => {
              const rowSeats = currentDeckSeats.filter(s => s.row === rowNum);
              const leftSingle = rowSeats.find(s => s.col === 0);
              const leftAisle = rowSeats.find(s => s.col === 1);
              const right1 = rowSeats.find(s => s.col === 2);
              const right2 = rowSeats.find(s => s.col === 3);

              return (
                <div key={rowNum} className="flex items-center justify-between gap-1.5 sm:gap-2">
                  {/* Left Column (Single Berth or 2 Seater) */}
                  <div className="flex items-center gap-1.5">
                    {leftSingle && (
                      <button
                        onClick={() => handleSeatClick(leftSingle)}
                        disabled={leftSingle.status === 'BOOKED' || (leftSingle.status === 'LOCKED' && leftSingle.lockedBySessionId !== sessionId)}
                        className={`relative rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                          leftSingle.isSleeper ? 'w-18 sm:w-22 h-13 p-1.5' : 'w-10 sm:w-11 h-11'
                        } ${getSeatColor(leftSingle)}`}
                      >
                        {leftSingle.isSleeper ? (
                          <div className="w-full h-full flex flex-col justify-between items-start">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold">{leftSingle.number}</span>
                              <div className="w-3.5 h-2 rounded-xs bg-slate-300 border border-slate-400/50" />
                            </div>
                            <div className="flex items-center justify-between w-full text-[10px]">
                              <span className="font-extrabold">₹{leftSingle.basePrice}</span>
                              {leftSingle.status === 'LOCKED' && leftSingle.lockedBySessionId !== sessionId && (
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                              )}
                              {leftSingle.genderRestriction === 'FEMALE_ONLY' && (
                                <span className="text-[9px] text-pink-600 font-bold">♀</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold">{leftSingle.number}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">₹{leftSingle.basePrice}</span>
                          </div>
                        )}
                      </button>
                    )}

                    {leftAisle && (
                      <button
                        onClick={() => handleSeatClick(leftAisle)}
                        disabled={leftAisle.status === 'BOOKED' || (leftAisle.status === 'LOCKED' && leftAisle.lockedBySessionId !== sessionId)}
                        className={`w-10 sm:w-11 h-11 rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${getSeatColor(
                          leftAisle
                        )}`}
                      >
                        <span className="text-xs font-bold">{leftAisle.number}</span>
                        <span className="text-[9px] text-slate-500 font-semibold">₹{leftAisle.basePrice}</span>
                      </button>
                    )}
                  </div>

                  {/* Aisle Spacer */}
                  <div className="flex-1 flex justify-center items-center py-1">
                    <span className="text-[9px] uppercase font-mono font-bold tracking-widest text-slate-300 select-none">
                      AISLE
                    </span>
                  </div>

                  {/* Right Column (Double Berths or 2 Seater) */}
                  <div className="flex items-center gap-1.5">
                    {right1 && (
                      <button
                        onClick={() => handleSeatClick(right1)}
                        disabled={right1.status === 'BOOKED' || (right1.status === 'LOCKED' && right1.lockedBySessionId !== sessionId)}
                        className={`relative rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                          right1.isSleeper ? 'w-18 sm:w-22 h-13 p-1.5' : 'w-10 sm:w-11 h-11'
                        } ${getSeatColor(right1)}`}
                      >
                        {right1.isSleeper ? (
                          <div className="w-full h-full flex flex-col justify-between items-start">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold">{right1.number}</span>
                              <div className="w-3.5 h-2 rounded-xs bg-slate-300 border border-slate-400/50" />
                            </div>
                            <div className="flex items-center justify-between w-full text-[10px]">
                              <span className="font-extrabold">₹{right1.basePrice}</span>
                              {right1.status === 'LOCKED' && right1.lockedBySessionId !== sessionId && (
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                              )}
                              {right1.genderRestriction === 'FEMALE_ONLY' && (
                                <span className="text-[9px] text-pink-600 font-bold">♀</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold">{right1.number}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">₹{right1.basePrice}</span>
                          </div>
                        )}
                      </button>
                    )}

                    {right2 && (
                      <button
                        onClick={() => handleSeatClick(right2)}
                        disabled={right2.status === 'BOOKED' || (right2.status === 'LOCKED' && right2.lockedBySessionId !== sessionId)}
                        className={`relative rounded-lg border flex flex-col items-center justify-center transition cursor-pointer ${
                          right2.isSleeper ? 'w-18 sm:w-22 h-13 p-1.5' : 'w-10 sm:w-11 h-11'
                        } ${getSeatColor(right2)}`}
                      >
                        {right2.isSleeper ? (
                          <div className="w-full h-full flex flex-col justify-between items-start">
                            <div className="flex items-center justify-between w-full">
                              <span className="text-[11px] font-bold">{right2.number}</span>
                              <div className="w-3.5 h-2 rounded-xs bg-slate-300 border border-slate-400/50" />
                            </div>
                            <div className="flex items-center justify-between w-full text-[10px]">
                              <span className="font-extrabold">₹{right2.basePrice}</span>
                              {right2.status === 'LOCKED' && right2.lockedBySessionId !== sessionId && (
                                <Lock className="w-2.5 h-2.5 text-amber-700" />
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <span className="text-xs font-bold">{right2.number}</span>
                            <span className="text-[9px] text-slate-500 font-semibold">₹{right2.basePrice}</span>
                          </div>
                        )}
                      </button>
                    )}
                  </div>
                </div>
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
