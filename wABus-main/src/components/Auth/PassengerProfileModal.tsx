import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Booking } from '../../types';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  Ticket, 
  Sparkles, 
  Calendar, 
  Smartphone, 
  BadgeCheck, 
  Bus,
  CheckCircle2,
  QrCode,
  MapPin,
  Clock,
  RefreshCw,
  ChevronRight,
  Check,
  Trash2
} from 'lucide-react';

const JourneyQrCode: React.FC<{ booking: Booking }> = ({ booking }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      pnr: booking.pnr,
      vehicle: booking.trip.busRegistrationNumber,
      seats: booking.passengers.map(p => p.seatNumber),
      operator: booking.trip.operatorName,
      status: booking.paymentStatus,
      hash: booking.qrPayloadHash
    });

    QRCode.toDataURL(payload, { width: 200, margin: 1 })
      .then(url => setQrUrl(url))
      .catch(() => {});
  }, [booking]);

  if (!qrUrl) return <div className="w-28 h-28 bg-gray-100 rounded-xl animate-pulse" />;
  return <img src={qrUrl} alt={`QR Code ${booking.pnr}`} className="w-28 h-28 rounded-xl border border-gray-200 shadow-xs" />;
};

export const PassengerProfileModal: React.FC<{
  bookings?: Booking[];
  onRefreshBookings?: () => void;
  initialTab?: 'JOURNEY' | 'ACCOUNT';
}> = ({ bookings = [], onRefreshBookings, initialTab = 'JOURNEY' }) => {
  const { currentUser, isProfileModalOpen, closeProfileModal, logout, openAuthModal } = useAuth();
  const [activeTab, setActiveTab] = useState<'JOURNEY' | 'ACCOUNT'>(initialTab);
  const [journeyFilter, setJourneyFilter] = useState<'ACTIVE' | 'BOARDED' | 'CANCELLED' | 'ALL'>('ACTIVE');
  const [userBookings, setUserBookings] = useState<Booking[]>(bookings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cancelSuccessMsg, setCancelSuccessMsg] = useState<string | null>(null);

  const fetchUserBookings = async () => {
    setIsRefreshing(true);
    try {
      const list = await api.getBookings();
      setUserBookings(list);
      if (onRefreshBookings) onRefreshBookings();
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleCancelTicket = async (b: Booking) => {
    if (!confirm(`Are you sure you want to cancel ticket PNR ${b.pnr}? Refund will be credited instantly to your wABus Wallet balance.`)) return;
    try {
      const res = await api.cancelBooking(b.id);
      setCancelSuccessMsg(`Ticket PNR ${b.pnr} cancelled! Refund of ₹${res.refundAmount} credited to your wABus Wallet.`);
      fetchUserBookings();
      setTimeout(() => setCancelSuccessMsg(null), 6000);
    } catch (err: any) {
      alert(err.message || 'Failed to cancel ticket');
    }
  };

  const handleDeleteTicket = async (b: Booking) => {
    if (!confirm(`Are you sure you want to remove ticket PNR ${b.pnr} from your account view?`)) return;
    try {
      await api.deleteBooking(b.id);
      setUserBookings(prev => prev.filter(x => x.id !== b.id));
      setCancelSuccessMsg(`Ticket PNR ${b.pnr} removed successfully.`);
      fetchUserBookings();
      setTimeout(() => setCancelSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to remove ticket');
    }
  };

  useEffect(() => {
    if (isProfileModalOpen) {
      fetchUserBookings();
      const interval = setInterval(fetchUserBookings, 5000);
      return () => clearInterval(interval);
    }
  }, [isProfileModalOpen]);

  useEffect(() => {
    setUserBookings(bookings);
  }, [bookings]);

  if (!isProfileModalOpen || !currentUser) return null;

  // Filter bookings for current passenger
  const activeJourneys = userBookings.filter(b => b.checkInStatus !== 'BOARDED' && b.checkInStatus !== 'CANCELLED');
  const boardedJourneys = userBookings.filter(b => b.checkInStatus === 'BOARDED');
  const cancelledJourneys = userBookings.filter(b => b.checkInStatus === 'CANCELLED');
  
  const totalSeatsCount = userBookings.reduce((sum, b) => sum + b.passengers.length, 0);
  const activeSeatsCount = activeJourneys.reduce((sum, b) => sum + b.passengers.length, 0);
  const boardedSeatsCount = boardedJourneys.reduce((sum, b) => sum + b.passengers.length, 0);

  const filteredJourneys = journeyFilter === 'ACTIVE'
    ? activeJourneys
    : journeyFilter === 'BOARDED'
    ? boardedJourneys
    : journeyFilter === 'CANCELLED'
    ? cancelledJourneys
    : userBookings;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#C33E44] text-white p-6 relative">
          <button
            onClick={closeProfileModal}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white/60"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-white text-[#D84E55] flex items-center justify-center font-black text-xl shadow-md border-2 border-white/40">
                  {currentUser.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-lg font-black text-white">{currentUser.name}</h3>
                  <BadgeCheck className="w-4 h-4 text-white fill-white text-[#D84E55]" />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    {currentUser.role === 'PASSENGER' ? 'Verified Passenger' : currentUser.role === 'CONDUCTOR' ? 'Certified Conductor' : 'Master Administrator'}
                  </span>
                  <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 shadow-xs">
                    🎟️ {totalSeatsCount} Ticket{totalSeatsCount !== 1 ? 's' : ''} Booked
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={fetchUserBookings}
              disabled={isRefreshing}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Sync Journeys</span>
            </button>
          </div>

          {/* Ticket Count Summary Grid */}
          <div className="grid grid-cols-3 gap-2 bg-black/25 p-3 rounded-2xl border border-white/20 mt-4 text-center font-mono text-xs">
            <div>
              <span className="text-[10px] text-red-100 font-sans uppercase font-bold block">Total Booked</span>
              <span className="font-extrabold text-white text-sm">{totalSeatsCount} Ticket{totalSeatsCount !== 1 ? 's' : ''}</span>
            </div>
            <div>
              <span className="text-[10px] text-amber-200 font-sans uppercase font-bold block">Upcoming</span>
              <span className="font-extrabold text-amber-300 text-sm">{activeSeatsCount} Active</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-200 font-sans uppercase font-bold block">Boarded</span>
              <span className="font-extrabold text-emerald-300 text-sm">{boardedSeatsCount} Verified</span>
            </div>
          </div>

          {/* Modal Navigation Tabs */}
          <div className="flex bg-black/20 p-1 rounded-2xl mt-4 text-xs font-bold">
            <button
              onClick={() => setActiveTab('JOURNEY')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'JOURNEY' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>View Your Journey ({totalSeatsCount} Ticket{totalSeatsCount !== 1 ? 's' : ''})</span>
            </button>

            <button
              onClick={() => setActiveTab('ACCOUNT')}
              className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'ACCOUNT' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-white/80 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Account Details</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4 text-gray-800">
          
          {/* TAB 1: VIEW YOUR JOURNEY */}
          {activeTab === 'JOURNEY' && (
            <div className="space-y-4">
              {/* Journey Filter Bar */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setJourneyFilter('ACTIVE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      journeyFilter === 'ACTIVE' 
                        ? 'bg-[#D84E55] text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Active Upcoming ({activeJourneys.length})
                  </button>

                  <button
                    onClick={() => setJourneyFilter('BOARDED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      journeyFilter === 'BOARDED' 
                        ? 'bg-emerald-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Boarded & Verified ({boardedJourneys.length})
                  </button>

                  <button
                    onClick={() => setJourneyFilter('CANCELLED')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      journeyFilter === 'CANCELLED' 
                        ? 'bg-rose-700 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Cancelled & Refunded ({cancelledJourneys.length})
                  </button>

                  <button
                    onClick={() => setJourneyFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      journeyFilter === 'ALL' 
                        ? 'bg-gray-900 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All ({userBookings.length})
                  </button>
                </div>

                <span className="text-[11px] text-gray-400 font-medium hidden sm:block">
                  Live Conductor Sync Active
                </span>
              </div>

              {cancelSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{cancelSuccessMsg}</span>
                </div>
              )}

              {/* Tickets List */}
              {filteredJourneys.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-200 rounded-3xl space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#D84E55] flex items-center justify-center mx-auto">
                    <Ticket className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900">No {journeyFilter.toLowerCase()} tickets found</h4>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto">
                    Book your Day or Night coach journey online to get instant digital tickets with cryptographic QR codes.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredJourneys.map(b => (
                    <div 
                      key={b.id} 
                      className={`border rounded-2xl p-4 space-y-3 shadow-xs transition-all ${
                        b.checkInStatus === 'BOARDED'
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : b.checkInStatus === 'CANCELLED'
                          ? 'bg-rose-50/40 border-rose-200 opacity-80'
                          : 'bg-white border-gray-200 hover:border-red-200'
                      }`}
                    >
                      {/* Ticket Card Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-red-50 text-[#D84E55] flex items-center justify-center">
                            <Bus className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-gray-900">{b.trip.operatorName}</span>
                            <span className="text-[10px] text-gray-500 block">{b.trip.busModel}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-xs">
                          <span className="px-2.5 py-1 rounded-lg bg-gray-100 text-gray-900 font-bold border border-gray-200">
                            PNR: {b.pnr}
                          </span>
                          <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold border border-amber-200">
                            Bus: {b.trip.busRegistrationNumber}
                          </span>
                          <button
                            onClick={() => handleDeleteTicket(b)}
                            className="p-1 rounded-lg bg-red-50 hover:bg-red-100 text-[#D84E55] transition border border-red-200 cursor-pointer"
                            title="Remove ticket from account view"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Ticket Body: QR Code & Journey Details */}
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Generated QR Code */}
                        <div className="flex flex-col items-center shrink-0">
                          <JourneyQrCode booking={b} />
                          <span className="text-[10px] font-mono font-bold text-gray-500 mt-1 uppercase">
                            Boarding QR Pass
                          </span>
                        </div>

                        {/* Journey Details */}
                        <div className="flex-1 space-y-2 text-xs w-full">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-base text-gray-900">
                              {b.trip.originCity} ➔ {b.trip.destinationCity}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-bold">
                              {b.trip.category}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Departure</span>
                              <strong className="text-gray-900">{b.trip.departureTime} ({b.trip.departureDate})</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-gray-400 uppercase font-bold block">Seat(s)</span>
                              <strong className="text-[#D84E55] font-mono">{b.passengers.map(p => p.seatNumber).join(', ')}</strong>
                            </div>
                          </div>

                          <div className="text-gray-600 text-[11px] flex items-center justify-between">
                            <span>Boarding: <strong className="text-gray-900">{b.boardingPoint.name} ({b.boardingPoint.time})</strong></span>
                            <span className="font-mono font-bold text-gray-900">₹{b.totalAmount} ({b.paymentStatus})</span>
                          </div>

                          {/* Live Conductor Verification / Cancellation Banner */}
                          {b.checkInStatus === 'BOARDED' ? (
                            <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-emerald-950 text-xs font-bold flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span>✓ BOARDED & VERIFIED BY CONDUCTOR</span>
                              </div>
                              <span className="text-[10px] font-mono text-emerald-800">{b.boardedAt || 'Verified'}</span>
                            </div>
                          ) : b.checkInStatus === 'CANCELLED' ? (
                            <div className="p-2.5 bg-rose-100/80 border border-rose-300 rounded-xl text-rose-950 text-xs font-bold space-y-1">
                              <div className="flex items-center justify-between">
                                <span>🔴 TICKET CANCELLED</span>
                                <span className="font-mono text-emerald-700 font-black">+₹{b.refundAmount || Math.round(b.totalAmount * 0.85)} CREDITED</span>
                              </div>
                              <p className="text-[10px] text-rose-800 font-normal">
                                Instant refund of ₹{b.refundAmount || Math.round(b.totalAmount * 0.85)} credited to wABus Wallet balance.
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
                                <QrCode className="w-4 h-4 text-amber-600 shrink-0 animate-pulse" />
                                <span>Show this QR code to the conductor upon boarding for instant verification</span>
                              </div>

                              <button
                                onClick={() => handleCancelTicket(b)}
                                className="w-full py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[#D84E55] border border-red-200 text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel Ticket & Claim Instant Refund</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ACCOUNT DETAILS */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-4">
              <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
                  </span>
                  <span className="font-bold text-gray-900">{currentUser.phone}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
                  </span>
                  <span className="font-bold text-gray-900">{currentUser.email}</span>
                </div>

                {currentUser.employeeId && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-gray-400" /> Employee ID:
                    </span>
                    <span className="font-bold text-[#D84E55]">{currentUser.employeeId}</span>
                  </div>
                )}

                {currentUser.assignedOperator && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 font-medium flex items-center gap-1.5">
                      <Bus className="w-3.5 h-3.5 text-gray-400" /> Operator:
                    </span>
                    <span className="font-bold text-gray-900">{currentUser.assignedOperator}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    closeProfileModal();
                    openAuthModal('PASSENGER', 'SIGN_IN');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition cursor-pointer"
                >
                  Switch Account
                </button>

                <button
                  onClick={() => {
                    logout();
                    closeProfileModal();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#D84E55] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
