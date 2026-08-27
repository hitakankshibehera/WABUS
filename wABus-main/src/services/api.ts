import { Trip, Booking, FeatureFlags, PayoutRecord, Route, ConductorProfile, OfferCoupon } from '../types';

export const api = {
  async getFeatureFlags(): Promise<FeatureFlags> {
    const res = await fetch('/api/feature-flags');
    return res.json();
  },

  async updateFeatureFlags(flags: Partial<FeatureFlags>): Promise<FeatureFlags> {
    const res = await fetch('/api/feature-flags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(flags)
    });
    const data = await res.json();
    return data.featureFlags;
  },

  async getRoutes(): Promise<Route[]> {
    const res = await fetch('/api/routes');
    return res.json();
  },

  async searchTrips(params?: { origin?: string; destination?: string; date?: string; category?: string; busType?: string }): Promise<Trip[]> {
    const query = new URLSearchParams();
    if (params?.origin) query.set('origin', params.origin);
    if (params?.destination) query.set('destination', params.destination);
    if (params?.date) query.set('date', params.date);
    if (params?.category) query.set('category', params.category);
    if (params?.busType) query.set('busType', params.busType);

    const res = await fetch(`/api/trips?${query.toString()}`);
    return res.json();
  },

  async getTripById(id: string): Promise<Trip> {
    const res = await fetch(`/api/trips/${id}`);
    if (!res.ok) throw new Error('Trip not found');
    return res.json();
  },

  async lockSeats(tripId: string, seatIds: string[], sessionId: string): Promise<{ success: boolean; expiresAt: number; ttlSeconds: number; error?: string }> {
    const res = await fetch('/api/seats/lock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, seatIds, sessionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to lock seats');
    return data;
  },

  async releaseSeats(tripId: string, seatIds: string[], sessionId: string): Promise<void> {
    await fetch('/api/seats/release', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tripId, seatIds, sessionId })
    });
  },

  async checkoutBooking(payload: {
    tripId: string;
    sessionId: string;
    passengers: any[];
    contactEmail: string;
    contactPhone: string;
    boardingPointId: string;
    droppingPointId: string;
    paymentMethod: string;
    discountAmount?: number;
  }): Promise<{ success: boolean; booking: Booking; qrToken: string; whatsAppDelivered: boolean }> {
    const res = await fetch('/api/bookings/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Booking checkout failed');
    return data;
  },

  async getBookings(): Promise<Booking[]> {
    const res = await fetch('/api/bookings');
    if (!res.ok) return [];
    return res.json();
  },

  async getBookingByPnr(pnr: string): Promise<Booking> {
    const res = await fetch(`/api/bookings/${pnr}`);
    if (!res.ok) throw new Error('Booking not found');
    return res.json();
  },

  async cancelBooking(pnrOrId: string, flexiCover?: boolean, reason?: string): Promise<{ success: boolean; booking: Booking; refundPercentage?: number; refundAmount: number }> {
    const res = await fetch(`/api/bookings/${pnrOrId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flexiCover, reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cancellation failed');
    return data;
  },

  async getConductorManifest(tripOrBusIdentifier: string): Promise<{ trip: Trip; assignedBus?: any; manifest: any[]; summary: any }> {
    const res = await fetch(`/api/conductor/manifest/${encodeURIComponent(tripOrBusIdentifier)}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Manifest not found');
    }
    return res.json();
  },

  async manualCheckInBooking(bookingId: string): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch(`/api/conductor/checkin/${bookingId}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Check-in failed');
    return data;
  },

  async collectCashPayment(bookingId: string): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch(`/api/conductor/collect-cash/${bookingId}`, {
      method: 'POST'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Cash collection failed');
    return data;
  },

  async scanTicket(payload: {
    qrHashOrPnr: string;
    conductorBusNumber?: string;
    tripId?: string;
    conductorId?: string;
    conductorName?: string;
    autoCollectCash?: boolean;
    remarks?: string;
  }): Promise<{
    valid: boolean;
    status: 'VERIFIED_ALLOWED' | 'INVALID_WRONG_BUS' | 'INVALID_ALREADY_BOARDED' | 'INVALID_CANCELLED' | 'PENDING_CASH_COLLECTION' | 'INVALID_NOT_FOUND' | 'INVALID_TAMPERED';
    booking?: Booking;
    alreadyBoarded?: boolean;
    passengerAllowed: boolean;
    message?: string;
    error?: string;
    ticketBusNumber?: string;
    conductorBusNumber?: string;
  }> {
    const res = await fetch('/api/conductor/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok && !data.error && !data.message) {
      throw new Error('Ticket verification failed');
    }
    return data;
  },

  async bookWalkinTicket(payload: {
    tripId: string;
    passengerName: string;
    age: number;
    gender: string;
    seatNumber: string;
    phone: string;
    amountCollected: number;
  }): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch('/api/conductor/walkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Walk-in booking failed');
    return data;
  },

  async getPayouts(): Promise<PayoutRecord[]> {
    const res = await fetch('/api/admin/payouts');
    return res.json();
  },

  async triggerPayoutCron(): Promise<{ success: boolean; message: string; payout: PayoutRecord }> {
    const res = await fetch('/api/admin/payouts/run-cron', { method: 'POST' });
    const data = await res.json();
    return data;
  },

  async generateRecurringSchedule(payload: any): Promise<{ 
    success: boolean; 
    trip: Trip; 
    conductorCredentials?: {
      employeeId: string;
      pin: string;
      name: string;
      phone: string;
      busRegistrationNumber: string;
    } | null 
  }> {
    const res = await fetch('/api/admin/schedules/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data;
  },

  async getConductors(): Promise<ConductorProfile[]> {
    const res = await fetch('/api/admin/conductors');
    if (!res.ok) return [];
    return res.json();
  },

  async addConductor(payload: Partial<ConductorProfile>): Promise<{ success: boolean; conductor: ConductorProfile }> {
    const res = await fetch('/api/admin/conductors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add conductor');
    return data;
  },

  async deleteConductor(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/conductors/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async loginConductor(employeeIdOrPhone: string, pin: string): Promise<{ success: boolean; conductor: ConductorProfile }> {
    const res = await fetch('/api/conductor/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employeeIdOrPhone, pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Conductor authentication failed');
    return data;
  },

  async getOffers(): Promise<OfferCoupon[]> {
    const res = await fetch('/api/offers');
    if (!res.ok) return [];
    return res.json();
  },

  async getAdminOffers(): Promise<OfferCoupon[]> {
    const res = await fetch('/api/admin/offers');
    if (!res.ok) return [];
    return res.json();
  },

  async createOffer(payload: Partial<OfferCoupon>): Promise<{ success: boolean; offer: OfferCoupon }> {
    const res = await fetch('/api/admin/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create offer package');
    return data;
  },

  async toggleOffer(id: string): Promise<{ success: boolean; offer: OfferCoupon }> {
    const res = await fetch(`/api/admin/offers/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to toggle offer status');
    return data;
  },

  async deleteOffer(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/offers/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async validateCoupon(code: string, bookingAmount?: number): Promise<{
    valid: boolean;
    code?: string;
    discountAmount?: number;
    offer?: OfferCoupon;
    message?: string;
    error?: string;
  }> {
    const res = await fetch('/api/coupons/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, bookingAmount })
    });
    const data = await res.json();
    if (!res.ok && !data.error) throw new Error('Failed to validate coupon code');
    return data;
  },

  async deleteTrip(id: string): Promise<{ success: boolean; removedCount?: number }> {
    const res = await fetch(`/api/admin/trips/${id}`, { method: 'DELETE' });
    return res.json();
  },

  async deleteBus(registrationNumber: string): Promise<{ success: boolean; refundTripsCount?: number }> {
    const res = await fetch(`/api/admin/buses/${encodeURIComponent(registrationNumber)}`, { method: 'DELETE' });
    return res.json();
  },

  async deleteBooking(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/bookings/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove ticket');
    return data;
  },

  async getDeliverables(): Promise<{ postgresqlSchema: string; redisLockingModule: string; webhookHandler: string }> {
    const res = await fetch('/api/deliverables');
    return res.json();
  }
};
