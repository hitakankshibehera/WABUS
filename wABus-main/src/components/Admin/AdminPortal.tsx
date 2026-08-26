import React, { useState, useEffect } from 'react';
import { FeatureFlags, PayoutRecord, Trip, Route, Bus } from '../../types';
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
  Key
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
  const [activeAdminTab, setActiveAdminTab] = useState<'FEATURE_FLAGS' | 'SCHEDULES' | 'PAYOUTS' | 'ANALYTICS'>('FEATURE_FLAGS');
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);

  // Admin Login/Register state
  const [adminMode, setAdminMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [adminEmail, setAdminEmail] = useState('wonderlightadventure@gmail.com');
  const [adminKey, setAdminKey] = useState('Wa@1234');
  const [adminName, setAdminName] = useState('Wonderlight Adventure Admin');
  const [adminPhone, setAdminPhone] = useState('+91 98300 11223');
  const [adminDept, setAdminDept] = useState('Central Fleet & Master Admin Operations');
  const [authError, setAuthError] = useState<string | null>(null);

  // Dynamic Schedule Generator form state
  const [routes, setRoutes] = useState<Route[]>([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [coachCategory, setCoachCategory] = useState<'DAY_COACH' | 'NIGHT_COACH'>('NIGHT_COACH');
  const [baseFareInput, setBaseFareInput] = useState('650');
  const [depTimeInput, setDepTimeInput] = useState('21:30');
  const [arrTimeInput, setArrTimeInput] = useState('06:00');
  const [isGeneratingSchedule, setIsGeneratingSchedule] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Local feature flag state
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags);

  useEffect(() => {
    setFlags(featureFlags);
  }, [featureFlags]);

  const loadPayoutsAndRoutes = async () => {
    try {
      const [payoutList, routeList] = await Promise.all([
        api.getPayouts(),
        api.getRoutes()
      ]);
      setPayouts(payoutList);
      setRoutes(routeList);
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
    try {
      await api.generateRecurringSchedule({
        routeId: selectedRouteId,
        category: coachCategory,
        baseFare: Number(baseFareInput),
        departureTime: depTimeInput,
        arrivalTime: arrTimeInput
      });
      setScheduleSuccess('Automated recurring coach schedule activated across network!');
      onRefreshTrips();
    } catch (err: any) {
      console.error('Schedule creation error:', err);
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
              <span>Automated Recurring Schedule Generator</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Generate daily Day & Night coach departures, seat matrices, and dynamic route pricing automatically.
            </p>
          </div>

          {scheduleSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{scheduleSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateRecurringSchedule} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-[11px] text-gray-600 font-bold block mb-1">Route Corridor</label>
              <select
                value={selectedRouteId}
                onChange={e => setSelectedRouteId(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
              >
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.originCity} ➔ {r.destinationCity} ({r.distanceKm} km)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block mb-1">Coach Schedule Type</label>
              <select
                value={coachCategory}
                onChange={e => setCoachCategory(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
              >
                <option value="NIGHT_COACH">🌙 Night Sleeper Coach</option>
                <option value="DAY_COACH">☀️ Day Express Seater Coach</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block mb-1">Base Fare (₹)</label>
              <input
                type="number"
                value={baseFareInput}
                onChange={e => setBaseFareInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block mb-1">Departure Time</label>
              <input
                type="time"
                value={depTimeInput}
                onChange={e => setDepTimeInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono focus:border-[#D84E55] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-gray-600 font-bold block mb-1">Arrival Time</label>
              <input
                type="time"
                value={arrTimeInput}
                onChange={e => setArrTimeInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono focus:border-[#D84E55] focus:outline-none"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={isGeneratingSchedule}
                className="w-full py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isGeneratingSchedule ? 'Generating Fleet...' : 'Create Schedule'}</span>
              </button>
            </div>
          </form>

          {/* Active Network Fleet Table */}
          <div className="pt-4 border-t border-gray-100 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Active Network Schedules ({trips.length})
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {trips.map(t => (
                <div key={t.id} className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-gray-900">
                      {t.originCity} ➔ {t.destinationCity}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-mono font-bold">
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Dep: <strong className="text-gray-900">{t.departureTime}</strong></span>
                    <span>Arr: <strong className="text-gray-900">{t.arrivalTime}</strong></span>
                    <span>Base: <strong className="text-[#D84E55] font-mono font-bold">₹{t.baseFare}</strong></span>
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
