import React, { useState, useEffect } from 'react';
import { FeatureFlags, PayoutRecord, Trip, Route, Bus, OfferCoupon, CoachType } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  ShieldCheck, 
  ToggleLeft, 
  ToggleRight, 
  Zap, 
  CreditCard, 
  Clock, 
  Sparkles, 
  DollarSign, 
  Play, 
  CheckCircle2, 
  RefreshCw, 
  Plus, 
  Calendar, 
  Layers, 
  Percent, 
  MessageSquare, 
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Bus as BusIcon,
  User,
  Lock,
  BadgeCheck,
  LogOut,
  ArrowRight,
  Key,
  Tag,
  Trash2
} from 'lucide-react';

interface AdminPortalProps {
  featureFlags: FeatureFlags;
  onUpdateFeatureFlags: (newFlags: Partial<FeatureFlags>) => Promise<void>;
  trips: Trip[];
  onRefreshTrips: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  featureFlags,
  onUpdateFeatureFlags,
  trips,
  onRefreshTrips,
}) => {
  const { currentUser, loginAdmin, signupAdmin, switchDemoRole, logout } = useAuth();
  const [activeAdminTab, setActiveAdminTab] = useState<'FEATURE_FLAGS' | 'SCHEDULES' | 'OFFERS' | 'PAYOUTS' | 'ANALYTICS'>('FEATURE_FLAGS');
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  // Offers State
  const [offers, setOffers] = useState<OfferCoupon[]>([]);
  const [newOfferCode, setNewOfferCode] = useState('');
  const [newOfferTitle, setNewOfferTitle] = useState('');
  const [newOfferDesc, setNewOfferDesc] = useState('');
  const [newOfferType, setNewOfferType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
  const [newOfferValue, setNewOfferValue] = useState('100');
  const [newOfferMinAmount, setNewOfferMinAmount] = useState('300');
  const [newOfferValidUntil, setNewOfferValidUntil] = useState('2026-12-31');
  const [newOfferBadge, setNewOfferBadge] = useState('');
  const [isPublishingOffer, setIsPublishingOffer] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      const list = await api.getAdminOffers();
      setOffers(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleCreateOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOfferCode || !newOfferTitle || !newOfferValue) return;
    setIsPublishingOffer(true);
    setOfferSuccessMsg(null);
    try {
      const res = await api.createOffer({
        code: newOfferCode,
        title: newOfferTitle,
        description: newOfferDesc,
        discountType: newOfferType,
        discountValue: Number(newOfferValue),
        minBookingAmount: Number(newOfferMinAmount || 0),
        validUntil: newOfferValidUntil,
        badgeTag: newOfferBadge
      });
      setOfferSuccessMsg(`Offer package ${res.offer.code} released live to website!`);
      setNewOfferCode('');
      setNewOfferTitle('');
      setNewOfferDesc('');
      fetchOffers();
    } catch (err: any) {
      alert(err.message || 'Failed to publish offer package');
    } finally {
      setIsPublishingOffer(false);
    }
  };

  const handleToggleOffer = async (id: string) => {
    try {
      await api.toggleOffer(id);
      fetchOffers();
    } catch (err: any) {
      alert('Failed to toggle offer');
    }
  };

  const handleDeleteOffer = async (id: string) => {
    if (!confirm('Are you sure you want to delete this offer package?')) return;
    try {
      await api.deleteOffer(id);
      fetchOffers();
    } catch (err: any) {
      alert('Failed to delete offer');
    }
  };

  const handleRemoveTrip = async (tripId: string, routeInfo: string) => {
    if (!confirm(`Are you sure you want to remove the bus schedule for ${routeInfo}?`)) return;
    try {
      await api.deleteTrip(tripId);
      await loadPayoutsAndRoutes();
      if (onRefreshTrips) onRefreshTrips();
    } catch (err: any) {
      alert('Failed to remove trip schedule');
    }
  };

  const handleRemoveBus = async (busReg: string) => {
    if (!confirm(`Are you sure you want to remove Bus ${busReg} and all its assigned schedules & conductor assignment?`)) return;
    try {
      await api.deleteBus(busReg);
      setConductorsList(prev => prev.filter(c => c.assignedBusNumber?.toUpperCase() !== busReg.toUpperCase()));
      await loadPayoutsAndRoutes();
      if (onRefreshTrips) onRefreshTrips();
    } catch (err: any) {
      alert('Failed to remove bus');
    }
  };

  // Admin Login/Register state
  const [adminMode, setAdminMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [adminEmail, setAdminEmail] = useState('wonderlightadventure@gmail.com');
  const [adminKey, setAdminKey] = useState('Wa@1234');
  const [adminName, setAdminName] = useState('Wonderlight Adventure Admin');
  const [adminPhone, setAdminPhone] = useState('+91 98300 11223');
  const [adminDept, setAdminDept] = useState('Central Fleet & Master Admin Operations');
  const [authError, setAuthError] = useState<string | null>(null);

  // Dynamic Schedule Generator & Conductor Assignment form state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [conductorsList, setConductorsList] = useState<any[]>([]);
  const [routeMode, setRouteMode] = useState<'PRESET' | 'CUSTOM'>('CUSTOM');
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [customOrigin, setCustomOrigin] = useState('Bhubaneswar');
  const [customDest, setCustomDest] = useState('Puri');
  const [coachCategory, setCoachCategory] = useState<'DAY_COACH' | 'NIGHT_COACH'>('NIGHT_COACH');
  const [selectedBusType, setSelectedBusType] = useState<CoachType>('AC_SLEEPER_2_1');
  const [customBusModel, setCustomBusModel] = useState('BharatBenz 2+1 AC Sleeper Executive');
  const [baseFareInput, setBaseFareInput] = useState('650');
  const [depTimeInput, setDepTimeInput] = useState('21:30');
  const [arrTimeInput, setArrTimeInput] = useState('06:00');
  
  // Conductor & Bus Assignment fields
  const [busRegInput, setBusRegInput] = useState('OD-02-AX-8910');
  const [condNameInput, setCondNameInput] = useState('Bijay Nayak');
  const [condEmpIdInput, setCondEmpIdInput] = useState('COND-7890');
  const [condPinInput, setCondPinInput] = useState('7890');
  const [condPhoneInput, setCondPhoneInput] = useState('+91 94371 00001');
  const [generatedCredentials, setGeneratedCredentials] = useState<{
    employeeId: string;
    pin: string;
    name: string;
    phone: string;
    busRegistrationNumber: string;
  } | null>(null);

  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Local feature flag state
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags);

  useEffect(() => {
    setFlags(featureFlags);
  }, [featureFlags]);

  const loadPayoutsAndRoutes = async () => {
    try {
      const [payoutList, routeList, condList] = await Promise.all([
        api.getPayouts(),
        api.getRoutes(),
        api.getConductors()
      ]);
      setPayouts(payoutList);
      setRoutes(routeList);
      setConductorsList(condList);
      if (routeList.length > 0 && !selectedRouteId) {
        setSelectedRouteId(routeList[0].id);
      }
    } catch (err) {
      console.error('Admin loading failed:', err);
    }
  };

  useEffect(() => {
    loadPayoutsAndRoutes();
  }, []);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      if (adminMode === 'SIGN_IN') {
        await loginAdmin(adminEmail, adminKey);
      } else {
        await signupAdmin({
          name: adminName,
          email: adminEmail,
          phone: adminPhone,
          adminDepartment: adminDept
        });
      }
    } catch (err: any) {
      setAuthError(err.message || 'Admin authentication failed');
    }
  };

  const handleToggle = async (key: keyof FeatureFlags, value: any) => {
    const updated = { ...flags, [key]: value };
    setFlags(updated);
    await onUpdateFeatureFlags({ [key]: value });
  };

  const handleRunMidnightCron = async () => {
    setIsCronRunning(true);
    setCronMessage(null);
    try {
      await new Promise(r => setTimeout(r, 1200));
      const res = await api.triggerPayoutCron();
      setCronMessage(res.message);
      setPayouts(prev => [res.payout, ...prev]);
    } catch (err: any) {
      setCronMessage('Cron failure: ' + err.message);
    } finally {
      setIsCronRunning(false);
    }
  };

  const handleCreateRecurringSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingSchedule(true);
    setScheduleSuccess(null);
    setGeneratedCredentials(null);
    try {
      const res = await api.generateRecurringSchedule({
        routeId: routeMode === 'PRESET' ? selectedRouteId : undefined,
        originCity: routeMode === 'CUSTOM' ? customOrigin : undefined,
        destinationCity: routeMode === 'CUSTOM' ? customDest : undefined,
        category: coachCategory,
        busType: selectedBusType,
        busModel: customBusModel,
        baseFare: Number(baseFareInput),
        departureTime: depTimeInput,
        arrivalTime: arrTimeInput,
        busRegistrationNumber: busRegInput,
        conductorName: condNameInput,
        conductorEmployeeId: condEmpIdInput,
        conductorPin: condPinInput,
        conductorPhone: condPhoneInput
      });
      setScheduleSuccess(`✨ Real-Time Success! Bus ${res.trip.bus.registrationNumber} (${res.trip.originCity} ➔ ${res.trip.destinationCity}) added and LIVE on the website! Conductor ${res.trip.bus.conductorName} assigned with ID: ${res.conductorCredentials?.employeeId} & Password: ${res.conductorCredentials?.pin}.`);
      if (res.conductorCredentials) {
        setGeneratedCredentials(res.conductorCredentials);
      }
      const updatedConductors = await api.getConductors();
      setConductorsList(updatedConductors);
      onRefreshTrips();
    } catch (err: any) {
      console.error('Schedule creation error:', err);
      alert('Failed to add bus: ' + (err.message || 'Server error'));
    } finally {
      setIsGeneratingSchedule(false);
    }
  };

  // Metrics calculation
  const totalGrossRevenue = payouts.reduce((sum, p) => sum + p.grossBookingsAmount, 0) + 42800;
  const totalPlatformCommission = Math.round(totalGrossRevenue * (flags.platformCommissionRate || 0.08));

  // IF USER IS NOT LOGGED IN AS ADMIN
  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-purple-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-purple-500/20">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-purple-800 border border-purple-200 text-xs font-bold">
              <Key className="w-3.5 h-3.5 text-purple-600" />
              <span>Master Admin Security Gateway</span>
            </div>
            <h2 className="text-2xl font-black text-gray-900">
              {adminMode === 'SIGN_IN' ? 'Master Admin Sign In' : 'Provision Admin Account'}
            </h2>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Authorized access required for dynamic feature flag controls, remote config distribution, and automated midnight payout cron triggers.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 text-xs text-[#D84E55] font-semibold rounded-xl border border-red-200 text-left">
              {authError}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-gray-100 p-1 rounded-xl max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setAdminMode('SIGN_IN')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                adminMode === 'SIGN_IN' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setAdminMode('SIGN_UP')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                adminMode === 'SIGN_UP' ? 'bg-white text-purple-700 shadow-xs' : 'text-gray-600'
              }`}
            >
              Register Admin
            </button>
          </div>

          <form onSubmit={handleAdminAuth} className="space-y-4 text-left">
            {adminMode === 'SIGN_IN' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Administrator Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="wonderlightadventure@gmail.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Master Password / Security Key
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={adminKey}
                      onChange={e => setAdminKey(e.target.value)}
                      placeholder="Password: Wa@1234"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Admin Full Name
                  </label>
                  <input
                    type="text"
                    value={adminName}
                    onChange={e => setAdminName(e.target.value)}
                    placeholder="e.g. Wonderlight Adventure Admin"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={e => setAdminEmail(e.target.value)}
                      placeholder="wonderlightadventure@gmail.com"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={adminPhone}
                      onChange={e => setAdminPhone(e.target.value)}
                      placeholder="+91 98300 11223"
                      className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Administrative Department
                  </label>
                  <select
                    value={adminDept}
                    onChange={e => setAdminDept(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-600 cursor-pointer"
                  >
                    <option value="Central Fleet & Master Admin Operations">Central Fleet & Master Admin Operations</option>
                    <option value="Operations & Automation">Operations & Automation</option>
                    <option value="Fleet Pricing & Dynamic Revenue">Fleet Pricing & Dynamic Revenue</option>
                    <option value="Platform Security & Infrastructure">Platform Security & Infrastructure</option>
                    <option value="Executive Management">Executive Management</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{adminMode === 'SIGN_IN' ? 'Authorize Master Console' : 'Complete Administrator Enrollment'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo One Click Login */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Master Admin Access:</span>
            <button
              type="button"
              onClick={() => switchDemoRole('ADMIN')}
              className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>1-Click Master Admin (wonderlightadventure@gmail.com)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Master Admin Active Session Bar */}
      <div className="bg-gradient-to-r from-purple-950 via-gray-900 to-gray-900 text-white rounded-2xl px-5 py-3 shadow-md flex flex-wrap items-center justify-between gap-3 border border-purple-900/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold">
            {currentUser.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold">{currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/30 text-purple-200 border border-purple-400/40 font-mono">
                {currentUser.adminDepartment || 'Operations & Automation'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">
              Email: {currentUser.email} &bull; Remote Config Root Access Granted
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-xs font-semibold text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-red-400" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Admin Top Header */}
      <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#D84E55] text-white flex items-center justify-center shadow-md shadow-red-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-gray-900">Master Admin & Automation Engine</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                  Live Remote Config Active
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Zero-downtime feature flags, recurring day/night schedule generator & automated midnight payouts
              </p>
            </div>
          </div>

          {/* Admin Navigation Pills */}
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold">
            <button
              onClick={() => setActiveAdminTab('FEATURE_FLAGS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'FEATURE_FLAGS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feature Flags
            </button>
            <button
              onClick={() => setActiveAdminTab('SCHEDULES')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'SCHEDULES' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Fleet & Schedules
            </button>
            <button
              onClick={() => setActiveAdminTab('OFFERS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'OFFERS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Offers & Coupons ({offers.filter(o => o.isLive).length})
            </button>
            <button
              onClick={() => setActiveAdminTab('PAYOUTS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'PAYOUTS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Midnight Payouts
            </button>
            <button
              onClick={() => setActiveAdminTab('ANALYTICS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'ANALYTICS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: ZERO-DOWNTIME FEATURE FLAGS */}
      {activeAdminTab === 'FEATURE_FLAGS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>Zero-Downtime Live Remote Config Engine</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Toggle critical business logic and promotional banners instantly across web, iOS, and Android without deploying new builds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Surge Pricing Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Dynamic Weekend Surge Pricing</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    flags.enableSurgePricing ? 'bg-orange-100 text-orange-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {flags.enableSurgePricing ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Automatically adjusts base fares (+20%) on high-demand routes like Bhubaneswar ⇄ Puri/Rourkela and Bangalore ⇄ Hyderabad.
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableSurgePricing', !flags.enableSurgePricing)}
                className="text-[#D84E55] hover:opacity-80 transition cursor-pointer"
              >
                {flags.enableSurgePricing ? <ToggleRight className="w-8 h-8 fill-[#D84E55] text-[#D84E55]" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
            </div>

            {/* Pay On Boarding COD Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Pay on Boarding (Cash on Delivery)</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    flags.enablePayOnBoarding ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {flags.enablePayOnBoarding ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Permits passengers to reserve seats online and pay the conductor in cash upon boarding.
                </p>
              </div>
              <button
                onClick={() => handleToggle('enablePayOnBoarding', !flags.enablePayOnBoarding)}
                className="text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
              >
                {flags.enablePayOnBoarding ? <ToggleRight className="w-8 h-8 fill-emerald-600 text-emerald-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
            </div>

            {/* WhatsApp Notifications Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Instant WhatsApp Business PDF Delivery</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    flags.enableWhatsAppNotifications ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {flags.enableWhatsAppNotifications ? 'ACTIVE' : 'MUTED'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Dispatches high-resolution PDF tickets with cryptographic QR codes directly to passenger WhatsApp numbers.
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableWhatsAppNotifications', !flags.enableWhatsAppNotifications)}
                className="text-emerald-600 hover:text-emerald-700 transition cursor-pointer"
              >
                {flags.enableWhatsAppNotifications ? <ToggleRight className="w-8 h-8 fill-emerald-600 text-emerald-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
            </div>

            {/* Dynamic Cancellation Shield Toggle */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">Dynamic Refund & Cancellation Policy</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    flags.enableDynamicCancellation ? 'bg-blue-100 text-blue-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {flags.enableDynamicCancellation ? 'ENABLED' : 'DISABLED'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Computes tiered automatic refunds based on time remaining before scheduled bus departure.
                </p>
              </div>
              <button
                onClick={() => handleToggle('enableDynamicCancellation', !flags.enableDynamicCancellation)}
                className="text-blue-600 hover:text-blue-700 transition cursor-pointer"
              >
                {flags.enableDynamicCancellation ? <ToggleRight className="w-8 h-8 fill-blue-600 text-blue-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
            </div>

            {/* Maintenance Mode Emergency Switch */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-start justify-between gap-4">
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm">System Maintenance Mode</span>
                  <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                    flags.maintenanceMode ? 'bg-rose-100 text-rose-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {flags.maintenanceMode ? 'ACTIVE' : 'OFF'}
                  </span>
                </div>
                <p className="text-gray-500 text-[11px]">
                  Displays global maintenance banner and pauses checkout operations during database migrations.
                </p>
              </div>
              <button
                onClick={() => handleToggle('maintenanceMode', !flags.maintenanceMode)}
                className="text-rose-600 hover:text-rose-700 transition cursor-pointer"
              >
                {flags.maintenanceMode ? <ToggleRight className="w-8 h-8 fill-rose-600 text-rose-600" /> : <ToggleLeft className="w-8 h-8 text-gray-400" />}
              </button>
            </div>

            {/* Redis Lock TTL Settings */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="space-y-1 text-xs">
                <span className="font-bold text-gray-900 text-sm">Redis Seat Lock TTL Duration</span>
                <p className="text-gray-500 text-[11px]">
                  Current expiry: <strong className="text-[#D84E55]">{flags.seatLockDurationMinutes} Minutes</strong>
                </p>
              </div>
              <select
                value={flags.seatLockDurationMinutes}
                onChange={e => handleToggle('seatLockDurationMinutes', Number(e.target.value))}
                className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-xs text-gray-900 font-bold focus:outline-none focus:border-[#D84E55]"
              >
                <option value="5">5 Minutes</option>
                <option value="10">10 Minutes (Standard)</option>
                <option value="15">15 Minutes</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FLEET & SCHEDULE AUTOMATION */}
      {activeAdminTab === 'SCHEDULES' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#D84E55]" />
              <span>Automated Recurring Schedule Generator & Conductor Provisioning</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Assign recurring bus vehicle numbers, provision conductor login credentials (ID & Password), and launch daily Day & Night schedules automatically.
            </p>
          </div>

          {scheduleSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{scheduleSuccess}</span>
            </div>
          )}

          {/* Generated Conductor Credentials Badge */}
          {generatedCredentials && (
            <div className="p-4 bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-2xl text-white space-y-3 shadow-md border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30">
                    <Key className="w-4 h-4 text-purple-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-200">
                      Conductor Staff Credentials Issued
                    </h4>
                    <p className="text-[11px] text-gray-300">
                      Give these credentials to the conductor to log into the website and access ticket manifests for Bus {generatedCredentials.busRegistrationNumber}.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  ACTIVE & READY
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/30 p-3 rounded-xl border border-white/10 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-sans font-bold block">Conductor Name</span>
                  <span className="font-bold text-white">{generatedCredentials.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-sans font-bold block">Login ID / Emp ID</span>
                  <span className="font-bold text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">{generatedCredentials.employeeId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 uppercase font-sans font-bold block">Password / PIN</span>
                  <span className="font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">{generatedCredentials.pin}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 uppercase font-sans font-bold block">Assigned Bus</span>
                  <span className="font-bold text-white">{generatedCredentials.busRegistrationNumber}</span>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleCreateRecurringSchedule} className="space-y-5">
            {/* Route Selection Mode */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">1. Route & Bus Location</span>
                <div className="flex bg-gray-200 p-0.5 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setRouteMode('CUSTOM')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      routeMode === 'CUSTOM' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Custom From ➔ To Cities
                  </button>
                  <button
                    type="button"
                    onClick={() => setRouteMode('PRESET')}
                    className={`px-3 py-1 rounded-md transition cursor-pointer ${
                      routeMode === 'PRESET' ? 'bg-white text-[#D84E55] shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Select Preset Corridor
                  </button>
                </div>
              </div>

              {routeMode === 'CUSTOM' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-gray-700 font-bold block mb-1">From City (Origin)</label>
                    <input
                      type="text"
                      value={customOrigin}
                      onChange={e => setCustomOrigin(e.target.value)}
                      placeholder="e.g. Bhubaneswar"
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-700 font-bold block mb-1">To City (Destination)</label>
                    <input
                      type="text"
                      value={customDest}
                      onChange={e => setCustomDest(e.target.value)}
                      placeholder="e.g. Puri"
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                      required
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[11px] text-gray-700 font-bold block mb-1">Select Preset Route Corridor</label>
                  <select
                    value={selectedRouteId}
                    onChange={e => setSelectedRouteId(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none text-xs"
                  >
                    {routes.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.originCity} ➔ {r.destinationCity} ({r.distanceKm} km)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Coach & Bus Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Bus Number (Registration No.)</label>
                <input
                  type="text"
                  value={busRegInput}
                  onChange={e => setBusRegInput(e.target.value)}
                  placeholder="e.g. OD-02-AX-8910"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Coach Type (Layout)</label>
                <select
                  value={selectedBusType}
                  onChange={e => {
                    const val = e.target.value as CoachType;
                    setSelectedBusType(val);
                    if (val === 'AC_SLEEPER_2_1') {
                      setCoachCategory('NIGHT_COACH');
                      setCustomBusModel('BharatBenz 2+1 AC Sleeper Executive');
                    } else if (val === 'SCANIA_LUXURY_SLEEPER') {
                      setCoachCategory('NIGHT_COACH');
                      setCustomBusModel('Scania Metrolink Multi-Axle Sleeper');
                    } else {
                      setCoachCategory('DAY_COACH');
                      setCustomBusModel('Volvo 9600 Multi-Axle Express');
                    }
                  }}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                >
                  <option value="AC_SLEEPER_2_1">🛌 AC Sleeper (2+1)</option>
                  <option value="VOLVO_MULTI_AXLE_2_2">💺 Volvo Multi-Axle Seater (2+2)</option>
                  <option value="SCANIA_LUXURY_SLEEPER">👑 Scania Luxury Sleeper</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Bus Model Name</label>
                <input
                  type="text"
                  value={customBusModel}
                  onChange={e => setCustomBusModel(e.target.value)}
                  placeholder="e.g. BharatBenz 2+1 AC Sleeper Executive"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-medium focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Departure Start Time (Arrival at Origin)</label>
                <input
                  type="time"
                  value={depTimeInput}
                  onChange={e => setDepTimeInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Reach Time (Arrival at Destination)</label>
                <input
                  type="time"
                  value={arrTimeInput}
                  onChange={e => setArrTimeInput(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] text-gray-600 font-bold block mb-1">Base Fare per Seat (₹)</label>
                <input
                  type="number"
                  value={baseFareInput}
                  onChange={e => setBaseFareInput(e.target.value)}
                  placeholder="650"
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Conductor Provisioning Section */}
            <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-purple-700" />
                <h4 className="text-xs font-black text-purple-950 uppercase tracking-wider">
                  Assign Conductor Staff & Generate Login Credentials
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-gray-700 font-bold block mb-1">Conductor Full Name</label>
                  <input
                    type="text"
                    value={condNameInput}
                    onChange={e => setCondNameInput(e.target.value)}
                    placeholder="e.g. Bijay Nayak"
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-gray-900 font-medium focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-700 font-bold block mb-1">Conductor ID (Login Username)</label>
                  <input
                    type="text"
                    value={condEmpIdInput}
                    onChange={e => setCondEmpIdInput(e.target.value)}
                    placeholder="e.g. COND-7890"
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-gray-900 font-mono font-bold focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-700 font-bold block mb-1">Password / Security PIN</label>
                  <input
                    type="text"
                    value={condPinInput}
                    onChange={e => setCondPinInput(e.target.value)}
                    placeholder="e.g. 7890"
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-gray-900 font-mono font-bold focus:border-purple-600 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] text-gray-700 font-bold block mb-1">Conductor Mobile Phone</label>
                  <input
                    type="text"
                    value={condPhoneInput}
                    onChange={e => setCondPhoneInput(e.target.value)}
                    placeholder="e.g. +91 94371 00001"
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-gray-900 font-medium focus:border-purple-600 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isGeneratingSchedule}
                className="py-3 px-6 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{isGeneratingSchedule ? 'Adding Bus & Publishing Real-Time...' : '🚀 ADD BUS & LAUNCH LIVE ON WEBSITE REAL-TIME'}</span>
              </button>
            </div>
          </form>

          {/* Active Network Fleet & Conductor Roster Table */}
          <div className="pt-4 border-t border-gray-100 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
                <BusIcon className="w-4 h-4 text-purple-700" />
                <span>Provisioned Conductor Credentials Roster ({conductorsList.length})</span>
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {conductorsList.map(c => (
                <div key={c.id || c.employeeId} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                        {c.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-900 block">{c.name}</span>
                        <span className="text-[10px] text-gray-500">{c.phone}</span>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-mono font-bold">
                      Bus: {c.assignedBusNumber}
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-xl border border-gray-200 flex items-center justify-between font-mono text-[11px]">
                    <div>
                      <span className="text-gray-400 text-[10px]">ID: </span>
                      <strong className="text-purple-700">{c.employeeId}</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 text-[10px]">PIN/Pass: </span>
                      <strong className="text-emerald-700">{c.pin}</strong>
                    </div>
                    <button
                      onClick={() => handleRemoveBus(c.assignedBusNumber)}
                      className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[#D84E55] font-sans font-bold text-[10px] transition cursor-pointer flex items-center gap-1 border border-red-200"
                      title="Remove Bus & Cancel Schedules"
                    >
                      <Trash2 className="w-3 h-3 text-[#D84E55]" />
                      <span>Remove Bus</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 pt-2">
              Active Network Schedules ({trips.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trips.map(t => (
                <div key={t.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-gray-900">
                      {t.originCity} ➔ {t.destinationCity}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-mono font-bold">
                        {t.category}
                      </span>
                      <button
                        onClick={() => handleRemoveTrip(t.id, `${t.originCity} ➔ ${t.destinationCity} (${t.bus.registrationNumber})`)}
                        className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[#D84E55] font-bold text-[10px] transition cursor-pointer flex items-center gap-1 border border-red-200"
                        title="Remove this bus schedule"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Trip</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Bus: <strong className="text-gray-900 font-mono">{t.bus.registrationNumber}</strong></span>
                    <span>Conductor: <strong className="text-purple-700 font-semibold">{t.bus.conductorName}</strong></span>
                    <span>Base: <strong className="text-[#D84E55] font-mono font-bold">₹{t.baseFare}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: OFFERS & COUPONS MANAGER */}
      {activeAdminTab === 'OFFERS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-[#D84E55]" />
                <span>Offers & Promotional Coupon Code Manager</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Create new promotional packages, specify flat/percentage discounts, and release live offers instantly to website customers.
              </p>
            </div>

            <button
              onClick={fetchOffers}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Offers</span>
            </button>
          </div>

          {/* Create & Release New Offer Form */}
          <form onSubmit={handleCreateOffer} className="bg-red-50/50 border border-red-100 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#D84E55]" />
                <span>Create & Release New Offer Package</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold border border-emerald-200">
                Instant Live Push to Checkout
              </span>
            </div>

            {offerSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{offerSuccessMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Coupon Code (UPPERCASE)</label>
                <input
                  type="text"
                  placeholder="e.g. FESTIVE150"
                  value={newOfferCode}
                  onChange={e => setNewOfferCode(e.target.value.toUpperCase())}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-mono font-bold text-gray-900 uppercase focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Offer Title</label>
                <input
                  type="text"
                  placeholder="e.g. Festival Season Luxury Coach Offer"
                  value={newOfferTitle}
                  onChange={e => setNewOfferTitle(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-medium focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Discount Type</label>
                <select
                  value={newOfferType}
                  onChange={e => setNewOfferType(e.target.value as 'FLAT' | 'PERCENTAGE')}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                >
                  <option value="FLAT">Flat Amount (₹)</option>
                  <option value="PERCENTAGE">Percentage (%)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Discount Value ({newOfferType === 'FLAT' ? '₹ Amount' : '% Percent'})
                </label>
                <input
                  type="number"
                  placeholder="e.g. 150"
                  value={newOfferValue}
                  onChange={e => setNewOfferValue(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-mono font-bold text-gray-900 focus:border-[#D84E55] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Min Booking Value (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 300"
                  value={newOfferMinAmount}
                  onChange={e => setNewOfferMinAmount(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-mono font-bold text-gray-900 focus:border-[#D84E55] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Badge Tag</label>
                <input
                  type="text"
                  placeholder="e.g. FLAT ₹150 OFF"
                  value={newOfferBadge}
                  onChange={e => setNewOfferBadge(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-mono text-gray-900 focus:border-[#D84E55] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Offer Description</label>
              <input
                type="text"
                placeholder="e.g. Flat ₹150 discount on all Night Sleeper Luxury Coach bookings across Odisha corridors."
                value={newOfferDesc}
                onChange={e => setNewOfferDesc(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:border-[#D84E55] focus:outline-none"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={isPublishingOffer}
                className="py-3 px-6 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isPublishingOffer ? 'Publishing Package...' : 'Publish & Release Offer Package to Website'}</span>
              </button>
            </div>
          </form>

          {/* Published Offers Roster Table */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#D84E55]" />
              <span>Live Promotional Offers & Coupon Roster ({offers.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(off => (
                <div 
                  key={off.id}
                  className={`p-4 rounded-2xl border transition space-y-3 ${
                    off.isLive 
                      ? 'bg-white border-gray-200 shadow-xs' 
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono px-3 py-1 bg-red-50 text-[#D84E55] rounded-xl border border-red-200">
                        {off.code}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200">
                        {off.badgeTag || `${off.discountValue} OFF`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleOffer(off.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          off.isLive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        {off.isLive ? '🟢 LIVE' : '⚪ PAUSED'}
                      </button>

                      <button
                        onClick={() => handleDeleteOffer(off.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Delete offer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-gray-900">{off.title}</h5>
                    <p className="text-[11px] text-gray-500">{off.description}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-600 pt-2 border-t border-gray-100">
                    <span>Discount: <strong className="text-emerald-700 font-bold">{off.discountType === 'FLAT' ? `₹${off.discountValue} FLAT` : `${off.discountValue}%`}</strong></span>
                    <span>Min Spend: <strong className="text-gray-900">₹{off.minBookingAmount}</strong></span>
                    <span>Valid Until: <strong className="text-gray-500">{off.validUntil}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MIDNIGHT CRON PAYOUT ENGINE */}
      {activeAdminTab === 'PAYOUTS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Automated Midnight Operator Payout Engine</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Executes daily at 00:00:00 IST via Razorpay Route / Stripe Connect, auto-deducting 8% platform fee + 1% Section 194O TDS.
              </p>
            </div>

            <button
              onClick={handleRunMidnightCron}
              disabled={isCronRunning}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4" />
              <span>{isCronRunning ? 'Calculating & Dispersing...' : 'Trigger Midnight Payout Cron'}</span>
            </button>
          </div>

          {cronMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{cronMessage}</span>
            </div>
          )}

          {/* Payout History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                  <th className="pb-3 px-3">Payout Date</th>
                  <th className="pb-3 px-3">Operator</th>
                  <th className="pb-3 px-3">Gross Bookings</th>
                  <th className="pb-3 px-3">Platform Fee (8%)</th>
                  <th className="pb-3 px-3">TDS (1%)</th>
                  <th className="pb-3 px-3">Net Dispersed</th>
                  <th className="pb-3 px-3">Gateway Ref</th>
                  <th className="pb-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {payouts.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-3 text-gray-900 font-bold">{p.payoutDate}</td>
                    <td className="py-3 px-3 text-gray-800 font-sans font-medium">{p.operatorName}</td>
                    <td className="py-3 px-3 text-gray-700">₹{p.grossBookingsAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-orange-700 font-semibold">-₹{p.platformCommissionAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-gray-500">-₹{p.tdsDeductionAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-emerald-700 font-black text-sm">₹{p.netPayoutAmount.toLocaleString()}</td>
                    <td className="py-3 px-3 text-[10px] text-gray-400">{p.gatewayReference}</td>
                    <td className="py-3 px-3 text-right">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ANALYTICS OVERVIEW */}
      {activeAdminTab === 'ANALYTICS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#D84E55]" />
              <span>Ecosystem Revenue & Fleet Occupancy Analytics</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Gross Network GMV</span>
              <div className="text-2xl font-black font-mono text-gray-900">₹{totalGrossRevenue.toLocaleString()}</div>
              <span className="text-[10px] text-emerald-700 font-bold">↑ 18.4% this week</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Net Platform Commission</span>
              <div className="text-2xl font-black font-mono text-[#D84E55]">₹{totalPlatformCommission.toLocaleString()}</div>
              <span className="text-[10px] text-gray-500">8% Take Rate</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Day vs Night Coach Split</span>
              <div className="text-2xl font-black font-mono text-blue-700">68% / 32%</div>
              <span className="text-[10px] text-gray-500">Night Sleeper preference</span>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase">Seat Lock Conflict Rate</span>
              <div className="text-2xl font-black font-mono text-emerald-700">0.00%</div>
              <span className="text-[10px] text-gray-500">Redis Mutex Protection</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
