import React, { useState, useEffect } from 'react';
import { Trip, Booking, FeatureFlags } from '../../types';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';
import { useAuth } from '../../context/AuthContext';
import { 
  Camera, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  MapPin, 
  Phone, 
  Banknote, 
  ShieldCheck, 
  Radio, 
  RefreshCw,
  QrCode,
  Users,
  ChevronRight,
  Clock,
  ArrowRight,
  User,
  Lock,
  Sparkles,
  BadgeCheck,
  LogOut,
  Bus,
  Filter,
  Check
} from 'lucide-react';
import { QRScanner } from './QRScanner';
import { WalkinBookingModal } from './WalkinBookingModal';

interface ConductorPortalProps {
  trips: Trip[];
  bookings: Booking[];
  featureFlags: FeatureFlags;
  onRefreshData: () => void;
}

export const ConductorPortal: React.FC<ConductorPortalProps> = ({
  trips,
  bookings,
  featureFlags,
  onRefreshData,
}) => {
  const { currentUser, loginConductor, signupConductor, switchDemoRole, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'MANIFEST' | 'SCANNER' | 'WALKIN_DISPATCH'>('SCANNER');
  const [isWalkinModalOpen, setIsWalkinModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'BOARDED' | 'AWAITING' | 'CASH_DUE'>('ALL');
  const [isSyncing, setIsSyncing] = useState(false);

  // Conductor Gate Form state
  const [condEmpId, setCondEmpId] = useState('COND-7890');
  const [condPin, setCondPin] = useState('7890');
  const [condMode, setCondMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [condName, setCondName] = useState('Bijay Nayak');
  const [condPhone, setCondPhone] = useState('+91 94371 00001');
  const [condOperator, setCondOperator] = useState('OSRTC Volvo Premier');
  const [condBusNum, setCondBusNum] = useState('OD-02-AX-8910');
  const [authError, setAuthError] = useState<string | null>(null);

  // Determine conductor's assigned bus registration number
  const assignedBusNumber = currentUser?.assignedBusNumber || 'OD-02-AX-8910';

  // Find trip belonging to this conductor's assigned bus
  const matchingTrip = trips.find(t => 
    t.bus.registrationNumber.toUpperCase() === assignedBusNumber.toUpperCase() ||
    t.bus.conductorId === currentUser?.employeeId
  ) || trips[0];

  const [selectedTripId, setSelectedTripId] = useState<string>(matchingTrip?.id || trips[0]?.id || '');

  // Keep trip synchronized when conductor or bus changes
  useEffect(() => {
    if (matchingTrip && selectedTripId !== matchingTrip.id) {
      setSelectedTripId(matchingTrip.id);
    }
  }, [currentUser?.assignedBusNumber]);

  const selectedTrip = trips.find(t => t.id === selectedTripId) || matchingTrip || trips[0];

  // Strictly filter bookings mapped to this assigned bus vehicle
  const currentBusReg = (selectedTrip?.bus?.registrationNumber || assignedBusNumber).toUpperCase();
  const busBookings = bookings.filter(b => 
    b.trip.busRegistrationNumber.toUpperCase() === currentBusReg || 
    b.tripId === selectedTrip?.id
  );

  const handleConductorLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (condMode === 'SIGN_IN') {
        await loginConductor(condEmpId, condPin);
      } else {
        await signupConductor({
          name: condName,
          email: `${condEmpId.toLowerCase()}@osrtc.gov.in`,
          phone: condPhone,
          employeeId: condEmpId,
          assignedOperator: condOperator,
          assignedBusNumber: condBusNum
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Conductor authentication failed');
    }
  };

  // Filter manifest by search and status
  const filteredBookings = busBookings.filter(b => {
    if (b.checkInStatus === 'CANCELLED') return false;

    const matchesSearch = searchTerm
      ? b.pnr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.passengers.some(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        b.passengers.some(p => p.seatNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        b.contactPhone.includes(searchTerm)
      : true;

    if (!matchesSearch) return false;

    if (statusFilter === 'BOARDED') {
      return b.checkInStatus === 'BOARDED';
    }
    if (statusFilter === 'AWAITING') {
      return b.checkInStatus !== 'BOARDED';
    }
    if (statusFilter === 'CASH_DUE') {
      return b.paymentStatus === 'PAY_ON_BOARDING_PENDING' || (b.paymentMethod === 'PAY_ON_BOARDING_COD' && b.paymentStatus !== 'PAID_ONLINE');
    }

    return true;
  });

  const totalPassengers = busBookings.reduce((sum, b) => b.checkInStatus !== 'CANCELLED' ? sum + b.passengers.length : sum, 0);
  const boardedPassengers = busBookings
    .filter(b => b.checkInStatus === 'BOARDED')
    .reduce((sum, b) => sum + b.passengers.length, 0);
  const cashCollectionPending = busBookings
    .filter(b => b.checkInStatus !== 'CANCELLED' && (b.paymentStatus === 'PAY_ON_BOARDING_PENDING' || (b.paymentMethod === 'PAY_ON_BOARDING_COD' && b.paymentStatus !== 'PAID_ONLINE')))
    .reduce((sum, b) => sum + b.totalAmount, 0);

  const handleManualCheckIn = async (bookingId: string) => {
    try {
      await api.manualCheckInBooking(bookingId);
      soundEngine.playSuccess();
      onRefreshData();
    } catch (err) {
      soundEngine.playError();
      console.error('Manual check-in error:', err);
    }
  };

  const handleCollectCash = async (bookingId: string) => {
    try {
      await api.collectCashPayment(bookingId);
      soundEngine.playCashChime();
      onRefreshData();
    } catch (err) {
      soundEngine.playError();
      console.error('Cash collection error:', err);
    }
  };

  const handleRefresh = async () => {
    setIsSyncing(true);
    await onRefreshData();
    setTimeout(() => setIsSyncing(false), 500);
  };

  // IF USER IS NOT AUTHENTICATED AS CONDUCTOR
  if (currentUser?.role !== 'CONDUCTOR') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-[#D84E55] text-white flex items-center justify-center mx-auto shadow-lg shadow-red-500/20">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
              <BadgeCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Conductor Staff Terminal Login</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {condMode === 'SIGN_IN' ? 'Conductor Sign In' : 'Register New Conductor'}
            </h2>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please sign in with your Conductor ID & PIN to access bookings and QR verification for your assigned vehicle.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-xs text-[#D84E55] font-semibold rounded-xl border border-red-200 text-left">
              {authError}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-xl max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setCondMode('SIGN_IN')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                condMode === 'SIGN_IN' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-slate-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setCondMode('SIGN_UP')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                condMode === 'SIGN_UP' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-slate-600'
              }`}
            >
              Staff Sign Up
            </button>
          </div>

          <form onSubmit={handleConductorLogin} className="space-y-4 text-left">
            {condMode === 'SIGN_IN' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Conductor ID / Employee ID
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={condEmpId}
                      onChange={e => setCondEmpId(e.target.value)}
                      placeholder="COND-7890"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    4-Digit Security PIN
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={condPin}
                      onChange={e => setCondPin(e.target.value)}
                      placeholder="Demo PIN: 7890"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={condName}
                    onChange={e => setCondName(e.target.value)}
                    placeholder="e.g. Bijay Nayak"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Conductor ID
                    </label>
                    <input
                      type="text"
                      value={condEmpId}
                      onChange={e => setCondEmpId(e.target.value)}
                      placeholder="COND-1024"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={condPhone}
                      onChange={e => setCondPhone(e.target.value)}
                      placeholder="+91 94371 00001"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Operator
                    </label>
                    <input
                      type="text"
                      value={condOperator}
                      onChange={e => setCondOperator(e.target.value)}
                      placeholder="OSRTC Volvo Premier"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Vehicle Number
                    </label>
                    <input
                      type="text"
                      value={condBusNum}
                      onChange={e => setCondBusNum(e.target.value)}
                      placeholder="OD-02-AX-8910"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{condMode === 'SIGN_IN' ? 'Unlock Conductor Terminal' : 'Complete Staff Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo One Click Logins */}
          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <span className="text-xs text-slate-500 font-semibold">Demo Staff Accounts:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCondEmpId('COND-7890');
                  setCondPin('7890');
                  loginConductor('COND-7890', '7890');
                }}
                className="text-xs font-bold text-[#D84E55] bg-red-50 hover:bg-red-100 p-2.5 rounded-xl border border-red-200 transition flex items-center justify-between cursor-pointer"
              >
                <div className="text-left">
                  <div className="font-bold">Bijay Nayak</div>
                  <div className="text-[10px] text-slate-500 font-mono">Bus: OD-02-AX-8910</div>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-red-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCondEmpId('COND-4421');
                  setCondPin('4421');
                  loginConductor('COND-4421', '4421');
                }}
                className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl border border-blue-200 transition flex items-center justify-between cursor-pointer"
              >
                <div className="text-left">
                  <div className="font-bold">Ramesh Sahu</div>
                  <div className="text-[10px] text-slate-500 font-mono">Bus: OD-05-BQ-3456</div>
                </div>
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Conductor Active Session Status Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl px-5 py-3.5 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#D84E55] flex items-center justify-center text-xs font-black">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{currentUser.name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/30 text-red-200 border border-red-400/40 font-mono font-bold">
                ID: {currentUser.employeeId || 'COND-7890'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>Assigned Vehicle:</span>
              <strong className="text-amber-300 font-mono">{currentBusReg}</strong>
              <span className="text-slate-500">&bull;</span>
              <span>{currentUser.assignedOperator || selectedTrip?.bus.operatorName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Switch Conductor Account / Bus */}
          <button
            onClick={() => {
              if (currentUser.employeeId === 'COND-7890') {
                loginConductor('COND-4421', '4421');
              } else {
                loginConductor('COND-7890', '7890');
              }
            }}
            className="text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-700/50 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            title="Switch between conductor accounts to test vehicle access isolation"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch Bus ({currentUser.employeeId === 'COND-7890' ? 'To OD-05-BQ-3456' : 'To OD-02-AX-8910'})</span>
          </button>

          <button
            onClick={logout}
            className="text-xs font-semibold text-slate-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Conductor Top Terminal Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D84E55] text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900">Conductor In-Coach Terminal</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                  Vehicle Mapped: {currentBusReg}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Encrypted QR scanning, seat check-ins, and cash collection strictly for your bus
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('SCANNER')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'SCANNER'
                  ? 'bg-[#D84E55] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>QR Scanner (Default)</span>
            </button>

            <button
              onClick={() => setActiveTab('MANIFEST')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'MANIFEST'
                  ? 'bg-[#D84E55] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Passenger Manifest ({filteredBookings.length})
            </button>

            <button
              onClick={() => setIsWalkinModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Issue Walk-in Ticket</span>
            </button>

            <button
              onClick={handleRefresh}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              title="Sync Trip Data"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-[#D84E55]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Coach Status Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-500 uppercase">Current Route:</span>
            <span className="font-extrabold text-slate-900">
              {selectedTrip?.originCity || 'Bhubaneswar'} ➔ {selectedTrip?.destinationCity || 'Puri'} ({selectedTrip?.departureTime || '08:00'})
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono font-bold">
              Coach: {currentBusReg}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-600">
              Boarded: <strong className="text-emerald-700 font-bold">{boardedPassengers}</strong> / {totalPassengers} Pax
            </span>
            {cashCollectionPending > 0 && (
              <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 font-bold">
                Cash Due: ₹{cashCollectionPending}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: PASSENGER MANIFEST & BOARDING LOG */}
      {activeTab === 'MANIFEST' && (
        <div className="space-y-4">
          {/* Manifest Search and Filter Chips */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 flex items-center bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                placeholder="Search by PNR, Passenger Name, Seat (e.g. 1A, 2B), or Phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-transparent text-xs text-slate-900 w-full focus:outline-none"
              />
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({busBookings.filter(b => b.checkInStatus !== 'CANCELLED').length})
              </button>

              <button
                onClick={() => setStatusFilter('BOARDED')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'BOARDED'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                Boarded ({boardedPassengers})
              </button>

              <button
                onClick={() => setStatusFilter('AWAITING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'AWAITING'
                    ? 'bg-amber-700 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                Awaiting ({totalPassengers - boardedPassengers})
              </button>

              <button
                onClick={() => setStatusFilter('CASH_DUE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  statusFilter === 'CASH_DUE'
                    ? 'bg-rose-700 text-white'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
              >
                Cash Due
              </button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="space-y-3">
            {filteredBookings.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 text-xs">
                No passenger bookings found matching the current search & filters for Bus {currentBusReg}.
              </div>
            ) : (
              filteredBookings.map(booking => {
                const isBoarded = booking.checkInStatus === 'BOARDED';
                const isCashPending = booking.paymentStatus === 'PAY_ON_BOARDING_PENDING' || (booking.paymentMethod === 'PAY_ON_BOARDING_COD' && booking.paymentStatus !== 'PAID_ONLINE');

                return (
                  <div
                    key={booking.id}
                    className={`bg-white border rounded-2xl p-4 sm:p-5 transition shadow-xs ${
                      isBoarded
                        ? 'border-emerald-200 bg-emerald-50/30'
                        : isCashPending
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Passenger & Ticket Data */}
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-black text-sm text-slate-900">
                            PNR: {booking.pnr}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              isBoarded
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {isBoarded ? '✓ BOARDED' : 'AWAITING CHECK-IN'}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {booking.paymentMethod.replace(/_/g, ' ')} &bull; ₹{booking.totalAmount}
                          </span>
                          {booking.boardedAt && (
                            <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md font-semibold">
                              Checked in: {booking.boardedAt}
                            </span>
                          )}
                        </div>

                        {/* Passenger Berths */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {booking.passengers.map((p, i) => (
                            <div
                              key={i}
                              className="bg-slate-100 border border-slate-200 px-3 py-1 rounded-xl text-xs flex items-center gap-2"
                            >
                              <span className="font-extrabold text-slate-900">{p.name}</span>
                              <span className="text-[11px] text-slate-500">({p.gender}, {p.age}y)</span>
                              <span className="px-2 py-0.5 rounded bg-[#D84E55] text-white font-mono font-bold text-[10px]">
                                Seat {p.seatNumber}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Boarding location */}
                        <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-2 pt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#D84E55]" />
                            <span>Boarding: <strong className="text-slate-800">{booking.boardingPoint.name}</strong> ({booking.boardingPoint.time})</span>
                          </div>
                          <span className="text-slate-300">|</span>
                          <div className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>Phone: <strong className="text-slate-800 font-mono">+91 {booking.contactPhone}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Conductor Actions */}
                      <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0">
                        {isCashPending && (
                          <button
                            onClick={() => handleCollectCash(booking.id)}
                            className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>Collect ₹{booking.totalAmount} Cash</span>
                          </button>
                        )}

                        {!isBoarded ? (
                          <button
                            onClick={() => handleManualCheckIn(booking.id)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Boarded</span>
                          </button>
                        ) : (
                          <span className="px-3 py-2 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Passenger Boarded</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: HARDWARE QR SCANNER */}
      {activeTab === 'SCANNER' && (
        <QRScanner 
          tripId={selectedTrip?.id || ''} 
          conductorBusNumber={currentBusReg}
          conductorId={currentUser.employeeId}
          conductorName={currentUser.name}
          onScanComplete={onRefreshData} 
        />
      )}

      {/* WALK-IN CASH BOOKING MODAL */}
      {isWalkinModalOpen && selectedTrip && (
        <WalkinBookingModal
          isOpen={isWalkinModalOpen}
          onClose={() => setIsWalkinModalOpen(false)}
          trip={selectedTrip}
          onBookingSuccess={() => {
            onRefreshData();
            setIsWalkinModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
