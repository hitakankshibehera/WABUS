import React, { useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Wallet, 
  Gift, 
  Info, 
  Ticket, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  CreditCard,
  Building2,
  Sparkles,
  AlertTriangle,
  Search,
  Lock,
  QrCode,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';
import { Booking } from '../../types';
import { api } from '../../services/api';

interface WalletTx {
  id: string;
  title: string;
  subtext: string;
  amount: number;
  date: string;
}

// ==========================================
// 1. wABus Wallet Modal (With Live UPI QR Code & Online App Gateway)
// ==========================================
export const WalletModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [balance, setBalance] = useState<number>(450);
  const [addAmount, setAddAmount] = useState<string>('250');
  const [transactions, setTransactions] = useState<WalletTx[]>([
    { id: 'tx-1', title: 'Welcome Cashback Bonus', subtext: 'Credited on account setup', amount: 100, date: 'Yesterday' },
    { id: 'tx-2', title: 'Primo Loyalty Credit', subtext: 'Promo reward', amount: 350, date: '2 days ago' }
  ]);

  // Payment QR Modal State
  const [isQrScreenOpen, setIsQrScreenOpen] = useState(false);
  const [pendingPayAmount, setPendingPayAmount] = useState<number>(250);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isVerifyingPay, setIsVerifyingPay] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartAddMoney = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(addAmount);
    if (!val || val <= 0) return;
    setPendingPayAmount(val);
    setPaySuccessMsg(null);
    setIsVerifyingPay(false);

    // Generate real scannable UPI QR Code payload
    const upiPayload = `upi://pay?pa=wabus.merchant@upi&pn=wABus%20Wallet%20TopUp&am=${val}&cu=INR&tn=Wallet%20Balance%20TopUp`;
    QRCode.toDataURL(upiPayload, { width: 240, margin: 1, color: { dark: '#0F172A', light: '#FFFFFF' } })
      .then(url => setQrUrl(url))
      .catch(() => {});

    setIsQrScreenOpen(true);
  };

  const handleConfirmUpiPayment = (appName?: string) => {
    setIsVerifyingPay(true);

    setTimeout(() => {
      setIsVerifyingPay(false);
      const addedAmt = pendingPayAmount;
      setBalance(prev => prev + addedAmt);

      const newTx: WalletTx = {
        id: `tx-${Date.now()}`,
        title: appName ? `UPI Top-Up via ${appName}` : 'UPI QR Code Wallet Top-Up',
        subtext: 'Deposited directly into wallet',
        amount: addedAmt,
        date: 'Just now'
      };
      setTransactions(prev => [newTx, ...prev]);
      setPaySuccessMsg(`🎉 Payment of ₹${addedAmt} received & credited to your wABus Wallet!`);

      setTimeout(() => {
        setIsQrScreenOpen(false);
        setPaySuccessMsg(null);
      }, 2000);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#B83238] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">wABus Wallet</h3>
              <p className="text-[11px] text-red-100">Instant Refunds &amp; Seamless Checkout</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isQrScreenOpen ? (
          <div className="p-5 space-y-5 text-xs">
            {/* Balance card */}
            <div className="bg-gradient-to-br from-rose-50 via-orange-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between shadow-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">Available Balance</span>
                <div className="text-3xl font-black font-mono text-slate-900 mt-0.5">₹{balance}</div>
                <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Auto-applied at bus booking checkout
                </span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#D84E55] text-white flex items-center justify-center font-bold shadow-sm">
                <Sparkles className="w-6 h-6" />
              </div>
            </div>

            {/* Quick Add Money Form */}
            <form onSubmit={handleStartAddMoney} className="space-y-3 pt-1">
              <label className="font-bold text-slate-800 block text-xs">Select or Enter Top Up Amount</label>
              <div className="flex gap-2">
                {['100', '250', '500', '1000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAddAmount(amt)}
                    className={`flex-1 py-1.5 rounded-xl border text-xs font-bold font-mono transition cursor-pointer ${
                      addAmount === amt 
                        ? 'bg-[#D84E55] text-white border-[#D84E55] shadow-xs' 
                        : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">₹</span>
                  <input
                    type="number"
                    value={addAmount}
                    onChange={e => setAddAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-7 pr-3 py-2.5 font-mono font-bold text-slate-900 focus:border-[#D84E55] focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold transition cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Add Money</span>
                </button>
              </div>
            </form>

            {/* Transaction History preview */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 block text-xs">Recent Wallet Activity</span>
                <span className="text-[10px] text-slate-400 font-medium">Real-time updates</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-0.5">
                {transactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{tx.title}</div>
                      <div className="text-[10px] text-slate-500">{tx.subtext} &bull; {tx.date}</div>
                    </div>
                    <span className="font-mono font-black text-emerald-600 text-xs">+₹{tx.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================
             2. UPI PAYMENT QR CODE & APP GATEWAY SCREEN
             ========================================================= */
          <div className="p-5 space-y-4 text-xs">
            {/* Top Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Wallet Top-Up</span>
                <span className="text-xl font-black font-mono text-slate-900">Pay ₹{pendingPayAmount}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsQrScreenOpen(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-900 underline cursor-pointer"
              >
                ← Change Amount
              </button>
            </div>

            {paySuccessMsg ? (
              <div className="py-8 text-center space-y-3 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">Payment Received!</h4>
                  <p className="text-xs text-emerald-800 font-semibold max-w-xs mx-auto">{paySuccessMsg}</p>
                </div>
              </div>
            ) : isVerifyingPay ? (
              <div className="py-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full border-4 border-[#D84E55] border-t-transparent animate-spin mx-auto" />
                <h4 className="font-extrabold text-slate-900 text-sm">Verifying UPI Payment...</h4>
                <p className="text-[11px] text-slate-500">Connecting with bank &amp; depositing ₹{pendingPayAmount} into wABus Wallet...</p>
              </div>
            ) : (
              <>
                {/* QR Code Card */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-3 shadow-inner">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#D84E55]" />
                    <span>Scan QR Code with PhonePe, Google Pay or Paytm</span>
                  </div>

                  {/* QR Image */}
                  <div className="bg-white p-3 rounded-2xl inline-block border border-slate-200 shadow-md">
                    {qrUrl ? (
                      <img src={qrUrl} alt="UPI Payment QR Code" className="w-44 h-44 mx-auto rounded-lg" />
                    ) : (
                      <div className="w-44 h-44 bg-slate-100 rounded-lg animate-pulse mx-auto" />
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 font-medium">
                    Merchant UPI ID: <span className="font-mono font-bold text-slate-800">wabus.merchant@upi</span>
                  </div>
                </div>

                {/* Direct App Pay Buttons */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block text-center">Or Pay directly using online apps:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmUpiPayment('PhonePe')}
                      className="p-2.5 rounded-xl border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">पे</span>
                      <span>Pay via PhonePe</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleConfirmUpiPayment('Google Pay')}
                      className="p-2.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-900 font-extrabold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">G</span>
                      <span>Pay via GPay</span>
                    </button>
                  </div>
                </div>

                {/* Simulated Confirm Button */}
                <button
                  type="button"
                  onClick={() => handleConfirmUpiPayment()}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment of ₹{pendingPayAmount} Received</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 2. Redeem Gift Card Modal (Redbus Screenshot Style)
// ==========================================
export const GiftCardModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !pin.trim()) {
      setStatusMsg({ type: 'ERROR', text: 'Please enter both Gift card code and 4-digit PIN.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const res = await api.redeemGiftCard(code.trim(), pin.trim());
      setStatusMsg({
        type: 'SUCCESS',
        text: res.message || `🎉 Gift card ${code.trim().toUpperCase()} redeemed! ₹${res.amount} credited to your wABus Wallet.`
      });
      setCode('');
      setPin('');
    } catch (err: any) {
      setStatusMsg({
        type: 'ERROR',
        text: err.message || 'Invalid gift card code or PIN. Try code WABUS500 with PIN 1234.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">Redeem gift card</h3>
        </div>

        {/* Scrollable Content Container */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs">
          {/* Banner Graphic */}
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-950 via-[#4A1521] to-[#781829] text-white p-6 shadow-md border border-amber-900/30">
            <div className="relative z-10 max-w-[240px] space-y-1">
              <h2 className="font-serif italic text-2xl font-bold leading-tight tracking-wide text-amber-200">
                GIFT CARDS:
              </h2>
              <h3 className="font-sans uppercase font-black text-xl tracking-wider text-white">
                THE PERFECT PRESENT
              </h3>
              <p className="text-[10px] text-amber-100 uppercase tracking-widest font-bold pt-1">
                GIVE THE GIFT OF CHOICE THIS SEASON
              </p>
            </div>

            {/* Visual card stack decoration */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-32 h-24 hidden sm:block opacity-90">
              <div className="absolute top-0 right-0 w-24 h-16 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 border border-white/20 shadow-md rotate-6 flex items-end p-2 text-[9px] font-black text-white">
                GIFT CARD
              </div>
              <div className="absolute bottom-0 right-4 w-24 h-16 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 border border-white/20 shadow-lg -rotate-6 flex items-end p-2 text-[9px] font-black text-white">
                ₹500
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleRedeem} className="space-y-3.5 pt-1">
            {/* Input 1: Gift card code */}
            <div>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Gift card code"
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-xs text-slate-900 font-semibold focus:border-[#D84E55] focus:outline-none placeholder:text-slate-400 shadow-2xs"
                required
              />
            </div>

            {/* Input 2: PIN with eye toggle */}
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="PIN"
                className="w-full bg-white border border-slate-300 rounded-xl p-3.5 pr-11 text-xs text-slate-900 font-semibold focus:border-[#D84E55] focus:outline-none placeholder:text-slate-400 shadow-2xs font-mono"
                required
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                title={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Guidelines Box matching screenshot */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-[11px] text-slate-500 space-y-2 leading-relaxed">
              <ul className="space-y-1.5 list-disc pl-3">
                <li>Gift card amount will be added to wABus Wallet which can be used to make bookings.</li>
                <li>Gift card amount added will be valid for 4 years from the date of redemption.</li>
                <li>Gift card amount cannot be transferred to bank account or other wABus Wallets.</li>
              </ul>
            </div>

            {/* View terms and conditions link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowTerms(!showTerms)}
                className="text-xs text-indigo-600 font-bold underline hover:text-indigo-800 transition cursor-pointer"
              >
                {showTerms ? 'Hide terms and conditions' : 'View terms and conditions'}
              </button>

              {showTerms && (
                <div className="mt-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[10px] text-indigo-900 text-left space-y-1">
                  <p>&bull; Issued by Wonderlight Adventure Co. under RBI prepaid payment instrument guidelines.</p>
                  <p>&bull; Non-refundable once claimed into wABus Wallet balance.</p>
                  <p>&bull; For support or email issues contact wonderlightadventure@gmail.com.</p>
                </div>
              )}
            </div>

            {statusMsg && (
              <div className={`p-3.5 rounded-xl font-semibold text-xs flex items-center gap-2 ${
                statusMsg.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' : 'bg-rose-50 text-rose-900 border border-rose-200'
              }`}>
                {statusMsg.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                <span>{statusMsg.text}</span>
              </div>
            )}

            {/* Red Redeem Button matching screenshot */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-full bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-sm tracking-wide shadow-md hover:shadow-lg transition cursor-pointer active:scale-98 disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying Gift Card...' : 'Redeem gift card'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. Know About wABus Modal
// ==========================================
export const AboutModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100 relative">
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/10">
              <Building2 className="w-5 h-5 text-[#D84E55]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Know About wABus</h3>
              <p className="text-[11px] text-slate-300">Wonderlight Adventure Company</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs text-slate-600 leading-relaxed max-h-[75vh] overflow-y-auto">
          <p>
            <strong className="text-slate-900 font-bold">wABus</strong> by Wonderlight Adventure Company is India&apos;s leading next-generation automated bus ticketing ecosystem serving over 25+ million passengers across 100+ cities.
          </p>

          <div className="space-y-2 pt-1 border-t border-slate-100">
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Key Highlights</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-extrabold text-slate-900 text-sm block font-mono">25M+</span>
                <span className="text-[10px] text-slate-500">Tickets Booked</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-extrabold text-slate-900 text-sm block font-mono">10,000+</span>
                <span className="text-[10px] text-slate-500">Buses Tracked Live</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-extrabold text-[#D84E55] text-sm block font-mono">100%</span>
                <span className="text-[10px] text-slate-500">Free Cancellation</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-extrabold text-emerald-600 text-sm block font-mono">WhatsApp</span>
                <span className="text-[10px] text-slate-500">Instant PDF QR Pass</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-[#D84E55] font-semibold text-[11px] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>256-Bit SSL Encrypted &amp; AIS-140 GPS Compliance</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. Instant Cancel Ticket & Refund Modal
// ==========================================
export const CancelTicketModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void;
  bookings: Booking[];
  onRefreshBookings?: () => void;
}> = ({ isOpen, onClose, bookings, onRefreshBookings }) => {
  const [pnrInput, setPnrInput] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeBookings = bookings.filter(b => b.checkInStatus !== 'CANCELLED');

  const handleCancelByPnr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrInput.trim()) return;
    const target = bookings.find(b => b.pnr.toUpperCase() === pnrInput.trim().toUpperCase());
    if (!target) {
      alert(`No booking found with PNR "${pnrInput.trim().toUpperCase()}".`);
      return;
    }
    if (!confirm(`Are you sure you want to cancel PNR ${target.pnr}? Full refund will be credited to your wABus Wallet.`)) return;

    try {
      const res = await api.cancelBooking(target.id);
      setStatusMsg(`PNR ${target.pnr} cancelled! Refund of ₹${res.refundAmount} credited to your wABus Wallet.`);
      setPnrInput('');
      if (onRefreshBookings) onRefreshBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 relative">
        <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white border border-white/20">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Instant Ticket Cancellation</h3>
              <p className="text-[11px] text-red-100">Cancel ticket &amp; get instant wallet refund</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Quick PNR Lookup */}
          <form onSubmit={handleCancelByPnr} className="space-y-2">
            <label className="font-bold text-slate-800 block">Cancel by PNR Number</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={pnrInput}
                onChange={e => setPnrInput(e.target.value.toUpperCase())}
                placeholder="e.g. PNR-789012"
                className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 font-mono font-bold uppercase text-slate-900 focus:border-[#D84E55] focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold transition cursor-pointer"
              >
                Cancel PNR
              </button>
            </div>
          </form>

          {statusMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Active Bookings List */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="font-bold text-slate-800 block">Your Active Tickets ({activeBookings.length})</span>
            {activeBookings.length === 0 ? (
              <p className="text-slate-400 text-center py-4">No active bookings to cancel.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {activeBookings.map(b => (
                  <div key={b.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                    <div>
                      <div className="font-mono font-black text-slate-900 text-xs">{b.pnr}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{b.trip.originCity} ➔ {b.trip.destinationCity}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Total Fare: ₹{b.totalPrice}</div>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm(`Cancel booking ${b.pnr}? Instant refund will be credited to wallet.`)) return;
                        try {
                          const res = await api.cancelBooking(b.id);
                          setStatusMsg(`PNR ${b.pnr} cancelled! Refund of ₹${res.refundAmount} credited.`);
                          if (onRefreshBookings) onRefreshBookings();
                        } catch (err: any) {
                          alert('Cancel failed');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 font-bold text-[11px] transition cursor-pointer"
                    >
                      Cancel &amp; Refund
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
