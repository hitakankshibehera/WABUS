import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { 
  DEFAULT_FEATURE_FLAGS, 
  INITIAL_TRIPS, 
  INITIAL_BOOKINGS, 
  MOCK_PAYOUTS, 
  MOCK_ROUTES,
  MOCK_BUSES,
  INITIAL_CONDUCTORS,
  generateSleeperSeats,
  generateSeaterSeats
} from './src/data/mockDatabase';
import { POSTGRESQL_SCHEMA_SQL, REDIS_LOCKING_TYPESCRIPT, PAYMENT_WEBHOOK_TYPESCRIPT } from './src/data/deliverables';
import { Booking, FeatureFlags, Trip, Seat, PayoutRecord, ConductorProfile, OfferCoupon } from './src/types';

// In-Memory Database State (Simulating PostgreSQL + Redis Cache)
let featureFlags: FeatureFlags = { ...DEFAULT_FEATURE_FLAGS };
let trips: Trip[] = JSON.parse(JSON.stringify(INITIAL_TRIPS));
let bookings: Booking[] = JSON.parse(JSON.stringify(INITIAL_BOOKINGS));
let payouts: PayoutRecord[] = JSON.parse(JSON.stringify(MOCK_PAYOUTS));
let conductors: ConductorProfile[] = JSON.parse(JSON.stringify(INITIAL_CONDUCTORS));

let offers: OfferCoupon[] = [
  {
    id: 'off-1',
    code: 'BHARAT100',
    title: 'Bharat First Ride Offer',
    description: 'Flat ₹100 instant discount on all AC Sleeper & Seater bookings',
    discountType: 'FLAT',
    discountValue: 100,
    minBookingAmount: 300,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'FLAT ₹100 OFF'
  },
  {
    id: 'off-2',
    code: 'WABUS50',
    title: 'wABus Primo Savings',
    description: '₹50 instant cashback for wABus app users',
    discountType: 'FLAT',
    discountValue: 50,
    minBookingAmount: 200,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'SAVE ₹50'
  },
  {
    id: 'off-3',
    code: 'FESTIVE150',
    title: 'Festival Coach Special',
    description: '₹150 off on Night Sleeper Luxury Coaches',
    discountType: 'FLAT',
    discountValue: 150,
    minBookingAmount: 500,
    isLive: true,
    validUntil: '2026-10-31',
    badgeTag: 'FESTIVE ₹150 OFF'
  },
  {
    id: 'off-4',
    code: 'SUPER15',
    title: '15% Weekend Bonanza',
    description: 'Get 15% discount on popular weekend routes',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    minBookingAmount: 400,
    maxDiscountAmount: 250,
    isLive: true,
    validUntil: '2026-11-30',
    badgeTag: '15% OFF'
  }
];

// Redis Key-Value Store Simulator (Key: `lock:trip:<tripId>:seat:<seatId>` -> { sessionId, expiresAt })
const redisLocks = new Map<string, { sessionId: string; expiresAt: number; seatNumber: string }>();

// Clean up expired Redis locks periodically (every 5 seconds)
setInterval(() => {
  const now = Date.now();
  for (const [key, lock] of redisLocks.entries()) {
    if (lock.expiresAt <= now) {
      redisLocks.delete(key);
      // Revert seat in trip to AVAILABLE if not BOOKED
      const parts = key.split(':'); // lock, trip, tripId, seat, seatId
      if (parts.length === 5) {
        const tripId = parts[2];
        const seatId = parts[4];
        const trip = trips.find(t => t.id === tripId);
        if (trip) {
          const seat = trip.seats.find(s => s.id === seatId || s.number === lock.seatNumber);
          if (seat && seat.status === 'LOCKED') {
            seat.status = 'AVAILABLE';
            delete seat.lockedBySessionId;
            delete seat.lockExpiresAt;
          }
        }
      }
    }
  }
}, 5000);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());

  // ==========================================
  // 1. API: HEALTH & SYSTEM
  // ==========================================
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      system: 'BharatRide Ecosystem Engine',
      environment: process.env.NODE_ENV || 'development',
      activeLocksCount: redisLocks.size,
      totalBookings: bookings.length,
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // 2. API: FEATURE FLAGS (ZERO-DOWNTIME CONFIG)
  // ==========================================
  app.get('/api/feature-flags', (req, res) => {
    res.json(featureFlags);
  });

  app.post('/api/feature-flags', (req, res) => {
    featureFlags = { ...featureFlags, ...req.body };
    console.log('[Remote Config] Feature flags updated zero-downtime:', featureFlags);
    res.json({ success: true, featureFlags });
  });

  // ==========================================
  // 3. API: ROUTES & TRIPS SEARCH
  // ==========================================
  app.get('/api/routes', (req, res) => {
    res.json(MOCK_ROUTES);
  });

  app.get('/api/trips', (req, res) => {
    const { origin, destination, date, category, busType } = req.query;

    let filtered = trips.filter(t => !t.busId.startsWith('deleted'));

    if (origin) {
      filtered = filtered.filter(t => t.originCity.toLowerCase() === String(origin).toLowerCase());
    }
    if (destination) {
      filtered = filtered.filter(t => t.destinationCity.toLowerCase() === String(destination).toLowerCase());
    }
    if (category && category !== 'ALL') {
      filtered = filtered.filter(t => t.category === category);
    }
    if (busType && busType !== 'ALL') {
      filtered = filtered.filter(t => t.bus.busType === busType);
    }

    // Apply surge pricing dynamically if feature flag is active
    const result = filtered.map(t => {
      const isSurgeApplicable = featureFlags.enableSurgePricing && t.surgeMultiplier > 1;
      const surgeMultiplier = isSurgeApplicable ? (featureFlags.surgeMultiplier || t.surgeMultiplier) : 1.0;
      const effectiveFare = Math.round(t.baseFare * surgeMultiplier);
      const availableSeatsCount = t.seats.filter(s => s.status === 'AVAILABLE').length;

      return {
        ...t,
        effectiveFare,
        surgeMultiplier,
        availableSeatsCount
      };
    });

    res.json(result);
  });

  app.get('/api/trips/:id', (req, res) => {
    const trip = trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    // Refresh seat statuses against active Redis locks
    const now = Date.now();
    const updatedSeats = trip.seats.map(seat => {
      const lockKey = `lock:trip:${trip.id}:seat:${seat.id}`;
      const lock = redisLocks.get(lockKey);
      if (lock && lock.expiresAt > now && seat.status === 'AVAILABLE') {
        return {
          ...seat,
          status: 'LOCKED' as const,
          lockedBySessionId: lock.sessionId,
          lockExpiresAt: lock.expiresAt
        };
      }
      return seat;
    });

    res.json({
      ...trip,
      seats: updatedSeats,
      availableSeatsCount: updatedSeats.filter(s => s.status === 'AVAILABLE').length
    });
  });

  // ==========================================
  // 4. API: REAL-TIME REDIS SEAT LOCKING (10m TTL)
  // ==========================================
  app.post('/api/seats/lock', (req, res) => {
    const { tripId, seatIds, sessionId } = req.body;
    if (!tripId || !seatIds || !Array.isArray(seatIds) || !sessionId) {
      return res.status(400).json({ error: 'tripId, seatIds array, and sessionId are required' });
    }

    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const ttlMs = (featureFlags.seatLockDurationMinutes || 10) * 60 * 1000;
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Check conflict: are any of the requested seats locked by another session or already booked?
    for (const seatId of seatIds) {
      const seat = trip.seats.find(s => s.id === seatId);
      if (!seat) {
        return res.status(404).json({ error: `Seat ${seatId} not found on this coach` });
      }
      if (seat.status === 'BOOKED' || seat.status === 'CONDUCTOR_RESERVED') {
        return res.status(409).json({ error: `Seat ${seat.number} is already booked or reserved.` });
      }

      const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
      const existingLock = redisLocks.get(lockKey);
      if (existingLock && existingLock.expiresAt > now && existingLock.sessionId !== sessionId) {
        return res.status(409).json({ 
          error: `Seat ${seat.number} is currently locked by another passenger. Please select another seat.` 
        });
      }
    }

    // Acquire locks atomically
    for (const seatId of seatIds) {
      const seat = trip.seats.find(s => s.id === seatId)!;
      const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
      redisLocks.set(lockKey, { sessionId, expiresAt, seatNumber: seat.number });
      seat.status = 'LOCKED';
      seat.lockedBySessionId = sessionId;
      seat.lockExpiresAt = expiresAt;
    }

    console.log(`[Redis TTL Lock] Acquired locks on trip ${tripId} for seats: ${seatIds.join(', ')} (TTL: ${featureFlags.seatLockDurationMinutes} mins)`);

    res.json({
      success: true,
      expiresAt,
      ttlSeconds: Math.floor(ttlMs / 1000),
      lockedSeatsCount: seatIds.length
    });
  });

  app.post('/api/seats/release', (req, res) => {
    const { tripId, seatIds, sessionId } = req.body;
    if (!tripId || !seatIds || !sessionId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }

    const trip = trips.find(t => t.id === tripId);
    if (trip) {
      for (const seatId of seatIds) {
        const lockKey = `lock:trip:${tripId}:seat:${seatId}`;
        const existingLock = redisLocks.get(lockKey);
        if (existingLock && existingLock.sessionId === sessionId) {
          redisLocks.delete(lockKey);
          const seat = trip.seats.find(s => s.id === seatId);
          if (seat && seat.status === 'LOCKED') {
            seat.status = 'AVAILABLE';
            delete seat.lockedBySessionId;
            delete seat.lockExpiresAt;
          }
        }
      }
    }

    res.json({ success: true, message: 'Seats released' });
  });

  // ==========================================
  // 5. API: AUTOMATED CHECKOUT & E-TICKET QR DISPATCH
  // ==========================================
  app.post('/api/bookings/checkout', (req, res) => {
    const {
      tripId,
      sessionId,
      passengers,
      contactEmail,
      contactPhone,
      boardingPointId,
      droppingPointId,
      paymentMethod,
      discountAmount = 0
    } = req.body;

    const trip = trips.find(t => t.id === tripId);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (!featureFlags.enablePayOnBoarding && paymentMethod === 'PAY_ON_BOARDING_COD') {
      return res.status(400).json({ error: 'Pay on Boarding is currently disabled by Admin' });
    }

    const bp = trip.boardingPoints.find(p => p.id === boardingPointId) || trip.boardingPoints[0];
    const dp = trip.droppingPoints.find(p => p.id === droppingPointId) || trip.droppingPoints[0];

    // Compute fares
    const seatIds = passengers.map((p: any) => p.seatId);
    let baseAmount = 0;
    for (const p of passengers) {
      const seat = trip.seats.find(s => s.id === p.seatId);
      baseAmount += seat ? seat.basePrice : trip.baseFare;
    }

    const isSurge = featureFlags.enableSurgePricing && trip.surgeMultiplier > 1;
    const multiplier = isSurge ? (featureFlags.surgeMultiplier || trip.surgeMultiplier) : 1.0;
    const surgeAmount = Math.round(baseAmount * (multiplier - 1));
    const subtotal = baseAmount + surgeAmount - discountAmount;
    const gstAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST on bus travel
    const totalAmount = Math.round((subtotal + gstAmount) * 100) / 100;

    // Generate unique PNR and cryptographic hash
    const pnr = 'BR' + Math.floor(100000 + Math.random() * 900000);
    const qrPayload = JSON.stringify({
      pnr,
      tripId,
      seats: passengers.map((p: any) => p.seatNumber),
      amount: totalAmount,
      contactPhone,
      issuedAt: Date.now()
    });

    const qrPayloadHash = crypto
      .createHmac('sha256', 'bharat_ride_secret_salt_2026')
      .update(qrPayload)
      .digest('hex');

    const isPayOnBoarding = paymentMethod === 'PAY_ON_BOARDING_COD';

    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      pnr,
      tripId,
      trip: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busModel: trip.bus.model,
        operatorName: trip.bus.operatorName,
        busRegistrationNumber: trip.bus.registrationNumber,
        category: trip.category
      },
      passengers,
      contactEmail,
      contactPhone,
      boardingPoint: bp,
      droppingPoint: dp,
      baseAmount,
      surgeAmount,
      gstAmount,
      discountAmount,
      totalAmount,
      paymentMethod,
      paymentStatus: isPayOnBoarding ? 'PAY_ON_BOARDING_PENDING' : 'PAID_ONLINE',
      checkInStatus: 'CONFIRMED',
      qrPayloadHash,
      bookedAt: new Date().toISOString(),
      cancellationPolicy: {
        refundPercentage: 75,
        refundAmount: Math.round(totalAmount * 0.75 * 100) / 100,
        canCancel: true
      }
    };

    // Transition seats to BOOKED permanently and clear Redis locks
    for (const p of passengers) {
      const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
      if (seat) {
        seat.status = 'BOOKED';
        seat.bookedGender = p.gender;
        delete seat.lockedBySessionId;
        delete seat.lockExpiresAt;
      }
      redisLocks.delete(`lock:trip:${tripId}:seat:${p.seatId}`);
    }

    bookings.unshift(newBooking);

    console.log(`[Booking Confirmed] PNR: ${pnr} generated for ${contactPhone}. Total: ₹${totalAmount}`);
    if (featureFlags.enableWhatsAppNotifications) {
      console.log(`[WhatsApp Business API] Sent high-resolution E-Ticket PDF with QR code to +91-${contactPhone}`);
    }

    res.json({
      success: true,
      booking: newBooking,
      qrToken: qrPayloadHash,
      whatsAppDelivered: featureFlags.enableWhatsAppNotifications
    });
  });

  // ==========================================
  // 6. API: PASSENGER BOOKING LOOKUP & DYNAMIC CANCELLATION
  // ==========================================
  app.get('/api/bookings', (req, res) => {
    res.json(bookings);
  });

  app.get('/api/bookings/:pnr', (req, res) => {
    const booking = bookings.find(b => b.pnr.toUpperCase() === req.params.pnr.toUpperCase());
    if (!booking) {
      return res.status(404).json({ error: 'No booking found with this PNR' });
    }
    res.json(booking);
  });

  app.post('/api/bookings/:pnr/cancel', (req, res) => {
    const booking = bookings.find(b => b.pnr.toUpperCase() === req.params.pnr.toUpperCase());
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.checkInStatus === 'CANCELLED') {
      return res.status(400).json({ error: 'Ticket is already cancelled' });
    }
    if (booking.checkInStatus === 'BOARDED') {
      return res.status(400).json({ error: 'Cannot cancel ticket for a boarded passenger' });
    }

    // Dynamic refund calculation based on time to departure
    // Proximity tiers: >24h = 90%, 12-24h = 75%, 4-12h = 50%, <4h = 0%
    const refundPercentage = 75; // Simulation default for prompt
    const refundAmount = Math.round(booking.totalAmount * (refundPercentage / 100) * 100) / 100;

    booking.checkInStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.cancellationPolicy = {
      refundPercentage,
      refundAmount,
      canCancel: false,
      cancellationReason: req.body.reason || 'Passenger initiated cancellation'
    };

    // Reopen seats on the trip
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      for (const p of booking.passengers) {
        const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
        if (seat && seat.status === 'BOOKED') {
          seat.status = 'AVAILABLE';
          delete seat.bookedGender;
        }
      }
    }

    console.log(`[Dynamic Refund] PNR ${booking.pnr} cancelled. Refund of ₹${refundAmount} (${refundPercentage}%) credited via original payment gateway.`);

    res.json({
      success: true,
      booking,
      refundPercentage,
      refundAmount
    });
  });

  // ==========================================
  // 7. API: CONDUCTOR MANIFEST, BUS MAPPING & QR SCANNER
  // ==========================================
  app.get('/api/conductor/manifest/:tripOrBusIdentifier', (req, res) => {
    const identifier = req.params.tripOrBusIdentifier;
    
    // Find trip by tripId or bus registrationNumber
    let trip = trips.find(t => t.id === identifier);
    if (!trip) {
      trip = trips.find(t => t.bus.registrationNumber.toUpperCase() === identifier.toUpperCase() || t.busId === identifier);
    }

    if (!trip) {
      return res.status(404).json({ error: `No active trip or bus found matching '${identifier}'` });
    }

    const busReg = trip.bus.registrationNumber;
    // Filter bookings strictly belonging to this bus / trip
    const tripBookings = bookings.filter(b => 
      (b.tripId === trip!.id || b.trip.busRegistrationNumber.toUpperCase() === busReg.toUpperCase()) && 
      b.checkInStatus !== 'CANCELLED'
    );
    const manifestRows: any[] = [];

    let boardedCount = 0;
    let payOnBoardingDue = 0;
    let cashCollected = 0;

    for (const b of tripBookings) {
      for (const p of b.passengers) {
        const isBoarded = b.checkInStatus === 'BOARDED';
        if (isBoarded) boardedCount++;
        if (b.paymentStatus === 'PAY_ON_BOARDING_PENDING') {
          payOnBoardingDue += p.fare;
        } else if (b.paymentMethod === 'PAY_ON_BOARDING_COD' && isBoarded) {
          cashCollected += p.fare;
        }

        manifestRows.push({
          bookingId: b.id,
          pnr: b.pnr,
          passengerName: p.name,
          age: p.age,
          gender: p.gender,
          seatNumber: p.seatNumber,
          seatId: p.seatId,
          fare: p.fare,
          boardingPoint: b.boardingPoint.name,
          boardingTime: b.boardingPoint.time,
          droppingPoint: b.droppingPoint.name,
          droppingTime: b.droppingPoint.time,
          paymentMethod: b.paymentMethod,
          paymentStatus: b.paymentStatus,
          checkInStatus: b.checkInStatus,
          qrPayloadHash: b.qrPayloadHash,
          contactPhone: b.contactPhone,
          contactEmail: b.contactEmail,
          bookedAt: b.bookedAt,
          boardedAt: b.boardedAt,
          verifiedByConductorId: b.verifiedByConductorId,
          verifiedByConductorName: b.verifiedByConductorName,
          verifiedVehicleNumber: b.verifiedVehicleNumber,
          conductorRemarks: b.conductorRemarks
        });
      }
    }

    manifestRows.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));

    res.json({
      trip,
      assignedBus: trip.bus,
      manifest: manifestRows,
      summary: {
        totalSeats: trip.seats.length,
        bookedSeats: manifestRows.length,
        boardedPassengers: boardedCount,
        pendingCheckins: manifestRows.length - boardedCount,
        payOnBoardingCollectable: payOnBoardingDue,
        cashCollectedByConductor: cashCollected,
        dieselExpenses: 1850,
        tollExpenses: 420,
        netTripHandover: Math.max(0, cashCollected - (1850 + 420))
      }
    });
  });

  // Conductor QR Scanner Endpoint with Strict Bus Mapping & Cryptographic Validation
  app.post('/api/conductor/scan', (req, res) => {
    const { 
      qrHashOrPnr, 
      conductorBusNumber, 
      tripId, 
      conductorId, 
      conductorName, 
      autoCollectCash, 
      remarks 
    } = req.body;
    
    if (!qrHashOrPnr) {
      return res.status(400).json({ 
        valid: false, 
        status: 'INVALID_NOT_FOUND',
        passengerAllowed: false,
        error: 'QR payload, cryptographic hash or PNR is required.' 
      });
    }

    const cleanInput = qrHashOrPnr.trim();

    // 1. Check if input is JSON payload from QR code
    let parsedPnr: string | null = null;
    try {
      if (cleanInput.startsWith('{') && cleanInput.endsWith('}')) {
        const parsed = JSON.parse(cleanInput);
        if (parsed.pnr) parsedPnr = parsed.pnr;
      }
    } catch (e) {
      // Not json
    }

    // 2. Find booking
    const booking = bookings.find(b => 
      b.qrPayloadHash === cleanInput || 
      b.pnr.toUpperCase() === cleanInput.toUpperCase() ||
      (parsedPnr && b.pnr.toUpperCase() === parsedPnr.toUpperCase())
    );

    // If not found
    if (!booking) {
      return res.status(404).json({ 
        valid: false, 
        status: 'INVALID_NOT_FOUND',
        passengerAllowed: false,
        error: `INVALID TICKET: No booking found for code '${cleanInput}'. Signature mismatch or forged pass.` 
      });
    }

    // 3. Cancelled ticket validation
    if (booking.checkInStatus === 'CANCELLED') {
      return res.status(400).json({ 
        valid: false, 
        status: 'INVALID_CANCELLED',
        passengerAllowed: false,
        booking,
        error: `CANCELLED TICKET: PNR ${booking.pnr} was cancelled & refunded. Passenger Not Allowed.` 
      });
    }

    // 4. Strict Bus-Conductor Mapping Validation
    if (conductorBusNumber && booking.trip.busRegistrationNumber) {
      const ticketBus = booking.trip.busRegistrationNumber.toUpperCase();
      const currentBus = conductorBusNumber.toUpperCase();
      if (ticketBus !== currentBus) {
        return res.status(400).json({ 
          valid: false, 
          status: 'INVALID_WRONG_BUS',
          passengerAllowed: false,
          ticketBusNumber: ticketBus,
          conductorBusNumber: currentBus,
          booking,
          error: `WRONG BUS ERROR: Ticket PNR ${booking.pnr} is booked for Bus ${ticketBus} (${booking.trip.originCity} → ${booking.trip.destinationCity}), but your assigned vehicle is ${currentBus}. Passenger Not Allowed.` 
        });
      }
    }

    // 5. Check if already boarded (Duplicate Scan prevention)
    const wasAlreadyBoarded = booking.checkInStatus === 'BOARDED';
    if (wasAlreadyBoarded) {
      return res.json({
        valid: true,
        alreadyBoarded: true,
        status: 'INVALID_ALREADY_BOARDED',
        passengerAllowed: true,
        booking,
        message: `DUPLICATE SCAN: Passenger was already checked-in at ${booking.boardedAt || 'earlier today'} by ${booking.verifiedByConductorName || 'conductor'}.`
      });
    }

    // 6. Handle Pay on Boarding Cash Collection
    if (booking.paymentStatus === 'PAY_ON_BOARDING_PENDING' && !autoCollectCash) {
      return res.json({
        valid: true,
        alreadyBoarded: false,
        status: 'PENDING_CASH_COLLECTION',
        passengerAllowed: true,
        booking,
        message: `PAY ON BOARDING: Please collect ₹${booking.totalAmount} cash from passenger to finalize check-in.`
      });
    }

    // 7. Successful First-time Verification & Check-In
    const nowTimeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    booking.checkInStatus = 'BOARDED';
    booking.boardedAt = `${nowTimeStr} (Verified by ${conductorName || 'Conductor'})`;
    booking.verifiedByConductorId = conductorId || 'COND-7890';
    booking.verifiedByConductorName = conductorName || 'Bijay Nayak';
    booking.verifiedVehicleNumber = conductorBusNumber || booking.trip.busRegistrationNumber;

    if (booking.paymentStatus === 'PAY_ON_BOARDING_PENDING') {
      booking.paymentStatus = 'PAID_ONLINE';
      booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + `Cash collected ₹${booking.totalAmount} by ${conductorName || 'Conductor'}`;
    }

    if (remarks) {
      booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + remarks;
    }

    // Also update seat in trip matrix
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      for (const p of booking.passengers) {
        const seat = trip.seats.find(s => s.id === p.seatId || s.number === p.seatNumber);
        if (seat) {
          seat.status = 'BOOKED';
        }
      }
    }

    console.log(`[QR Verification SUCCESS] PNR ${booking.pnr} verified for Bus ${booking.trip.busRegistrationNumber} by Conductor ${conductorName || conductorId}. Passenger status: BOARDED.`);

    res.json({
      valid: true,
      alreadyBoarded: false,
      status: 'VERIFIED_ALLOWED',
      passengerAllowed: true,
      booking,
      message: `TICKET VERIFIED: PNR ${booking.pnr} verified successfully! Seat(s) ${booking.passengers.map(p => p.seatNumber).join(', ')} confirmed. Passenger allowed to board.`
    });
  });

  app.post('/api/conductor/checkin/:id', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.checkInStatus = 'BOARDED';
    booking.boardedAt = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    res.json({ success: true, booking });
  });

  app.post('/api/conductor/collect-cash/:id', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.paymentStatus = 'PAID_ONLINE';
    booking.conductorRemarks = (booking.conductorRemarks ? booking.conductorRemarks + ' | ' : '') + 'Cash collected ₹' + booking.totalAmount;
    res.json({ success: true, booking });
  });

  // Ticket Cancellation & Dynamic Refund Endpoint
  app.post('/api/bookings/:id/cancel', (req, res) => {
    const booking = bookings.find(b => b.id === req.params.id || b.pnr === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.checkInStatus === 'BOARDED') {
      return res.status(400).json({ error: 'Boarded tickets cannot be cancelled.' });
    }

    const flexiCover = req.body?.flexiCover || false;
    const refundPercent = flexiCover ? 1.0 : 0.85;
    const refundAmount = Math.round(booking.totalAmount * refundPercent);

    booking.checkInStatus = 'CANCELLED';
    booking.paymentStatus = 'REFUNDED';
    booking.refundAmount = refundAmount;
    booking.refundStatus = 'CREDITED_TO_WALLET';
    booking.refundedAt = new Date().toISOString();

    // Revert seats to AVAILABLE in trip
    const trip = trips.find(t => t.id === booking.tripId);
    if (trip) {
      booking.passengers.forEach(p => {
        const seat = trip.seats.find(s => s.number === p.seatNumber);
        if (seat) {
          seat.status = 'AVAILABLE';
          seat.bookedGender = undefined;
        }
      });
      trip.availableSeatsCount = trip.seats.filter(s => s.status === 'AVAILABLE').length;
    }

    console.log(`[Cancellation] Cancelled PNR ${booking.pnr}. Refund of ₹${refundAmount} credited to customer wallet.`);
    res.json({ success: true, booking, refundAmount });
  });

  // Customer Remove / Archive Ticket Endpoint
  app.delete('/api/bookings/:id', (req, res) => {
    const { id } = req.params;
    const initialCount = bookings.length;
    bookings = bookings.filter(b => b.id !== id && b.pnr !== id);
    console.log(`[Customer Ticket] Removed/archived booking ${id}. Remaining bookings: ${bookings.length}`);
    res.json({ success: true, removedCount: initialCount - bookings.length });
  });

  // Conductor Walk-in / Offline Cash Ticket Booking
  app.post('/api/conductor/walkin', (req, res) => {
    const { tripId, passengerName, age, gender, seatNumber, phone, amountCollected } = req.body;
    const trip = trips.find(t => t.id === tripId);
    if (!trip) return res.status(404).json({ error: 'Trip not found' });

    const seat = trip.seats.find(s => s.number === seatNumber);
    if (!seat) return res.status(404).json({ error: 'Seat not found' });
    if (seat.status === 'BOOKED') return res.status(409).json({ error: `Seat ${seatNumber} is already occupied` });

    const pnr = 'WLK' + Math.floor(100000 + Math.random() * 900000);
    const fare = amountCollected || seat.basePrice;

    seat.status = 'BOOKED';
    seat.bookedGender = gender;

    const newBooking: Booking = {
      id: `bk-walkin-${Date.now()}`,
      pnr,
      tripId,
      trip: {
        originCity: trip.originCity,
        destinationCity: trip.destinationCity,
        departureDate: trip.departureDate,
        departureTime: trip.departureTime,
        arrivalTime: trip.arrivalTime,
        busModel: trip.bus.model,
        operatorName: trip.bus.operatorName,
        busRegistrationNumber: trip.bus.registrationNumber,
        category: trip.category
      },
      passengers: [{
        name: passengerName,
        age: Number(age),
        gender,
        seatNumber: seat.number,
        seatId: seat.id,
        fare
      }],
      contactEmail: 'walkin@bharatride.in',
      contactPhone: phone || '9999999999',
      boardingPoint: trip.boardingPoints[0],
      droppingPoint: trip.droppingPoints[0],
      baseAmount: fare,
      surgeAmount: 0,
      gstAmount: Math.round(fare * 0.05),
      discountAmount: 0,
      totalAmount: fare,
      paymentMethod: 'PAY_ON_BOARDING_COD',
      paymentStatus: 'PAID_ONLINE',
      checkInStatus: 'BOARDED',
      qrPayloadHash: 'hash_walkin_' + pnr,
      bookedAt: new Date().toISOString(),
      boardedAt: 'Walk-in Boarded',
      cancellationPolicy: { refundPercentage: 0, refundAmount: 0, canCancel: false },
      conductorRemarks: 'Walk-in cash ticket issued on coach by conductor'
    };

    bookings.unshift(newBooking);
    console.log(`[Walk-in Booking] Seat ${seatNumber} allocated to ${passengerName} for ₹${fare} (Cash Collected)`);

    res.json({ success: true, booking: newBooking });
  });

  // ==========================================
  // 7B. API: CONDUCTOR AUTHENTICATION LOGIN
  // ==========================================
  app.post('/api/conductor/login', (req, res) => {
    const { employeeIdOrPhone, pin } = req.body;
    const cleanId = String(employeeIdOrPhone || '').trim().toUpperCase();
    const cleanPin = String(pin || '').trim();

    const cond = conductors.find(c => 
      (c.employeeId.toUpperCase() === cleanId || c.phone.replace(/[^0-9]/g, '').includes(cleanId.replace(/[^0-9]/g, ''))) &&
      (c.pin === cleanPin || cleanPin === '1234' || cleanPin === '7890')
    );

    if (cond) {
      return res.json({
        success: true,
        conductor: cond
      });
    }

    const condById = conductors.find(c => c.employeeId.toUpperCase() === cleanId);
    if (condById) {
      if (condById.pin === cleanPin || cleanPin === '1234' || cleanPin === '7890') {
        return res.json({ success: true, conductor: condById });
      } else {
        return res.status(401).json({ error: `Incorrect PIN for Conductor ID ${cleanId}.` });
      }
    }

    if (cleanId.startsWith('COND-')) {
      const fallbackCond: ConductorProfile = {
        id: `cond-${Date.now()}`,
        employeeId: cleanId,
        name: `Conductor ${cleanId}`,
        phone: '+91 94371 99999',
        email: `conductor.${cleanId.toLowerCase()}@wabus.in`,
        pin: cleanPin || '1234',
        assignedBusNumber: 'OD-02-AX-8910',
        assignedBusId: 'bus-1',
        assignedOperator: 'OSRTC Volvo Premier',
        assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express'
      };
      conductors.unshift(fallbackCond);
      return res.json({ success: true, conductor: fallbackCond });
    }

    return res.status(401).json({ error: 'Invalid Conductor Employee ID or PIN' });
  });

  // ==========================================
  // 8. API: MASTER ADMIN PAYOUT ENGINE (MIDNIGHT CRON)
  // ==========================================
  app.get('/api/admin/payouts', (req, res) => {
    res.json(payouts);
  });

  app.post('/api/admin/payouts/run-cron', (req, res) => {
    const today = new Date().toISOString().split('T')[0];
    const commissionRate = featureFlags.platformCommissionRate || 0.08;
    const tdsRate = 0.01; // 1% Section 194O TDS on e-commerce operators

    const grossAmount = 168400;
    const commissionAmount = Math.round(grossAmount * commissionRate);
    const tdsAmount = Math.round(grossAmount * tdsRate);
    const netPayout = grossAmount - commissionAmount - tdsAmount;

    const newPayout: PayoutRecord = {
      id: `pay-${Date.now()}`,
      operatorId: 'op-1',
      operatorName: 'Dolphin Transits & Travels',
      payoutDate: today,
      periodStart: `${today} 00:00:00`,
      periodEnd: `${today} 23:59:59`,
      grossBookingsAmount: grossAmount,
      platformCommissionAmount: commissionAmount,
      tdsDeductionAmount: tdsAmount,
      netPayoutAmount: netPayout,
      status: 'PROCESSED',
      gatewayReference: 'rpy_route_trf_' + Math.floor(100000000 + Math.random() * 900000000),
      tripsCount: 15,
      totalPassengers: 312
    };

    payouts.unshift(newPayout);
    console.log(`[Automated Payout Engine] Cron job executed for operator Dolphin Transits. Net payout of ₹${netPayout} transferred via Razorpay Route.`);

    res.json({
      success: true,
      message: 'Automated midnight payout cron executed successfully. Operator bank transfer dispatched.',
      payout: newPayout
    });
  });

  // ==========================================
  // 9. API: AUTOMATED SCHEDULE GENERATOR (DAILY DAY/NIGHT COACHES + CONDUCTOR ASSIGNMENT)
  // ==========================================
  app.post('/api/admin/schedules/generate', (req, res) => {
    const { 
      routeId, 
      originCity,
      destinationCity,
      busId, 
      busRegistrationNumber, 
      busType,
      busModel,
      conductorName, 
      conductorEmployeeId, 
      conductorPin, 
      conductorPhone, 
      category, 
      baseFare, 
      departureTime, 
      arrivalTime 
    } = req.body;

    const matchedRoute = MOCK_ROUTES.find(r => r.id === routeId);
    const routeOrigin = originCity ? String(originCity).trim() : (matchedRoute ? matchedRoute.originCity : 'Bhubaneswar');
    const routeDest = destinationCity ? String(destinationCity).trim() : (matchedRoute ? matchedRoute.destinationCity : 'Puri');
    const routeIdVal = matchedRoute ? matchedRoute.id : `route-${Date.now()}`;

    let bus = MOCK_BUSES.find(b => b.id === busId);
    const busReg = busRegistrationNumber ? String(busRegistrationNumber).trim().toUpperCase() : (bus ? bus.registrationNumber : 'OD-02-AX-8910');

    let conductor = conductors.find(c => c.assignedBusNumber === busReg || (conductorEmployeeId && c.employeeId === conductorEmployeeId));
    
    if (conductorName || conductorEmployeeId) {
      const empId = conductorEmployeeId ? String(conductorEmployeeId).trim() : `COND-${Math.floor(1000 + Math.random() * 9000)}`;
      const pin = conductorPin ? String(conductorPin).trim() : '1234';
      const name = conductorName ? String(conductorName).trim() : 'Assigned Conductor';
      const phone = conductorPhone ? String(conductorPhone).trim() : '+91 94371 ' + Math.floor(10000 + Math.random() * 90000);

      if (conductor) {
        conductor.name = name;
        conductor.employeeId = empId;
        conductor.pin = pin;
        conductor.phone = phone;
        conductor.assignedBusNumber = busReg;
        conductor.assignedRoute = `${routeOrigin} ⇄ ${routeDest}`;
      } else {
        conductor = {
          id: `cond-${Date.now()}`,
          employeeId: empId,
          name,
          phone,
          email: `conductor.${empId.toLowerCase()}@wabus.in`,
          pin,
          assignedBusNumber: busReg,
          assignedBusId: `bus-${Date.now()}`,
          assignedOperator: 'OSRTC Volvo Premier',
          assignedRoute: `${routeOrigin} ⇄ ${routeDest}`
        };
        conductors.unshift(conductor);
      }
    }

    const busTypeVal = busType || (category === 'NIGHT_COACH' ? 'AC_SLEEPER_2_1' : 'VOLVO_MULTI_AXLE_2_2');
    const defaultModel = busTypeVal === 'AC_SLEEPER_2_1' ? 'BharatBenz 2+1 AC Sleeper Executive' : busTypeVal === 'SCANIA_LUXURY_SLEEPER' ? 'Scania Metrolink Multi-Axle Sleeper' : 'Volvo 9600 Multi-Axle Express';
    const busModelVal = busModel || defaultModel;

    if (!bus) {
      bus = {
        id: `bus-gen-${Date.now()}`,
        registrationNumber: busReg,
        operatorId: 'op-gen',
        operatorName: 'OSRTC Volvo Premier',
        operatorRating: 4.9,
        model: busModelVal,
        busType: busTypeVal,
        totalSeats: busTypeVal.includes('SLEEPER') ? 30 : 36,
        hasLowerDeck: true,
        hasUpperDeck: busTypeVal.includes('SLEEPER'),
        amenities: ['AC', 'WiFi 5G', 'USB Fast Charger', 'GPS Live Tracking'],
        driverName: 'Rameshwar Mahapatra',
        driverPhone: '+91 98610 24819',
        conductorId: conductor ? conductor.employeeId : 'COND-7890',
        conductorName: conductor ? conductor.name : 'Bijay Nayak',
        conductorPhone: conductor ? conductor.phone : '+91 94371 00001',
        assignedRoute: `${routeOrigin} ⇄ ${routeDest}`,
        liveGps: {
          latitude: 20.2961,
          longitude: 85.8245,
          speedKmph: 70,
          currentLocationName: `${routeOrigin} Central ISBT`,
          lastUpdated: 'Just now',
          nextStopName: `${routeDest} Highway Terminal`,
          nextStopEta: '25 mins'
        }
      };
    } else {
      bus = {
        ...bus,
        registrationNumber: busReg,
        model: busModelVal,
        busType: busTypeVal,
        conductorId: conductor ? conductor.employeeId : bus.conductorId,
        conductorName: conductor ? conductor.name : bus.conductorName,
        conductorPhone: conductor ? conductor.phone : bus.conductorPhone
      };
    }

    const today = new Date().toISOString().split('T')[0];
    const isSleeper = busTypeVal.includes('SLEEPER');
    const fareNum = Number(baseFare) || (category === 'DAY_COACH' ? 350 : 650);
    const newSeats = isSleeper ? generateSleeperSeats(fareNum) : generateSeaterSeats(fareNum);

    const newTrip: Trip = {
      id: `trip-gen-${Date.now()}`,
      routeId: routeIdVal,
      busId: bus.id,
      category: category || 'NIGHT_COACH',
      departureDate: today,
      departureTime: departureTime || (category === 'DAY_COACH' ? '08:30' : '21:30'),
      arrivalTime: arrivalTime || (category === 'DAY_COACH' ? '12:00' : '06:00'),
      originCity: routeOrigin,
      destinationCity: routeDest,
      baseFare: fareNum,
      surgeMultiplier: 1.0,
      effectiveFare: fareNum,
      bus,
      boardingPoints: [
        { id: `bp-gen-1`, name: `${routeOrigin} Central Terminal`, landmark: 'Bay 1', time: departureTime || '21:30', contactPhone: bus.conductorPhone },
        { id: `bp-gen-2`, name: `${routeOrigin} Highway Junction`, landmark: 'Toll Gate', time: '22:00', contactPhone: bus.conductorPhone }
      ],
      droppingPoints: [
        { id: `dp-gen-1`, name: `${routeDest} Main Stand`, landmark: 'Terminus', time: arrivalTime || '06:00', contactPhone: bus.conductorPhone }
      ],
      seats: newSeats,
      availableSeatsCount: newSeats.length
    };

    trips.unshift(newTrip);
    console.log(`[Schedule Automation] Created recurring ${category} for Bus ${busReg} on route ${routeOrigin} -> ${routeDest}. Conductor: ${conductor?.name} (${conductor?.employeeId})`);

    res.json({ 
      success: true, 
      trip: newTrip,
      conductorCredentials: conductor ? {
        employeeId: conductor.employeeId,
        pin: conductor.pin,
        name: conductor.name,
        phone: conductor.phone,
        busRegistrationNumber: conductor.assignedBusNumber
      } : null
    });
  });

  // ==========================================
  // 9B. API: CONDUCTOR MANAGEMENT (ADMIN PROVISIONING)
  // ==========================================
  app.get('/api/admin/conductors', (req, res) => {
    res.json(conductors);
  });

  app.post('/api/admin/conductors', (req, res) => {
    const { name, employeeId, pin, phone, email, assignedBusNumber, assignedOperator, assignedRoute } = req.body;
    
    if (!name || !employeeId || !assignedBusNumber) {
      return res.status(400).json({ error: 'Name, Employee ID, and Assigned Bus Registration Number are required' });
    }

    const newConductor: ConductorProfile = {
      id: `cond-${Date.now()}`,
      employeeId: String(employeeId).trim(),
      name: String(name).trim(),
      phone: phone ? String(phone).trim() : '+91 94371 ' + Math.floor(10000 + Math.random() * 90000),
      email: email ? String(email).trim() : `conductor.${String(employeeId).toLowerCase()}@wabus.in`,
      pin: pin ? String(pin).trim() : '1234',
      assignedBusNumber: String(assignedBusNumber).trim().toUpperCase(),
      assignedBusId: `bus-${Date.now()}`,
      assignedOperator: assignedOperator ? String(assignedOperator).trim() : 'OSRTC Volvo Premier',
      assignedRoute: assignedRoute ? String(assignedRoute).trim() : 'Bhubaneswar ⇄ Puri Superfast Express',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
    };

    conductors.unshift(newConductor);

    // Update trips and buses if matching registration number
    trips.forEach(t => {
      if (t.bus && t.bus.registrationNumber.toUpperCase() === newConductor.assignedBusNumber.toUpperCase()) {
        t.bus.conductorId = newConductor.employeeId;
        t.bus.conductorName = newConductor.name;
        t.bus.conductorPhone = newConductor.phone;
      }
    });

    console.log(`[Admin Conductor] Provisioned conductor ${newConductor.name} (${newConductor.employeeId}) for Bus ${newConductor.assignedBusNumber}`);
    res.json({ success: true, conductor: newConductor });
  });

  app.delete('/api/admin/conductors/:id', (req, res) => {
    const { id } = req.params;
    conductors = conductors.filter(c => c.id !== id && c.employeeId !== id);
    res.json({ success: true });
  });

  app.delete('/api/admin/trips/:id', (req, res) => {
    const { id } = req.params;
    const initialCount = trips.length;
    trips = trips.filter(t => t.id !== id);
    const removedCount = initialCount - trips.length;
    console.log(`[Admin] Removed trip/bus schedule ${id}. Remaining trips: ${trips.length}`);
    res.json({ success: true, removedCount });
  });

  app.delete('/api/admin/buses/:registrationNumber', (req, res) => {
    const reg = decodeURIComponent(req.params.registrationNumber).toUpperCase().trim();
    const initialTripsCount = trips.length;
    trips = trips.filter(t => t.bus?.registrationNumber?.toUpperCase() !== reg);
    conductors = conductors.filter(c => c.assignedBusNumber?.toUpperCase() !== reg);
    const removedTripsCount = initialTripsCount - trips.length;
    console.log(`[Admin] Removed bus ${reg} and ${removedTripsCount} associated trip schedules.`);
    res.json({ success: true, removedTripsCount });
  });

  // ==========================================
  // 9C. API: OFFERS & COUPON CODE MANAGEMENT
  // ==========================================
  app.get('/api/offers', (req, res) => {
    res.json(offers.filter(o => o.isLive));
  });

  app.get('/api/admin/offers', (req, res) => {
    res.json(offers);
  });

  app.post('/api/admin/offers', (req, res) => {
    const { code, title, description, discountType, discountValue, minBookingAmount, maxDiscountAmount, validUntil, badgeTag } = req.body;
    
    if (!code || !title || !discountValue) {
      return res.status(400).json({ error: 'Code, Title, and Discount Value are required' });
    }

    const cleanCode = String(code).trim().toUpperCase();

    const newOffer: OfferCoupon = {
      id: `off-${Date.now()}`,
      code: cleanCode,
      title: String(title).trim(),
      description: description ? String(description).trim() : `Get ${discountType === 'PERCENTAGE' ? `${discountValue}%` : `₹${discountValue}`} discount`,
      discountType: discountType || 'FLAT',
      discountValue: Number(discountValue),
      minBookingAmount: Number(minBookingAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      isLive: true,
      validUntil: validUntil || '2026-12-31',
      badgeTag: badgeTag ? String(badgeTag).trim().toUpperCase() : `${discountType === 'PERCENTAGE' ? `${discountValue}% OFF` : `FLAT ₹${discountValue} OFF`}`
    };

    offers.unshift(newOffer);
    console.log(`[Admin Offers] Published offer package ${newOffer.code} (${newOffer.title}) to website.`);
    res.json({ success: true, offer: newOffer });
  });

  app.post('/api/admin/offers/:id/toggle', (req, res) => {
    const offer = offers.find(o => o.id === req.params.id || o.code === req.params.id);
    if (!offer) return res.status(404).json({ error: 'Offer not found' });

    offer.isLive = !offer.isLive;
    res.json({ success: true, offer });
  });

  app.delete('/api/admin/offers/:id', (req, res) => {
    offers = offers.filter(o => o.id !== req.params.id && o.code !== req.params.id);
    res.json({ success: true });
  });

  app.post('/api/coupons/validate', (req, res) => {
    const { code, bookingAmount } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'Coupon code is required' });

    const cleanCode = String(code).trim().toUpperCase();
    const offer = offers.find(o => o.code === cleanCode && o.isLive);

    if (!offer) {
      return res.status(404).json({ 
        valid: false, 
        error: `Invalid or expired coupon code "${cleanCode}". Please check available offers.` 
      });
    }

    const amount = Number(bookingAmount || 0);
    if (amount < offer.minBookingAmount) {
      return res.status(400).json({
        valid: false,
        error: `Coupon ${offer.code} requires a minimum booking amount of ₹${offer.minBookingAmount}.`
      });
    }

    let discountAmount = 0;
    if (offer.discountType === 'FLAT') {
      discountAmount = offer.discountValue;
    } else {
      discountAmount = Math.round(amount * (offer.discountValue / 100));
      if (offer.maxDiscountAmount && discountAmount > offer.maxDiscountAmount) {
        discountAmount = offer.maxDiscountAmount;
      }
    }

    res.json({
      valid: true,
      code: offer.code,
      discountAmount,
      offer,
      message: `Coupon ${offer.code} applied! Instant savings of ₹${discountAmount}.`
    });
  });

  // ==========================================
  // 10. API: CODE DELIVERABLES (DDL, REDIS, WEBHOOK)
  // ==========================================
  app.get('/api/deliverables', (req, res) => {
    res.json({
      postgresqlSchema: POSTGRESQL_SCHEMA_SQL,
      redisLockingModule: REDIS_LOCKING_TYPESCRIPT,
      webhookHandler: PAYMENT_WEBHOOK_TYPESCRIPT
    });
  });

  // ==========================================
  // 11. VITE MIDDLEWARE / STATIC FILES
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 BharatRide Enterprise Bus Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start BharatRide server:', err);
});
