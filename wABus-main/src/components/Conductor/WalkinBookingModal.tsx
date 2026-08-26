import React, { useState } from 'react';
import { Trip, Seat } from '../../types';
import { api } from '../../services/api';
import { X, UserPlus, Banknote, ShieldCheck, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

interface WalkinBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onBookingSuccess: () => void;
}

export const WalkinBookingModal: React.FC<WalkinBookingModalProps> = ({
  isOpen,
  onClose,
  trip,
  onBookingSuccess,
}) => {
  const [passengerName, setPassengerName] = useState('');
  const [age, setAge] = useState('28');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('MALE');
  const [phone, setPhone] = useState('9861099887');
  const [selectedSeatNumber, setSelectedSeatNumber] = useState('');
  const [amountCollected, setAmountCollected] = useState(trip.baseFare);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter available seats on coach
  const availableSeats = trip.seats.filter(s => s.status === 'AVAILABLE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeatNumber) {
      setError('Please select an available seat');
      return;
    }
    if (!passengerName.trim()) {
      setError('Please enter passenger name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.bookWalkinTicket({
        tripId: trip.id,
        passengerName: passengerName.trim(),
        age: Number(age),
        gender,
        seatNumber: selectedSeatNumber,
        phone,
        amountCollected: Number(amountCollected)
      });
      onBookingSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Walk-in booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-gray-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in">
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Walk-in Cash Passenger Booking</h3>
              <p className="text-[11px] text-gray-500">Issue immediate boarding pass on coach</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Seat Picker */}
          <div>
            <label className="text-[11px] text-gray-600 block mb-1 font-bold">
              Select Vacant Seat ({availableSeats.length} available)
            </label>
            <select
              value={selectedSeatNumber}
              onChange={e => {
                setSelectedSeatNumber(e.target.value);
                const s = trip.seats.find(st => st.number === e.target.value);
                if (s) setAmountCollected(s.basePrice);
              }}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono font-bold focus:border-[#D84E55] focus:outline-none"
            >
              <option value="">-- Choose Vacant Berth/Seat --</option>
              {availableSeats.map(s => (
                <option key={s.id} value={s.number}>
                  Seat {s.number} ({s.deck} Deck {s.isSleeper ? 'Sleeper' : 'Seater'}) - ₹{s.basePrice}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] text-gray-600 block mb-1 font-bold">Passenger Name</label>
            <input
              type="text"
              placeholder="e.g. Soumya Ranjan Das"
              value={passengerName}
              onChange={e => setPassengerName(e.target.value)}
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:border-[#D84E55] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] text-gray-600 block mb-1 font-bold">Age</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                min="1"
                max="100"
                required
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono focus:border-[#D84E55] focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[11px] text-gray-600 block mb-1 font-bold">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 focus:border-[#D84E55] focus:outline-none"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] text-gray-600 block mb-1 font-bold">Passenger Phone (SMS / WhatsApp)</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="98610 99887"
              required
              className="w-full bg-gray-50 border border-gray-300 rounded-xl p-2.5 text-gray-900 font-mono focus:border-[#D84E55] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-gray-600 block mb-1 font-bold">Cash Collected (₹)</label>
            <div className="flex items-center bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-gray-900 font-mono font-bold text-sm">
              <Banknote className="w-4 h-4 text-emerald-600 mr-2" />
              <span>₹</span>
              <input
                type="number"
                value={amountCollected}
                onChange={e => setAmountCollected(Number(e.target.value))}
                className="bg-transparent text-gray-900 w-full focus:outline-none ml-1"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || availableSeats.length === 0}
            className="w-full py-3 rounded-2xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md disabled:opacity-50 transition cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Recording Cash & Booking...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Walk-in & Mark Boarded</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
