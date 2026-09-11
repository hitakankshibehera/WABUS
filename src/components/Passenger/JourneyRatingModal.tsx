import React, { useState } from 'react';
import { 
  X, 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  Bus, 
  UserCheck, 
  Clock, 
  ShieldCheck,
  Award
} from 'lucide-react';
import { api } from '../../services/api';
import { soundEngine } from '../../utils/audio';

interface JourneyRatingModalProps {
  isOpen?: boolean;
  onClose: () => void;
  bookingPnr?: string;
  bookingId?: string;
  tripId?: string;
  busNumber?: string;
  onRatedSuccess?: () => void;
  onSubmitted?: () => void;
}

export const JourneyRatingModal: React.FC<JourneyRatingModalProps> = ({
  isOpen = true,
  onClose,
  bookingPnr,
  bookingId,
  tripId = 'trip-bbsr-puri-flagship',
  busNumber = 'MP-204',
  onRatedSuccess,
  onSubmitted
}) => {
  const currentPnr = bookingId || bookingPnr || 'MP100284';
  const [overallRating, setOverallRating] = useState(5);
  const [driverRating, setDriverRating] = useState(5);
  const [safetyRating, setSafetyRating] = useState(5);
  const [cleanlinessRating, setCleanlinessRating] = useState(5);
  const [comfortRating, setComfortRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    soundEngine.play('CLICK');
    try {
      const res = await api.submitTripReview({
        bookingId: currentPnr,
        tripId,
        overallRating,
        driverBehavior: driverRating,
        safety: safetyRating,
        cleanliness: cleanlinessRating,
        comfort: comfortRating,
        punctuality: punctualityRating,
        feedbackText: comment
      });

      soundEngine.play('SUCCESS');
      setSuccessMsg(res.message || 'Thank you! 50 MargPoints added to your wallet.');
      setTimeout(() => {
        if (onRatedSuccess) onRatedSuccess();
        if (onSubmitted) onSubmitted();
        onClose();
      }, 2500);
    } catch (err: any) {
      soundEngine.play('ERROR');
      alert(err.message || 'Rating submission failed');
      setIsSubmitting(false);
    }
  };

  const renderStars = (value: number, setValue: (n: number) => void) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setValue(star)}
            className="p-1 hover:scale-110 transition cursor-pointer"
          >
            <Star
              className={`w-6 h-6 ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-md shrink-0">
              <Star className="w-5 h-5 fill-white" />
            </div>
            <div>
              <span className="font-extrabold text-base text-white tracking-tight block">Rate Your Journey</span>
              <span className="text-xs text-amber-100">Bus MP-204 • PNR {bookingPnr}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Bonus Points Badge */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between text-xs font-bold text-amber-900">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Earn +50 MargPoints</span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-black">BONUS</span>
          </div>

          {/* Overall Experience */}
          <div className="text-center py-2 border-b border-slate-100 space-y-1">
            <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">Overall Experience</span>
            <div className="flex justify-center">
              {renderStars(overallRating, setOverallRating)}
            </div>
          </div>

          {/* 5 Specific Criteria */}
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Driver Behavior</span>
              </span>
              {renderStars(driverRating, setDriverRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Safety &amp; Smooth Drive</span>
              </span>
              {renderStars(safetyRating, setSafetyRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                <span>Coach Cleanliness</span>
              </span>
              {renderStars(cleanlinessRating, setCleanlinessRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Bus className="w-3.5 h-3.5 text-slate-400" />
                <span>Seat Comfort &amp; AC</span>
              </span>
              {renderStars(comfortRating, setComfortRating)}
            </div>

            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Punctuality</span>
              </span>
              {renderStars(punctualityRating, setPunctualityRating)}
            </div>
          </div>

          {/* Feedback Textarea */}
          <div className="space-y-1.5 pt-2">
            <span className="text-xs font-bold text-slate-700 block">Additional Comments (Optional)</span>
            <textarea
              rows={2}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What made your journey great or how can we improve?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:outline-none focus:border-orange-500"
            />
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting || !!successMsg}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Review & Claim 50 MargPoints'}</span>
          </button>
        </form>

      </div>
    </div>
  );
};
