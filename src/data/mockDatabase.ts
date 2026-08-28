import { Bus, Route, Trip, Seat, FeatureFlags, Booking, PayoutRecord, ConductorProfile } from '../types';

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
    id: 'bus-1',
    registrationNumber: 'OD-02-AX-8910',
    operatorId: 'op-1',
    operatorName: 'OSRTC Volvo Premier',
    operatorRating: 4.8,
    model: 'BharatBenz 2+1 AC Sleeper Executive',
    busType: 'AC_SLEEPER_2_1',
    totalSeats: 30,
    hasLowerDeck: true,
    hasUpperDeck: true,
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
    assignedBusNumber: 'OD-02-AX-8910',
    assignedBusId: 'bus-1',
    assignedOperator: 'OSRTC Volvo Premier',
    assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
    activeTripId: 'trip-bbsr-puri-night',
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

// Helper to generate 2+2 Semi-Sleeper Seater seats (36 seats)
export function generateSeaterSeats(basePrice: number): Seat[] {
  const seats: Seat[] = [];
  for (let r = 1; r <= 9; r++) {
    // Left pair: col 0 (Window), col 1 (Aisle)
    seats.push({
      id: `S${r}-W1`,
      number: `${r}A`,
      deck: 'LOWER',
      row: r,
      col: 0,
      isSleeper: false,
      basePrice: basePrice + 40,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    seats.push({
      id: `S${r}-A1`,
      number: `${r}B`,
      deck: 'LOWER',
      row: r,
      col: 1,
      isSleeper: false,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    // Right pair: col 2 (Aisle), col 3 (Window)
    seats.push({
      id: `S${r}-A2`,
      number: `${r}C`,
      deck: 'LOWER',
      row: r,
      col: 2,
      isSleeper: false,
      basePrice: basePrice,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
    seats.push({
      id: `S${r}-W2`,
      number: `${r}D`,
      deck: 'LOWER',
      row: r,
      col: 3,
      isSleeper: false,
      basePrice: basePrice + 40,
      status: 'AVAILABLE',
      genderRestriction: 'ANY',
    });
  }
  return seats;
}

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-bbsr-puri-night',
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
    bus: MOCK_BUSES[0],
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
    id: 'bk-1001',
    pnr: 'BR899401',
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
