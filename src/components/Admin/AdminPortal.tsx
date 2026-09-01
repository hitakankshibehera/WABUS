import React, { useState, useEffect } from 'react';
import { FeatureFlags, PayoutRecord, Trip, Route, Bus, OfferCoupon, CoachType, Booking } from '../../types';
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
  Mail,
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
  Trash2,
  X
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
  const [activeAdminTab, setActiveAdminTab] = useState<'FEATURE_FLAGS' | 'BOOKINGS' | 'SCHEDULES' | 'OFFERS' | 'PAYOUTS' | 'ANALYTICS' | 'CUSTOMERS' | 'SEAT_LAYOUT'>('FEATURE_FLAGS');
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [isCronRunning, setIsCronRunning] = useState(false);
  const [cronMessage, setCronMessage] = useState<string | null>(null);
  const [customers, setCustomers] = useState<any[]>([]);

  // WhatsApp & Booking Audit State
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [retryingPnr, setRetryingPnr] = useState<string | null>(null);
  const [waRetryStatusMsg, setWaRetryStatusMsg] = useState<string | null>(null);

  const fetchBookingsList = async () => {
    try {
      const list = await api.getBookings();
      setAllBookings(list);
    } catch (err) {
      console.warn('Failed to load bookings list:', err);
    }
  };

  const handleRetryWhatsApp = async (pnr: string) => {
    setRetryingPnr(pnr);
    setWaRetryStatusMsg(null);
    try {
      const result = await api.retryWhatsAppNotification(pnr);
      setWaRetryStatusMsg(`✅ WhatsApp notification for PNR ${pnr} dispatched to +91 9438318821! (Status: ${result.status})`);
      await fetchBookingsList();
    } catch (err: any) {
      setWaRetryStatusMsg(`❌ WhatsApp retry failed: ${err.message || 'Error sending message'}`);
    } finally {
      setRetryingPnr(null);
    }
  };

  const handleRetryEmail = async (pnr: string, email?: string) => {
    setRetryingPnr(pnr);
    setWaRetryStatusMsg(null);
    try {
      const result = await api.retryEmailNotification(pnr, email);
      setWaRetryStatusMsg(`✉️ E-Ticket confirmation email for PNR ${pnr} re-sent successfully to ${email || 'customer'}!`);
      await fetchBookingsList();
    } catch (err: any) {
      setWaRetryStatusMsg(`❌ Email retry failed: ${err.message || 'Error sending email'}`);
    } finally {
      setRetryingPnr(null);
    }
  };

  // Interactive Seat Layout Studio State
  const [selectedSeatStudioTripId, setSelectedSeatStudioTripId] = useState<string>('');
  const [editingSeats, setEditingSeats] = useState<any[]>([]);
  const [editingDeck, setEditingDeck] = useState<'LOWER' | 'UPPER'>('LOWER');
  const [seatStudioStatusMsg, setSeatStudioStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    if (trips && trips.length > 0 && !selectedSeatStudioTripId) {
      setSelectedSeatStudioTripId(trips[0].id);
      setEditingSeats(JSON.parse(JSON.stringify(trips[0].seats)));
    }
  }, [trips]);

  useEffect(() => {
    if (selectedSeatStudioTripId) {
      const match = trips.find(t => t.id === selectedSeatStudioTripId);
      if (match) {
        setEditingSeats(JSON.parse(JSON.stringify(match.seats)));
      }
    }
  }, [selectedSeatStudioTripId, trips]);

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
  const [newOfferSavingsText, setNewOfferSavingsText] = useState('');
  const [newOfferCategory, setNewOfferCategory] = useState<'BUS' | 'TRAIN' | 'HOTEL' | 'ALL'>('BUS');
  const [newOfferImageUrl, setNewOfferImageUrl] = useState('');
  const [newOfferTerms, setNewOfferTerms] = useState('');
  const [newOfferHowToUse, setNewOfferHowToUse] = useState('');
  const [isPublishingOffer, setIsPublishingOffer] = useState(false);
  const [offerSuccessMsg, setOfferSuccessMsg] = useState<string | null>(null);

  // Gift Card Email Generator State
  const [gcRecipientEmail, setGcRecipientEmail] = useState('customer@gmail.com');
  const [gcAmount, setGcAmount] = useState('500');
  const [gcCode, setGcCode] = useState('WABUS500');
  const [gcPin, setGcPin] = useState('1234');
  const [gcTitle, setGcTitle] = useState('Festival Celebration Gift Card');
  const [gcSelectedImage, setGcSelectedImage] = useState('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80');
  const [isGcSending, setIsGcSending] = useState(false);
  const [gcSuccessMsg, setGcSuccessMsg] = useState<string | null>(null);
  const [sentGiftCardPreview, setSentGiftCardPreview] = useState<{
    recipientEmail: string;
    amount: number;
    code: string;
    pin: string;
    senderEmail: string;
    message: string;
    imageUrl?: string;
    title?: string;
    previewUrl?: string;
    smtpMessageId?: string;
    smtpResponse?: string;
  } | null>(null);

  const GIFT_CARD_TEMPLATES = [
    {
      id: 'template-1',
      name: 'Festival Luxe Gift Card',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      badge: 'Red & Gold Luxe'
    },
    {
      id: 'template-2',
      name: 'Birthday & Celebration Pass',
      imageUrl: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&auto=format&fit=crop&q=80',
      badge: 'Party Lights'
    },
    {
      id: 'template-3',
      name: 'Primo VIP Black Pass',
      imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&auto=format&fit=crop&q=80',
      badge: 'VIP Luxury'
    },
    {
      id: 'template-4',
      name: 'Bus Travel Ride Voucher',
      imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80',
      badge: 'Express Bus'
    },
    {
      id: 'template-5',
      name: 'Holiday Season Gift Voucher',
      imageUrl: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=600&auto=format&fit=crop&q=80',
      badge: 'Festive Season'
    }
  ];

  const handleSendGiftCardEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gcRecipientEmail || !gcAmount) {
      alert('Please enter both customer email address and gift card amount.');
      return;
    }

    setIsGcSending(true);
    setGcSuccessMsg(null);
    try {
      const res = await api.sendAdminGiftCard({
        recipientEmail: gcRecipientEmail.trim(),
        amount: Number(gcAmount),
        code: gcCode.trim().toUpperCase(),
        pin: gcPin.trim(),
        imageUrl: gcSelectedImage,
        title: gcTitle
      });
      
      const successText = `Gift card email sent from wonderlightadventure@gmail.com to ${gcRecipientEmail.trim()}!`;
      setGcSuccessMsg(`📧 ${successText}`);
      setSentGiftCardPreview({
        recipientEmail: gcRecipientEmail.trim(),
        amount: Number(gcAmount),
        code: gcCode.trim().toUpperCase(),
        pin: gcPin.trim(),
        senderEmail: 'wonderlightadventure@gmail.com',
        message: successText,
        imageUrl: gcSelectedImage,
        title: gcTitle,
        previewUrl: res.previewUrl,
        smtpMessageId: res.smtpMessageId,
        smtpResponse: res.smtpResponse
      });
    } catch (err: any) {
      alert(err.message || 'Failed to send gift card email');
    } finally {
      setIsGcSending(false);
    }
  };

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
        badgeTag: newOfferBadge,
        savingsText: newOfferSavingsText,
        category: newOfferCategory,
        imageUrl: newOfferImageUrl,
        termsAndConditions: newOfferTerms ? newOfferTerms.split('\n').filter(Boolean) : undefined,
        howToUse: newOfferHowToUse ? newOfferHowToUse.split('\n').filter(Boolean) : undefined,
      });
      setOfferSuccessMsg(`✅ Offer ${res.offer.code} is now LIVE on the website!`);
      setNewOfferCode('');
      setNewOfferTitle('');
      setNewOfferDesc('');
      setNewOfferSavingsText('');
      setNewOfferImageUrl('');
      setNewOfferTerms('');
      setNewOfferHowToUse('');
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
  const [customBoardingStops, setCustomBoardingStops] = useState('Baramunda ISBT, Master Canteen, Vani Vihar');
  const [customDroppingStops, setCustomDroppingStops] = useState('Puri Bus Stand, Grand Road Jagannath Temple, Atharnala');
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
    fetchBookingsList();
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
        boardingStops: routeMode === 'CUSTOM' ? customBoardingStops : undefined,
        droppingStops: routeMode === 'CUSTOM' ? customDroppingStops : undefined,
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
          <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200 text-xs font-bold overflow-x-auto">
            <button
              onClick={() => setActiveAdminTab('FEATURE_FLAGS')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'FEATURE_FLAGS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Feature Flags
            </button>
            <button
              onClick={() => {
                setActiveAdminTab('BOOKINGS');
                fetchBookingsList();
              }}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === 'BOOKINGS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Bookings & WhatsApp ({allBookings.length})</span>
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
              onClick={() => setActiveAdminTab('SEAT_LAYOUT')}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeAdminTab === 'SEAT_LAYOUT' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BusIcon className="w-3.5 h-3.5" />
              <span>Seat Layout Studio</span>
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
              onClick={() => {
                setActiveAdminTab('CUSTOMERS');
                api.getAdminCustomers().then(setCustomers).catch(console.error);
              }}
              className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer ${
                activeAdminTab === 'CUSTOMERS' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Customer Accounts
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

      {/* TAB: BOOKINGS & WHATSAPP NOTIFICATION AUDIT */}
      {activeAdminTab === 'BOOKINGS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-emerald-600" />
                <span>WhatsApp Business Notification System & Booking Audit</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time booking dispatch logs, Meta WhatsApp Cloud API statuses, and automated company alerts (+91 9438318821).
              </p>
            </div>
            <button
              onClick={fetchBookingsList}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
              <span>Refresh Bookings</span>
            </button>
          </div>

          {waRetryStatusMsg && (
            <div className="p-3 bg-slate-900 text-white rounded-2xl text-xs font-semibold flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{waRetryStatusMsg}</span>
              </div>
              <button onClick={() => setWaRetryStatusMsg(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-emerald-800">Company Recipient</span>
              <div className="text-lg font-black text-emerald-950 font-mono">+91 9438318821</div>
              <span className="text-[10px] text-emerald-700 font-medium">WHATSAPP_COMPANY_NUMBER</span>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-slate-600">Total Bookings</span>
              <div className="text-xl font-black text-slate-900 font-mono">{allBookings.length}</div>
              <span className="text-[10px] text-slate-500">Verified System Bookings</span>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-emerald-800">WhatsApp Sent</span>
              <div className="text-xl font-black text-emerald-900 font-mono">
                {allBookings.filter(b => b.whatsappNotificationStatus === 'SENT' || b.whatsappDelivered).length}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold">✓ Cloud API Verified</span>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl">
              <span className="text-[10px] font-bold uppercase text-rose-800">WhatsApp Failed</span>
              <div className="text-xl font-black text-rose-900 font-mono">
                {allBookings.filter(b => b.whatsappNotificationStatus === 'FAILED').length}
              </div>
              <span className="text-[10px] text-rose-700 font-medium">Retry Available</span>
            </div>
          </div>

          {/* Bookings & WhatsApp Audit Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                  <th className="pb-3 px-3">Booking Ref / PNR</th>
                  <th className="pb-3 px-3">Customer & Contact</th>
                  <th className="pb-3 px-3">Route & Date</th>
                  <th className="pb-3 px-3">Amount & Payment</th>
                  <th className="pb-3 px-3">Email Status</th>
                  <th className="pb-3 px-3">WhatsApp Status (+91 9438318821)</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400 font-sans">
                      No customer bookings found. Create a test booking to view real-time WhatsApp logs.
                    </td>
                  </tr>
                ) : (
                  allBookings.map((b) => {
                    const primaryPassenger = b.passengers && b.passengers[0] ? b.passengers[0].name : 'Passenger';
                    const waStatus = b.whatsappNotificationStatus || (b.whatsappDelivered ? 'SENT' : 'PENDING');
                    const isWaSent = waStatus === 'SENT';
                    const isWaFailed = waStatus === 'FAILED';

                    return (
                      <tr key={b.id || b.pnr} className="hover:bg-gray-50 transition">
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-black text-slate-900 text-sm">{b.pnr}</div>
                          <div className="text-[10px] text-gray-400 font-sans">
                            {b.bookedAt ? new Date(b.bookedAt).toLocaleString() : 'Recent Booking'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-gray-900">{primaryPassenger}</div>
                          <div className="text-[11px] text-gray-500 font-mono">+91 {b.contactPhone}</div>
                          <div className="text-[10px] text-gray-400">{b.contactEmail}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-slate-800">
                            {b.trip?.originCity || 'Origin'} ➔ {b.trip?.destinationCity || 'Destination'}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {b.trip?.departureDate} at {b.trip?.departureTime}
                          </div>
                          <div className="text-[10px] text-rose-600 font-mono font-bold">
                            Reg: {b.trip?.busRegistrationNumber || 'OD-02-AX-8910'}
                          </div>
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-mono font-extrabold text-emerald-700 text-sm">
                            ₹{b.totalAmount ? b.totalAmount.toLocaleString() : 0}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            {b.paymentStatus || 'PAID'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> EMAIL SENT
                          </span>
                        </td>
                        <td className="py-3.5 px-3 space-y-1">
                          {isWaSent ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp: ✓ Sent
                            </span>
                          ) : isWaFailed ? (
                            <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 inline-flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> WhatsApp: ✕ Failed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-200 inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-600" /> WhatsApp: ⏳ Pending
                            </span>
                          )}

                          {b.whatsappMessageId && (
                            <div className="text-[10px] font-mono text-gray-500">
                              Msg ID: <span className="text-slate-800 font-bold">{b.whatsappMessageId}</span>
                            </div>
                          )}

                          {b.whatsappSentAt && (
                            <div className="text-[9px] text-gray-400">
                              Sent: {new Date(b.whatsappSentAt).toLocaleTimeString()}
                            </div>
                          )}

                          {b.whatsappError && (
                            <div className="text-[10px] text-rose-600 font-semibold bg-rose-50 p-1.5 rounded-lg border border-rose-200 max-w-xs">
                              {b.whatsappError}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleRetryEmail(b.pnr, b.contactEmail)}
                              disabled={retryingPnr === b.pnr}
                              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-[#D84E55] border border-red-200 disabled:opacity-50 rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Re-send E-Ticket email to customer"
                            >
                              <Mail className="w-3 h-3 text-[#D84E55]" />
                              <span>{retryingPnr === b.pnr ? 'Sending...' : 'Resend Email'}</span>
                            </button>
                            <button
                              onClick={() => handleRetryWhatsApp(b.pnr)}
                              disabled={retryingPnr === b.pnr}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                            >
                              <RefreshCw className={`w-3 h-3 text-emerald-400 ${retryingPnr === b.pnr ? 'animate-spin' : ''}`} />
                              <span>{retryingPnr === b.pnr ? 'Sending...' : 'Retry WhatsApp'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
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
                <div className="space-y-3">
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-gray-700 font-bold block mb-1">
                        Boarding Bus Stops (From Places - comma separated)
                      </label>
                      <input
                        type="text"
                        value={customBoardingStops}
                        onChange={e => setCustomBoardingStops(e.target.value)}
                        placeholder="e.g. Baramunda ISBT, Master Canteen, Vani Vihar"
                        className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-medium focus:border-[#D84E55] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-700 font-bold block mb-1">
                        Dropping Bus Stops (To Places - comma separated)
                      </label>
                      <input
                        type="text"
                        value={customDroppingStops}
                        onChange={e => setCustomDroppingStops(e.target.value)}
                        placeholder="e.g. Puri Bus Stand, Grand Road Jagannath Temple, Atharnala"
                        className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-medium focus:border-[#D84E55] focus:outline-none"
                      />
                    </div>
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
                        onClick={() => handleRemoveTrip(t.id, `${t.originCity} ➔ ${t.destinationCity} (${t.bus?.registrationNumber || 'Bus'})`)}
                        className="px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-[#D84E55] font-bold text-[10px] transition cursor-pointer flex items-center gap-1 border border-red-200"
                        title="Remove this bus schedule"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove Trip</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-gray-500 text-[11px]">
                    <span>Bus: <strong className="text-gray-900 font-mono">{t.bus?.registrationNumber || 'OD-02-AX-8910'}</strong></span>
                    <span>Conductor: <strong className="text-purple-700 font-semibold">{t.bus?.conductorName || 'Bijay Nayak'}</strong></span>
                    <span>Base: <strong className="text-[#D84E55] font-mono font-bold">₹{t.baseFare}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: INTERACTIVE BUS SEAT LAYOUT & ARRANGEMENT STUDIO */}
      {activeAdminTab === 'SEAT_LAYOUT' && (() => {
        const selectedTripObj = trips.find(t => t.id === selectedSeatStudioTripId) || trips[0];
        const currentSeats = editingSeats.length > 0 ? editingSeats : (selectedTripObj?.seats || []);
        const lowerSeats = currentSeats.filter((s: any) => s.deck === 'LOWER');
        const upperSeats = currentSeats.filter((s: any) => s.deck === 'UPPER');
        const activeSeats = editingDeck === 'LOWER' ? lowerSeats : upperSeats;

        const handleSeatStatusCycle = (seatId: string) => {
          setEditingSeats(prev => prev.map((s: any) => {
            if (s.id === seatId || String(s.number).toUpperCase() === String(seatId).toUpperCase()) {
              let nextStatus = 'AVAILABLE';
              let nextGender = s.bookedGender;
              let nextRestriction = s.genderRestriction;

              if (s.status === 'AVAILABLE') {
                nextStatus = 'CONDUCTOR_RESERVED';
              } else if (s.status === 'CONDUCTOR_RESERVED') {
                nextStatus = 'AVAILABLE';
                nextRestriction = 'FEMALE_ONLY';
              } else if (s.status === 'AVAILABLE' && nextRestriction === 'FEMALE_ONLY') {
                nextStatus = 'BOOKED';
                nextGender = 'MALE';
                nextRestriction = 'ANY';
              } else if (s.status === 'BOOKED') {
                nextStatus = 'AVAILABLE';
                nextGender = undefined;
                nextRestriction = 'ANY';
              }

              return {
                ...s,
                status: nextStatus,
                bookedGender: nextGender,
                genderRestriction: nextRestriction
              };
            }
            return s;
          }));
        };

        const handleSaveSeats = async () => {
          setSeatStudioStatusMsg(null);
          if (!selectedSeatStudioTripId) return;
          try {
            const res = await api.updateTripSeats(selectedSeatStudioTripId, currentSeats);
            setSeatStudioStatusMsg(`✨ Success! Seat arrangement updated and LIVE for bus ${selectedTripObj?.bus?.registrationNumber || 'vehicle'}!`);
            onRefreshTrips();
          } catch (err: any) {
            setSeatStudioStatusMsg(`❌ Failed to update seat layout: ${err?.message || 'Error saving seats'}`);
          }
        };

        return (
          <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
            {/* Studio Header */}
            <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D84E55] to-[#b83238] flex items-center justify-center shadow-sm text-white">
                    <BusIcon className="w-4.5 h-4.5" />
                  </div>
                  <span>Master Bus Seat Layout &amp; Arrangement Studio</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1 ml-10">
                  Arrange Upper &amp; Lower deck berths, conductor seat, driver cabin, and custom seat prices.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveSeats}
                className="px-5 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#c44349] text-white font-extrabold text-xs transition shadow-md cursor-pointer flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <Sparkles className="w-4 h-4" />
                <span>Save &amp; Deploy Seat Arrangement Live</span>
              </button>
            </div>

            {seatStudioStatusMsg && (
              <div className={`p-3 rounded-2xl text-xs font-bold text-center ${
                seatStudioStatusMsg.includes('✨') ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                {seatStudioStatusMsg}
              </div>
            )}

            {/* Trip Selector Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="md:col-span-6 space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                  Select Bus Schedule to Customize Layout
                </label>
                <select
                  value={selectedSeatStudioTripId}
                  onChange={(e) => setSelectedSeatStudioTripId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#D84E55] cursor-pointer"
                >
                  {trips.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.originCity} ➔ {t.destinationCity} | Bus: {t.bus?.registrationNumber || 'Vehicle'} ({t.departureTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-6 flex flex-wrap items-center gap-3 text-xs text-gray-600 font-semibold border-t md:border-t-0 md:border-l border-gray-200 pt-3 md:pt-0 md:pl-4">
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Assigned Conductor</span>
                  <span className="font-bold text-purple-700">👮 {selectedTripObj?.bus?.conductorName || 'Bijay Nayak'}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-[10px] uppercase block">Bus Model &amp; Type</span>
                  <span className="font-bold text-gray-900">{selectedTripObj?.bus?.model || 'Executive Sleeper'}</span>
                </div>
              </div>
            </div>

            {/* Deck & Cabin Controls Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Deck View:</span>
                <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setEditingDeck('LOWER')}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                      editingDeck === 'LOWER' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600'
                    }`}
                  >
                    Lower Deck ({lowerSeats.length} Seats)
                  </button>
                  {upperSeats.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditingDeck('UPPER')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        editingDeck === 'UPPER' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600'
                      }`}
                    >
                      Upper Deck ({upperSeats.length} Berths)
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                  🛞 Driver Cabin: Front Right
                </span>
                <span className="flex items-center gap-1 font-bold text-purple-900 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg">
                  👮 Conductor Reserved Seat
                </span>
              </div>
            </div>

            {/* Seat Legend Bar */}
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 p-3 rounded-2xl text-[11px] font-semibold border border-gray-200">
              <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">Seat Status Legend (Click any seat to change status):</span>
              <span className="flex items-center gap-1 text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
              </span>
              <span className="flex items-center gap-1 text-purple-800 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span> Conductor Reserved
              </span>
              <span className="flex items-center gap-1 text-pink-700 bg-pink-50 border border-pink-200 px-2 py-0.5 rounded font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span> Female Only
              </span>
              <span className="flex items-center gap-1 text-slate-500 bg-slate-200 border border-slate-300 px-2 py-0.5 rounded font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Booked / Unavailable
              </span>
            </div>

            {/* Visual Bus Interior Canvas */}
            <div className="border-2 border-dashed border-gray-300 rounded-3xl p-6 bg-slate-50 relative space-y-6">
              
              {/* Front Bus Cabin Header */}
              <div className="flex items-center justify-between border-b-2 border-slate-200 pb-4">
                <div className="flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl font-mono text-xs font-bold">
                  <span>FRONT OF BUS</span>
                </div>
                {/* Steering Wheel Badge */}
                <div className="flex items-center gap-2 bg-amber-100 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-black shadow-xs">
                  <span className="text-base">🛞</span> Driver Steering Wheel &amp; Dashboard
                </div>
              </div>

              {/* Seats Grid Canvas */}
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                {activeSeats.map((seat: any) => {
                  const isConductor = seat.status === 'CONDUCTOR_RESERVED';
                  const isFemale = seat.genderRestriction === 'FEMALE_ONLY';
                  const isBooked = seat.status === 'BOOKED';

                  let statusBg = 'bg-white border-slate-300 text-slate-900 hover:border-[#D84E55]';
                  if (isConductor) statusBg = 'bg-purple-100 border-purple-300 text-purple-900 font-black ring-2 ring-purple-400';
                  else if (isFemale) statusBg = 'bg-pink-100 border-pink-300 text-pink-900 font-bold';
                  else if (isBooked) statusBg = 'bg-slate-200 border-slate-400 text-slate-500 font-bold opacity-75';

                  return (
                    <div
                      key={seat.id}
                      onClick={() => handleSeatStatusCycle(seat.id)}
                      className={`p-3 rounded-2xl border-2 transition cursor-pointer flex flex-col items-center justify-between text-center space-y-1 shadow-xs hover:scale-105 ${statusBg}`}
                    >
                      <div className="text-[10px] font-extrabold tracking-wider uppercase text-slate-400">
                        {seat.deck === 'UPPER' ? 'Upper' : 'Lower'}
                      </div>

                      <div className="font-mono text-sm font-black tracking-tight">
                        {seat.number}
                      </div>

                      <div className="text-[10px] font-bold">
                        {isConductor ? '👮 Cond' : isFemale ? '🌸 Female' : isBooked ? '🔴 Booked' : '🟢 Avail'}
                      </div>

                      <div className="text-[10px] font-extrabold text-[#D84E55]">
                        ₹{seat.basePrice || selectedTripObj?.baseFare || 450}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Rear Bus Footer */}
              <div className="text-center border-t-2 border-slate-200 pt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                REAR ENGINE &amp; EMERGENCY EXIT DOOR
              </div>

            </div>

            {/* Deploy Action Bar */}
            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={handleSaveSeats}
                className="px-6 py-3 bg-[#D84E55] hover:bg-[#c44349] text-white font-black text-xs rounded-2xl transition shadow-lg shadow-red-500/20 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Save &amp; Deploy Seat Arrangement Live</span>
              </button>
            </div>

          </div>
        );
      })()}

      {/* TAB: OFFERS & COUPONS MANAGER */}
      {activeAdminTab === 'OFFERS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          {/* Header */}
          <div className="border-b border-gray-100 pb-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#D84E55] to-[#b83238] flex items-center justify-center shadow-sm">
                  <Tag className="w-4 h-4 text-white" />
                </div>
                <span>Exclusive Offers &amp; Coupon Manager</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1.5 ml-10">
                Publish new promo packages here and they go
                <strong className="text-[#D84E55]"> instantly live</strong> on the customer website.
                Customers see the latest offers in real-time on the homepage.
              </p>
            </div>

            <button
              onClick={fetchOffers}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Live Stats Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-emerald-700">{offers.filter(o => o.isLive).length}</div>
              <div className="text-[11px] text-emerald-800 font-semibold mt-0.5">Live on Website</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-gray-700">{offers.filter(o => !o.isLive).length}</div>
              <div className="text-[11px] text-gray-600 font-semibold mt-0.5">Paused</div>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-center">
              <div className="text-xl font-black text-[#D84E55]">{offers.length}</div>
              <div className="text-[11px] text-red-800 font-semibold mt-0.5">Total Created</div>
            </div>
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

            </div>

            {/* Row 3: Badge + Valid Until + MaxDiscount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Valid Until Date</label>
                <input
                  type="date"
                  value={newOfferValidUntil}
                  onChange={e => setNewOfferValidUntil(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Max Discount Cap (₹) <span className="text-gray-400 font-normal">Optional</span></label>
                <input
                  type="number"
                  placeholder="e.g. 250 (for % offers)"
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 font-mono text-gray-900 focus:border-[#D84E55] focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Savings Headline + Category */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Savings Headline
                  <span className="text-gray-400 font-normal ml-1">(bold card title e.g. &quot;Save up to ₹300 on bus tickets&quot;)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Save up to ₹150 on luxury night coaches"
                  value={newOfferSavingsText}
                  onChange={e => setNewOfferSavingsText(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-semibold focus:border-[#D84E55] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Category</label>
                <select
                  value={newOfferCategory}
                  onChange={e => setNewOfferCategory(e.target.value as 'BUS' | 'TRAIN' | 'HOTEL' | 'ALL')}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 font-bold focus:border-[#D84E55] focus:outline-none"
                >
                  <option value="BUS">Bus</option>
                  <option value="TRAIN">Train</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="ALL">All Categories</option>
                </select>
              </div>
            </div>

            {/* Row 5: Image URL + Preview */}
            <div className="space-y-1.5 text-xs">
              <label className="text-[11px] font-bold text-gray-700 block">
                Offer Card Image URL
                <span className="text-gray-400 font-normal ml-1">(image displayed on the offer card on customer homepage)</span>
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  placeholder="https://example.com/bus-offer-banner.png"
                  value={newOfferImageUrl}
                  onChange={e => setNewOfferImageUrl(e.target.value)}
                  className="flex-1 bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 focus:border-[#D84E55] focus:outline-none"
                />
                {newOfferImageUrl && (
                  <div className="w-20 h-14 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={newOfferImageUrl}
                      alt="preview"
                      className="w-full h-full object-contain p-1"
                      onError={e => { (e.target as HTMLImageElement).style.opacity = '0.2'; }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Offer Description */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">Offer Description <span className="text-gray-400 font-normal">(supporting subtext shown on website)</span></label>
              <input
                type="text"
                placeholder="e.g. Flat ₹150 discount on all Night Sleeper Luxury Coach bookings across Odisha corridors."
                value={newOfferDesc}
                onChange={e => setNewOfferDesc(e.target.value)}
                className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:border-[#D84E55] focus:outline-none"
              />
            </div>

            {/* Terms & Conditions & How to Use (Pop-up Modal details) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Terms &amp; Conditions
                  <span className="text-gray-400 font-normal ml-1">(one condition per line)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={`e.g. Valid on minimum booking of ₹300.\nApplicable once per user.\nCannot be combined with other offers.`}
                  value={newOfferTerms}
                  onChange={e => setNewOfferTerms(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 focus:border-[#D84E55] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  How to Use / Redeem Instructions
                  <span className="text-gray-400 font-normal ml-1">(one step per line)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={`e.g. Select your preferred bus & seats.\nProceed to passenger details page.\nEnter coupon code at checkout and click Apply.`}
                  value={newOfferHowToUse}
                  onChange={e => setNewOfferHowToUse(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs text-gray-900 focus:border-[#D84E55] focus:outline-none font-mono"
                />
              </div>
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

          {/* =========================================================================
              NEW: ADMIN GIFT CARD EMAIL SENDER PANEL (wonderlightadventure@gmail.com)
              ========================================================================= */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 border border-amber-200 rounded-2xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-amber-200/60 pb-3 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                  🎁
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">Issue &amp; Send Gift Card Email to Customer</h4>
                  <p className="text-[11px] text-amber-800">
                    Sends real HTML gift card email from <strong className="text-amber-950 font-mono underline">wonderlightadventure@gmail.com</strong> directly to customer email inbox.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-full border border-emerald-300 flex items-center gap-1 self-start sm:self-auto shrink-0 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                <span>Gmail SMTP 587 Connected</span>
              </span>
            </div>

            {gcSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{gcSuccessMsg}</span>
              </div>
            )}

            {/* Visual Gift Card Image Selector Gallery */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-amber-950 block">Select Gift Card Design Theme / Image</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {GIFT_CARD_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      setGcSelectedImage(tpl.imageUrl);
                      setGcTitle(tpl.name);
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 text-left transition cursor-pointer group ${
                      gcSelectedImage === tpl.imageUrl
                        ? 'border-amber-600 ring-2 ring-amber-500/50 shadow-md scale-[1.02]'
                        : 'border-white/80 hover:border-amber-300 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-16 object-cover" />
                    <div className="p-1.5 bg-white/95 backdrop-blur-xs text-[10px] font-bold text-slate-800 truncate">
                      {tpl.badge}
                    </div>
                    {gcSelectedImage === tpl.imageUrl && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Custom Image URL Input */}
              <div className="pt-1 flex gap-2">
                <input
                  type="text"
                  value={gcSelectedImage}
                  onChange={e => setGcSelectedImage(e.target.value)}
                  placeholder="Or paste custom gift card image URL..."
                  className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-mono text-gray-900 focus:border-amber-600 focus:outline-none"
                />
                <input
                  type="text"
                  value={gcTitle}
                  onChange={e => setGcTitle(e.target.value)}
                  placeholder="Gift Card Title"
                  className="w-48 bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>

            <form onSubmit={handleSendGiftCardEmail} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-bold text-amber-950 block mb-1">Customer Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={gcRecipientEmail}
                  onChange={e => setGcRecipientEmail(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 text-xs text-gray-900 font-semibold focus:border-amber-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-950 block mb-1">Gift Card Value (₹)</label>
                <input
                  type="number"
                  placeholder="500"
                  value={gcAmount}
                  onChange={e => setGcAmount(e.target.value)}
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono font-bold text-gray-900 focus:border-amber-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-950 block mb-1">Gift Card Code</label>
                <input
                  type="text"
                  value={gcCode}
                  onChange={e => setGcCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WABUS500"
                  className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono font-bold uppercase text-gray-900 focus:border-amber-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-amber-950 block mb-1">4-Digit PIN</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={gcPin}
                    onChange={e => setGcPin(e.target.value)}
                    placeholder="1234"
                    maxLength={4}
                    className="w-full bg-white border border-amber-300 rounded-xl p-2.5 font-mono font-bold text-gray-900 focus:border-amber-600 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isGcSending}
                    className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs uppercase tracking-wider shrink-0 transition cursor-pointer shadow-xs"
                  >
                    {isGcSending ? 'Sending Email...' : 'Send Email'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Published Offers Roster */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#D84E55]" />
              <span>All Offers Roster ({offers.length})</span>
              <span className="ml-auto text-[11px] normal-case font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {offers.filter(o => o.isLive).length} currently showing on website
              </span>
            </h4>

            {offers.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                No offers yet. Create your first exclusive offer above to push it live to the website!
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(off => (
                <div
                  key={off.id}
                  className={`rounded-2xl border transition overflow-hidden ${
                    off.isLive
                      ? 'border-gray-200 bg-white shadow-xs'
                      : 'border-gray-200 bg-gray-50/60 opacity-60'
                  }`}
                >
                  {/* Card visual: image area + controls */}
                  <div className="flex">
                    {/* Image area */}
                    <div className="w-28 shrink-0 bg-rose-50 flex items-center justify-center p-3 border-r border-gray-100">
                      {off.imageUrl ? (
                        <img
                          src={off.imageUrl}
                          alt={off.title}
                          className="w-full h-20 object-contain"
                          onError={e => { (e.target as HTMLImageElement).src = ''; }}
                        />
                      ) : (
                        <div className="w-full h-20 flex flex-col items-center justify-center gap-1">
                          <BusIcon className="w-8 h-8 text-[#D84E55] opacity-40" />
                          <span className="text-[9px] text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-3 space-y-2 min-w-0">
                      {/* Category pill + controls */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-800 text-white uppercase tracking-wider">
                          {off.category || 'Bus'}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleToggleOffer(off.id)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              off.isLive
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'
                            }`}
                          >
                            {off.isLive ? '🟢 LIVE' : '⚪ OFF'}
                          </button>
                          <button
                            onClick={() => handleDeleteOffer(off.id)}
                            className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Delete offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Savings headline */}
                      <div className="text-xs font-extrabold text-gray-900 leading-snug line-clamp-2">
                        {off.savingsText || off.title}
                      </div>

                      {/* Valid till */}
                      <div className="text-[10px] text-gray-500">
                        Valid till {new Date(off.validUntil + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>

                      {/* Coupon code row */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100">
                        <Tag className="w-3 h-3 text-[#D84E55] shrink-0" />
                        <span className="font-mono font-black text-[11px] text-gray-800">{off.code}</span>
                        {off.badgeTag && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                            {off.badgeTag}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer: stats + website visibility */}
                  {off.isLive && (
                    <div className="px-3 py-2 bg-emerald-50 border-t border-emerald-100 text-[10px] text-emerald-800 font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      Visible to customers — Homepage &amp; Checkout
                    </div>
                  )}
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

      {/* TAB: CUSTOMER ACCOUNTS & OTP AUTH SECURITY */}
      {activeAdminTab === 'CUSTOMERS' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#D84E55]" />
                <span>Customer Accounts & Passwordless OTP Audits</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Registered user profiles, email verification statuses, creation dates, and booking history relations.
              </p>
            </div>
            <div className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700">
              🔒 Plaintext OTPs & Passwords Never Stored
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] uppercase font-bold text-gray-500">
                  <th className="pb-3 px-3">Customer ID</th>
                  <th className="pb-3 px-3">Email Address</th>
                  <th className="pb-3 px-3">Verification</th>
                  <th className="pb-3 px-3">Role</th>
                  <th className="pb-3 px-3">Account Status</th>
                  <th className="pb-3 px-3">Created Date</th>
                  <th className="pb-3 px-3">Last Login</th>
                  <th className="pb-3 px-3 text-right">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-3 text-[#D84E55] font-bold text-[11px]">{c.id}</td>
                    <td className="py-3 px-3 text-gray-900 font-sans font-semibold">
                      {c.email}
                      {c.name && <div className="text-[10px] text-gray-400 font-normal">{c.name}</div>}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200 inline-flex items-center gap-1 font-sans">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> VERIFIED
                      </span>
                    </td>
                    <td className="py-3 px-3 font-sans font-bold text-slate-700">{c.role}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 text-[10px] font-bold border border-slate-200 font-sans">
                        {c.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-[11px]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-gray-500 text-[11px]">
                      {c.lastLoginAt ? new Date(c.lastLoginAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                      {c.bookingsCount || 0}
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
      {/* =========================================================
         DISPATCHED GIFT CARD EMAIL PREVIEW MODAL
         ========================================================= */}
      {sentGiftCardPreview && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
                  <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Gift Card Email Sent Successfully!</h3>
                  <p className="text-[11px] text-emerald-100 font-mono">Dispatched from wonderlightadventure@gmail.com</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSentGiftCardPreview(null)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Render Preview Container */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">From:</span>
                  <span className="font-mono font-extrabold text-slate-900">{sentGiftCardPreview.senderEmail}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-2">
                  <span className="text-slate-500 font-bold">To Customer:</span>
                  <span className="font-mono font-extrabold text-emerald-700">{sentGiftCardPreview.recipientEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Subject:</span>
                  <span className="font-bold text-slate-900">🎁 You received a ₹{sentGiftCardPreview.amount} wABus Gift Card!</span>
                </div>
              </div>

              {/* HTML Mail Body Card */}
              <div className="border border-rose-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-gradient-to-r from-[#D84E55] to-[#B83238] text-white p-4 text-center">
                  <h4 className="font-extrabold text-base">🎁 {sentGiftCardPreview.title || 'Special Gift Card for You!'}</h4>
                  <p className="text-[11px] text-red-100">From Wonderlight Adventure Company (wABus)</p>
                </div>
                <div className="p-4 space-y-3 bg-white text-slate-700">
                  <p>Master Admin (<strong className="text-slate-900">wonderlightadventure@gmail.com</strong>) has issued a <strong>₹{sentGiftCardPreview.amount}</strong> Gift Card to your email address!</p>

                  {sentGiftCardPreview.imageUrl && (
                    <div className="rounded-xl overflow-hidden shadow-xs border border-slate-100">
                      <img src={sentGiftCardPreview.imageUrl} alt="Gift Card Theme" className="w-full h-36 object-cover" />
                    </div>
                  )}

                  <div className="bg-rose-50 border border-dashed border-rose-300 rounded-xl p-4 text-center space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Gift Card Code</span>
                    <div className="text-2xl font-mono font-black text-slate-900">{sentGiftCardPreview.code}</div>
                    <div className="text-xs font-bold text-[#D84E55]">4-Digit PIN: <span className="font-mono text-slate-900">{sentGiftCardPreview.pin}</span></div>
                    <div className="text-xs font-extrabold text-emerald-700">Value: ₹{sentGiftCardPreview.amount}</div>
                  </div>

                  <div className="text-[11px] text-slate-500 space-y-1 pt-1">
                    <p className="font-bold text-slate-800">Redemption steps:</p>
                    <p>1. Customer opens Account Menu ➔ Payments ➔ <strong>Redeem gift card</strong>.</p>
                    <p>2. Enters Code <strong className="font-mono text-slate-900">{sentGiftCardPreview.code}</strong> and PIN <strong className="font-mono text-slate-900">{sentGiftCardPreview.pin}</strong>.</p>
                    <p>3. ₹{sentGiftCardPreview.amount} is added instantly to customer&apos;s wABus Wallet balance!</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {sentGiftCardPreview.previewUrl && (
                  <a
                    href={sentGiftCardPreview.previewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>📬 Open Delivered Webmail Inbox</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`Gift Card Code: ${sentGiftCardPreview.code}\nPIN: ${sentGiftCardPreview.pin}\nAmount: ₹${sentGiftCardPreview.amount}`);
                    alert('Gift Card credentials copied to clipboard!');
                  }}
                  className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs transition cursor-pointer text-center"
                >
                  📋 Copy Code &amp; PIN
                </button>
                <button
                  type="button"
                  onClick={() => setSentGiftCardPreview(null)}
                  className="flex-1 py-3 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs transition cursor-pointer shadow-md text-center"
                >
                  Done &amp; Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
