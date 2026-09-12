import React, { useState } from 'react';
import { 
  X, 
  Bus, 
  MapPin, 
  Clock, 
  Navigation, 
  Ticket, 
  Coins, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  QrCode, 
  Share2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Booking } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface CustomerDashboardModalProps {
  isOpen?: boolean;
  onClose: () => void;
  bookings?: Booking[];
  onOpenTracker?: (pnr?: string) => void;
  onOpenETicket?: (booking: Booking) => void;
  onOpenMargPoints?: () => void;
  onOpenSafetyHub?: () => void;
  onOpenRating?: () => void;
}

export const CustomerDashboardModal: React.FC<CustomerDashboardModalProps> = ({
  isOpen = true,
  onClose,
  bookings = [],
  onOpenTracker,
  onOpenETicket,
  onOpenMargPoints,
  onOpenSafetyHub,
  onOpenRating
}) => {
  const { currentUser, switchDemoRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ALL_BOOKINGS'>('ACTIVE');

  if (!isOpen) return null;

  const userBookings = bookings.length > 0 ? bookings : [
    {
      pnr: currentUser?.id === 'usr-pass-102' ? 'BR899401' : 'MP100284',
      trip: {
        originCity: 'Bhubaneswar',
        destinationCity: 'Puri',
        departureTime: '06:30 AM',
        arrivalTime: '08:25 AM',
        busRegistrationNumber: 'OD-02-MP-0204'
      },
      passengers: [{ name: currentUser?.name || 'Rahul Sharma', seatNumber: 'A12' }],
      totalAmount: 420,
      paymentStatus: 'PAID'
    } as any
  ];

  const activeBooking = userBookings[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#D84E55] to-orange-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">Your Journey &amp; Bookings</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  CONFIRMED
                </span>
              </div>
              <p className="text-xs text-slate-400">{currentUser?.name || 'Rahul Sharma'} • {currentUser?.phone || '+91 98765 43210'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Hero Card: YOUR NEXT JOURNEY */}
          {activeBooking && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden border border-slate-700/60">
              <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-[11px] font-black uppercase tracking-wider border border-red-500/30">
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                  <span>Your Next Journey</span>
                </div>
                <span className="font-mono text-xs font-bold text-slate-400">PNR: {activeBooking.pnr}</span>
              </div>

              {/* Route & Timing */}
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">From</span>
                  <span className="text-xl sm:text-2xl font-black text-white block">{activeBooking.trip.originCity}</span>
                  <span className="text-xs text-slate-300 font-semibold">{activeBooking.trip.departureTime}</span>
                </div>
                <div className="flex flex-col items-center px-4">
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Direct</span>
                  <div className="w-16 sm:w-24 h-0.5 bg-gradient-to-r from-red-500 to-orange-500 my-1 relative">
                    <Bus className="w-3.5 h-3.5 text-white absolute -top-1.5 left-1/2 -translate-x-1/2" />
                  </div>
                  <span className="text-[10px] text-emerald-400 font-bold">1h 55m</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-bold block">To</span>
                  <span className="text-xl sm:text-2xl font-black text-white block">{activeBooking.trip.destinationCity}</span>
                  <span className="text-xs text-slate-300 font-semibold">{activeBooking.trip.arrivalTime}</span>
                </div>
              </div>

              {/* Key Highlights: Bus, Seat, ETA */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-700/60 text-center">
                <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Bus</span>
                  <span className="text-sm font-black text-white font-mono block">MP-204</span>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Confirmed Seat</span>
                  <span className="text-sm font-black text-amber-400 font-mono block">
                    {activeBooking.passengers ? activeBooking.passengers.map(p => p.seatNumber).join(', ') : 'A12'}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Live ETA</span>
                  <span className="text-sm font-black text-emerald-400 block">18 min (4.8 km)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTracker?.(activeBooking.pnr);
                  }}
                  className="py-3 px-4 rounded-xl bg-gradient-to-r from-[#D84E55] to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Track My Bus</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenETicket?.(activeBooking);
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Ticket className="w-4 h-4 text-orange-400" />
                  <span>View E-Ticket</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenRating?.();
                  }}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Star className="w-4 h-4 text-amber-400" />
                  <span>Rate Journey</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Hub Cards: MargPoints & Safety Hub */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div 
              onClick={() => {
                onClose();
                onOpenMargPoints?.();
              }}
              className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-amber-950 block">MargPoints Rewards</span>
                  <span className="text-[11px] text-amber-700 font-semibold block">450 pts available • Unlock ₹100 discount</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-700" />
            </div>

            <div 
              onClick={() => {
                onClose();
                onOpenSafetyHub?.();
              }}
              className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/60 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-black text-emerald-950 block">Safety &amp; Emergency Hub</span>
                  <span className="text-[11px] text-emerald-700 font-semibold block">94/100 Safety Index • 112 SOS Assistance</span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-700" />
            </div>
          </div>

          {/* All Bookings List */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">Confirmed Journey Passes ({userBookings.length})</span>
            <div className="space-y-2.5">
              {userBookings.map(b => (
                <div key={b.id || b.pnr} className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-slate-900 text-xs">{b.pnr}</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">CONFIRMED</span>
                    </div>
                    <span className="text-xs font-bold text-slate-700 block mt-0.5">
                      {b.trip.originCity} ➔ {b.trip.destinationCity}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium block">
                      Bus: {b.busDisplayNumber || 'MP-204'} • Total Paid: ₹{b.totalAmount}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenTracker?.(b.pnr);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
                    >
                      Track
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenETicket?.(b);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs transition cursor-pointer"
                    >
                      Ticket
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
