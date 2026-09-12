import React from 'react';
import { 
  Bus, 
  MapPin, 
  Clock, 
  Navigation, 
  Ticket, 
  Sparkles, 
  Bell, 
  Search, 
  Tag, 
  ChevronRight, 
  Radio, 
  ShieldCheck,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Booking, Trip } from '../../types';

interface PersonalizedCustomerSectionProps {
  bookings: Booking[];
  onOpenTracker: (pnr?: string) => void;
  onOpenETicket?: (booking: Booking) => void;
  onOpenProfile: () => void;
  onOpenMargPoints: (tab?: 'POINTS' | 'REFERRAL') => void;
  onOpenOffers: () => void;
  onScrollToSearch: () => void;
}

export const PersonalizedCustomerSection: React.FC<PersonalizedCustomerSectionProps> = ({
  bookings,
  onOpenTracker,
  onOpenETicket,
  onOpenProfile,
  onOpenMargPoints,
  onOpenOffers,
  onScrollToSearch,
}) => {
  const { currentUser, openAuthModal } = useAuth();

  // Dynamic greeting based on Indian local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Get user's first name
  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Traveler';

  // Find active upcoming booking for the current user
  const activeBooking = bookings.find(b => {
    if (b.checkInStatus === 'CANCELLED') return false;
    if (!currentUser) return false;
    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    return (b.userId && b.userId === currentUser.id) || 
           (b.contactEmail && b.contactEmail.trim().toLowerCase() === cleanEmail);
  }) || (currentUser ? bookings.find(b => b.pnr === 'MP100284') : null);

  if (!currentUser) {
    return null;
  }

  return (
    <section className="space-y-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
      
      {/* Personalized Customer Greeting Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {getGreeting()}, {firstName} 👋
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-red-50 text-[#D84E55] border border-red-200/60">
              Verified Passenger
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Welcome back to MargPath. Ready for your journey?
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onScrollToSearch}
            className="px-4 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#c33e44] text-white text-xs font-extrabold shadow-sm hover:shadow transition flex items-center gap-2 cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Buses</span>
          </button>
        </div>
      </div>

      {/* Case A: Customer has an Active Booking */}
      {activeBooking ? (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden border border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-56 h-56 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-extrabold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Your Next Journey</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-400">
              Ticket PNR: <span className="text-white">{activeBooking.pnr}</span>
            </span>
          </div>

          {/* Route & Timing Summary */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            
            {/* Origin & Destination */}
            <div className="md:col-span-7 flex items-center justify-between bg-white/5 rounded-2xl p-4 border border-white/10">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Boarding</span>
                <span className="text-lg sm:text-xl font-black text-white block">
                  {activeBooking.trip?.originCity || 'Bhubaneswar'}
                </span>
                <span className="text-xs text-amber-300 font-bold font-mono">
                  {activeBooking.trip?.departureTime || '6:30 PM'}
                </span>
                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {activeBooking.boardingPoint?.name || 'Railway Station Platform 1'}
                </p>
              </div>

              <div className="flex flex-col items-center px-3">
                <span className="text-[10px] text-slate-400 font-mono uppercase">Direct Route</span>
                <div className="w-14 sm:w-20 h-0.5 bg-gradient-to-r from-[#D84E55] to-orange-400 my-1 relative">
                  <Bus className="w-3.5 h-3.5 text-white absolute -top-1.5 left-1/2 -translate-x-1/2" />
                </div>
                <span className="text-[10px] text-emerald-400 font-bold">On Schedule</span>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Dropping</span>
                <span className="text-lg sm:text-xl font-black text-white block">
                  {activeBooking.trip?.destinationCity || 'Puri'}
                </span>
                <span className="text-xs text-slate-400 font-bold font-mono">
                  {activeBooking.trip?.arrivalTime || '8:45 PM'}
                </span>
                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {activeBooking.droppingPoint?.name || 'Puri Grand Road Stand'}
                </p>
              </div>
            </div>

            {/* Coach & Seat Details */}
            <div className="md:col-span-5 bg-white/5 rounded-2xl p-4 border border-white/10 flex flex-col justify-between h-full space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Assigned Coach</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-base font-black text-white">
                      {activeBooking.busDisplayNumber || activeBooking.trip?.busDisplayNumber || 'MP-204'}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 font-bold border border-red-500/30">
                      Volvo 9600
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Confirmed Seat</span>
                  <span className="font-mono text-base font-black text-amber-300 block">
                    {activeBooking.passengers && activeBooking.passengers.length > 0 
                      ? activeBooking.passengers.map(p => p.seatNumber).join(', ')
                      : 'A12'}
                  </span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold text-emerald-300">
                  Bus is on the way &bull; ~18 min to boarding point
                </span>
              </div>
            </div>

          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero Exposure Security</span>
              </div>
              <span>&bull;</span>
              <div className="flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-amber-400" />
                <span>AIS-140 GPS Private Tracking</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenTracker(activeBooking.pnr)}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D84E55] to-orange-500 hover:from-[#c33e44] hover:to-orange-600 text-white font-extrabold text-xs shadow-lg shadow-red-950/40 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
                <span>Track My Bus</span>
              </button>

              {onOpenETicket && (
                <button
                  type="button"
                  onClick={() => onOpenETicket(activeBooking)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 border border-white/15"
                >
                  <Ticket className="w-3.5 h-3.5 text-amber-300" />
                  <span>E-Ticket</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Case B: Customer has NO Active Booking */
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 border border-rose-200/80 rounded-3xl p-6 sm:p-7 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-red-100 text-[#D84E55] text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-[#D84E55]" />
                <span>Your Next Journey Starts Here</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900">
                Ready for your next journey?
              </h3>
              <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                Book a seat on any premier AC Sleeper or Volvo bus to unlock private live bus tracking, WhatsApp boarding updates, and zero-exposure security.
              </p>
            </div>

            <button
              type="button"
              onClick={onScrollToSearch}
              className="px-6 py-3 rounded-xl bg-[#D84E55] hover:bg-[#c33e44] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <Bus className="w-4 h-4" />
              <span>Book a Bus</span>
            </button>
          </div>
        </div>
      )}

      {/* Customer Quick Actions Bar & Special Offer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        
        {/* Quick Action 1: My Tickets */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3 transition cursor-pointer text-left shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-red-50 text-[#D84E55] flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Ticket className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 block truncate">My Tickets</span>
            <span className="text-[10px] text-slate-500 truncate block">View & Download</span>
          </div>
        </button>

        {/* Quick Action 2: My Trips */}
        <button
          type="button"
          onClick={onOpenProfile}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3 transition cursor-pointer text-left shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Bus className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 block truncate">My Trips</span>
            <span className="text-[10px] text-slate-500 truncate block">Past & Upcoming</span>
          </div>
        </button>

        {/* Quick Action 3: MargPoints & Referral */}
        <button
          type="button"
          onClick={() => onOpenMargPoints('POINTS')}
          className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3 transition cursor-pointer text-left shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 block truncate">MargPoints</span>
            <span className="text-[10px] text-amber-600 font-bold truncate block">450 Pts &bull; Refer &amp; Earn</span>
          </div>
        </button>

        {/* Quick Action 4: Weekend Puri Special Offer */}
        <button
          type="button"
          onClick={onOpenOffers}
          className="p-3.5 bg-gradient-to-r from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border border-rose-200/80 rounded-2xl flex items-center gap-3 transition cursor-pointer text-left shadow-2xs group"
        >
          <div className="w-9 h-9 rounded-xl bg-[#D84E55] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Tag className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-slate-900 block truncate">Special for You</span>
            <span className="text-[10px] text-[#D84E55] font-bold truncate block">Save ₹100 on Puri</span>
          </div>
        </button>

      </div>

    </section>
  );
};
