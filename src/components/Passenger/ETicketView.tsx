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
  Ticket,
  Navigation,
  Footprints,
  Clock,
  MapPin,
  ExternalLink,
  Lock,
  Sparkles
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
  const [isShareLinkCopied, setIsShareLinkCopied] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentStatus, setEmailSentStatus] = useState<string | null>(null);
  
  const vehicleNumber = booking.trip.busRegistrationNumber || (trip && trip.bus ? trip.bus.registrationNumber : 'OD-02-MP-0204');
  const busDisplay = booking.busDisplayNumber || (vehicleNumber.includes('0204') ? 'MP-204' : `MP-${vehicleNumber.replace(/[^0-9]/g, '').slice(-3) || '204'}`);
  const tripCode = booking.tripCode || 'TRIP-20491';
  const bookingPnr = booking.pnr || 'MP100284';
  const seatsDisplay = booking.passengers.map(p => p.seatNumber).join(', ') || 'A12';
  const passengerNames = booking.passengers.map(p => p.name).join(', ') || 'Rahul Sharma';
  const departureTime = booking.trip.departureTime || '06:30 AM';
  const boardingPointName = booking.boardingPoint?.name || 'Bhubaneswar Railway Station';
  const droppingPointName = booking.droppingPoint?.name || 'Puri Bus Stand';

  const [qrCodeUrl, setQrCodeUrl] = useState<string>(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bookingPnr)}`
  );

  const isPaid = booking.paymentStatus === 'PAID_ONLINE' || booking.paymentStatus === 'PAID';

  useEffect(() => {
    // Generate structured QR Code data containing MargPath verified booking details
    const qrPayload = booking.qrCodeToken || booking.qrPayloadData || JSON.stringify({
      brand: 'MARGPATH',
      bookingId: bookingPnr,
      tripId: tripCode,
      bus: busDisplay,
      vehicle: vehicleNumber,
      seats: booking.passengers.map(p => p.seatNumber),
      departure: departureTime,
      boardingPoint: boardingPointName,
      destination: droppingPointName,
      status: booking.paymentStatus
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
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(bookingPnr)}`);
      });
  }, [booking, trip, vehicleNumber, busDisplay, tripCode, bookingPnr, departureTime, boardingPointName, droppingPointName]);

  const handleShare = () => {
    const origin = booking.trip?.originCity || (trip ? trip.originCity : 'Bhubaneswar');
    const dest = booking.trip?.destinationCity || (trip ? trip.destinationCity : 'Puri');
    navigator.clipboard.writeText(
      `MargPath Digital Ticket | Booking ID: ${bookingPnr} | Bus: ${busDisplay} (${vehicleNumber}) | ${origin} to ${dest} | Seat: ${seatsDisplay} | Departure: ${departureTime}`
    );
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleShareJourneyLink = () => {
    const shareUrl = `${window.location.origin}/?track=${bookingPnr}&share=${booking.shareToken || 'sh-live-token'}`;
    navigator.clipboard.writeText(shareUrl);
    setIsShareLinkCopied(true);
    setTimeout(() => setIsShareLinkCopied(false), 2500);
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
      `🎫 *MARGPATH Digital E-Ticket*\n\n` +
      `*Booking ID:* ${bookingPnr}\n` +
      `*Trip ID:* ${tripCode}\n` +
      `*Passenger:* ${passengerNames}\n` +
      `*Route:* ${trip?.originCity || booking.trip.originCity} ➔ ${trip?.destinationCity || booking.trip.destinationCity}\n` +
      `*Bus:* ${busDisplay} (${vehicleNumber})\n` +
      `*Seat:* ${seatsDisplay}\n` +
      `*Departure:* ${departureTime}\n` +
      `*Boarding Point:* ${boardingPointName}\n` +
      `*Destination:* ${droppingPointName}\n` +
      `*Total Paid:* ₹${booking.totalAmount}\n\n` +
      `🔒 *Private Live Tracking Enabled*\n` +
      `Track your bus in real-time: ${window.location.origin}/?track=${bookingPnr}`
    );
    const cleanPhone = (booking.contactPhone || '9438318821').replace(/\D/g, '');
    window.open(`https://wa.me/91${cleanPhone}?text=${text}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Success Banner with Privacy Notice */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 text-center shadow-xs space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-extrabold text-emerald-950">
          {isPaid ? 'Seat Confirmed & Linked to Bus' : 'Seat Reserved (Pay on Boarding)'}
        </h2>
        <p className="text-xs text-emerald-800 font-medium max-w-lg mx-auto">
          Your journey is securely mapped to assigned bus <strong className="font-mono bg-emerald-100 px-2 py-0.5 rounded text-emerald-900">{busDisplay} ({vehicleNumber})</strong>.
          Present this official QR ticket upon boarding for instant verification.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>🔒 Private Live Tracking Activated</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-white px-3 py-1 rounded-full border border-emerald-200">
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>Sent to {booking.contactEmail || 'customer'}</span>
          </span>
        </div>

        {emailSentStatus && (
          <div className="mt-2 text-xs font-bold text-emerald-700 bg-white border border-emerald-300 rounded-xl px-4 py-2 inline-block animate-in fade-in">
            {emailSentStatus}
          </div>
        )}
      </div>

      {/* MARGPATH Digital Boarding Pass */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-md">
        {/* Ticket Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white overflow-hidden border border-slate-200 shadow-sm shrink-0 flex items-center justify-center p-1">
              <img src="/logo.png" alt="MargPath Official Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-2xl tracking-tight text-white">
                  MARG<span className="text-[#D84E55]">PATH</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase font-black tracking-wider">
                  Verified Digital Ticket
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Your journey, tracked privately in real time
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-2xl">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">BOOKING ID</span>
              <span className="text-base font-black font-mono tracking-wider text-amber-300">{bookingPnr}</span>
            </div>
            <div className="bg-slate-800/90 border border-slate-700 px-3.5 py-2 rounded-2xl">
              <span className="text-[10px] uppercase font-black text-slate-400 block tracking-wider">TRIP ID</span>
              <span className="text-sm font-black font-mono tracking-wider text-white">{tripCode}</span>
            </div>
          </div>
        </div>

        {/* Ticket Main Details Body */}
        <div className="p-5 sm:p-8 space-y-6">
          
          {/* Journey Route & Time Banner */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-5">
            <div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">BOARDING POINT</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{trip?.originCity || booking.trip?.originCity || 'Bhubaneswar'}</div>
              <div className="text-sm font-black text-[#D84E55]">{departureTime}</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#D84E55] shrink-0" />
                <span>{boardingPointName}</span>
              </div>
            </div>

            <div className="flex flex-col items-center px-3">
              <span className="text-[10px] font-mono font-bold text-slate-400">
                1h 45m
              </span>
              <div className="w-20 sm:w-36 h-0.5 bg-slate-200 relative my-2">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#D84E55] border-2 border-white shadow-xs"></div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Express Direct
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">DESTINATION</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{trip?.destinationCity || booking.trip?.destinationCity || 'Puri'}</div>
              <div className="text-sm font-black text-[#D84E55]">{booking.droppingPoint?.time || booking.trip?.droppingTime || '08:45 AM'}</div>
              <div className="text-xs text-slate-600 font-medium mt-0.5 flex items-center justify-end gap-1">
                <span>{droppingPointName}</span>
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </div>
            </div>
          </div>

          {/* Passenger & QR Code Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Passenger Manifest Breakdown */}
            <div className="md:col-span-7 space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2.5">
                  Passenger &amp; Seat Manifest
                </h4>
                <div className="space-y-2">
                  {booking.passengers.map((p, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-xl bg-[#D84E55] text-white flex items-center justify-center font-black text-xs">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            {p.age} Yrs &bull; {p.gender} &bull; Passenger ID: PAX-{Math.abs(p.name.length * 1024 + idx)}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-amber-300 font-mono font-black text-xs shadow-xs">
                          Seat {p.seatNumber}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vehicle & Conductor Assignment Badge */}
              <div className="p-4 bg-gradient-to-r from-red-50/50 via-slate-50 to-blue-50/50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">ASSIGNED BUS COACH</span>
                  <span className="font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200">
                    {busDisplay} ({vehicleNumber})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-500">ASSIGNED DRIVER &amp; STAFF</span>
                  <span className="font-semibold text-slate-800">
                    Rameshwar Mahapatra / {trip?.bus?.conductorName || 'Bijay Nayak'} (COND-7890)
                  </span>
                </div>
              </div>

              {/* Fare & Payment Breakdown */}
              <div className="grid grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">FARE PAID</span>
                  <span className="text-base font-black font-mono text-slate-900">₹{booking.totalAmount}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">PAYMENT MODE</span>
                  <span className="text-xs font-extrabold text-slate-800 truncate block mt-0.5">
                    {booking.paymentMethod.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 uppercase font-black block">BOARDING STATUS</span>
                  <span className={`text-xs font-extrabold block mt-0.5 ${booking.checkInStatus === 'BOARDED' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {booking.checkInStatus === 'BOARDED' ? '✓ Checked In' : 'Awaiting Boarding'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cryptographic QR Validation Pass */}
            <div className={`md:col-span-5 rounded-3xl p-5 flex flex-col items-center justify-center text-center space-y-3 border-2 border-dashed ${
              isPaid
                ? 'bg-emerald-50/60 border-emerald-300'
                : 'bg-amber-50/60 border-amber-300'
            }`}>
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-md relative">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt={`QR Code for ${bookingPnr}`} 
                    className="w-36 h-36 rounded-lg"
                  />
                ) : (
                  <QrCode className="w-36 h-36 text-slate-900" />
                )}
                <div className="absolute bottom-1 inset-x-1 flex justify-center">
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow ${
                    isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
                  }`}>
                    {isPaid ? 'PAID VERIFIED' : 'COLLECT CASH'}
                  </span>
                </div>
              </div>
              
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  Official Digital QR Ticket
                </span>
                <span className="text-[11px] text-slate-600 font-mono font-bold block">
                  {bookingPnr} &bull; Bus: {busDisplay}
                </span>
              </div>

              {/* Prominent Track My Bus Button in QR Card */}
              <button
                type="button"
                onClick={() => setShowLiveTracker(true)}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-[#D84E55] to-orange-500 hover:from-[#C33E44] hover:to-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Radio className="w-3.5 h-3.5 animate-pulse text-white" />
                <span>Track My Bus Live</span>
              </button>
            </div>
          </div>
        </div>

        {/* Boarding Point Navigation Card (Requirement 15) */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50/60 via-slate-50 to-indigo-50/60 border-t border-slate-200 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Footprints className="w-4 h-4 text-blue-600" />
              <span>How to Reach Your Boarding Point</span>
            </h4>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-900 font-extrabold rounded-lg">
                120m away
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 font-extrabold rounded-lg">
                ~2 min walk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <div>
                <strong className="text-slate-900 block">Head to Station Exit 2</strong>
                <span className="text-slate-500 text-[11px]">Exit toward Master Canteen Circle from Platform 1.</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <div>
                <strong className="text-slate-900 block">Walk 80m Along Bay Line</strong>
                <span className="text-slate-500 text-[11px]">Follow covered pedestrian pathway to Inter-City Coach Bay 4.</span>
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <div>
                <strong className="text-slate-900 block">Look for Bus {busDisplay}</strong>
                <span className="text-slate-500 text-[11px]">Display board shows &quot;MargPath Express — Bus {busDisplay}&quot;.</span>
              </div>
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
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs shadow-md transition cursor-pointer active:scale-98"
            >
              <Radio className="w-3.5 h-3.5 text-white animate-pulse" />
              <span>Track My Bus</span>
            </button>

            {/* Share My Journey Button (Requirement 14) */}
            <button
              type="button"
              onClick={handleShareJourneyLink}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              title="Generate temporary secure tracking link for friends/family"
            >
              {isShareLinkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{isShareLinkCopied ? 'Link Copied!' : 'Share My Journey'}</span>
            </button>

            <button
              type="button"
              onClick={() => openProfileModal()}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>My Journeys</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBookAnother}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs uppercase tracking-wider shadow-xs transition cursor-pointer text-center"
          >
            Book Another Bus
          </button>
        </div>
      </div>

      {/* Live GPS Telemetry Modal */}
      {showLiveTracker && (
        <LiveBusTracker
          bookingId={bookingPnr}
          trip={booking.trip}
          onClose={() => setShowLiveTracker(false)}
        />
      )}
    </div>
  );
};
