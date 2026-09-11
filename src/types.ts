export type CoachType = 'AC_SLEEPER_2_1' | 'VOLVO_MULTI_AXLE_2_2' | 'SCANIA_LUXURY_SLEEPER';
export type TripCategory = 'DAY_COACH' | 'NIGHT_COACH';
export type SeatTier = 'LOWER_BERTH' | 'UPPER_BERTH' | 'SEATER_WINDOW' | 'SEATER_AISLE';
export type SeatGenderRestriction = 'ANY' | 'FEMALE_ONLY' | 'MALE_ONLY';
export type SeatStatus = 'AVAILABLE' | 'SELECTED' | 'HELD' | 'BOOKED' | 'BLOCKED' | 'CANCELLED' | 'LOCKED' | 'CONDUCTOR_RESERVED';
export type PaymentStatus = 'PAID_ONLINE' | 'PAY_ON_BOARDING_PENDING' | 'REFUNDED' | 'FAILED' | 'PENDING' | 'COMPLETED' | 'PAID';
export type CheckInStatus = 'CONFIRMED' | 'BOARDED' | 'NO_SHOW' | 'CANCELLED';
export type PaymentMethod = 'UPI' | 'UPI_QR' | 'CARD' | 'CREDIT_DEBIT_CARD' | 'NET_BANKING' | 'GIFT_CARD' | 'PAY_ON_BOARDING_COD';

export interface SeatLayoutSeat {
  id: string;
  layoutId?: string;
  number: string;
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number;
  isSleeper: boolean;
  isWindow?: boolean;
  isAisle?: boolean;
  isLadies?: boolean;
  isOperatorBlocked?: boolean;
  xPos?: number;
  yPos?: number;
  basePrice?: number;
}

export interface SeatLayoutElement {
  id: string;
  type: 'DRIVER_CABIN' | 'DOOR' | 'STAIRS' | 'RESTROOM' | 'AISLE';
  deck: 'LOWER' | 'UPPER';
  row: number;
  col: number;
  label?: string;
}

export interface SeatLayoutTemplate {
  id: string;
  name: string; // e.g. "2+2 Luxury Seater (40 Seats)", "2+1 AC Sleeper (30 Berths)"
  layoutCode: string; // e.g. "LAYOUT-2X2-SEATER"
  description?: string;
  totalRows: number;
  totalCols: number;
  hasLowerDeck: boolean;
  hasUpperDeck: boolean;
  seats: SeatLayoutSeat[];
  elements?: SeatLayoutElement[];
  createdAt?: string;
}

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
  segmentFromId?: string;
  segmentToId?: string;
  passengerName?: string;
  bookingPnr?: string;
}

export interface TripSeatInventory {
  id: string;
  tripId: string;
  seatId: string;
  seatNumber: string;
  deck: 'LOWER' | 'UPPER';
  status: SeatStatus;
  heldBySessionId?: string;
  holdExpiresAt?: number;
  bookingId?: string;
  bookingPnr?: string;
  passengerName?: string;
  passengerGender?: string;
  segmentFromStopIndex?: number;
  segmentToStopIndex?: number;
  updatedAt: string;
}

export interface InventoryAuditLog {
  id: string;
  tripId: string;
  seatId: string;
  seatNumber: string;
  previousStatus: string;
  newStatus: string;
  triggeredBy: string;
  details?: string;
  timestamp: string;
}

export interface BoardingDroppingPoint {
  id: string;
  name: string;
  landmark: string;
  time: string; // e.g. "21:30"
  contactPhone: string;
  stopIndex?: number;
}

// Aliases for compatibility
export type BoardingPoint = BoardingDroppingPoint;
export type DroppingPoint = BoardingDroppingPoint;

export type TripStageStatus = 
  | 'BOOKED' 
  | 'BUS_ASSIGNED' 
  | 'DRIVER_ASSIGNED' 
  | 'BUS_APPROACHING' 
  | 'ARRIVING' 
  | 'BOARDING' 
  | 'JOURNEY_STARTED' 
  | 'IN_TRANSIT' 
  | 'DESTINATION_APPROACHING' 
  | 'ARRIVED' 
  | 'TRIP_COMPLETED';

export interface Bus {
  id: string;
  registrationNumber: string; // Unique Vehicle Number e.g. OD-02-AX-8910
  displayNumber?: string; // Short Bus ID e.g. MP-204
  operatorId: string;
  operatorName: string;
  operatorRating: number;
  model: string;
  busType: CoachType;
  totalSeats: number;
  hasLowerDeck: boolean;
  hasUpperDeck: boolean;
  layoutId?: string; // Link to SeatLayoutTemplate
  layoutCode?: string; // e.g. LAYOUT-2X2-SEATER
  amenities: string[];
  driverName: string;
  driverPhone: string;
  conductorId?: string; // Assigned Conductor ID e.g. COND-7890
  conductorName: string;
  conductorPhone: string;
  assignedRoute?: string;
  status?: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  images?: string[];
  headingDegrees?: number;
  passengerCount?: number;
  liveGps?: {
    latitude: number;
    longitude: number;
    speedKmph: number;
    headingDegrees?: number;
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
  tripCode?: string; // e.g. TRIP-20491
  routeId: string;
  busId: string;
  category: TripCategory;
  departureDate: string; // YYYY-MM-DD
  departureTime: string; // "20:30"
  arrivalTime: string; // "06:15"
  durationText?: string;
  originCity: string;
  destinationCity: string;
  boardingPoints: BoardingDroppingPoint[];
  droppingPoints: BoardingDroppingPoint[];
  baseFare: number;
  surgeMultiplier: number;
  effectiveFare: number;
  seats: Seat[];
  availableSeatsCount: number;
  totalSeatsCount?: number;
  rating?: number;
  totalReviewsCount?: number;
  operatingDays?: string[];
  tripStatus?: TripStageStatus;
  bus: Bus;
}

export interface Passenger {
  name: string;
  age: number;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  seatNumber: string;
  seatId?: string;
  fare?: number;
  isPrimaryContact?: boolean;
}

export type PassengerDetails = Passenger;

export interface Booking {
  id: string;
  pnr: string;
  userId?: string;
  tripId: string;
  tripCode?: string; // e.g. TRIP-20491
  passengerId?: string; // e.g. PAX-100284
  busDisplayNumber?: string; // e.g. MP-204
  trackingPermissionGranted?: boolean;
  shareToken?: string;
  trip: {
    originCity: string;
    destinationCity: string;
    departureDate?: string;
    departureTime: string;
    arrivalTime: string;
    busModel: string;
    busType?: CoachType;
    operatorName: string;
    busRegistrationNumber: string; // Vehicle Number
    busDisplayNumber?: string; // e.g. MP-204
    category?: TripCategory;
    boardingPointName?: string;
    boardingTime?: string;
    droppingPointName?: string;
    droppingTime?: string;
    travelDate?: string;
  };
  passengers: Passenger[];
  contactEmail: string;
  contactPhone: string;
  boardingPoint?: BoardingDroppingPoint;
  droppingPoint?: BoardingDroppingPoint;
  baseAmount?: number;
  surgeAmount?: number;
  gstAmount?: number;
  discountAmount?: number;
  totalAmount: number;
  bookingDate?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  checkInStatus: CheckInStatus;
  qrPayloadHash?: string;
  qrPayloadData?: string;
  qrCodeToken?: string;
  whatsappDelivered?: boolean;
  whatsappNotificationStatus?: 'PENDING' | 'SENT' | 'FAILED';
  whatsappMessageId?: string;
  whatsappSentAt?: string;
  whatsappError?: string;
  whatsappRetryCount?: number;
  emailNotificationStatus?: 'PENDING' | 'SENT' | 'FAILED';
  emailSentAt?: string;
  emailError?: string;
  bookedAt?: string;
  cancellationPolicy?: {
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
  refundAmount?: number;
  refundStatus?: string;
  refundedAt?: string;
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
  lastLoginAt?: string;
  status?: 'ACTIVE' | 'SUSPENDED';
  bookingsCount?: number;
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

export interface OtpSessionResponse {
  success: boolean;
  message?: string;
  expiresInSeconds?: number;
  resendAllowedInSeconds?: number;
  email?: string;
  phone?: string;
  otpCode?: string;
  code?: string;
  otp?: string;
  sentViaSmtp?: boolean;
  error?: string;
  retryAfterSeconds?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  user?: UserAccount;
  sessionToken?: string;
  message?: string;
  error?: string;
}

export interface OfferCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minBookingAmount: number;
  maxDiscountAmount?: number;
  isLive: boolean;
  validUntil: string;
  badgeTag?: string;
  savingsText?: string;
  category?: 'BUS' | 'TRAIN' | 'HOTEL' | 'ALL';
  imageUrl?: string;
  termsAndConditions?: string[];
  howToUse?: string[];
}

export interface GiftCard {
  id: string;
  code: string;
  pin: string;
  amount: number;
  recipientEmail: string;
  senderEmail: string;
  status: 'ACTIVE' | 'REDEEMED';
  validUntil: string;
  createdAt: string;
  imageUrl?: string;
  title?: string;
}

export type BusGPSStatus = 'LIVE' | 'UPDATING' | 'OFFLINE';

export interface RouteStop {
  id: string;
  name: string;
  status: 'COMPLETED' | 'CURRENT' | 'NEXT' | 'UPCOMING';
  eta: string;
}

export interface BusTrackingNotification {
  id: string;
  title: string;
  message: string;
  time: string;
}

export interface LiveTrackingResponse {
  bookingId: string;
  pnrNumber: string;
  tripId?: string;
  tripCode?: string; // e.g. TRIP-20491
  status: string;
  tripStageStatus?: TripStageStatus;
  seatNumbers: string[];
  passengerNames: string[];
  trackingPermissionGranted?: boolean;
  bus: {
    id: string;
    displayNumber: string; // e.g. MP-204
    registrationNumber: string;
    operatorName: string;
    model: string;
    driverName: string;
    conductorName: string;
    passengerCount?: number;
    totalSeats?: number;
  };
  route: {
    originCity: string;
    destinationCity: string;
    stops: RouteStop[];
    coordinates?: [number, number][]; // [lat, lng] polyline points
  };
  boardingPoint?: {
    name: string;
    landmark?: string;
    time?: string;
    latitude?: number;
    longitude?: number;
  };
  droppingPoint?: {
    name: string;
    landmark?: string;
    time?: string;
    latitude?: number;
    longitude?: number;
  };
  passengerLocation?: {
    latitude: number;
    longitude: number;
  };
  walkingDirections?: {
    walkingDistanceMeters: number;
    walkingDurationMinutes: number;
    instruction: string;
  };
  liveGps: {
    latitude: number;
    longitude: number;
    currentLocationName: string;
    nextStopName: string;
    distanceRemainingKm: number;
    speedKmph: number;
    heading: string;
    headingDegrees: number; // 0 to 360 for directional rotation
    accuracy: string;
    gpsStatus: BusGPSStatus;
    lastUpdated: string;
    lastUpdatedTimestamp: number;
    distanceFromBoardingKm?: number;
    etaBoardingMinutes?: number;
    routeProgressPercentage?: number;
  };
  notifications: BusTrackingNotification[];
  shareToken?: string;
  shareUrl?: string;
  shareExpiresAt?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string; // e.g. "CEO", "CTO", "COO"
  bio: string;
  imageUrl: string;
  displayOrder?: number;
  email?: string;
  linkedinUrl?: string;
  createdAt?: string;
}

export interface MargPointsTransaction {
  id: string;
  title: string;
  subtext: string;
  points: number; // positive for earned, negative for redeemed
  type: 'BOOKING' | 'REFERRAL' | 'REVIEW' | 'REDEMPTION';
  date: string;
}

export interface MargPointsWallet {
  balance: number;
  lifetimeEarned: number;
  nextMilestonePoints: number;
  discountAvailable: number; // e.g. ₹100
  history: MargPointsTransaction[];
}

export interface ReferralProfile {
  code: string;
  referralLink: string;
  rewardPerReferral: number;
  friendsJoinedCount: number;
  totalEarnings: number;
}

export interface AIAssistantMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  quickReplies?: string[];
  contextTelemetry?: {
    busNumber?: string;
    distanceKm?: number;
    etaMinutes?: number;
    boardingPointName?: string;
    seatNumber?: string;
  };
}

export interface TripSafetyScore {
  overallScore: number; // e.g. 94
  statusText: string; // e.g. "EXCELLENT"
  driverVerified: boolean;
  driverName: string;
  driverLicenseNumber: string;
  driverExperienceYears: number;
  driverAlcoholTestPassed: boolean;
  gpsTransponderType: string; // "AIS-140 Certified"
  sosPanicButtonFitted: boolean;
  cctvMonitoringActive: boolean;
  routeSafetyRating: number; // 4.9
  emergencyPhone: string;
  operatorHelpline: string;
}

export interface TripReview {
  id?: string;
  bookingId: string;
  tripId: string;
  overallRating: number;
  driverBehavior: number;
  safety: number;
  cleanliness: number;
  comfort: number;
  punctuality: number;
  feedbackText?: string;
  createdAt?: string;
}

export interface AdminDemandInsight {
  id: string;
  route: string;
  corridor: string;
  demandPercentageChange: number; // e.g. +28%
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
  headline: string;
  recommendation: string;
  peakHours: string;
  historicalPunctuality: number;
}

export interface VehicleHealthReport {
  busId: string;
  displayNumber: string;
  registrationNumber: string;
  overallScore: number; // e.g. 92
  engineStatus: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  brakesStatus: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  tyresStatus: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  tyreTreadMm: number;
  batteryHealthPercentage: number;
  serviceDueInKm: number;
  lastInspectionDate: string;
}

export interface CompleteMyTripOption {
  id: string;
  category: 'HOTEL' | 'TAXI' | 'ACTIVITY' | 'FOOD';
  title: string;
  subtitle: string;
  price: number;
  badge: string;
  rating: number;
  imageUrl: string;
}

