import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header, ActiveTab } from './components/Header';
import { TripSearch } from './components/Passenger/TripSearch';
import { SeatMatrix } from './components/Passenger/SeatMatrix';
import { PassengerForm } from './components/Passenger/PassengerForm';
import { CheckoutModal } from './components/Passenger/CheckoutModal';
import { ETicketView } from './components/Passenger/ETicketView';
import { ConductorPortal } from './components/Conductor/ConductorPortal';
import { AdminPortal } from './components/Admin/AdminPortal';
import { DeliverablesViewer } from './components/Architecture/DeliverablesViewer';
import { AuthModal } from './components/Auth/AuthModal';
import { PassengerProfileModal } from './components/Auth/PassengerProfileModal';
import { CustomerSupportModal } from './components/Support/CustomerSupportModal';
import { api } from './services/api';
import { Trip, Seat, FeatureFlags, Booking, PaymentMethod, BoardingPoint, DroppingPoint, PassengerDetails } from './types';
import { DEFAULT_FEATURE_FLAGS } from './data/mockDatabase';
import { ArrowLeft, Bus, AlertCircle, CheckCircle2, ShieldCheck, Zap, Sparkles, ChevronRight, HelpCircle } from 'lucide-react';

const getInitialTab = (): ActiveTab => {
  if (typeof window === 'undefined') return 'PASSENGER';
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (path.includes('/admin') || hash.includes('admin') || search.includes('admin')) {
    return 'ADMIN';
  }
  if (path.includes('/conductor') || hash.includes('conductor') || search.includes('conductor')) {
    return 'CONDUCTOR';
  }
  if (path.includes('/architecture') || hash.includes('architecture') || search.includes('architecture')) {
    return 'ARCHITECTURE';
  }
  return 'PASSENGER';
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialTab);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(DEFAULT_FEATURE_FLAGS);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Passenger Booking Flow State
  const [bookingStep, setBookingStep] = useState<'SEARCH' | 'SEATS' | 'FORM' | 'ETICKET'>('SEARCH');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [lockExpiresAt, setLockExpiresAt] = useState<number | null>(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPayload, setCheckoutPayload] = useState<{
    passengers: PassengerDetails[];
    boardingPoint: BoardingPoint;
    droppingPoint: DroppingPoint;
    contactEmail: string;
    contactPhone: string;
    optInWhatsApp: boolean;
    appliedCoupon: string | null;
  } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [statusNotification, setStatusNotification] = useState<string | null>(null);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // Client Session ID for Redis Distributed Lock
  const [sessionId] = useState<string>(() => 'sess-' + Math.random().toString(36).substring(2, 11));

  const loadData = async () => {
    try {
      const [flags, tripList, bookingList] = await Promise.all([
        api.getFeatureFlags(),
        api.searchTrips(),
        api.getBookings()
      ]);
      setFeatureFlags(flags);
      setTrips(tripList);
      setBookings(bookingList);
      if (selectedTrip) {
        const refreshed = tripList.find(t => t.id === selectedTrip.id);
        if (refreshed) setSelectedTrip(refreshed);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll feature flags & trips periodically in real-time (every 3s)
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen for browser URL navigation (e.g. back/forward, direct /admin, #admin)
  useEffect(() => {
    const handleLocationChange = () => {
      const target = getInitialTab();
      setActiveTab(target);
    };
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const handleTabSwitch = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const targetPath = tab === 'ADMIN' ? '/admin' : tab === 'CONDUCTOR' ? '/conductor' : tab === 'ARCHITECTURE' ? '/architecture' : '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Handle seat toggle with Redis Atomic Locking
  const handleSeatToggle = async (seat: Seat) => {
    if (!selectedTrip) return;

    const isAlreadySelected = selectedSeats.some(s => s.id === seat.id);

    if (isAlreadySelected) {
      // Release seat lock
      const updated = selectedSeats.filter(s => s.id !== seat.id);
      setSelectedSeats(updated);
      await api.releaseSeats(selectedTrip.id, [seat.id], sessionId);
      if (updated.length === 0) setLockExpiresAt(null);
    } else {
      // Max 6 seats per booking
      if (selectedSeats.length >= 6) {
        setStatusNotification('Maximum 6 seats allowed per booking.');
        setTimeout(() => setStatusNotification(null), 3000);
        return;
      }

      // Try acquiring Redis lock
      try {
        const newSeats = [...selectedSeats, seat];
        const res = await api.lockSeats(
          selectedTrip.id,
          newSeats.map(s => s.id),
          sessionId
        );

        if (res.success) {
          setSelectedSeats(newSeats);
          setLockExpiresAt(res.expiresAt);
          setStatusNotification(`Seat ${seat.number} locked for ${featureFlags.seatLockDurationMinutes || 10} minutes via Redis.`);
          setTimeout(() => setStatusNotification(null), 3000);
        }
      } catch (err: any) {
        setStatusNotification(err.message || 'Could not lock seat. It may have just been taken.');
        setTimeout(() => setStatusNotification(null), 4000);
      }
    }
  };

  // Proceed to Checkout Modal
  const handleProceedToPayment = (payload: {
    passengers: PassengerDetails[];
    boardingPoint: BoardingPoint;
    droppingPoint: DroppingPoint;
    contactEmail: string;
    contactPhone: string;
    optInWhatsApp: boolean;
    appliedCoupon: string | null;
  }) => {
    setCheckoutPayload(payload);
    setIsCheckoutModalOpen(true);
  };

  // Execute Payment and Finalize Booking
  const handlePaymentSuccess = async (method: PaymentMethod, reference: string) => {
    if (!selectedTrip || !checkoutPayload) return;

    try {
      const discount = checkoutPayload.appliedCoupon === 'BHARAT100' ? 100 : (checkoutPayload.appliedCoupon === 'REDBUS50' || checkoutPayload.appliedCoupon === 'WABUS50') ? 50 : 0;
      const res = await api.checkoutBooking({
        tripId: selectedTrip.id,
        sessionId,
        passengers: checkoutPayload.passengers,
        contactEmail: checkoutPayload.contactEmail,
        contactPhone: checkoutPayload.contactPhone,
        boardingPointId: checkoutPayload.boardingPoint.id,
        droppingPointId: checkoutPayload.droppingPoint.id,
        paymentMethod: method,
        discountAmount: discount
      });

      setConfirmedBooking(res.booking);
      setIsCheckoutModalOpen(false);
      setBookingStep('ETICKET');
      setSelectedSeats([]);
      setLockExpiresAt(null);
      loadData(); // Refresh seat matrix & bookings
    } catch (err: any) {
      console.error('Checkout error:', err);
      setStatusNotification('Checkout failed: ' + err.message);
    }
  };

  // Update Feature Flags from Admin
  const handleUpdateFeatureFlags = async (newFlags: Partial<FeatureFlags>) => {
    const updated = await api.updateFeatureFlags(newFlags);
    setFeatureFlags(updated);
    loadData();
  };

  const handleSelectTrip = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedSeats([]);
    setLockExpiresAt(null);
    setBookingStep('SEATS');
  };

  const handleResetBooking = () => {
    if (selectedTrip && selectedSeats.length > 0) {
      api.releaseSeats(selectedTrip.id, selectedSeats.map(s => s.id), sessionId);
    }
    setSelectedTrip(null);
    setSelectedSeats([]);
    setLockExpiresAt(null);
    setConfirmedBooking(null);
    setBookingStep('SEARCH');
  };

  // Calculate checkout amount
  const calculateTotalAmount = () => {
    if (!selectedSeats.length) return 0;
    const base = selectedSeats.reduce((sum, s) => sum + s.basePrice, 0);
    const gst = Math.round(base * 0.05);
    let discount = 0;
    const code = checkoutPayload?.appliedCoupon;
    if (code) {
      if (code === 'BHARAT100') discount = 100;
      else if (code === 'WABUS50' || code === 'REDBUS50') discount = 50;
      else if (code === 'FESTIVE150') discount = 150;
      else if (code === 'SUPER15') discount = Math.round(base * 0.15);
      else discount = 100; // Fallback for custom admin coupons
    }
    return Math.max(0, base + gst - discount);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col selection:bg-[#D84E55] selection:text-white">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={handleTabSwitch}
        featureFlags={featureFlags}
        bookings={bookings}
        onOpenSupport={() => setIsSupportOpen(true)}
      />

      {/* Floating Status Notification */}
      {statusNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-700 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <Zap className="w-4 h-4 text-[#D84E55] shrink-0 fill-[#D84E55]" />
          <span className="text-xs font-semibold">{statusNotification}</span>
        </div>
      )}

      {/* Main Container with Smooth Motion Entrance & Exit Animations */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7">
        <AnimatePresence mode="wait">
          {/* PORTAL 1: PASSENGER WEB / APP */}
          {activeTab === 'PASSENGER' && (
            <motion.div
              key={`passenger-${bookingStep}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              {/* Step 1: Trip Search & Bus Listing */}
              {bookingStep === 'SEARCH' && (
                <TripSearch
                  trips={trips}
                  onSelectTrip={handleSelectTrip}
                  selectedTripId={selectedTrip?.id || null}
                  featureFlags={featureFlags}
                />
              )}

              {/* Step 2: 2D Interactive Seat Matrix Selection */}
              {bookingStep === 'SEATS' && selectedTrip && (
                <div className="space-y-6 pb-20 sm:pb-0">
                  {/* Back button & Bus info bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleResetBooking}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                        title="Back to search"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {selectedTrip.originCity} ➔ {selectedTrip.destinationCity}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-50 text-[#D84E55] font-mono font-bold border border-red-200">
                            {selectedTrip.departureTime}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          {selectedTrip.bus.operatorName} &bull; {selectedTrip.bus.model} ({selectedTrip.bus.registrationNumber})
                        </p>
                      </div>
                    </div>

                    {selectedSeats.length > 0 && (
                      <div className="hidden sm:flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-xs text-slate-500 font-medium">
                            Selected Seats: <strong className="text-slate-900">{selectedSeats.map(s => s.number).join(', ')}</strong>
                          </div>
                          <div className="text-sm font-black text-[#D84E55] font-mono">
                            Total: ₹{selectedSeats.reduce((sum, s) => sum + s.basePrice, 0)}
                          </div>
                        </div>

                        <button
                          onClick={() => setBookingStep('FORM')}
                          className="py-2.5 px-5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
                        >
                          <span>Continue</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Interactive 2D Seat Matrix */}
                  <SeatMatrix
                    trip={selectedTrip}
                    selectedSeats={selectedSeats}
                    onSeatToggle={handleSeatToggle}
                    lockExpiresAt={lockExpiresAt}
                    featureFlags={featureFlags}
                    sessionId={sessionId}
                  />

                  {/* Mobile Sticky Bottom Floating Action Bar */}
                  {selectedSeats.length > 0 && (
                    <div className="sm:hidden fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 p-3.5 shadow-2xl z-40 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2 duration-150">
                      <div>
                        <div className="text-[11px] text-slate-500 font-medium">
                          Seats: <strong className="text-slate-900">{selectedSeats.map(s => s.number).join(', ')}</strong>
                        </div>
                        <div className="text-base font-black text-[#D84E55] font-mono">
                          ₹{selectedSeats.reduce((sum, s) => sum + s.basePrice, 0)}
                        </div>
                      </div>
                      <button
                        onClick={() => setBookingStep('FORM')}
                        className="py-2.5 px-5 rounded-xl bg-[#D84E55] text-white font-extrabold text-xs uppercase tracking-wider flex items-center gap-1 shadow-md"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Passenger Form & Boarding Point Selection */}
              {bookingStep === 'FORM' && selectedTrip && (
                <div className="space-y-6">
                  <button
                    onClick={() => setBookingStep('SEATS')}
                    className="flex items-center gap-2 text-xs font-bold text-gray-600 hover:text-[#D84E55] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Seat Matrix (Seats: {selectedSeats.map(s => s.number).join(', ')})</span>
                  </button>

                  <PassengerForm
                    trip={selectedTrip}
                    selectedSeats={selectedSeats}
                    featureFlags={featureFlags}
                    onProceedToCheckout={handleProceedToPayment}
                    onBack={() => setBookingStep('SEATS')}
                  />
                </div>
              )}

              {/* Step 4: E-Ticket View with QR Pass */}
              {bookingStep === 'ETICKET' && confirmedBooking && selectedTrip && (
                <ETicketView
                  booking={confirmedBooking}
                  trip={selectedTrip}
                  featureFlags={featureFlags}
                  onBookAnother={handleResetBooking}
                />
              )}
            </motion.div>
          )}

          {/* PORTAL 2: CONDUCTOR & OPERATOR MOBILE PORTAL */}
          {activeTab === 'CONDUCTOR' && (
            <motion.div
              key="conductor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <ConductorPortal
                trips={trips}
                bookings={bookings}
                featureFlags={featureFlags}
                onRefreshData={loadData}
              />
            </motion.div>
          )}

          {/* PORTAL 3: MASTER ADMIN & AUTOMATION ENGINE */}
          {activeTab === 'ADMIN' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <AdminPortal
                featureFlags={featureFlags}
                onUpdateFeatureFlags={handleUpdateFeatureFlags}
                trips={trips}
                onRefreshTrips={loadData}
              />
            </motion.div>
          )}

          {/* PORTAL 4: SYSTEM ARCHITECTURE & POSTGRESQL / REDIS DDL */}
          {activeTab === 'ARCHITECTURE' && (
            <motion.div
              key="architecture"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <DeliverablesViewer />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Checkout Modal */}
      {selectedTrip && (
        <CheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          amount={calculateTotalAmount()}
          featureFlags={featureFlags}
          lockExpiresAt={lockExpiresAt}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Global Multi-Role Authentication Modal (Passenger, Conductor, Master Admin) */}
      <AuthModal />

      {/* Passenger / User Account Profile Modal */}
      <PassengerProfileModal bookings={bookings} onRefreshBookings={loadData} />

      {/* 24x7 Customer Support & FAQs Modal */}
      <CustomerSupportModal isOpen={isSupportOpen} onClose={() => setIsSupportOpen(false)} />

      {/* wABus Authentic Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="flex items-center space-x-2.5 mb-2">
                <div className="w-8 h-8 rounded-xl bg-gray-900 overflow-hidden shadow-xs border border-gray-200 shrink-0">
                  <img src="/logo.png" alt="Wonderlight Adventure Co." className="w-full h-full object-cover" />
                </div>
                <div>
                  <span className="font-black text-lg text-[#D84E55] block leading-none">
                    wA<span className="text-gray-900">Bus</span>
                  </span>
                  <span className="text-[9px] uppercase font-bold text-gray-500">Wonderlight Adventure Co.</span>
                </div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                wABus is Wonderlight Adventure Company&apos;s automated bus ticketing ecosystem trusted by over 25+ million satisfied passengers.
              </p>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Popular Bus Corridors</h4>
              <ul className="space-y-1 text-[11px]">
                <li className="hover:text-[#D84E55] cursor-pointer">Bhubaneswar to Puri Bus</li>
                <li className="hover:text-[#D84E55] cursor-pointer">Bangalore to Hyderabad Bus</li>
                <li className="hover:text-[#D84E55] cursor-pointer">Mumbai to Pune Bus</li>
                <li className="hover:text-[#D84E55] cursor-pointer">Delhi to Manali Bus</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Top Operators</h4>
              <ul className="space-y-1 text-[11px]">
                <li className="hover:text-[#D84E55] cursor-pointer">OSRTC Volvo Premier</li>
                <li className="hover:text-[#D84E55] cursor-pointer">Dolphin Travels AC Sleeper</li>
                <li className="hover:text-[#D84E55] cursor-pointer">KSRTC Airavat Club Class</li>
                <li className="hover:text-[#D84E55] cursor-pointer">SRS Travels Multi-Axle</li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-2">Architecture & Stack</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                React 19 &bull; Tailwind CSS &bull; Redis 10m TTL Lock Engine &bull; PostgreSQL 15 DDL &bull; Razorpay / Stripe Webhook Validation &bull; AIS-140 GPS
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-400">
            <div>
              &copy; {new Date().getFullYear()} wABus India. All Rights Reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>Terms & Conditions</span>
              <span>24x7 Customer Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
