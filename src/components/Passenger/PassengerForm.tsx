import React, { useState, useEffect } from 'react';
import { Trip, Seat, BoardingPoint, DroppingPoint, PassengerDetails, FeatureFlags, OfferCoupon } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight, 
  Info,
  CheckCircle2,
  Tag,
  CreditCard,
  Lock,
  ChevronRight,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface PassengerFormProps {
  trip: Trip;
  selectedSeats: Seat[];
  onProceedToCheckout: (data: {
    passengers: PassengerDetails[];
    boardingPoint: BoardingPoint;
    droppingPoint: DroppingPoint;
    contactEmail: string;
    contactPhone: string;
    optInWhatsApp: boolean;
    appliedCoupon: string | null;
  }) => void;
  onBack: () => void;
  featureFlags: FeatureFlags;
}

export const PassengerForm: React.FC<PassengerFormProps> = ({
  trip,
  selectedSeats,
  onProceedToCheckout,
  onBack,
  featureFlags,
}) => {
  const { currentUser } = useAuth();
  const [boardingPointId, setBoardingPointId] = useState(trip.boardingPoints[0]?.id || '');
  const [droppingPointId, setDroppingPointId] = useState(trip.droppingPoints[0]?.id || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [optInWhatsApp, setOptInWhatsApp] = useState(featureFlags.enableWhatsAppNotifications);

  // Initialize passenger records for each selected seat
  const [passengers, setPassengers] = useState<PassengerDetails[]>(() =>
    selectedSeats.map((seat, idx) => ({
      name: idx === 0 ? (currentUser?.name || '') : '',
      age: 26,
      gender: 'MALE',
      seatNumber: seat.number,
      isPrimaryContact: idx === 0,
    }))
  );

  // Synchronize contact info if user logs in after initial form render
  useEffect(() => {
    if (currentUser) {
      if (currentUser.email && (!contactEmail || contactEmail === 'ashutosh@wabus.in')) {
        setContactEmail(currentUser.email);
      }
      if (currentUser.phone && (!contactPhone || contactPhone === '9438318821')) {
        setContactPhone(currentUser.phone);
      }
      if (currentUser.name) {
        setPassengers(prev => {
          if (prev.length > 0 && (!prev[0].name || prev[0].name === 'Ashutosh Panda')) {
            const updated = [...prev];
            updated[0] = { ...updated[0], name: currentUser.name };
            return updated;
          }
          return prev;
        });
      }
    }
  }, [currentUser]);

  // Offers & Coupon State
  const [availableOffers, setAvailableOffers] = useState<OfferCoupon[]>([]);
  const [couponCode, setCouponCode] = useState('BHARAT100');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>('BHARAT100');
  const [discountAmount, setDiscountAmount] = useState<number>(100);
  const [couponSuccess, setCouponSuccess] = useState<string | null>('₹100 discount applied!');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const totalSeatsPrice = selectedSeats.reduce((acc, s) => acc + s.basePrice, 0);

  // Load live published offers from backend
  React.useEffect(() => {
    api.getOffers()
      .then(offers => {
        setAvailableOffers(offers);
        // Pre-validate default coupon
        validateCode('BHARAT100', totalSeatsPrice);
      })
      .catch(() => {});
  }, []);

  const validateCode = async (code: string, price: number) => {
    if (!code.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const res = await api.validateCoupon(code, price);
      if (res.valid) {
        setAppliedCoupon(res.code || code.toUpperCase());
        setDiscountAmount(res.discountAmount || 0);
        setCouponSuccess(res.message || `Coupon ${code.toUpperCase()} applied!`);
      } else {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponSuccess(null);
        setCouponError(res.error || 'Invalid coupon code');
      }
    } catch (err: any) {
      setAppliedCoupon(null);
      setDiscountAmount(0);
      setCouponSuccess(null);
      setCouponError('Failed to validate coupon');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: any) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    validateCode(couponCode, totalSeatsPrice);
  };

  const selectedBoarding = trip.boardingPoints.find(bp => bp.id === boardingPointId) || trip.boardingPoints[0];
  const selectedDropping = trip.droppingPoints.find(dp => dp.id === droppingPointId) || trip.droppingPoints[0];

  const gst = Math.round(totalSeatsPrice * 0.05); // 5% GST
  const finalPayable = Math.max(0, totalSeatsPrice + gst - discountAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onProceedToCheckout({
      passengers,
      boardingPoint: selectedBoarding,
      droppingPoint: selectedDropping,
      contactEmail,
      contactPhone,
      optInWhatsApp,
      appliedCoupon,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Boarding/Dropping & Passenger Information */}
        <div className="lg:col-span-2 space-y-5">
          {/* Boarding & Dropping Points Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D84E55]" />
              <span>Select Boarding & Dropping Points</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Boarding */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Boarding Point ({trip.originCity})
                </label>
                <div className="space-y-2">
                  {trip.boardingPoints.map(bp => (
                    <label
                      key={bp.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        boardingPointId === bp.id
                          ? 'border-[#D84E55] bg-red-50/50 ring-1 ring-red-300'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="boardingPoint"
                          checked={boardingPointId === bp.id}
                          onChange={() => setBoardingPointId(bp.id)}
                          className="accent-[#D84E55]"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{bp.name}</div>
                          <div className="text-[11px] text-slate-500">{bp.landmark}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs">{bp.time}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dropping */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                  Dropping Point ({trip.destinationCity})
                </label>
                <div className="space-y-2">
                  {trip.droppingPoints.map(dp => (
                    <label
                      key={dp.id}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${
                        droppingPointId === dp.id
                          ? 'border-[#D84E55] bg-red-50/50 ring-1 ring-red-300'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="droppingPoint"
                          checked={droppingPointId === dp.id}
                          onChange={() => setDroppingPointId(dp.id)}
                          className="accent-[#D84E55]"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{dp.name}</div>
                          <div className="text-[11px] text-slate-500">{dp.landmark}</div>
                        </div>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs">{dp.time}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Passenger Information Cards */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-[#D84E55]" />
              <span>Passenger Details ({passengers.length} Passenger{passengers.length > 1 ? 's' : ''})</span>
            </h3>

            <div className="space-y-3.5">
              {passengers.map((passenger, index) => (
                <div
                  key={index}
                  className="bg-slate-50/80 border border-slate-200 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-[#D84E55] text-white flex items-center justify-center text-[10px] font-bold">
                        {index + 1}
                      </span>
                      <span>Passenger {index + 1} &bull; Seat {passenger.seatNumber}</span>
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold font-mono">
                      ₹{selectedSeats[index]?.basePrice}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                    {/* Name */}
                    <div className="sm:col-span-6">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Full Name (as per Govt ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={passenger.name}
                        onChange={e => handlePassengerChange(index, 'name', e.target.value)}
                        placeholder="e.g. Ramesh Chandra Sethi"
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 focus:border-[#D84E55] focus:outline-none"
                      />
                    </div>

                    {/* Age */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Age
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        max="110"
                        value={passenger.age}
                        onChange={e => handlePassengerChange(index, 'age', Number(e.target.value))}
                        className="w-full bg-white border border-slate-300 rounded-lg p-2.5 text-xs text-slate-900 font-mono focus:border-[#D84E55] focus:outline-none"
                      />
                    </div>

                    {/* Gender */}
                    <div className="sm:col-span-4">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Gender
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {(['MALE', 'FEMALE', 'OTHER'] as const).map(g => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => handlePassengerChange(index, 'gender', g)}
                            className={`py-2 px-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                              passenger.gender === g
                                ? 'bg-[#D84E55] text-white border-[#D84E55] shadow-xs'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Details & WhatsApp Ticket Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#D84E55]" />
              <span>Contact & WhatsApp E-Ticket Delivery</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Email Address (for GST invoice & Ticket)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
                  <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="bg-transparent text-xs text-slate-900 w-full focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Mobile Number (for SMS & WhatsApp Boarding Pass)
                </label>
                <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
                  <span className="text-xs font-bold text-slate-500 mr-2">+91</span>
                  <input
                    type="tel"
                    required
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="bg-transparent text-xs font-mono font-bold text-slate-900 w-full focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* WhatsApp delivery checkbox */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-950">Send Instant PDF Ticket with QR to WhatsApp</div>
                  <div className="text-[11px] text-emerald-700">Receive live conductor GPS alerts & bus live tracking link</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={optInWhatsApp}
                onChange={e => setOptInWhatsApp(e.target.checked)}
                className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right 1 Col: Fare Summary & Coupons */}
        <div className="space-y-5">
          {/* Fare Breakdown Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4 sticky top-24">
            <h3 className="text-base font-bold text-slate-900">Fare Summary</h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Base Fare ({selectedSeats.length} Seats)</span>
                <span className="font-mono font-bold text-slate-900">₹{totalSeatsPrice}</span>
              </div>

              {trip.surgeMultiplier > 1 && (
                <div className="flex items-center justify-between text-amber-700">
                  <span>Weekend Surge</span>
                  <span className="font-mono font-bold">Included</span>
                </div>
              )}

              <div className="flex items-center justify-between text-slate-600">
                <span>GST (5% Goods & Service Tax)</span>
                <span className="font-mono font-bold text-slate-900">₹{gst}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-emerald-700 font-bold">
                  <span>Coupon Discount ({appliedCoupon})</span>
                  <span className="font-mono">-₹{discountAmount}</span>
                </div>
              )}

              <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-sm">
                <span className="font-bold text-slate-900">Total Amount</span>
                <span className="font-black font-mono text-xl text-[#D84E55]">₹{finalPayable}</span>
              </div>
            </div>

            {/* Coupon Code Box & Available Offers */}
            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-[#D84E55]" />
                <span>Apply Promo Code & Save</span>
              </span>

              {/* Available Offer Chips */}
              {availableOffers.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {availableOffers.map(off => (
                    <button
                      key={off.id}
                      type="button"
                      onClick={() => {
                        setCouponCode(off.code);
                        validateCode(off.code, totalSeatsPrice);
                      }}
                      className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border transition cursor-pointer flex items-center gap-1 ${
                        appliedCoupon === off.code
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                          : 'bg-red-50 hover:bg-red-100 text-[#D84E55] border-red-200'
                      }`}
                    >
                      <Sparkles className="w-2.5 h-2.5 text-[#D84E55]" />
                      <span>{off.code} ({off.badgeTag || `${off.discountValue} OFF`})</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Coupon (e.g. BHARAT100)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), validateCode(couponCode, totalSeatsPrice))}
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-900 uppercase focus:border-[#D84E55] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon}
                  className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1"
                >
                  {isValidatingCoupon ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </button>
              </div>

              {couponSuccess && (
                <div className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{couponSuccess}</span>
                </div>
              )}

              {couponError && (
                <div className="text-[11px] text-rose-700 bg-rose-50 p-2 rounded-lg border border-rose-200 font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{couponError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-3">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <span>PROCEED TO PAY ₹{finalPayable}</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onBack}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                Back to Seat Matrix
              </button>
            </div>

            {/* Trust badge */}
            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>256-Bit SSL Encrypted & PCI-DSS Compliant</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
