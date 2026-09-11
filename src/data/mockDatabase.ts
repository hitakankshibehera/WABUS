import { Bus, Route, Trip, Seat, FeatureFlags, Booking, PayoutRecord, ConductorProfile, SeatLayoutTemplate, InventoryAuditLog, TeamMember, OfferCoupon } from '../types';


export const INITIAL_SEAT_LAYOUT_TEMPLATES: SeatLayoutTemplate[] = [
  {
    id: 'layout-2x1-sleeper',
    name: '2+1 Luxury AC Sleeper (30 Berths)',
    layoutCode: 'LAYOUT-2X1-SLEEPER',
    description: 'Standard 2+1 sleeper coach with 15 Lower Berths and 15 Upper Berths',
    totalRows: 10,
    totalCols: 3,
    hasLowerDeck: true,
    hasUpperDeck: true,
    seats: [
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `layout-l-${i + 1}`,
        number: `L${i + 1}`,
        deck: 'LOWER' as const,
        row: Math.floor(i / 3) + 1,
        col: (i % 3) + 1,
        isSleeper: true,
        isWindow: i % 3 === 0 || i % 3 === 2,
        isAisle: i % 3 === 1,
        basePrice: 550
      })),
      ...Array.from({ length: 15 }, (_, i) => ({
        id: `layout-u-${i + 1}`,
        number: `U${i + 1}`,
        deck: 'UPPER' as const,
        row: Math.floor(i / 3) + 1,
        col: (i % 3) + 1,
        isSleeper: true,
        isWindow: i % 3 === 0 || i % 3 === 2,
        isAisle: i % 3 === 1,
        basePrice: 450
      }))
    ],
    elements: [
      { id: 'elem-1', type: 'DRIVER_CABIN', deck: 'LOWER', row: 0, col: 3, label: 'Driver Steering' },
      { id: 'elem-2', type: 'DOOR', deck: 'LOWER', row: 0, col: 1, label: 'Passenger Entrance' },
      { id: 'elem-3', type: 'STAIRS', deck: 'LOWER', row: 1, col: 2, label: 'Upper Deck Stairs' }
    ]
  },
  {
    id: 'layout-2x2-seater',
    name: '2+2 Volvo Multi-Axle Seater (40 Seats)',
    layoutCode: 'LAYOUT-2X2-SEATER',
    description: '40 Recliner Seats in 2+2 layout',
    totalRows: 10,
    totalCols: 4,
    hasLowerDeck: true,
    hasUpperDeck: false,
    seats: Array.from({ length: 40 }, (_, i) => ({
      id: `layout-s-${i + 1}`,
      number: `${i + 1}`,
      deck: 'LOWER' as const,
      row: Math.floor(i / 4) + 1,
      col: (i % 4) + 1,
      isSleeper: false,
      isWindow: i % 4 === 0 || i % 4 === 3,
      isAisle: i % 4 === 1 || i % 4 === 2,
      basePrice: 350
    })),
    elements: [
      { id: 'elem-10', type: 'DRIVER_CABIN', deck: 'LOWER', row: 0, col: 4, label: 'Driver Cabin' },
      { id: 'elem-11', type: 'DOOR', deck: 'LOWER', row: 0, col: 1, label: 'Main Door' }
    ]
  }
];

export const INITIAL_INVENTORY_AUDIT_LOGS: InventoryAuditLog[] = [
  {
    id: 'log-1',
    tripId: 'trip-1',
    seatId: 'seat-1-L1',
    seatNumber: 'L1',
    previousStatus: 'AVAILABLE',
    newStatus: 'HELD',
    triggeredBy: 'Customer (Session-1029)',
    details: '10-minute seat hold lock initialized',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
  },
  {
    id: 'log-2',
    tripId: 'trip-1',
    seatId: 'seat-1-L1',
    seatNumber: 'L1',
    previousStatus: 'HELD',
    newStatus: 'BOOKED',
    triggeredBy: 'Payment Gateway (PNR: WB892341)',
    details: 'Payment confirmed via UPI',
    timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString()
  }
];

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableSurgePricing: true,
  surgeMultiplier: 1.2, // 20% surge on high demand
  enablePayOnBoarding: true,
  enableDynamicCancellation: true,
  enableWhatsAppNotifications: true,
  maintenanceMode: false,
  emergencyAlertBanner: null,
  seatLockDurationMinutes: 10,
  platformCommissionRate: 0.08, // 8% platform fee
};

export const INITIAL_CONDUCTORS: ConductorProfile[] = [
  {
    id: 'cond-1',
    employeeId: 'COND-7890',
    name: 'Bijay Nayak',
    phone: '+91 94371 00001',
    email: 'conductor.bijay@osrtc.gov.in',
    pin: '7890',
    assignedBusNumber: 'OD-02-AX-8910',
    assignedBusId: 'bus-1',
    assignedOperator: 'OSRTC Volvo Premier',
    assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-2',
    employeeId: 'COND-4421',
    name: 'Pradeep Jena',
    phone: '+91 93370 11984',
    email: 'conductor.pradeep@dolphintransits.in',
    pin: '4421',
    assignedBusNumber: 'OD-33-K-1080',
    assignedBusId: 'bus-2',
    assignedOperator: 'Dolphin Transits & Travels',
    assignedRoute: 'Bhubaneswar ⇄ Puri Day Coach',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-3',
    employeeId: 'COND-5589',
    name: 'Venkatesh Rao',
    phone: '+91 98450 67890',
    email: 'conductor.venkatesh@orangetravels.com',
    pin: '5589',
    assignedBusNumber: 'KA-01-MJ-4521',
    assignedBusId: 'bus-3',
    assignedOperator: 'Orange National Royal Express',
    assignedRoute: 'Bangalore ⇄ Hyderabad Royal Sleeper',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-4',
    employeeId: 'COND-1024',
    name: 'Ganesh Sawant',
    phone: '+91 98202 33445',
    email: 'conductor.ganesh@neetatravels.in',
    pin: '1024',
    assignedBusNumber: 'MH-04-ER-8877',
    assignedBusId: 'bus-4',
    assignedOperator: 'Neeta Intercity Luxury Wings',
    assignedRoute: 'Mumbai ⇄ Pune Express',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

export const MOCK_BUSES: Bus[] = [
  {
    id: 'bus-mp204',
    displayNumber: 'MP-204',
    registrationNumber: 'OD-02-MP-0204',
    operatorId: 'op-margpath',
    operatorName: 'MargPath Express Luxury Coach',
    operatorRating: 4.9,
    model: 'Volvo 9600 Multi-Axle Premium Sleeper',
    busType: 'AC_SLEEPER_2_1',
    totalSeats: 40,
    hasLowerDeck: true,
    hasUpperDeck: true,
    layoutId: 'layout-2x1-sleeper',
    layoutCode: 'LAYOUT-2X1-SLEEPER',
    amenities: ['AC', 'WiFi 5G', 'AIS-140 GPS Private Tracking', 'USB Fast Charger', 'Personal LED Screen', 'Plush Blanket & Water', 'First Aid Kit'],
    driverName: 'Rameshwar Mahapatra',
    driverPhone: '+91 98610 24819',
    conductorId: 'COND-7890',
    conductorName: 'Bijay Nayak',
    conductorPhone: '+91 94371 00001',
    assignedRoute: 'Bhubaneswar ⇄ Puri',
    headingDegrees: 165,
    passengerCount: 32,
    liveGps: {
      latitude: 20.1585,
      longitude: 85.8340,
      speedKmph: 42,
      headingDegrees: 165,
      currentLocationName: 'Approaching Pipili Square Toll (NH-316)',
      lastUpdated: '10 seconds ago',
      nextStopName: 'Master Canteen',
      nextStopEta: '18 mins'
    }
  },
  {
    id: 'bus-1',
    displayNumber: 'MP-108',
    registrationNumber: 'OD-02-AX-8910',
    operatorId: 'op-1',
    operatorName: 'OSRTC Volvo Premier',
    operatorRating: 4.8,
    model: 'BharatBenz 2+1 AC Sleeper Executive',
    busType: 'AC_SLEEPER_2_1',
    totalSeats: 30,
    hasLowerDeck: true,
    hasUpperDeck: true,
    layoutId: 'layout-2x1-sleeper',
    layoutCode: 'LAYOUT-2X1-SLEEPER',
    amenities: ['AC', 'WiFi 5G', 'USB Fast Charger', 'Personal LED Screen', 'Plush Pillow & Blanket', 'Mineral Water', 'GPS Live Tracking'],
    driverName: 'Rameshwar Mahapatra',
    driverPhone: '+91 98610 24819',
    conductorId: 'COND-7890',
    conductorName: 'Bijay Nayak',
    conductorPhone: '+91 94371 00001',
    assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
    liveGps: {
      latitude: 20.2961,
      longitude: 85.8245,
      speedKmph: 74,
      currentLocationName: 'Near NH-16 Khurda Toll Plaza',
      lastUpdated: 'Just now (Real-time)',
      nextStopName: 'Bhubaneswar Baramunda ISBT',
      nextStopEta: '18 mins'
    }
  },
  {
    id: 'bus-2',
    registrationNumber: 'OD-33-K-1080',
    operatorId: 'op-1',
    operatorName: 'Dolphin Transits & Travels',
    operatorRating: 4.9,
    model: 'Volvo 9600 B11R Multi-Axle Semi-Sleeper',
    busType: 'VOLVO_MULTI_AXLE_2_2',
    totalSeats: 36,
    hasLowerDeck: true,
    hasUpperDeck: false,
    amenities: ['AC', 'Ergonomic Calf Support', 'USB Type-C', 'Emergency Exit Alarm', 'Live CCTV', 'First Aid Kit'],
    driverName: 'Bikash Mohanty',
    driverPhone: '+91 97780 43210',
    conductorId: 'COND-4421',
    conductorName: 'Pradeep Jena',
    conductorPhone: '+91 93370 11984',
    assignedRoute: 'Bhubaneswar ⇄ Puri Day Coach',
    liveGps: {
      latitude: 19.8135,
      longitude: 85.8312,
      speedKmph: 62,
      currentLocationName: 'Puri NH Bypass',
      lastUpdated: '1 min ago',
      nextStopName: 'Puri Grand Road Stand',
      nextStopEta: '12 mins'
    }
  },
  {
    id: 'bus-3',
    registrationNumber: 'KA-01-MJ-4521',
    operatorId: 'op-2',
    operatorName: 'Orange National Royal Express',
    operatorRating: 4.7,
    model: 'Scania Metrolink HD Multi-Axle Sleeper',
    busType: 'SCANIA_LUXURY_SLEEPER',
    totalSeats: 30,
    hasLowerDeck: true,
    hasUpperDeck: true,
    amenities: ['AC', 'Individual Entertainment System', 'Thermal Blankets', 'Reading Lamp', 'GPS Live Tracking'],
    driverName: 'Suresh Kumar',
    driverPhone: '+91 99801 54321',
    conductorId: 'COND-5589',
    conductorName: 'Venkatesh Rao',
    conductorPhone: '+91 98450 67890',
    assignedRoute: 'Bangalore ⇄ Hyderabad Royal Sleeper',
    liveGps: {
      latitude: 12.9716,
      longitude: 77.5946,
      speedKmph: 82,
      currentLocationName: 'Hosur Highway Km 42',
      lastUpdated: 'Just now',
      nextStopName: 'Electronic City Toll',
      nextStopEta: '25 mins'
    }
  },
  {
    id: 'bus-4',
    registrationNumber: 'MH-04-ER-8877',
    operatorId: 'op-3',
    operatorName: 'Neeta Intercity Luxury Wings',
    operatorRating: 4.6,
    model: 'Volvo 9400 XL Multi-Axle AC Sleeper',
    busType: 'AC_SLEEPER_2_1',
    totalSeats: 30,
    hasLowerDeck: true,
    hasUpperDeck: true,
    amenities: ['AC', 'Water Bottle', 'Charging Plug', 'Snack Kit', 'GPS Live Tracking'],
    driverName: 'Santosh Shinde',
    driverPhone: '+91 98201 11223',
    conductorId: 'COND-1024',
    conductorName: 'Ganesh Sawant',
    conductorPhone: '+91 98202 33445',
    assignedRoute: 'Mumbai ⇄ Pune Express',
    liveGps: {
      latitude: 18.5204,
      longitude: 73.8567,
      speedKmph: 68,
      currentLocationName: 'Mumbai-Pune Expressway Lonavala Ghat',
      lastUpdated: 'Just now',
      nextStopName: 'Wakad Pune Highway',
      nextStopEta: '30 mins'
    }
  }
];

export const MOCK_CONDUCTORS: ConductorProfile[] = [
  {
    id: 'cond-prof-1',
    employeeId: 'COND-7890',
    name: 'Bijay Nayak',
    phone: '+91 94371 00001',
    email: 'conductor.bijay@osrtc.gov.in',
    pin: '7890',
    assignedBusNumber: 'OD-02-MP-0204',
    assignedBusId: 'bus-mp204',
    assignedOperator: 'MargPath Express Luxury Coach',
    assignedRoute: 'Bhubaneswar ⇄ Puri',
    activeTripId: 'trip-bbsr-puri-flagship',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-prof-2',
    employeeId: 'COND-4421',
    name: 'Pradeep Jena',
    phone: '+91 93370 11984',
    email: 'conductor.pradeep@dolphintravels.in',
    pin: '4421',
    assignedBusNumber: 'OD-33-K-1080',
    assignedBusId: 'bus-2',
    assignedOperator: 'Dolphin Transits & Travels',
    assignedRoute: 'Bhubaneswar ⇄ Puri Day Coach',
    activeTripId: 'trip-bbsr-puri-day',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-prof-3',
    employeeId: 'COND-5589',
    name: 'Venkatesh Rao',
    phone: '+91 98450 67890',
    email: 'conductor.venkatesh@orangetravels.in',
    pin: '5589',
    assignedBusNumber: 'KA-01-MJ-4521',
    assignedBusId: 'bus-3',
    assignedOperator: 'Orange National Royal Express',
    assignedRoute: 'Bangalore ⇄ Hyderabad Royal Sleeper',
    activeTripId: 'trip-blr-hyd-night',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'cond-prof-4',
    employeeId: 'COND-1024',
    name: 'Ganesh Sawant',
    phone: '+91 98202 33445',
    email: 'conductor.ganesh@neetabus.com',
    pin: '1024',
    assignedBusNumber: 'MH-04-ER-8877',
    assignedBusId: 'bus-4',
    assignedOperator: 'Neeta Intercity Luxury Wings',
    assignedRoute: 'Mumbai ⇄ Pune Express',
    activeTripId: 'trip-mum-pune-day',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
  }
];

export const MOCK_ROUTES: Route[] = [
  {
    id: 'route-bbsr-puri',
    originCity: 'Bhubaneswar',
    destinationCity: 'Puri',
    distanceKm: 62,
    estimatedDurationHours: 1.5,
    popularWeekendRoute: true,
  },
  {
    id: 'route-bbsr-rourkela',
    originCity: 'Bhubaneswar',
    destinationCity: 'Rourkela',
    distanceKm: 340,
    estimatedDurationHours: 7.5,
    popularWeekendRoute: true,
  },
  {
    id: 'route-cuttack-berhampur',
    originCity: 'Cuttack',
    destinationCity: 'Berhampur',
    distanceKm: 195,
    estimatedDurationHours: 3.5,
    popularWeekendRoute: false,
  },
  {
    id: 'route-blr-hyd',
    originCity: 'Bangalore',
    destinationCity: 'Hyderabad',
    distanceKm: 570,
    estimatedDurationHours: 9.0,
    popularWeekendRoute: true,
  },
  {
    id: 'route-mum-pune',
    originCity: 'Mumbai',
    destinationCity: 'Pune',
    distanceKm: 150,
    estimatedDurationHours: 3.0,
    popularWeekendRoute: true,
  },
  {
    id: 'route-delhi-manali',
    originCity: 'Delhi',
    destinationCity: 'Manali',
    distanceKm: 535,
    estimatedDurationHours: 12.0,
    popularWeekendRoute: true,
  },
  {
    id: 'route-kolkata-puri',
    originCity: 'Kolkata',
    destinationCity: 'Puri',
    distanceKm: 500,
    estimatedDurationHours: 9.5,
    popularWeekendRoute: true,
  }
];

// Helper to generate seat matrix for AC Sleeper 2+1 (30 seats: 15 lower, 15 upper)
export function generateSleeperSeats(basePrice: number): Seat[] {
  const seats: Seat[] = [];
  // Lower Deck: 5 rows, Left single berth (col 0), Right double berths (col 2, 3)
  for (let r = 1; r <= 5; r++) {
    // Single berth left
    seats.push({
      id: `L-S${r}`,
      number: `L${r}A`,
      deck: 'LOWER',
      row: r,
      col: 0,
      isSleeper: true,
      basePrice: basePrice + 100, // Premium for single berth
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    // Double berth right 1
    seats.push({
      id: `L-D${r}1`,
      number: `L${r}B`,
      deck: 'LOWER',
      row: r,
      col: 2,
      isSleeper: true,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    // Double berth right 2
    seats.push({
      id: `L-D${r}2`,
      number: `L${r}C`,
      deck: 'LOWER',
      row: r,
      col: 3,
      isSleeper: true,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
  }

  // Upper Deck: 5 rows, Left single berth (col 0), Right double berths (col 2, 3)
  for (let r = 1; r <= 5; r++) {
    seats.push({
      id: `U-S${r}`,
      number: `U${r}A`,
      deck: 'UPPER',
      row: r,
      col: 0,
      isSleeper: true,
      basePrice: basePrice + 50,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    seats.push({
      id: `U-D${r}1`,
      number: `U${r}B`,
      deck: 'UPPER',
      row: r,
      col: 2,
      isSleeper: true,
      basePrice: basePrice - 50,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    seats.push({
      id: `U-D${r}2`,
      number: `U${r}C`,
      deck: 'UPPER',
      row: r,
      col: 3,
      isSleeper: true,
      basePrice: basePrice - 50,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
  }

  return seats;
}

// Realistic GPS route polyline coordinates along NH-316 (Bhubaneswar to Puri)
export const BHUBANESWAR_PURI_WAYPOINTS: [number, number][] = [
  [20.2668, 85.8436], // Master Canteen / Railway Station (Boarding Point)
  [20.2520, 85.8385], // Kalpana Square / Lingaraj Junction
  [20.2180, 85.8450], // Ravi Talkies / Samantarapur
  [20.2014, 85.8488], // Uttara Square
  [20.1585, 85.8340], // Near Pipili Toll Gate (Current Bus Position Demo)
  [20.1172, 85.8315], // Khordha Bypass Junction
  [20.0889, 85.8284], // Pipili Applique Town
  [20.0152, 85.8310], // Dandamukundapur Market
  [19.9540, 85.8295], // Sakhigopal Temple Bypass
  [19.8920, 85.8300], // Biragobindapur
  [19.8520, 85.8310], // Malatipatpur Bus Terminal
  [19.8250, 85.8315], // Atharnala Historic Bridge
  [19.8135, 85.8312], // Puri Bus Stand (Bada Danda / Destination)
];

// Helper to generate standard MargPath seat layout: A1 A2 B1 B2, A3 A4 B3 B4 ... A11 A12 B11 B12
export function generateMargPathSeats(basePrice: number): Seat[] {
  const seats: Seat[] = [];
  for (let r = 1; r <= 10; r++) {
    const leftSeat1Num = `A${(r - 1) * 2 + 1}`;
    const leftSeat2Num = `A${(r - 1) * 2 + 2}`;
    const rightSeat1Num = `B${(r - 1) * 2 + 1}`;
    const rightSeat2Num = `B${(r - 1) * 2 + 2}`;

    // Aisle-left window & aisle
    seats.push({
      id: `seat-${leftSeat1Num.toLowerCase()}`,
      number: leftSeat1Num,
      deck: 'LOWER',
      row: r,
      col: 0,
      isSleeper: false,
      basePrice: basePrice + 30,
      status: 'AVAILABLE',
      genderRestriction: r === 1 ? 'FEMALE_ONLY' : 'ANY',
    });
    seats.push({
      id: `seat-${leftSeat2Num.toLowerCase()}`,
      number: leftSeat2Num,
      deck: 'LOWER',
      row: r,
      col: 1,
      isSleeper: false,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: r === 1 ? 'FEMALE_ONLY' : 'ANY',
    });
    // Aisle-right aisle & window
    seats.push({
      id: `seat-${rightSeat1Num.toLowerCase()}`,
      number: rightSeat1Num,
      deck: 'LOWER',
      row: r,
      col: 2,
      isSleeper: false,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    seats.push({
      id: `seat-${rightSeat2Num.toLowerCase()}`,
      number: rightSeat2Num,
      deck: 'LOWER',
      row: r,
      col: 3,
      isSleeper: false,
      basePrice: basePrice + 30,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
  }
  return seats;
}

export function generateSeaterSeats(basePrice: number): Seat[] {
  return generateMargPathSeats(basePrice);
}

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-bbsr-puri-flagship',
    tripCode: 'TRIP-20491',
    routeId: 'route-bbsr-puri',
    busId: 'bus-mp204',
    category: 'DAY_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '06:30',
    arrivalTime: '08:45',
    durationText: '2h 15m',
    originCity: 'Bhubaneswar',
    destinationCity: 'Puri',
    baseFare: 380,
    surgeMultiplier: 1.0,
    effectiveFare: 380,
    rating: 4.9,
    totalReviewsCount: 384,
    bus: MOCK_BUSES[0],
    boardingPoints: [
      { id: 'bp-bbsr-railway', name: 'Bhubaneswar Railway Station', landmark: 'Master Canteen Square Platform 1 Exit', time: '06:30', contactPhone: '+91 94371 00001' },
      { id: 'bp-1', name: 'Baramunda ISBT', landmark: 'Platform 2 Overbridge', time: '06:15', contactPhone: '+91 98610 24819' },
      { id: 'bp-2', name: 'Kalpana Square', landmark: 'Near State Museum', time: '06:45', contactPhone: '+91 94371 00001' }
    ],
    droppingPoints: [
      { id: 'dp-puri-grandroad', name: 'Puri Bus Stand', landmark: 'Grand Road Jagannath Temple Entrance', time: '08:45', contactPhone: '+91 94371 00001' },
      { id: 'dp-2', name: 'Swargadwar Beach', landmark: 'Sea Beach Circle', time: '09:00', contactPhone: '+91 94371 00001' }
    ],
    seats: (() => {
      const s = generateMargPathSeats(380);
      // Pre-seed demo booking for seat A12
      const a12 = s.find(seat => seat.number === 'A12');
      if (a12) {
        a12.status = 'BOOKED';
        a12.bookedGender = 'MALE';
        a12.passengerName = 'Rahul Sharma';
        a12.bookingPnr = 'MP100284';
      }
      // Seed a few other occupied seats for realistic 32/40 passenger count
      ['A1', 'A2', 'B1', 'B2', 'A3', 'B3', 'A4', 'B4', 'A5', 'B5', 'A6', 'B6', 'A7', 'B7', 'A8', 'B8', 'A9', 'B9', 'A10', 'B10'].forEach(num => {
        const found = s.find(seat => seat.number === num);
        if (found) {
          found.status = 'BOOKED';
          found.bookedGender = 'MALE';
        }
      });
      return s;
    })(),
    availableSeatsCount: 19,
    totalSeatsCount: 40,
    tripStatus: 'BUS_APPROACHING'
  },
  {
    id: 'trip-bbsr-puri-night',
    tripCode: 'TRIP-20492',
    routeId: 'route-bbsr-puri',
    busId: 'bus-1',
    category: 'NIGHT_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '22:30',
    arrivalTime: '00:15',
    originCity: 'Bhubaneswar',
    destinationCity: 'Puri',
    baseFare: 450,
    surgeMultiplier: 1.2,
    effectiveFare: 540,
    bus: MOCK_BUSES[1],
    boardingPoints: [
      { id: 'bp-1', name: 'Baramunda ISBT (Bay 4)', landmark: 'Near Overbridge', time: '22:30', contactPhone: '+91 98610 24819' },
      { id: 'bp-2', name: 'Jaydev Vihar Overbridge', landmark: 'Opposite Fortune Hotel', time: '22:45', contactPhone: '+91 98610 24819' },
      { id: 'bp-3', name: 'Master Canteen Square', landmark: 'Near Railway Station Exit', time: '23:05', contactPhone: '+91 98610 24819' },
      { id: 'bp-4', name: 'Kalpana Square & Lingaraj', landmark: 'Near State Museum', time: '23:20', contactPhone: '+91 98610 24819' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Puri Bus Stand (Bada Danda)', landmark: 'Near Jagannath Temple Office', time: '00:15', contactPhone: '+91 94371 89201' },
      { id: 'dp-2', name: 'Swargadwar Beach Junction', landmark: 'Sea Beach Circle', time: '00:30', contactPhone: '+91 94371 89201' }
    ],
    seats: (() => {
      const s = generateSleeperSeats(450);
      // Pre-seed some booked seats
      s[0].status = 'BOOKED';
      s[0].bookedGender = 'MALE';
      s[1].status = 'BOOKED';
      s[1].bookedGender = 'FEMALE';
      s[1].genderRestriction = 'FEMALE_ONLY';
      s[6].status = 'BOOKED';
      s[6].bookedGender = 'MALE';
      s[18].status = 'CONDUCTOR_RESERVED';
      return s;
    })(),
    availableSeatsCount: 26,
  },
  {
    id: 'trip-bbsr-puri-day',
    routeId: 'route-bbsr-puri',
    busId: 'bus-2',
    category: 'DAY_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '09:00',
    arrivalTime: '10:30',
    originCity: 'Bhubaneswar',
    destinationCity: 'Puri',
    baseFare: 220,
    surgeMultiplier: 1.0,
    effectiveFare: 220,
    bus: MOCK_BUSES[1],
    boardingPoints: [
      { id: 'bp-1', name: 'Baramunda ISBT', landmark: 'Platform 2', time: '09:00', contactPhone: '+91 97780 43210' },
      { id: 'bp-3', name: 'Master Canteen', landmark: 'Railway Station', time: '09:25', contactPhone: '+91 97780 43210' }
    ],
    droppingPoints: [
      { id: 'dp-1', name: 'Puri Grand Road', landmark: 'Main Stand', time: '10:30', contactPhone: '+91 93370 11984' }
    ],
    seats: generateSeaterSeats(220),
    availableSeatsCount: 36,
  },
  {
    id: 'trip-bbsr-rourkela-night',
    routeId: 'route-bbsr-rourkela',
    busId: 'bus-1',
    category: 'NIGHT_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '21:00',
    arrivalTime: '05:30',
    originCity: 'Bhubaneswar',
    destinationCity: 'Rourkela',
    baseFare: 850,
    surgeMultiplier: 1.25,
    effectiveFare: 1060,
    bus: {
      ...MOCK_BUSES[0],
      registrationNumber: 'OD-02-BZ-3311',
      model: 'Scania Metrolink AC Multi-Axle Diamond Sleeper'
    },
    boardingPoints: [
      { id: 'bp-1', name: 'Baramunda ISBT Gate 1', landmark: 'Main Concourse', time: '21:00', contactPhone: '+91 98610 24819' },
      { id: 'bp-5', name: 'Khandagiri Chowk', landmark: 'Near Reliance Digital', time: '21:20', contactPhone: '+91 98610 24819' }
    ],
    droppingPoints: [
      { id: 'dp-3', name: 'Rourkela Panposh Stand', landmark: 'Near NIT Road', time: '05:00', contactPhone: '+91 94371 89201' },
      { id: 'dp-4', name: 'Rourkela Main Bus Stand', landmark: 'Near Railway Station', time: '05:30', contactPhone: '+91 94371 89201' }
    ],
    seats: (() => {
      const s = generateSleeperSeats(850);
      s[2].status = 'BOOKED';
      s[2].bookedGender = 'FEMALE';
      s[3].status = 'BOOKED';
      s[3].bookedGender = 'FEMALE';
      s[3].genderRestriction = 'FEMALE_ONLY';
      s[10].status = 'BOOKED';
      s[10].bookedGender = 'MALE';
      return s;
    })(),
    availableSeatsCount: 27,
  },
  {
    id: 'trip-blr-hyd-night',
    routeId: 'route-blr-hyd',
    busId: 'bus-3',
    category: 'NIGHT_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '21:30',
    arrivalTime: '06:30',
    originCity: 'Bangalore',
    destinationCity: 'Hyderabad',
    baseFare: 1100,
    surgeMultiplier: 1.2,
    effectiveFare: 1320,
    bus: MOCK_BUSES[2],
    boardingPoints: [
      { id: 'bp-b1', name: 'Majestic / Kempegowda Bus Stand', landmark: 'Platform 18', time: '21:30', contactPhone: '+91 99801 54321' },
      { id: 'bp-b2', name: 'Hebbal Flyover', landmark: 'Esteem Mall Service Road', time: '22:15', contactPhone: '+91 99801 54321' }
    ],
    droppingPoints: [
      { id: 'dp-h1', name: 'Aramghar Junction', landmark: 'Pillar 140', time: '05:45', contactPhone: '+91 98450 67890' },
      { id: 'dp-h2', name: 'MGBS / Lakdikapool', landmark: 'Main Terminus', time: '06:30', contactPhone: '+91 98450 67890' }
    ],
    seats: generateSleeperSeats(1100),
    availableSeatsCount: 30,
  },
  {
    id: 'trip-mum-pune-day',
    routeId: 'route-mum-pune',
    busId: 'bus-4',
    category: 'DAY_COACH',
    departureDate: new Date().toISOString().split('T')[0],
    departureTime: '07:30',
    arrivalTime: '11:00',
    originCity: 'Mumbai',
    destinationCity: 'Pune',
    baseFare: 420,
    surgeMultiplier: 1.0,
    effectiveFare: 420,
    bus: MOCK_BUSES[3],
    boardingPoints: [
      { id: 'bp-m1', name: 'Dadar TT Circle', landmark: 'Asiad Stand', time: '07:30', contactPhone: '+91 98201 11223' },
      { id: 'bp-m2', name: 'Vashi Highway', landmark: 'Near Toll Plaza', time: '08:15', contactPhone: '+91 98201 11223' }
    ],
    droppingPoints: [
      { id: 'dp-p1', name: 'Wakad Bridge', landmark: 'Ginger Hotel Cross', time: '10:30', contactPhone: '+91 98202 33445' },
      { id: 'dp-p2', name: 'Swargate Bus Station', landmark: 'Platform 3', time: '11:00', contactPhone: '+91 98202 33445' }
    ],
    seats: generateSeaterSeats(420),
    availableSeatsCount: 36,
  }
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'bk-demo-100284',
    pnr: 'MP100284',
    userId: 'usr-pass-101', // Rahul Sharma
    tripId: 'trip-bbsr-puri-flagship',
    tripCode: 'TRIP-20491',
    busDisplayNumber: 'MP-204',
    passengerId: 'PAX-100284',
    trackingPermissionGranted: true,
    shareToken: 'share-mp100284-demo',
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '06:30',
      arrivalTime: '08:45',
      busModel: 'Volvo 9600 Multi-Axle Premium Sleeper',
      operatorName: 'MargPath Express Luxury Coach',
      busRegistrationNumber: 'OD-02-MP-0204',
      busDisplayNumber: 'MP-204',
      category: 'DAY_COACH',
      boardingPointName: 'Bhubaneswar Railway Station',
      boardingTime: '06:30',
      droppingPointName: 'Puri Bus Stand',
      droppingTime: '08:45',
      travelDate: new Date().toISOString().split('T')[0]
    },
    passengers: [
      { name: 'Rahul Sharma', age: 29, gender: 'MALE', seatNumber: 'A12', seatId: 'seat-a12', fare: 380, isPrimaryContact: true }
    ],
    contactEmail: 'rahul.sharma@gmail.com',
    contactPhone: '9876543210',
    boardingPoint: {
      id: 'bp-bbsr-railway',
      name: 'Bhubaneswar Railway Station',
      landmark: 'Master Canteen Square Platform 1 Exit',
      time: '06:30',
      contactPhone: '+91 94371 00001'
    },
    droppingPoint: {
      id: 'dp-puri-grandroad',
      name: 'Puri Bus Stand',
      landmark: 'Grand Road Jagannath Temple Entrance',
      time: '08:45',
      contactPhone: '+91 94371 00001'
    },
    baseAmount: 380,
    surgeAmount: 0,
    gstAmount: 19,
    discountAmount: 0,
    totalAmount: 399,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID',
    checkInStatus: 'CONFIRMED',
    qrPayloadHash: 'hash_mp100284_pnr_sec_v1',
    qrPayloadData: JSON.stringify({ pnr: 'MP100284', trip: 'TRIP-20491', vehicle: 'MP-204', seats: ['A12'], passenger: 'Rahul Sharma', status: 'PAID' }),
    qrCodeToken: 'margpath:ticket:MP100284',
    bookedAt: new Date().toISOString()
  },
  {
    id: 'bk-1001',
    pnr: 'BR899401',
    userId: 'usr-pass-102', // Customer B: Ananya Pattnaik
    tripId: 'trip-bbsr-puri-night',
    tripCode: 'TRIP-10802',
    busDisplayNumber: 'MP-108',
    passengerId: 'PAX-899401',
    trackingPermissionGranted: true,
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '22:30',
      arrivalTime: '00:15',
      busModel: 'BharatBenz 2+1 AC Sleeper Executive',
      operatorName: 'OSRTC Volvo Premier',
      busRegistrationNumber: 'OD-02-AX-8910',
      category: 'NIGHT_COACH',
    },
    passengers: [
      { name: 'Ananya Pattnaik', age: 26, gender: 'FEMALE', seatNumber: 'L1B', seatId: 'L-D11', fare: 540 },
    ],
    contactEmail: 'ananya.pattnaik@example.com',
    contactPhone: '9861099234',
    boardingPoint: { id: 'bp-1', name: 'Baramunda ISBT (Bay 4)', landmark: 'Near Overbridge', time: '22:30', contactPhone: '+91 98610 24819' },
    droppingPoint: { id: 'dp-1', name: 'Puri Bus Stand (Bada Danda)', landmark: 'Near Jagannath Temple Office', time: '00:15', contactPhone: '+91 94371 00001' },
    baseAmount: 450,
    surgeAmount: 90,
    gstAmount: 27,
    discountAmount: 0,
    totalAmount: 567,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID_ONLINE',
    checkInStatus: 'CONFIRMED',
    qrPayloadHash: 'hash_br899401_sec_99a',
    qrPayloadData: JSON.stringify({ pnr: 'BR899401', vehicle: 'OD-02-AX-8910', seats: ['L1B'], status: 'PAID' }),
    bookedAt: '2026-08-25T19:40:00Z',
    cancellationPolicy: {
      refundPercentage: 75,
      refundAmount: 425.25,
      canCancel: true,
    },
  },
  {
    id: 'bk-1002',
    pnr: 'BR899402',
    tripId: 'trip-bbsr-puri-night',
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '22:30',
      arrivalTime: '00:15',
      busModel: 'BharatBenz 2+1 AC Sleeper Executive',
      operatorName: 'OSRTC Volvo Premier',
      busRegistrationNumber: 'OD-02-AX-8910',
      category: 'NIGHT_COACH',
    },
    passengers: [
      { name: 'Debashish Tripathy', age: 34, gender: 'MALE', seatNumber: 'L1A', seatId: 'L-S1', fare: 650 },
    ],
    contactEmail: 'debashish.tripathy@example.com',
    contactPhone: '9437108422',
    boardingPoint: { id: 'bp-2', name: 'Jaydev Vihar Overbridge', landmark: 'Opposite Fortune Hotel', time: '22:45', contactPhone: '+91 98610 24819' },
    droppingPoint: { id: 'dp-1', name: 'Puri Bus Stand (Bada Danda)', landmark: 'Near Jagannath Temple Office', time: '00:15', contactPhone: '+91 94371 00001' },
    baseAmount: 550,
    surgeAmount: 100,
    gstAmount: 32.5,
    discountAmount: 0,
    totalAmount: 682.5,
    paymentMethod: 'PAY_ON_BOARDING_COD',
    paymentStatus: 'PAY_ON_BOARDING_PENDING',
    checkInStatus: 'CONFIRMED',
    qrPayloadHash: 'hash_br899402_sec_10b',
    qrPayloadData: JSON.stringify({ pnr: 'BR899402', vehicle: 'OD-02-AX-8910', seats: ['L1A'], status: 'PAY_ON_BOARDING' }),
    bookedAt: '2026-08-25T21:10:00Z',
    cancellationPolicy: {
      refundPercentage: 50,
      refundAmount: 0,
      canCancel: true,
    },
  },
  {
    id: 'bk-1003',
    pnr: 'BR899403',
    tripId: 'trip-bbsr-puri-night',
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '22:30',
      arrivalTime: '00:15',
      busModel: 'BharatBenz 2+1 AC Sleeper Executive',
      operatorName: 'OSRTC Volvo Premier',
      busRegistrationNumber: 'OD-02-AX-8910',
      category: 'NIGHT_COACH',
    },
    passengers: [
      { name: 'Sanjay Mohanty', age: 41, gender: 'MALE', seatNumber: 'L3A', seatId: 'L-S3', fare: 650 },
    ],
    contactEmail: 'sanjay.mohanty@example.com',
    contactPhone: '9861234900',
    boardingPoint: { id: 'bp-3', name: 'Master Canteen Square', landmark: 'Near Railway Station Exit', time: '23:05', contactPhone: '+91 98610 24819' },
    droppingPoint: { id: 'dp-2', name: 'Swargadwar Beach Junction', landmark: 'Sea Beach Circle', time: '00:30', contactPhone: '+91 94371 00001' },
    baseAmount: 550,
    surgeAmount: 100,
    gstAmount: 32.5,
    discountAmount: 50,
    totalAmount: 632.5,
    paymentMethod: 'CREDIT_DEBIT_CARD',
    paymentStatus: 'PAID_ONLINE',
    checkInStatus: 'BOARDED',
    boardedAt: '22:14 (Validated by Conductor Bijay Nayak)',
    verifiedByConductorId: 'COND-7890',
    verifiedByConductorName: 'Bijay Nayak',
    verifiedVehicleNumber: 'OD-02-AX-8910',
    qrPayloadHash: 'hash_br899403_sec_33c',
    qrPayloadData: JSON.stringify({ pnr: 'BR899403', vehicle: 'OD-02-AX-8910', seats: ['L3A'], status: 'PAID' }),
    bookedAt: '2026-08-25T20:15:00Z',
    cancellationPolicy: {
      refundPercentage: 75,
      refundAmount: 474.37,
      canCancel: false,
    },
  },
  {
    id: 'bk-1004',
    pnr: 'BR899404',
    tripId: 'trip-bbsr-puri-night',
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '22:30',
      arrivalTime: '00:15',
      busModel: 'BharatBenz 2+1 AC Sleeper Executive',
      operatorName: 'OSRTC Volvo Premier',
      busRegistrationNumber: 'OD-02-AX-8910',
      category: 'NIGHT_COACH',
    },
    passengers: [
      { name: 'Amitav Mishra', age: 31, gender: 'MALE', seatNumber: 'L2B', seatId: 'L-D12', fare: 540 },
    ],
    contactEmail: 'amitav.mishra@example.com',
    contactPhone: '9437889900',
    boardingPoint: { id: 'bp-1', name: 'Baramunda ISBT (Bay 4)', landmark: 'Near Overbridge', time: '22:30', contactPhone: '+91 98610 24819' },
    droppingPoint: { id: 'dp-1', name: 'Puri Bus Stand (Bada Danda)', landmark: 'Near Jagannath Temple Office', time: '00:15', contactPhone: '+91 94371 00001' },
    baseAmount: 450,
    surgeAmount: 90,
    gstAmount: 27,
    discountAmount: 0,
    totalAmount: 567,
    paymentMethod: 'UPI',
    paymentStatus: 'REFUNDED',
    checkInStatus: 'CANCELLED',
    qrPayloadHash: 'hash_br899404_sec_canc',
    qrPayloadData: JSON.stringify({ pnr: 'BR899404', vehicle: 'OD-02-AX-8910', seats: ['L2B'], status: 'CANCELLED' }),
    bookedAt: '2026-08-25T18:00:00Z',
    cancellationPolicy: {
      refundPercentage: 75,
      refundAmount: 425.25,
      canCancel: false,
      cancellationReason: 'Customer requested refund via wABus app'
    },
  },
  {
    id: 'bk-2001',
    pnr: 'BR771099',
    tripId: 'trip-blr-hyd-night',
    trip: {
      originCity: 'Bangalore',
      destinationCity: 'Hyderabad',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '21:30',
      arrivalTime: '06:30',
      busModel: 'Scania Metrolink HD Multi-Axle Sleeper',
      operatorName: 'Orange National Royal Express',
      busRegistrationNumber: 'KA-01-MJ-4521',
      category: 'NIGHT_COACH',
    },
    passengers: [
      { name: 'Priya Sundaram', age: 29, gender: 'FEMALE', seatNumber: 'U1A', seatId: 'U-S1', fare: 1320 },
    ],
    contactEmail: 'priya.sundaram@example.com',
    contactPhone: '9980122334',
    boardingPoint: { id: 'bp-b1', name: 'Majestic / Kempegowda Bus Stand', landmark: 'Platform 18', time: '21:30', contactPhone: '+91 99801 54321' },
    droppingPoint: { id: 'dp-h1', name: 'Aramghar Junction', landmark: 'Pillar 140', time: '05:45', contactPhone: '+91 98450 67890' },
    baseAmount: 1100,
    surgeAmount: 220,
    gstAmount: 66,
    discountAmount: 0,
    totalAmount: 1386,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID_ONLINE',
    checkInStatus: 'CONFIRMED',
    qrPayloadHash: 'hash_br771099_blr_hyd',
    qrPayloadData: JSON.stringify({ pnr: 'BR771099', vehicle: 'KA-01-MJ-4521', seats: ['U1A'], status: 'PAID' }),
    bookedAt: '2026-08-25T14:30:00Z',
    cancellationPolicy: {
      refundPercentage: 75,
      refundAmount: 1039.5,
      canCancel: true,
    },
  },
  {
    id: 'bk-3001',
    pnr: 'BR662055',
    tripId: 'trip-bbsr-puri-day',
    trip: {
      originCity: 'Bhubaneswar',
      destinationCity: 'Puri',
      departureDate: new Date().toISOString().split('T')[0],
      departureTime: '09:00',
      arrivalTime: '10:30',
      busModel: 'Volvo 9600 B11R Multi-Axle Semi-Sleeper',
      operatorName: 'Dolphin Transits & Travels',
      busRegistrationNumber: 'OD-33-K-1080',
      category: 'DAY_COACH',
    },
    passengers: [
      { name: 'Rajesh Routray', age: 38, gender: 'MALE', seatNumber: '12', seatId: 'S-12', fare: 220 },
    ],
    contactEmail: 'rajesh.routray@example.com',
    contactPhone: '9337099881',
    boardingPoint: { id: 'bp-1', name: 'Baramunda ISBT', landmark: 'Platform 2', time: '09:00', contactPhone: '+91 97780 43210' },
    droppingPoint: { id: 'dp-1', name: 'Puri Grand Road', landmark: 'Main Stand', time: '10:30', contactPhone: '+91 93370 11984' },
    baseAmount: 220,
    surgeAmount: 0,
    gstAmount: 11,
    discountAmount: 0,
    totalAmount: 231,
    paymentMethod: 'UPI',
    paymentStatus: 'PAID_ONLINE',
    checkInStatus: 'CONFIRMED',
    qrPayloadHash: 'hash_br662055_day_puri',
    qrPayloadData: JSON.stringify({ pnr: 'BR662055', vehicle: 'OD-33-K-1080', seats: ['12'], status: 'PAID' }),
    bookedAt: '2026-08-25T16:00:00Z',
    cancellationPolicy: {
      refundPercentage: 75,
      refundAmount: 173.25,
      canCancel: true,
    },
  }
];

export const MOCK_PAYOUTS: PayoutRecord[] = [
  {
    id: 'pay-2026-08-25',
    operatorId: 'op-1',
    operatorName: 'Dolphin Transits & Travels',
    payoutDate: '2026-08-25',
    periodStart: '2026-08-24 00:00:00',
    periodEnd: '2026-08-24 23:59:59',
    grossBookingsAmount: 148500,
    platformCommissionAmount: 11880, // 8%
    tdsDeductionAmount: 1485, // 1%
    netPayoutAmount: 135135,
    status: 'PROCESSED',
    gatewayReference: 'rpy_route_trf_992149814',
    tripsCount: 14,
    totalPassengers: 284,
  },
  {
    id: 'pay-2026-08-24',
    operatorId: 'op-1',
    operatorName: 'Dolphin Transits & Travels',
    payoutDate: '2026-08-24',
    periodStart: '2026-08-23 00:00:00',
    periodEnd: '2026-08-23 23:59:59',
    grossBookingsAmount: 182400,
    platformCommissionAmount: 14592,
    tdsDeductionAmount: 1824,
    netPayoutAmount: 165984,
    status: 'PROCESSED',
    gatewayReference: 'rpy_route_trf_884102941',
    tripsCount: 16,
    totalPassengers: 340,
  },
  {
    id: 'pay-2026-08-25-op2',
    operatorId: 'op-2',
    operatorName: 'Orange National Royal Express',
    payoutDate: '2026-08-25',
    periodStart: '2026-08-24 00:00:00',
    periodEnd: '2026-08-24 23:59:59',
    grossBookingsAmount: 215600,
    platformCommissionAmount: 17248,
    tdsDeductionAmount: 2156,
    netPayoutAmount: 196196,
    status: 'PROCESSED',
    gatewayReference: 'rpy_route_trf_771928340',
    tripsCount: 12,
    totalPassengers: 310,
  }
];

export const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'tm-1',
    name: 'Prakash Sangam',
    role: 'CEO',
    bio: 'Prakash Sangam has been Chief Executive Officer of wABus since June 2014. Prior to wABus, he served as an Executive Vice President of Info Edge India (Naukri group), heading two group businesses namely Shiksha.com and Jeevansathi.com. He\'s also worked as General Manager of Marketing and Innovation at Airtel and has also had multiple roles across Marketing, Brand Management and Sales at Hindustan Unilever. Prakash has completed his MBA from IIM Calcutta and also holds an Honours degree in Production Engineering from Mumbai University.',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=80',
    displayOrder: 1,
    email: 'prakash.sangam@wabus.in',
    linkedinUrl: 'https://linkedin.com'
  },
  {
    id: 'tm-2',
    name: 'Anoop Menon',
    role: 'CTO',
    bio: 'Anoop Menon serves as Chief Technology Officer at wABus. Anoop plays an integral role in setting the company\'s strategic direction, development and future growth. At wABus, he leads effective delivery of scalable systems to the customers, agents and bus operators by incorporating the latest technology. A tech enthusiast, Anoop comes with over 18 years of extensive experience in building scalable and high-performing products across telecom, internet and mobile ecommerce domains. Anoop strongly believes that hard work and commitment can overcome the barriers to success. He completed BE in Mechanical Engineering from Madras University and loves sports, movies, TV and music.',
    imageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
    displayOrder: 2,
    email: 'anoop.menon@wabus.in',
    linkedinUrl: 'https://linkedin.com'
  },
  {
    id: 'tm-3',
    name: 'Sunita Sharma',
    role: 'COO - Chief Operating Officer',
    bio: 'Sunita Sharma oversees national fleet operations, operator relations, and passenger safety ecosystems across wABus corridors. With over 16 years of leadership experience in logistics and transport infrastructure, she led multi-city network scaling at leading Indian mobility platforms. She holds a Master\'s degree in Supply Chain Management from XLRI Jamshedpur.',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
    displayOrder: 3,
    email: 'sunita.sharma@wabus.in',
    linkedinUrl: 'https://linkedin.com'
  }
];

export const INITIAL_OFFERS: OfferCoupon[] = [
  {
    id: 'off-1',
    code: 'BHARAT100',
    title: 'Bharat First Ride Offer',
    description: 'Flat ₹100 instant discount on all AC Sleeper & Seater bookings across all corridors.',
    discountType: 'FLAT',
    discountValue: 100,
    minBookingAmount: 300,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'FLAT ₹100 OFF',
    savingsText: 'Save up to ₹100 on bus tickets',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Offer valid on minimum booking transaction value of ₹300.',
      'Discount applicable once per user account.',
      'Applicable on all AC Sleeper, Seater, and Volvo buses on wABus.',
      'wABus reserves the right to withdraw or alter the offer without prior notice.'
    ],
    howToUse: [
      'Search buses for your route and select your preferred seats.',
      'Proceed to passenger info page.',
      'Enter BHARAT100 in the Promo Code section and click Apply.',
      'Enjoy ₹100 instant discount on your total booking fare!'
    ]
  },
  {
    id: 'off-2',
    code: 'WABUS50',
    title: 'wABus Primo Savings',
    description: '₹50 instant cashback for wABus app & website passengers.',
    discountType: 'FLAT',
    discountValue: 50,
    minBookingAmount: 200,
    isLive: true,
    validUntil: '2026-12-31',
    badgeTag: 'SAVE ₹50',
    savingsText: 'Save up to ₹50 on bus bookings',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Valid on minimum booking value of ₹200.',
      'Can be redeemed on all bus routes nationwide.',
      'Valid for both online UPI/Card payments and Pay-on-Boarding COD.'
    ],
    howToUse: [
      'Select bus seats and proceed to checkout.',
      'Apply coupon WABUS50 before completing payment.'
    ]
  },
  {
    id: 'off-3',
    code: 'FESTIVE150',
    title: 'Festival Coach Special',
    description: '₹150 off on Night Sleeper Luxury Coaches for holiday travel.',
    discountType: 'FLAT',
    discountValue: 150,
    minBookingAmount: 500,
    isLive: true,
    validUntil: '2026-10-31',
    badgeTag: 'FESTIVE ₹150 OFF',
    savingsText: 'Save up to ₹150 on luxury coaches',
    category: 'BUS',
    imageUrl: 'https://cdn.iconscout.com/icon/free/png-256/free-bus-1782265-1512503.png',
    termsAndConditions: [
      'Valid on Night Coach sleeper bookings worth ₹500 or more.',
      'Non-transferable and non-refundable upon ticket cancellation.'
    ],
    howToUse: [
      'Select a Night Sleeper bus for your journey.',
      'Enter FESTIVE150 at passenger payment step.'
    ]
  }
];

