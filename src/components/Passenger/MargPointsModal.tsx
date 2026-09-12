import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Gift, 
  Coins, 
  Share2, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Award,
  Users,
  MessageSquare,
  ExternalLink
} from 'lucide-react';
import { MargPointsWallet, ReferralProfile } from '../../types';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';

interface MargPointsModalProps {
  isOpen?: boolean;
  initialTab?: 'POINTS' | 'REFERRAL';
  onClose: () => void;
}

export const MargPointsModal: React.FC<MargPointsModalProps> = ({ 
  isOpen = true, 
  initialTab = 'POINTS',
  onClose 
}) => {
  const [wallet, setWallet] = useState<MargPointsWallet | null>(null);
  const [referral, setReferral] = useState<ReferralProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'POINTS' | 'REFERRAL'>(initialTab);
  const [isCopied, setIsCopied] = useState(false);
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      api.getMargPoints().then(setWallet).catch(() => {});
      api.getReferralProfile().then(setReferral).catch(() => {});
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentBalance = wallet?.balance ?? 450;
  const milestoneTarget = 500;
  const progressPercent = Math.min(100, Math.round((currentBalance / milestoneTarget) * 100));
  const pointsToUnlock = Math.max(0, milestoneTarget - currentBalance);

  const getReferralUrl = () => {
    const code = referral?.code || 'RAHUL-MARG100';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/?ref=${code}`;
    }
    return referral?.referralLink || `https://margpath.vercel.app/?ref=${code}`;
  };

  const handleCopyCode = () => {
    const code = referral?.code || 'RAHUL-MARG100';
    navigator.clipboard.writeText(code);
    soundEngine.play('SUCCESS');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleCopyReferralLink = () => {
    const link = getReferralUrl();
    navigator.clipboard.writeText(link);
    soundEngine.play('SUCCESS');
    setIsLinkCopied(true);
    setTimeout(() => setIsLinkCopied(false), 2500);
  };

  const handleWhatsAppShare = () => {
    const code = referral?.code || 'RAHUL-MARG100';
    const link = getReferralUrl();
    const msg = encodeURIComponent(`Hey! 🚌 Travel across Odisha with MargPath.\n\nUse my invite code *${code}* to get ₹100 instant discount on your first bus booking!\n\nBook your bus here: ${link}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  };

  const handleNativeShare = async () => {
    const code = referral?.code || 'RAHUL-MARG100';
    const link = getReferralUrl();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MargPath Bus Travel - Get ₹100 Off',
          text: `Use my invite code ${code} to get ₹100 instant discount on your MargPath bus ticket!`,
          url: link
        });
      } catch {
        // user cancelled or share failed
      }
    } else {
      handleCopyReferralLink();
    }
  };

  const handleRedeem = async () => {
    if (currentBalance < 100) return;
    setIsRedeeming(true);
    setRedeemSuccess(null);
    soundEngine.play('CLICK');
    try {
      const res = await api.redeemMargPoints(100);
      soundEngine.play('SUCCESS');
      setRedeemSuccess(`🎉 ${res.message} Voucher Code: ${res.voucherCode}`);
      // Refresh wallet
      const updated = await api.getMargPoints();
      setWallet(updated);
    } catch (err: any) {
      soundEngine.play('ERROR');
      alert(err.message || 'Redemption failed');
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-md shrink-0">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">MargPoints Rewards</span>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  Loyalty Tier
                </span>
              </div>
              <p className="text-xs text-amber-100">Earn with every booking, review & referral</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('POINTS')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'POINTS'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>My MargPoints ({currentBalance})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REFERRAL')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition cursor-pointer ${
              activeTab === 'REFERRAL'
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Invite Friends (Give ₹100. Get ₹100)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {activeTab === 'POINTS' ? (
            <>
              {/* Main Balance Hero Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold tracking-wider uppercase">Available Balance</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                    <Sparkles className="w-3 h-3" />
                    <span>Silver Explorer</span>
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">{currentBalance}</span>
                  <span className="text-sm text-slate-300 font-bold">MargPoints</span>
                </div>

                {/* Milestone Progress */}
                <div className="mt-4 pt-4 border-t border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-300">Next Reward Milestone</span>
                    <span className="text-amber-400">{currentBalance} / {milestoneTarget} pts</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {pointsToUnlock > 0 ? (
                      <>Only <strong className="text-white font-bold">{pointsToUnlock} points more</strong> to unlock your next ₹100 discount coupon!</>
                    ) : (
                      <span className="text-emerald-400 font-bold">🎉 Milestone reached! Ready to redeem instant ₹100 discount.</span>
                    )}
                  </p>
                </div>

                {/* Redeem Button */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleRedeem}
                    disabled={currentBalance < 100 || isRedeeming}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Gift className="w-4 h-4" />
                    <span>{isRedeeming ? 'Redeeming...' : 'Redeem 100 Points for ₹25 Coupon'}</span>
                  </button>
                </div>
              </div>

              {redeemSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{redeemSuccess}</span>
                </div>
              )}

              {/* How to Earn Points Section */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">How to Earn MargPoints</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="font-extrabold text-orange-600 text-sm block">+100 pts</span>
                    <span className="font-bold text-slate-800 block">Every Bus Booking</span>
                    <span className="text-[11px] text-slate-500 block">Credited upon journey completion</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="font-extrabold text-emerald-600 text-sm block">+100 pts</span>
                    <span className="font-bold text-slate-800 block">Friend Referral</span>
                    <span className="text-[11px] text-slate-500 block">When friend completes first ride</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl space-y-1">
                    <span className="font-extrabold text-blue-600 text-sm block">+50 pts</span>
                    <span className="font-bold text-slate-800 block">Trip Feedback</span>
                    <span className="text-[11px] text-slate-500 block">Rate driver punctuality & clean coach</span>
                  </div>
                </div>
              </div>

              {/* Recent Ledger History */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider block">Recent Activity</span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(wallet?.history || []).map(tx => (
                    <div key={tx.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{tx.title}</span>
                        <span className="text-[11px] text-slate-500 block">{tx.subtext} • {tx.date}</span>
                      </div>
                      <span className={`font-mono font-extrabold ${tx.points > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Referral Tab */
            <div className="space-y-5">
              <div className="bg-gradient-to-tr from-orange-500 to-amber-500 rounded-3xl p-5 text-white shadow-xl text-center space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
                  Invite &amp; Earn
                </span>
                <h3 className="text-2xl font-black tracking-tight">Give ₹100. Get ₹100.</h3>
                <p className="text-xs text-amber-100 max-w-sm mx-auto">
                  Share your exclusive MargPath invitation link. When your friend books their first journey, they get ₹100 instant discount and you receive 100 MargPoints!
                </p>
              </div>

              {/* Code Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Your Personal Referral Code</span>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Earn ₹100 per friend
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 font-mono font-black text-slate-900 text-lg tracking-wider text-center select-all">
                    {referral?.code || 'RAHUL-MARG100'}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0 shadow-xs"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied Code!' : 'Copy Code'}</span>
                  </button>
                </div>

                {/* Direct Shareable Link Field */}
                <div className="space-y-1.5 pt-2 border-t border-slate-200">
                  <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider block">
                    Your Customer Referral Link
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getReferralUrl()}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleCopyReferralLink}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs flex items-center gap-1 transition cursor-pointer shrink-0 shadow-xs"
                    >
                      {isLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isLinkCopied ? 'Link Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct 1-Click Social Sharing */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleWhatsAppShare}
                    className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>WhatsApp Share</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNativeShare}
                    className="py-2.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share Link</span>
                  </button>
                </div>
              </div>

              {/* Referral Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 bg-orange-50 border border-orange-100 rounded-2xl">
                  <span className="text-2xl font-black text-orange-600 block">{referral?.friendsJoinedCount || 3}</span>
                  <span className="text-xs font-bold text-slate-600">Friends Joined</span>
                </div>
                <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <span className="text-2xl font-black text-emerald-600 block">₹{referral?.totalEarnings || 300}</span>
                  <span className="text-xs font-bold text-slate-600">Total Savings Earned</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
