import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  Radio, 
  Share2, 
  CheckCircle2, 
  FileText, 
  UserCheck, 
  Camera, 
  BadgeAlert,
  Copy,
  Check
} from 'lucide-react';
import { soundEngine } from '../../utils/audio';

interface JourneySafetyModalProps {
  isOpen?: boolean;
  onClose: () => void;
  bookingPnr?: string;
  bookingId?: string;
  shareUrl?: string;
}

export const JourneySafetyModal: React.FC<JourneySafetyModalProps> = ({
  isOpen = true,
  onClose,
  bookingPnr,
  bookingId,
  shareUrl = '/track/share-mp100284'
}) => {
  const currentPnr = bookingId || bookingPnr || 'MP100284';
  const [copiedLink, setCopiedLink] = useState(false);
  const [incidentSubmitted, setIncidentSubmitted] = useState(false);
  const [incidentText, setIncidentText] = useState('');

  if (!isOpen) return null;

  const handleCopyShare = () => {
    const fullUrl = `${window.location.origin}${shareUrl}`;
    navigator.clipboard.writeText(fullUrl);
    soundEngine.play('SUCCESS');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleReportIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incidentText.trim()) return;
    soundEngine.play('SUCCESS');
    setIncidentSubmitted(true);
    setTimeout(() => {
      setIncidentSubmitted(false);
      setIncidentText('');
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-white tracking-tight">Passenger Safety &amp; Emergency Hub</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400">24/7 Monitored Journey • PNR {bookingPnr}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Safety Score Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Verified Safety Index</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">GRADE A+</span>
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl sm:text-5xl font-black text-emerald-400">94</span>
                <span className="text-lg text-slate-400 font-bold">/ 100</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">All safety, health &amp; driver compliance checks passed prior to departure.</p>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-8 h-8 text-emerald-400" />
            </div>
          </div>

          {/* 4 Pillars of MargPath Safety */}
          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Safety Pillars on Bus MP-204</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
                <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">Driver Background Verified</span>
                  <span className="text-[11px] text-slate-500">Rameshwar Mahapatra (8+ yrs experience, breathalyzer 0.0% clean).</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
                <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">AIS-140 Certified GPS</span>
                  <span className="text-[11px] text-slate-500">Government mandated secure real-time transponder transmitting.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">SOS Panic Switches</span>
                  <span className="text-[11px] text-slate-500">Physical SOS buttons fitted above seat A12 and conductor bay.</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-2.5">
                <Camera className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-slate-900 block">CCTV Coach Monitoring</span>
                  <span className="text-[11px] text-slate-500">Dual cabin cameras for passenger and luggage corridor protection.</span>
                </div>
              </div>
            </div>
          </div>

          {/* 🆘 EMERGENCY ACTION BUTTONS */}
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-3xl space-y-3">
            <div className="flex items-center gap-2">
              <BadgeAlert className="w-5 h-5 text-rose-600" />
              <span className="font-black text-rose-900 text-sm">Emergency Assistance &amp; SOS</span>
            </div>
            <p className="text-xs text-rose-700">
              Immediate connection to local law enforcement, highway emergency response, or bus conductor.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href="tel:112"
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call 112 (National Helpline)</span>
              </a>
              <a
                href="tel:+919437100001"
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 transition"
              >
                <PhoneCall className="w-4 h-4 text-emerald-400" />
                <span>Call Conductor (Bijay Nayak)</span>
              </a>
            </div>
            <div className="pt-2 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleCopyShare}
                className="flex-1 py-2.5 px-3 rounded-xl bg-white border border-rose-200 hover:bg-rose-100 text-rose-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5 text-rose-600" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Live Journey Link with Family'}</span>
              </button>
            </div>
          </div>

          {/* Grievance / Safety Issue Report Form */}
          <form onSubmit={handleReportIncident} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="text-xs font-bold text-slate-800 block">Report Safety Issue or Grievance</span>
            <input
              type="text"
              value={incidentText}
              onChange={(e) => setIncidentText(e.target.value)}
              placeholder="Describe issue (e.g. rash driving, AC issue, luggage concern)..."
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!incidentText.trim()}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition disabled:opacity-50 cursor-pointer"
              >
                Submit Incident Report
              </button>
            </div>
            {incidentSubmitted && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Report received! Control center has alerted the fleet inspector.</span>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
};
