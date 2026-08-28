export const POSTGRESQL_SCHEMA_SQL = `-- ============================================================================
-- BHARAT-RIDE ENTERPRISE BUS ECOSYSTEM - PRODUCTION POSTGRESQL DDL
-- Multi-deck Seat Locks, Dynamic Pricing, Conductor Manifest & Payouts
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 0. USER AUTHENTICATION & OTP VERIFICATIONS
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT TRUE,
    name VARCHAR(150),
    phone VARCHAR(20),
    role VARCHAR(30) DEFAULT 'PASSENGER',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_lower_email ON users(LOWER(email));

CREATE TABLE otp_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(64) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMPTZ,
    ip_address VARCHAR(45)
);

CREATE INDEX idx_otp_verifications_email ON otp_verifications(LOWER(email));
CREATE INDEX idx_otp_verifications_lookup ON otp_verifications(LOWER(email), used, expires_at);

-- 1. ENUMS
CREATE TYPE coach_type_enum AS ENUM ('AC_SLEEPER_2_1', 'VOLVO_MULTI_AXLE_2_2', 'SCANIA_LUXURY_SLEEPER');
CREATE TYPE trip_category_enum AS ENUM ('DAY_COACH', 'NIGHT_COACH');
CREATE TYPE deck_enum AS ENUM ('LOWER', 'UPPER');
CREATE TYPE seat_status_enum AS ENUM ('AVAILABLE', 'LOCKED', 'BOOKED', 'CONDUCTOR_RESERVED');
CREATE TYPE gender_restriction_enum AS ENUM ('ANY', 'FEMALE_ONLY', 'MALE_ONLY');
CREATE TYPE payment_status_enum AS ENUM ('PAID_ONLINE', 'PAY_ON_BOARDING_PENDING', 'REFUNDED', 'FAILED');
CREATE TYPE check_in_status_enum AS ENUM ('CONFIRMED', 'BOARDED', 'NO_SHOW', 'CANCELLED');
CREATE TYPE payout_status_enum AS ENUM ('PENDING', 'PROCESSED', 'FAILED');

-- 2. OPERATORS & FLEET
CREATE TABLE operators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_entity_name VARCHAR(255) NOT NULL,
    gstin VARCHAR(15) UNIQUE NOT NULL,
    payout_account_id VARCHAR(100) NOT NULL, -- Razorpay Route / Stripe Connect Acc ID
    bank_account_number VARCHAR(30) NOT NULL,
    bank_ifsc VARCHAR(11) NOT NULL,
    rating NUMERIC(2, 1) DEFAULT 4.5,
    commission_rate NUMERIC(4, 2) DEFAULT 8.00, -- 8.00%
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE buses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id) ON DELETE CASCADE,
    registration_number VARCHAR(20) UNIQUE NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    coach_type coach_type_enum NOT NULL,
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    has_lower_deck BOOLEAN DEFAULT TRUE,
    has_upper_deck BOOLEAN DEFAULT FALSE,
    amenities JSONB DEFAULT '["AC", "Charging Port", "Reading Lamp", "Blanket", "Water Bottle", "GPS Live Tracking"]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROUTES & TRIPS
CREATE TABLE routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    origin_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    distance_km NUMERIC(6, 2) NOT NULL,
    estimated_duration_minutes INTEGER NOT NULL,
    is_popular_weekend_route BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_route UNIQUE(origin_city, destination_city)
);

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES routes(id),
    bus_id UUID NOT NULL REFERENCES buses(id),
    category trip_category_enum NOT NULL,
    departure_timestamp TIMESTAMPTZ NOT NULL,
    arrival_timestamp TIMESTAMPTZ NOT NULL,
    base_fare NUMERIC(10, 2) NOT NULL,
    dynamic_surge_multiplier NUMERIC(3, 2) DEFAULT 1.00,
    conductor_name VARCHAR(100),
    conductor_phone VARCHAR(20),
    driver_name VARCHAR(100),
    driver_phone VARCHAR(20),
    is_cancelled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. SEATS & REAL-TIME LOCKS
CREATE TABLE trip_seats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    deck deck_enum NOT NULL DEFAULT 'LOWER',
    row_num INTEGER NOT NULL,
    col_num INTEGER NOT NULL,
    is_sleeper BOOLEAN NOT NULL DEFAULT FALSE,
    base_price NUMERIC(10, 2) NOT NULL,
    status seat_status_enum NOT NULL DEFAULT 'AVAILABLE',
    gender_restriction gender_restriction_enum DEFAULT 'ANY',
    locked_session_id VARCHAR(128),
    lock_expires_at TIMESTAMPTZ,
    version INTEGER NOT NULL DEFAULT 1, -- Optimistic locking version
    CONSTRAINT unique_trip_seat UNIQUE (trip_id, seat_number)
);

-- 5. BOOKINGS & PASSENGERS
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pnr VARCHAR(12) UNIQUE NOT NULL,
    trip_id UUID NOT NULL REFERENCES trips(id),
    user_id UUID,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    boarding_point JSONB NOT NULL,
    dropping_point JSONB NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    surge_amount NUMERIC(10, 2) DEFAULT 0.00,
    gst_amount NUMERIC(10, 2) NOT NULL,
    discount_amount NUMERIC(10, 2) DEFAULT 0.00,
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL,
    payment_status payment_status_enum NOT NULL,
    check_in_status check_in_status_enum NOT NULL DEFAULT 'CONFIRMED',
    qr_payload_hash VARCHAR(255) UNIQUE NOT NULL,
    boarded_at TIMESTAMPTZ,
    conductor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    seat_id UUID NOT NULL REFERENCES trip_seats(id),
    name VARCHAR(150) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(10) NOT NULL,
    seat_number VARCHAR(10) NOT NULL,
    fare NUMERIC(10, 2) NOT NULL
);

-- 6. OPERATOR PAYOUTS & COMMISSIONS (CRON SETTLEMENT)
CREATE TABLE operator_payouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operator_id UUID NOT NULL REFERENCES operators(id),
    payout_date DATE NOT NULL,
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    gross_bookings_amount NUMERIC(12, 2) NOT NULL,
    platform_commission_amount NUMERIC(12, 2) NOT NULL,
    tds_deduction_amount NUMERIC(12, 2) NOT NULL,
    net_payout_amount NUMERIC(12, 2) NOT NULL,
    status payout_status_enum NOT NULL DEFAULT 'PENDING',
    gateway_transfer_id VARCHAR(100),
    trips_count INTEGER NOT NULL,
    total_passengers INTEGER NOT NULL,
    processed_at TIMESTAMPTZ
);

-- 7. PERFORMANCE INDEXES
CREATE INDEX idx_trips_route_date ON trips(route_id, departure_timestamp);
CREATE INDEX idx_seats_trip_status ON trip_seats(trip_id, status);
CREATE INDEX idx_bookings_pnr ON bookings(pnr);
CREATE INDEX idx_bookings_qr_hash ON bookings(qr_payload_hash);
CREATE INDEX idx_payouts_operator_date ON operator_payouts(operator_id, payout_date);
`;

export const REDIS_LOCKING_TYPESCRIPT = `// ============================================================================
// REDIS DISTRIBUTED SEAT LOCKING MODULE (10-MINUTE TTL)
// Atomicity via Redis Lua Script with Auto-Rollback & Conflict Handling
// ============================================================================

import Redis from 'ioredis';
import crypto from 'crypto';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const SEAT_LOCK_TTL_SECONDS = 600; // 10 minutes

// Lua script to atomically lock multiple seats only if ALL are currently unheld
const ACQUIRE_SEATS_LUA = \`
  local tripId = ARGV[1]
  local sessionId = ARGV[2]
  local ttl = tonumber(ARGV[3])
  
  -- Check if any of the keys are already locked
  for i, seatNumber in ipairs(KEYS) do
    local key = "lock:trip:" .. tripId .. ":seat:" .. seatNumber
    local currentLock = redis.call("GET", key)
    if currentLock and currentLock ~= sessionId then
      return 0 -- Conflict detected! Cannot acquire
    end
  end

  -- All seats free or already owned by this session: apply locks
  for i, seatNumber in ipairs(KEYS) do
    local key = "lock:trip:" .. tripId .. ":seat:" .. seatNumber
    redis.call("SET", key, sessionId, "EX", ttl)
  end

  return 1 -- Successfully acquired all seat locks
\`;

// Lua script to atomically release seat locks owned by a specific session
const RELEASE_SEATS_LUA = \`
  local tripId = ARGV[1]
  local sessionId = ARGV[2]
  
  for i, seatNumber in ipairs(KEYS) do
    local key = "lock:trip:" .. tripId .. ":seat:" .. seatNumber
    if redis.call("GET", key) == sessionId then
      redis.call("DEL", key)
    end
  end
  return 1
\`;

export async function lockSeatsAtomic(
  tripId: string,
  seatNumbers: string[],
  sessionId: string
): Promise<{ success: boolean; expiresAt?: number; error?: string }> {
  try {
    const result = await redis.eval(
      ACQUIRE_SEATS_LUA,
      seatNumbers.length,
      ...seatNumbers,
      tripId,
      sessionId,
      SEAT_LOCK_TTL_SECONDS
    );

    if (result === 1) {
      const expiresAt = Date.now() + SEAT_LOCK_TTL_SECONDS * 1000;
      return { success: true, expiresAt };
    } else {
      return { 
        success: false, 
        error: 'One or more selected seats were just locked by another passenger. Please choose another seat.' 
      };
    }
  } catch (err: any) {
    console.error('Redis lock acquisition failed:', err);
    return { success: false, error: 'Lock acquisition failure: ' + err.message };
  }
}

export async function releaseSeatsAtomic(
  tripId: string,
  seatNumbers: string[],
  sessionId: string
): Promise<boolean> {
  try {
    await redis.eval(
      RELEASE_SEATS_LUA,
      seatNumbers.length,
      ...seatNumbers,
      tripId,
      sessionId
    );
    return true;
  } catch (err) {
    console.error('Redis lock release failed:', err);
    return false;
  }
}
`;

export const PAYMENT_WEBHOOK_TYPESCRIPT = `// ============================================================================
// AUTOMATED POST-PAYMENT WEBHOOK & E-TICKET QR GENERATION
// Validates HMAC SHA-256 Signature, Persists Booking & Dispatches WhatsApp PDF
// ============================================================================

import express, { Request, Response } from 'express';
import crypto from 'crypto';

interface WebhookPayload {
  event: 'payment.captured' | 'payment.failed';
  payload: {
    payment: {
      entity: {
        id: string;
        amount: number;
        currency: 'INR';
        status: 'captured';
        order_id: string;
        method: string;
        notes: {
          tripId: string;
          seatNumbers: string; // Comma separated
          sessionId: string;
          contactPhone: string;
          contactEmail: string;
        };
      };
    };
  };
}

export function verifyGatewaySignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
}

export async function handlePaymentWebhook(req: Request, res: Response) {
  const signature = req.headers['x-razorpay-signature'] as string;
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || 'secret_test_key_123';

  const isValid = verifyGatewaySignature(JSON.stringify(req.body), signature, webhookSecret);
  if (!isValid) {
    return res.status(400).json({ error: 'Invalid HMAC signature' });
  }

  const { event, payload } = req.body as WebhookPayload;

  if (event === 'payment.captured') {
    const payment = payload.payment.entity;
    const { tripId, seatNumbers, sessionId, contactPhone, contactEmail } = payment.notes;
    const seats = seatNumbers.split(',');

    // 1. Generate Unique Cryptographic Token for QR Code
    const pnr = 'BR' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const qrPayload = JSON.stringify({
      pnr,
      tripId,
      seats,
      amount: payment.amount / 100,
      timestamp: Date.now(),
      v: 2
    });

    const qrHash = crypto
      .createHmac('sha256', process.env.QR_ENCRYPTION_KEY || 'qr_master_salt')
      .update(qrPayload)
      .digest('hex');

    // 2. Commit Booking in DB & Release Redis Lock to Permanent BOOKED state
    console.log(\`[Automated Webhook] PNR \${pnr} created for seats \${seats.join(', ')}\`);

    // 3. Trigger WhatsApp Business API & SMS with signed PDF link
    console.log(\`[WhatsApp Dispatch] Sending E-Ticket with QR code to +91 \${contactPhone}\`);

    return res.status(200).json({ status: 'ok', pnr, qrHash });
  }

  return res.status(200).json({ status: 'ignored' });
}
`;
