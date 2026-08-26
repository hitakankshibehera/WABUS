export type CoachType = 'AC_SLEEPER_2_1' | 'VOLVO_MULTI_AXLE_2_2' | 'SCANIA_LUXURY_SLEEPER';
export type TripCategory = 'DAY_COACH' | 'NIGHT_COACH';
export type SeatTier = 'LOWER_BERTH' | 'UPPER_BERTH' | 'SEATER_WINDOW' | 'SEATER_AISLE';
export type SeatGenderRestriction = 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY';
export type SeatStatus = 'AVAILABLE' | 'LOCKED' | 'BOOKED' | 'CONDUCTOR_RESERVED';
export type PaymentStatus = 'PAID_ONLINE' | 'PAY_ON_BOARDING_PENDING' | 'REFUNDED' | 'FAILED';
export type CheckInStatus = 'CONFIRMED' | 'BOARDED' | 'NO_SHOW' | 'CANCELLED';
export type PaymentMethod = 'UPI' | 'CREDIT_DEBIT_CARD' | 'NET_BANKING' | 'PAY_ON_BOARDING_COD';

export interface Seat {
  id: string;
  number: string;
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number; // 0, 1, 2 or 3
  isSleeper: boolean;
  basePrice: number;
  status: SeatStatus;
  genderRestriction: SeatGenderRestriction;
  bookedGender?: 'MALE' | 'FEMALE' | 'OTHER';
  lockedBySessionId?: string;
  lockExpiresAt?: number; // timestamp in ms
}

export interface BoardingDroppingPoint {
  id: string;
  name: string;
  landmark: string;
  time: string; // e.g. "21:30"
  contactPhone: string;
}

// Aliases for compatibility
export type BoardingPoint = BoardingDroppingPoint;
export type DroppingPoint = BoardingDroppingPoint;

export interface Bus {
  id: string;
  registrationNumber: string; // Unique Vehicle Number e.g. OD-02-AX-8910
  operatorId: string;
  operatorName: string;
  operatorRating: number;
  model: string;
  busType: CoachType;
  totalSeats: number;
  hasLowerDeck: boolean;
  hasUpperDeck: boolean;
  amenities: string[];
  driverName: string;
  driverPhone: string;
  conductorId?: string; // Assigned Conductor ID e.g. COND-7890
  conductorName: string;
  conductorPhone: string;
  assignedRoute?: string;
  liveGps?: {
    latitude: number;
    longitude: number;
    speedKmph: number;
    currentLocationName: string;
    lastUpdated: string;
    nextStopName: string;
    nextStopEta: string;
  };
}

export interface Route {
  id: string;
  originCity: string;
  destinationCity: string;
  distanceKm: number;
  estimatedDurationHours: number;
  popularWeekendRoute: boolean;
}

export interface Trip {
  id: string;
  routeId: string;
  busId: string;
  category: TripCategory;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // "20:30"
  arrivalTime: string; // "06:15"
  originCity: string;
  destinationCity: string;
  boardingPoints: BoardingDroppingPoint[];
  droppingPoints: BoardingDroppingPoint[];
  baseFare: number;
  surgeMultiplier: number;
  effectiveFare: number;
  seats: Seat[];
  availableSeatsCount: number;
  bus: Bus;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  seatNumber: string;
  seatId: string;
  fare: number;
}

export type PassengerDetails = Passenger;

export interface Booking {
  id: string;
  pnr: string;
  tripId: string;
  trip: {
    originCity: string;
    destinationCity: string;
    departureDate: string;
    departureTime: string;
    arrivalTime: string;
    busModel: string;
    operatorName: string;
    busRegistrationNumber: string; // Vehicle Number
    category: TripCategory;
  };
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  boardingPoint: BoardingDroppingPoint;
  droppingPoint: BoardingDroppingPoint;
  baseAmount: number;
  surgeAmount: number;
  gstAmount: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  checkInStatus: CheckInStatus;
  qrPayloadHash: string;
  qrPayloadData?: string;
  bookedAt: string;
  cancellationPolicy: {
    refundPercentage: number;
    refundAmount: number;
    canCancel: boolean;
    cancellationReason?: string;
  };
  whatsappDispatched?: boolean;
  conductorRemarks?: string;
  boardedAt?: string;
  verifiedByConductorId?: string;
  verifiedByConductorName?: string;
  verifiedVehicleNumber?: string;
}

export interface ConductorProfile {
  id: string;
  employeeId: string;
  name: string;
  phone: string;
  email: string;
  pin: string;
  assignedBusNumber: string; // Vehicle Number
  assignedBusId: string;
  assignedOperator: string;
  assignedRoute: string;
  avatarUrl?: string;
  activeTripId?: string;
}

export interface QRVerificationResult {
  valid: boolean;
  status: 'VERIFIED_ALLOWED' | 'INVALID_WRONG_BUS' | 'INVALID_ALREADY_BOARDED' | 'INVALID_CANCELLED' | 'PENDING_CASH_COLLECTION' | 'INVALID_NOT_FOUND' | 'INVALID_TAMPERED';
  booking?: Booking;
  message: string;
  error?: string;
  passengerAllowed: boolean;
  ticketBusNumber?: string;
  conductorBusNumber?: string;
}

export interface FeatureFlags {
  enableSurgePricing: boolean;
  surgeMultiplier: number; // e.g. 1.25 for +25%
  enablePayOnBoarding: boolean;
  enableDynamicCancellation: boolean;
  enableWhatsAppNotifications: boolean;
  maintenanceMode: boolean;
  emergencyAlertBanner: string | null;
  seatLockDurationMinutes: number;
  platformCommissionRate: number; // e.g. 0.08 for 8%
}

export interface PayoutRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  payoutDate: string;
  periodStart: string;
  periodEnd: string;
  grossBookingsAmount: number;
  platformCommissionAmount: number;
  tdsDeductionAmount: number;
  netPayoutAmount: number;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
  gatewayReference: string; // Razorpay Route / Stripe Connect transfer ID
  tripsCount: number;
  totalPassengers: number;
}

export interface TripManifestSummary {
  tripId: string;
  totalSeats: number;
  bookedSeats: number;
  boardedPassengers: number;
  pendingCheckins: number;
  payOnBoardingCollectable: number;
  cashCollectedByConductor: number;
  dieselExpenses: number;
  tollExpenses: number;
  netTripHandover: number;
  isTripCompleted: boolean;
}

export type UserRole = 'PASSENGER' | 'CONDUCTOR' | 'ADMIN';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isFirebaseUser?: boolean;
  firebaseUid?: string;
  authProvider?: string;
  emailVerified?: boolean;
  // Conductor specific fields
  employeeId?: string;
  badgeNumber?: string;
  assignedOperator?: string;
  assignedBusNumber?: string;
  assignedRoute?: string;
  // Admin specific fields
  adminDepartment?: string;
  adminLevel?: 'SUPER_ADMIN' | 'OPS_MANAGER' | 'FLEET_MANAGER';
  twoFactorEnabled?: boolean;
}
