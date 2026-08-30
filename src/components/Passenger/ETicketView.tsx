import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Booking, Trip, FeatureFlags } from '../../types';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircle2, 
  Share2, 
  MessageSquare, 
  QrCode, 
  Bus, 
  Radio, 
  Printer, 
  Check, 
  ShieldCheck,
  UserCheck,
  Mail,
  Loader2,
  Ticket
} from 'lucide-react';
import { LiveBusTracker } from './LiveBusTracker';

interface ETicketViewProps {
  booking: Booking;
  trip?: Trip;
  onBookAnother: () => void;
  featureFlags: FeatureFlags;
}

export const ETicketView: React.FC<ETicketViewProps> = ({
  booking,
  trip,
  onBookAnother,
  featureFlags,
}) => {
  const { openProfileModal } = useAuth();
  const [showLiveTracker, setShowLiveTracker] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(booking.pnr || 'WB123456')}`
  );

  const vehicleNumber = booking.trip.busRegistrationNumber || (trip && trip.bus ? trip.bus.registrationNumber : 'OD-02-AX-8910');
  const isPaid = booking.paymentStatus === 'PAID_ONLINE' || booking.paymentStatus === 'PAID';

  useEffect(() => {
    // Generate structured QR Code data containing bus vehicle mapping
    const qrPayload = booking.qrCodeToken || booking.qrPayloadData || JSON.stringify({
      pnr: booking.pnr,
      vehicle: vehicleNumber,
      seats: booking.passengers.map(p => p.seatNumber),
      operator: booking.trip?.operatorName || (trip && trip.bus ? trip.bus.operatorName : 'OSRTC Volvo Premier'),
      status: booking.paymentStatus,
      hash: booking.qrPayloadHash
    });

    QRCode.toDataURL(qrPayload, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then(url => setQrCodeUrl(url))
      .catch(() => {
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`);
      });
  }, [booking, trip, vehicleNumber]);

  const handleShare = () => {
    const origin = booking.trip?.originCity || (trip ? trip.originCity : 'Bhubaneswar');
    const dest = booking.trip?.destinationCity || (trip ? trip.destinationCity : 'Puri');
    navigator.clipboard.writeText(
      `wABus e-Ticket PNR: ${booking.pnr} | Vehicle: ${vehicleNumber} | ${origin} to ${dest} | Seats: ${booking.passengers.map(p => p.seatNumber).join(', ')}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleResendEmail = async () => {
    setIsSendingEmail(true);
    setEmailSentStatus(null);
    try {
      const res = await api.sendBookingConfirmationEmail(booking);
      setEmailSentStatus(res.message || `E-Ticket email sent to ${booking.contactEmail}!`);
      setTimeout(() => setEmailSentStatus(null), 5000);
    } catch {
      setEmailSentStatus('Failed to dispatch email.');
      setTimeout(() => setEmailSentStatus(null), 5000);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🎫 *Wonderlight Advanture E-Ticket & QR Code*\n\n` +
      `*PNR:* ${booking.pnr}\n` +
      `*Route:* ${trip?.originCity || booking.trip.originCity} ➔ ${trip?.destinationCity || booking.trip.destinationCity}\n` +
      `*Departure:* ${booking.trip.departureDate} at ${booking.trip.departureTime}\n` +
      `*Coach:* ${booking.trip.operatorName} (${vehicleNumber})\n` +
      `*Seats:* ${booking.passengers.map(p => p.seatNumber).join(', ')}\n` +
      `*Boarding Point:* ${booking.boardingPoint.name} (${booking.boardingPoint.time})\n` +
      `*Passengers:* ${booking.passengers.map(p => p.name).join(', ')}\n` +
      `*Total Paid:* ₹${booking.totalAmount}\n\n` +
      `Dispatched from Wonderlight Advanture Gateway (+91 94383 18821)`
    );
    const cleanPhone = (booking.contactPhone || '9438318821').replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Top Success Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 text-center shadow-xs">
        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm mb-3">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-emerald-950 mb-1">
          {isPaid ? 'Booking Confirmed & Linked to Bus' : 'Seat Reserved (Pay on Boarding)'}
        </h2>
        <p className="text-xs text-emerald-800 font-medium max-w-md mx-auto mb-3">
          Your ticket is securely mapped to assigned vehicle <strong className="font-mono bg-emerald-100 px-1.5 py-0.5 rounded text-emerald-900">{vehicleNumber}</strong>. Present this QR code to your conductor for instant digital verification.
        </p>

        <div className="inline-flex flex-wrap items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5 text-emerald-700" />
          <span>E-Ticket & QR Code sent to <strong>{booking.contactEmail || 'customer email'}</strong> & WhatsApp +91 {booking.contactPhone}</span>
        </div>

        {emailSentStatus && (
          <div className="mt-2 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded-lg px-3 py-1.5 inline-block animate-in fade-in">
            {emailSentStatus}
          </div>
        )}
      </div>

      {/* wABus Authentic Boarding Pass Card */}
      <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden shadow-sm">
        {/* Ticket Red Header Ribbon */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#C33E44] text-white p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 overflow-hidden border border-white/40 shadow-sm shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Wonderlight Adventure Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  wA<span className="text-red-200">Bus</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-white/20 uppercase font-bold tracking-wider">
                  Wonderlight Verified E-Ticket
                </span>
              </div>
              <p className="text-xs text-red-100">
                {trip?.bus?.operatorName || booking.trip?.operatorName || 'OSRTC'} &bull; {trip?.bus?.model || booking.trip?.busModel || 'Volvo Multi-Axle'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="text-left sm:text-right bg-black/20 px-3.5 py-2 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-red-200 block tracking-wider">ASSIGNED BUS VEHICLE</span>
              <span className="text-sm font-bold font-mono tracking-wider text-amber-300">{vehicleNumber}</span>
            </div>
            <div className="text-left sm:text-right bg-black/25 px-3.5 py-2 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-red-200 block tracking-wider">PNR NUMBER</span>
              <span className="text-base font-bold font-mono tracking-wider text-white">{booking.pnr}</span>
            </div>
          </div>
        </div>

        {/* Ticket Main Details Body */}
        <div className="p-4 sm:p-7 space-y-5">
          {/* Journey Route & Time Banner */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Boarding City & Stop</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{trip?.originCity || booking.trip?.originCity || 'Origin'}</div>
              <div className="text-xs font-bold text-[#D84E55]">{booking.boardingPoint?.time || booking.trip?.boardingTime || booking.trip?.departureTime || ''}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{booking.boardingPoint?.name || booking.trip?.boardingPointName || ''}</div>
            </div>

            <div className="flex flex-col items-center px-3">
              <span className="text-[10px] font-mono font-medium text-slate-400">
                {trip?.category === 'DAY_COACH' ? '1h 30m' : '1h 45m'}
              </span>
              <div className="w-16 sm:w-28 h-0.5 bg-slate-200 relative my-1.5">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-[#D84E55]"></div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Express Direct
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Dropping Destination</span>
              <div className="text-xl sm:text-2xl font-bold text-slate-900">{trip?.destinationCity || booking.trip?.destinationCity || 'Destination'}</div>
              <div className="text-xs font-bold text-[#D84E55]">{booking.droppingPoint?.time || booking.trip?.droppingTime || booking.trip?.arrivalTime || ''}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{booking.droppingPoint?.name || booking.trip?.droppingPointName || ''}</div>
            </div>
          </div>

          {/* Passenger & QR Code Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Passenger Manifest Breakdown */}
            <div className="md:col-span-7 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Passenger & Seat Allocation
                </h4>
                <div className="space-y-2">
                  {booking.passengers.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-[#D84E55] text-white flex items-center justify-center font-bold text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.age} Yrs &bull; {p.gender}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-3 py-1 rounded-lg bg-[#D84E55] text-white font-mono font-bold text-xs shadow-2xs">
                          Seat {p.seatNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle & Conductor Assignment Badge */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Assigned Coach Number</span>
                  <span className="font-mono font-bold text-slate-900">{vehicleNumber}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Assigned Conductor</span>
                  <span className="font-semibold text-slate-800">{trip?.bus?.conductorName || 'Bijay Nayak'} (ID: {trip?.bus?.conductorId || 'COND-7890'})</span>
                </div>
              </div>

              {/* Fare & Payment Method Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Fare Paid</span>
                  <span className="text-sm sm:text-base font-bold font-mono text-slate-900">₹{booking.totalAmount}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payment Mode</span>
                  <span className="text-xs font-bold text-slate-800">{booking.paymentMethod.replace(/_/g, ' ')}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Boarding Status</span>
                  <span className={`text-xs font-bold ${booking.checkInStatus === 'BOARDED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {booking.checkInStatus === 'BOARDED' ? '✓ Checked In' : 'Awaiting Boarding'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic QR Validation Pass (for Conductor) */}
            <div className={`md:col-span-5 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-2.5 border-2 border-dashed ${
              isPaid
                ? 'bg-emerald-50/70 border-emerald-300'
                : 'bg-amber-50/70 border-amber-300'
            }`}>
              <div className="p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm relative">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code for PNR ${booking.pnr}`} 
                    className="w-32 h-32 rounded-lg"
                  />
                ) : (
                  <QrCode className="w-32 h-32 text-slate-900" />
                )}
                <div className="absolute bottom-1 inset-x-1 flex justify-center">
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded shadow ${
                    isPaid
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-600 text-white'
                  }`}>
                    {isPaid ? 'PAID VERIFIED' : 'COLLECT CASH'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 block">
                  {isPaid ? 'Official Boarding QR Code' : 'On-Boarding Cash Pass QR'}
                </span>
                <span className="text-[11px] text-slate-600 font-mono font-bold block">
                  PNR: {booking.pnr} &bull; Bus: {vehicleNumber}
                </span>
              </div>
              <span className={`text-[10px] px-2.5 py-1 rounded-md border font-semibold ${
                isPaid
                  ? 'bg-white text-emerald-800 border-emerald-200'
                  : 'bg-white text-amber-800 border-amber-200 font-bold'
              }`}>
                {isPaid
                  ? 'Show QR to Conductor to Board'
                  : `Show QR & Pay ₹${booking.totalAmount} Cash`}
              </span>
            </div>
          </div>
        </div>

        {/* Perforated Divider Bar */}
        <div className="relative border-t border-dashed border-slate-200 my-0.5">
          <div className="absolute -top-3 -left-3 w-6 h-6 bg-[#F8FAFC] rounded-full border-r border-slate-200"></div>
          <div className="absolute -top-3 -right-3 w-6 h-6 bg-[#F8FAFC] rounded-full border-l border-slate-200"></div>
        </div>

        {/* Ticket Bottom Actions Toolbar */}
        <div className="bg-slate-50 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setShowLiveTracker(true)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Radio className="w-3.5 h-3.5 text-red-200 animate-pulse" />
              <span>🚌 Track My Bus</span>
            </button>

            <button
              type="button"
              onClick={() => openProfileModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>View in My Journeys</span>
            </button>

            <button
              type="button"
              onClick={handleResendEmail}
              disabled={isSendingEmail}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              {isSendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{isSendingEmail ? 'Sending Email...' : 'Resend Email'}</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Ticket (+91 94383 18821)</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Ticket</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isCopied ? 'Copied!' : 'Share'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBookAnother}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer text-center"
          >
            Book Another Journey
          </button>
        </div>
      </div>

      {/* Live GPS Telemetry Modal */}
      {showLiveTracker && (
        <LiveBusTracker
          bookingId={booking.id}
          trip={booking.trip}
          onClose={() => setShowLiveTracker(false)}
        />
      )}
    </div>
  );
};
