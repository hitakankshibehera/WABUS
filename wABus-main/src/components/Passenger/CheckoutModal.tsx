import React, { useState, useEffect } from 'react';
import { PaymentMethod, FeatureFlags } from '../../types';
import { soundEngine } from '../../utils/audio';
import { api } from '../../services/api';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Gift, 
  Banknote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Clock,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: (method: PaymentMethod, reference: string) => Promise<void>;
  featureFlags: FeatureFlags;
  lockExpiresAt: number | null;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  amount,
  onPaymentSuccess,
  featureFlags,
  lockExpiresAt,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('UPI_QR');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiVpa, setUpiVpa] = useState('user@okaxis');
  const [cardNumber, setCardNumber] = useState('4532 8901 2345 6789');
  const [cardExpiry, setCardExpiry] = useState('08/29');
  const [cardCvv, setCardCvv] = useState('884');
  const [cardName, setCardName] = useState('Ashutosh Panda');
  
  // Gift Card State
  const [gcCode, setGcCode] = useState('');
  const [gcPin, setGcPin] = useState('');
  const [showGcPin, setShowGcPin] = useState(false);
  const [gcSuccess, setGcSuccess] = useState<string | null>(null);
  const [gcError, setGcError] = useState<string | null>(null);
  
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number | null>(null);

  // Redis Lock countdown
  useEffect(() => {
    if (!lockExpiresAt || !isOpen) return;
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((lockExpiresAt - Date.now()) / 1000));
      setTimeRemainingSeconds(remaining);
      if (remaining === 0) {
        onClose();
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lockExpiresAt, isOpen, onClose]);

  if (!isOpen) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    setGcError(null);
    setGcSuccess(null);

    try {
      if (selectedMethod === 'GIFT_CARD') {
        if (!gcCode.trim() || !gcPin.trim()) {
          setGcError('Please enter both Gift Card Code and 4-digit PIN.');
          setIsProcessing(false);
          return;
        }

        try {
          const res = await api.redeemGiftCard(gcCode.trim(), gcPin.trim());
          if (res.success) {
            setGcSuccess(`Gift card ${gcCode.toUpperCase()} of ₹${res.amount} redeemed successfully!`);
            const refId = `GC_${gcCode.trim().toUpperCase()}`;
            await onPaymentSuccess('GIFT_CARD', refId);
            soundEngine.playSuccess();
            return;
          }
        } catch (err: any) {
          setGcError(err.message || 'Invalid Gift Card Code or PIN.');
          soundEngine.playError();
          setIsProcessing(false);
          return;
        }
      }

      await new Promise(r => setTimeout(r, 1200));
      const refId = `PAY_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      await onPaymentSuccess(selectedMethod, refId);
      soundEngine.playSuccess();
    } catch (err) {
      soundEngine.playError();
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#C33E44] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-tight">Select Payment Option</h3>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-white/20">
                  wABus Pay
                </span>
              </div>
              <p className="text-[11px] text-red-100">PCI-DSS 256-Bit Encrypted Payment Gateway</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lock Expiry Indicator */}
        {timeRemainingSeconds !== null && (
          <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 text-[#D84E55] font-semibold">
              <Clock className="w-3.5 h-3.5 animate-pulse" />
              <span>Seat Lock Active &bull; Time left:</span>
            </div>
            <span className="font-mono font-bold text-[#D84E55] bg-white px-2 py-0.5 rounded border border-red-200 text-xs">
              {formatTimer(timeRemainingSeconds)}
            </span>
          </div>
        )}

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto">
          {/* Payable Amount Summary Banner */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-bold uppercase">Total Payable Amount</span>
            <div className="text-xl sm:text-2xl font-black font-mono text-slate-900">₹{amount}</div>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Choose Payment Option
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI_QR')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'UPI_QR'
                    ? 'border-[#D84E55] bg-red-50/50 text-[#D84E55] font-bold shadow-xs ring-1 ring-[#D84E55]'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-6 h-6 rounded-lg bg-red-100 text-[#D84E55] flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-red-100 text-[#D84E55]">
                    QR Scanner
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">1. UPI QR Code</div>
                  <p className="text-[9px] text-slate-500 font-normal">GPay, PhonePe</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('CARD')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'CARD'
                    ? 'border-[#D84E55] bg-red-50/50 text-[#D84E55] font-bold shadow-xs ring-1 ring-[#D84E55]'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-blue-100 text-blue-700">
                    Gateway
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">2. Payment Gateway</div>
                  <p className="text-[9px] text-slate-500 font-normal">Cards &amp; Netbank</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('GIFT_CARD')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'GIFT_CARD'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-xs ring-1 ring-purple-600'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Gift className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-purple-100 text-purple-800">
                    Voucher
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">3. Redeem Gift Card</div>
                  <p className="text-[9px] text-slate-500 font-normal">Code &amp; PIN</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedMethod('PAY_ON_BOARDING_COD')}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'PAY_ON_BOARDING_COD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[8px] font-bold uppercase px-1 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    On-Board
                  </span>
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">4. Pay on Boarding</div>
                  <p className="text-[9px] text-slate-500 font-normal">Cash to conductor</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Details Container */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            {selectedMethod === 'UPI_QR' && (
              <div className="flex flex-col items-center text-center space-y-2.5 py-1">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <div className="w-32 h-32 bg-slate-900 rounded-lg flex items-center justify-center p-2 text-white relative">
                    <QrCode className="w-28 h-28 text-white" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-[#D84E55] text-[10px] font-bold text-white px-2 py-0.5 rounded shadow">
                        ₹{amount}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-900">Scan QR Code with Any UPI App</span>
                  <p className="text-[11px] text-slate-500">Google Pay &bull; PhonePe &bull; Paytm &bull; BHIM</p>
                </div>
              </div>
            )}

            {selectedMethod === 'CARD' && (
              <div className="space-y-2.5 text-xs">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:border-[#D84E55] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Expiry Date</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={e => setCardExpiry(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:border-[#D84E55] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={e => setCardCvv(e.target.value)}
                      maxLength={4}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-slate-900 font-mono text-xs focus:border-[#D84E55] focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === 'GIFT_CARD' && (
              <div className="space-y-3 text-xs">
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white rounded-xl p-3 text-center shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-red-200">wABus Gift Voucher</span>
                  <h4 className="text-xs font-black tracking-wide">GIFT CARDS: THE PERFECT PRESENT</h4>
                </div>

                {gcSuccess && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{gcSuccess}</span>
                  </div>
                )}

                {gcError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-bold flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{gcError}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Gift Card Code</label>
                    <input
                      type="text"
                      placeholder="e.g. WABUS500 or FESTIVE1000"
                      value={gcCode}
                      onChange={e => setGcCode(e.target.value.toUpperCase())}
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 uppercase focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">4-Digit PIN</label>
                    <div className="relative">
                      <input
                        type={showGcPin ? 'text' : 'password'}
                        placeholder="Enter 4-digit PIN"
                        maxLength={4}
                        value={gcPin}
                        onChange={e => setGcPin(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl p-2.5 font-mono font-bold text-slate-900 pr-10 focus:border-purple-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGcPin(!showGcPin)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showGcPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 bg-purple-50/60 border border-purple-100 rounded-xl p-2.5 space-y-1">
                  <p className="font-bold text-purple-900">How Gift Card Redemption Works:</p>
                  <p>&bull; Gift card amount will be deducted directly from your booking total of ₹{amount}.</p>
                  <p>&bull; Unused gift card balance remains in your wABus wallet for future bookings.</p>
                </div>
              </div>
            )}

            {selectedMethod === 'PAY_ON_BOARDING_COD' && (
              <div className="space-y-1.5 text-xs p-1">
                <div className="flex items-center gap-2 text-emerald-800 font-bold">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>Reserve Seat Now &bull; Pay Conductor Later</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Your seat will be confirmed immediately with an e-Ticket QR pass. Present the QR to the conductor and pay <strong className="text-slate-900">₹{amount} in cash</strong> upon coach boarding.
                </p>
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={isProcessing}
            className="w-full py-3.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 transition cursor-pointer shrink-0"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing &amp; Confirming Seats...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {selectedMethod === 'GIFT_CARD'
                    ? `REDEEM GIFT CARD & PAY ₹${amount}`
                    : selectedMethod === 'PAY_ON_BOARDING_COD'
                    ? `CONFIRM RESERVATION (PAY ₹${amount} ON BOARD)`
                    : `COMPLETE PAYMENT ₹${amount}`}
                </span>
              </>
            )}
          </button>

          {/* Trust Footnote */}
          <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Guaranteed Instant Seat Confirmation with Live QR E-Ticket</span>
          </div>
        </div>
      </div>
    </div>
  );
};
