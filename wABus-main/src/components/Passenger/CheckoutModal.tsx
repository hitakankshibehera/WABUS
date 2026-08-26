import React, { useState, useEffect } from 'react';
import { PaymentMethod, FeatureFlags } from '../../types';
import { soundEngine } from '../../utils/audio';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Smartphone, 
  Banknote, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  Loader2, 
  Clock,
  Sparkles,
  Building2
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
    try {
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
        {/* Modal Top Header (wABus Crimson Header) */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#C33E44] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold tracking-tight">Secure Checkout</h3>
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
              Select Payment Option
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Option 1: Instant Online UPI QR */}
              <button
                type="button"
                onClick={() => setSelectedMethod('UPI_QR')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'UPI_QR'
                    ? 'border-[#D84E55] bg-red-50/50 text-[#D84E55] font-bold shadow-xs ring-1 ring-[#D84E55]'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-7 h-7 rounded-lg bg-red-100 text-[#D84E55] flex items-center justify-center">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-red-100 text-[#D84E55]">
                    Fast QR
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">1. Online UPI QR</div>
                  <p className="text-[10px] text-slate-500 font-normal">GPay, PhonePe, Paytm</p>
                </div>
              </button>

              {/* Option 2: Online Cards & Netbanking */}
              <button
                type="button"
                onClick={() => setSelectedMethod('CARD')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'CARD'
                    ? 'border-[#D84E55] bg-red-50/50 text-[#D84E55] font-bold shadow-xs ring-1 ring-[#D84E55]'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                    Cards/Net
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">2. Cards & Netbanking</div>
                  <p className="text-[10px] text-slate-500 font-normal">Debit, Credit, Netbanking</p>
                </div>
              </button>

              {/* Option 3: Pay on Boarding Cash */}
              <button
                type="button"
                onClick={() => setSelectedMethod('PAY_ON_BOARDING_COD')}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer ${
                  selectedMethod === 'PAY_ON_BOARDING_COD'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-xs ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Banknote className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    On-Board
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">3. Pay on Boarding</div>
                  <p className="text-[10px] text-slate-500 font-normal">Cash to conductor</p>
                </div>
              </button>
            </div>
          </div>

          {/* Payment Details Container */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-3.5 space-y-3">
            {selectedMethod === 'UPI_QR' && (
              <div className="flex flex-col items-center text-center space-y-2.5 py-1">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs">
                  {/* Generated Simulated dynamic UPI QR */}
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
                  <span className="text-xs font-bold text-slate-900">Scan with Any UPI App</span>
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
                <span>Processing Payment & Generating Ticket...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {selectedMethod === 'PAY_ON_BOARDING_COD' ? `CONFIRM RESERVATION (PAY ₹${amount} ON BOARD)` : `COMPLETE PAYMENT ₹${amount}`}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
