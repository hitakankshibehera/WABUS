import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trip, TripCategory, CoachType, FeatureFlags, OfferCoupon } from '../../types';
import { api } from '../../services/api';
import { 
  Search, 
  MapPin, 
  Calendar as CalendarIcon, 
  Sun, 
  Moon, 
  Zap, 
  ShieldCheck, 
  Wifi, 
  BatteryCharging, 
  Tv, 
  Star, 
  ArrowRightLeft,
  ChevronRight,
  ChevronLeft,
  Filter,
  Sparkles,
  Award,
  Clock,
  Radio,
  CheckCircle2,
  Tag,
  Building2,
  Navigation,
  X,
  Bus as BusIcon
} from 'lucide-react';

interface TripSearchProps {
  trips: Trip[];
  onSelectTrip: (trip: Trip) => void;
  selectedTripId: string | null;
  featureFlags: FeatureFlags;
}

interface BusStopOption {
  city: string;
  state: string;
  majorStops: string[];
}

const BUS_STOP_LOCATIONS: BusStopOption[] = [
  { city: 'Bhubaneswar', state: 'Odisha', majorStops: ['Baramunda ISBT', 'Master Canteen', 'Vani Vihar', 'Patia Square', 'Jaydev Vihar'] },
  { city: 'Puri', state: 'Odisha', majorStops: ['Puri Bus Stand', 'Grand Road Jagannath Temple', 'Atharnala', 'Sea Beach Road'] },
  { city: 'Rourkela', state: 'Odisha', majorStops: ['Rourkela New Bus Stand', 'Sector 2 Bus Terminus', 'Panposh Chowk'] },
  { city: 'Cuttack', state: 'Odisha', majorStops: ['Badambadi Bus Terminal', 'Link Road', 'OMP Square', 'Madhupatna'] },
  { city: 'Berhampur', state: 'Odisha', majorStops: ['New Bus Stand', 'Old Bus Stand', 'Gosaninuagaon', 'Tata Benz Square'] },
  { city: 'Bangalore', state: 'Karnataka', majorStops: ['Majestic KBS', 'Madiwala', 'Silk Board', 'Electronic City Toll', 'Yeshwantpur'] },
  { city: 'Hyderabad', state: 'Telangana', majorStops: ['MGBS Central', 'Kukatpally', 'Ameerpet', 'Gachibowli', 'LB Nagar'] },
  { city: 'Mumbai', state: 'Maharashtra', majorStops: ['Borivali East', 'Sion Circle', 'Dadar Asiad Bus Stand', 'Vashi Toll Plaza'] },
  { city: 'Pune', state: 'Maharashtra', majorStops: ['Swargate Bus Stand', 'Wakad Hinjewadi Flyover', 'Shivajinagar', 'Katraj Bypass'] },
  { city: 'Delhi', state: 'Delhi NCR', majorStops: ['Kashmere Gate ISBT', 'Anand Vihar ISBT', 'Dhaula Kuan', 'Majnu Ka Tilla'] },
  { city: 'Manali', state: 'Himachal', majorStops: ['Private Bus Stand Mall Road', 'Volvo Bus Parking Patlikuhal', 'Aleo Bypass'] },
  { city: 'Kolkata', state: 'West Bengal', majorStops: ['Esplanade Dharmatala', 'Babughat Bus Stand', 'Karunamoyee Salt Lake', 'Howrah Station'] }
];

export const TripSearch: React.FC<TripSearchProps> = ({
  trips,
  onSelectTrip,
  selectedTripId,
  featureFlags,
}) => {
  const [origin, setOrigin] = useState('Bhubaneswar');
  const [destination, setDestination] = useState('Puri');
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | TripCategory>('ALL');
  const [busTypeFilter, setBusTypeFilter] = useState<'ALL' | CoachType>('ALL');

  // Live Offers from Admin (polls every 5s so new admin offers appear instantly)
  const [liveOffers, setLiveOffers] = useState<OfferCoupon[]>([]);
  const [offerCopied, setOfferCopied] = useState<string | null>(null);
  const [offerTabFilter, setOfferTabFilter] = useState<string>('ALL');
  const [selectedOfferModal, setSelectedOfferModal] = useState<OfferCoupon | null>(null);

  useEffect(() => {
    const fetchOffers = () => {
      api.getOffers().then(setLiveOffers).catch(() => {});
    };
    fetchOffers();
    const pollInterval = setInterval(fetchOffers, 5000);
    return () => clearInterval(pollInterval);
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setOfferCopied(code);
    setTimeout(() => setOfferCopied(null), 2000);
  };

  // Interactive UI Dropdowns
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [searchOriginText, setSearchOriginText] = useState('');
  const [searchDestText, setSearchDestText] = useState('');

  // Calendar navigation month/year
  const [calendarViewDate, setCalendarViewDate] = useState(new Date());

  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // Close popups on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(event.target as Node)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(event.target as Node)) {
        setIsDestOpen(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwapCities = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Dynamic compilation of preset + admin added bus stop locations
  const allAvailableLocations: BusStopOption[] = JSON.parse(JSON.stringify(BUS_STOP_LOCATIONS));

  trips.forEach(t => {
    // Add Origin city & boarding stops if not already present
    let originLoc = allAvailableLocations.find(l => l.city.toLowerCase() === t.originCity.toLowerCase());
    const boardingNames = t.boardingPoints ? t.boardingPoints.map(b => b.name) : [];
    if (!originLoc) {
      allAvailableLocations.push({
        city: t.originCity,
        state: 'India',
        majorStops: boardingNames.length > 0 ? boardingNames : [`${t.originCity} Central ISBT`]
      });
    } else {
      boardingNames.forEach(stop => {
        if (!originLoc!.majorStops.includes(stop)) {
          originLoc!.majorStops.push(stop);
        }
      });
    }

    // Add Destination city & dropping stops if not already present
    let destLoc = allAvailableLocations.find(l => l.city.toLowerCase() === t.destinationCity.toLowerCase());
    const droppingNames = t.droppingPoints ? t.droppingPoints.map(d => d.name) : [];
    if (!destLoc) {
      allAvailableLocations.push({
        city: t.destinationCity,
        state: 'India',
        majorStops: droppingNames.length > 0 ? droppingNames : [`${t.destinationCity} Main Stand`]
      });
    } else {
      droppingNames.forEach(stop => {
        if (!destLoc!.majorStops.includes(stop)) {
          destLoc!.majorStops.push(stop);
        }
      });
    }
  });

  // Filtered stop locations
  const filteredOriginLocations = allAvailableLocations.filter(loc =>
    loc.city.toLowerCase().includes(searchOriginText.toLowerCase()) ||
    loc.majorStops.some(s => s.toLowerCase().includes(searchOriginText.toLowerCase()))
  );

  const filteredDestLocations = allAvailableLocations.filter(loc =>
    loc.city.toLowerCase().includes(searchDestText.toLowerCase()) ||
    loc.majorStops.some(s => s.toLowerCase().includes(searchDestText.toLowerCase()))
  );

  const filteredTrips = trips.filter(t => {
    const matchOrigin = origin ? (
      t.originCity.toLowerCase().includes(origin.toLowerCase()) ||
      (t.boardingPoints && t.boardingPoints.some(b => b.name.toLowerCase().includes(origin.toLowerCase())))
    ) : true;
    const matchDest = destination ? (
      t.destinationCity.toLowerCase().includes(destination.toLowerCase()) ||
      (t.droppingPoints && t.droppingPoints.some(d => d.name.toLowerCase().includes(destination.toLowerCase())))
    ) : true;
    const matchCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchType = busTypeFilter === 'ALL' || (t.bus && t.bus.busType === busTypeFilter);
    return matchOrigin && matchDest && matchCat && matchType;
  });

  // Calendar Helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowObj = new Date();
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowStr = tomorrowObj.toISOString().split('T')[0];

  const weekendObj = new Date();
  const daysUntilSaturday = (6 - weekendObj.getDay() + 7) % 7 || 7;
  weekendObj.setDate(weekendObj.getDate() + daysUntilSaturday);
  const weekendStr = weekendObj.toISOString().split('T')[0];

  const formatDisplayDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });
      const dayNum = d.getDate();
      const monthName = d.toLocaleDateString('en-IN', { month: 'short' });
      const year = d.getFullYear();
      return { dayName, dayNum, monthName, year, full: `${dayName}, ${dayNum} ${monthName} ${year}` };
    } catch {
      return { dayName: 'Wed', dayNum: 26, monthName: 'Aug', year: 2026, full: dateStr };
    }
  };

  const currentDisplay = formatDisplayDate(selectedDate);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calYear = calendarViewDate.getFullYear();
  const calMonth = calendarViewDate.getMonth();
  const daysInCalMonth = getDaysInMonth(calYear, calMonth);
  const firstDayIndex = getFirstDayOfMonth(calYear, calMonth);
  const monthName = calendarViewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const handlePrevMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarViewDate(new Date(calYear, calMonth + 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const monthFormatted = String(calMonth + 1).padStart(2, '0');
    const dayFormatted = String(day).padStart(2, '0');
    const dateString = `${calYear}-${monthFormatted}-${dayFormatted}`;
    setSelectedDate(dateString);
    setIsCalendarOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Realistic Hero Banner */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-md bg-gradient-to-b from-[#D84E55] via-[#C93F46] to-[#B83238] text-white p-5 sm:p-8 lg:p-10">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto space-y-5">
          {/* Header text */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/15 text-xs font-semibold text-red-50 border border-white/10">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span>India&apos;s Leading Bus Ticketing Platform</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Online Bus Ticket Booking
            </h1>
            <p className="text-xs sm:text-sm text-red-100/90 font-normal max-w-2xl mx-auto">
              Real-time Redis seat reservation &bull; Instant WhatsApp e-Ticket &bull; AIS-140 GPS Live Tracking
            </p>
          </div>

          {/* DUAL COACH OPTIONS: Day Coach vs Night Coach */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto pt-1">
            {/* Option 1: Day Coach */}
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'DAY_COACH' ? 'ALL' : 'DAY_COACH')}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3.5 ${
                categoryFilter === 'DAY_COACH'
                  ? 'bg-white text-slate-900 shadow-md border-amber-300 ring-2 ring-amber-400'
                  : 'bg-black/15 hover:bg-black/25 text-white border-white/15'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                categoryFilter === 'DAY_COACH' ? 'bg-amber-50 text-amber-600' : 'bg-white/10 text-amber-200'
              }`}>
                <Sun className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    categoryFilter === 'DAY_COACH' ? 'text-amber-800' : 'text-amber-200'
                  }`}>
                    Option 1: Day Coach
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    categoryFilter === 'DAY_COACH' ? 'bg-amber-100 text-amber-900' : 'bg-white/15 text-white'
                  }`}>
                    06:00 - 18:00
                  </span>
                </div>
                <h4 className={`text-sm font-bold truncate ${categoryFilter === 'DAY_COACH' ? 'text-slate-900' : 'text-white'}`}>
                  Daytime Superfast Express
                </h4>
                <p className={`text-[11px] truncate ${categoryFilter === 'DAY_COACH' ? 'text-slate-500' : 'text-red-100/80'}`}>
                  2+2 Semi-Sleeper &bull; AC Seater &bull; WiFi & Charging
                </p>
              </div>
            </button>

            {/* Option 2: Night Coach */}
            <button
              type="button"
              onClick={() => setCategoryFilter(categoryFilter === 'NIGHT_COACH' ? 'ALL' : 'NIGHT_COACH')}
              className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer flex items-center gap-3.5 ${
                categoryFilter === 'NIGHT_COACH'
                  ? 'bg-white text-slate-900 shadow-md border-indigo-300 ring-2 ring-indigo-400'
                  : 'bg-black/15 hover:bg-black/25 text-white border-white/15'
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                categoryFilter === 'NIGHT_COACH' ? 'bg-indigo-50 text-indigo-600' : 'bg-white/10 text-indigo-200'
              }`}>
                <Moon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    categoryFilter === 'NIGHT_COACH' ? 'text-indigo-800' : 'text-indigo-200'
                  }`}>
                    Option 2: Night Coach
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    categoryFilter === 'NIGHT_COACH' ? 'bg-indigo-100 text-indigo-900' : 'bg-white/15 text-white'
                  }`}>
                    19:00 - 06:00
                  </span>
                </div>
                <h4 className={`text-sm font-bold truncate ${categoryFilter === 'NIGHT_COACH' ? 'text-slate-900' : 'text-white'}`}>
                  Overnight AC Sleeper
                </h4>
                <p className={`text-[11px] truncate ${categoryFilter === 'NIGHT_COACH' ? 'text-slate-500' : 'text-red-100/80'}`}>
                  2+1 Luxury Sleeper &bull; Fresh linen &bull; Clean berths
                </p>
              </div>
            </button>
          </div>

          {/* Connected Floating Search Bar */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xl text-slate-900 border border-slate-100 relative z-30">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3 items-center">
              {/* Origin Bus Stop Selector */}
              <div 
                ref={originRef}
                className="md:col-span-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition relative cursor-pointer"
                onClick={() => {
                  setIsOriginOpen(!isOriginOpen);
                  setIsDestOpen(false);
                  setIsCalendarOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    FROM (BOARDING)
                  </span>
                  <span className="text-[9px] font-semibold text-[#D84E55] bg-red-50 px-1.5 py-0.2 rounded">
                    Departure
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-7 h-7 rounded-md bg-red-50 text-[#D84E55] flex items-center justify-center mr-2 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {origin}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{BUS_STOP_LOCATIONS.find(b => b.city === origin)?.majorStops[0] || 'Main ISBT Stand'}</span>
                    </div>
                  </div>
                </div>

                {/* Origin Pop-Up Modal */}
                {isOriginOpen && (
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setIsOriginOpen(false)}
                  >
                    <div 
                      onClick={e => e.stopPropagation()}
                      className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in zoom-in-95 duration-150"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Select Boarding Stop</span>
                        <button 
                          type="button" 
                          onClick={() => setIsOriginOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="py-3 border-b border-slate-100">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (searchOriginText.trim()) {
                              const match = filteredOriginLocations.find(l => l.city.toLowerCase() === searchOriginText.trim().toLowerCase());
                              const selected = match ? match.city : (filteredOriginLocations.length > 0 ? filteredOriginLocations[0].city : searchOriginText.trim());
                              setOrigin(selected);
                              setIsOriginOpen(false);
                              setSearchOriginText('');
                            }
                          }}
                          className="flex gap-1.5 items-center"
                        >
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={searchOriginText}
                              onChange={e => setSearchOriginText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (searchOriginText.trim()) {
                                    const match = filteredOriginLocations.find(l => l.city.toLowerCase() === searchOriginText.trim().toLowerCase());
                                    const selected = match ? match.city : (filteredOriginLocations.length > 0 ? filteredOriginLocations[0].city : searchOriginText.trim());
                                    setOrigin(selected);
                                    setIsOriginOpen(false);
                                    setSearchOriginText('');
                                  }
                                }
                              }}
                              placeholder="Type city (e.g. Bhubaneswar) & press Enter..."
                              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#D84E55] font-medium"
                              autoFocus
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-3 py-2 bg-[#D84E55] hover:bg-[#C33E44] text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                          >
                            Enter
                          </button>
                        </form>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                        {searchOriginText.trim() && !filteredOriginLocations.some(l => l.city.toLowerCase() === searchOriginText.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setOrigin(searchOriginText.trim());
                              setIsOriginOpen(false);
                              setSearchOriginText('');
                            }}
                            className="p-2.5 bg-red-50 hover:bg-red-100 rounded-lg transition cursor-pointer flex items-center justify-between text-[#D84E55] font-bold text-xs mb-1"
                          >
                            <span>Select &quot;{searchOriginText.trim()}&quot;</span>
                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-red-200 font-semibold">Press Enter</span>
                          </div>
                        )}
                        {searchOriginText.trim().toLowerCase().includes('admin') && (
                          <div
                            onClick={() => {
                              window.history.pushState(null, '', '/admin');
                              window.dispatchEvent(new PopStateEvent('popstate'));
                              setIsOriginOpen(false);
                              setSearchOriginText('');
                            }}
                            className="p-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-lg transition cursor-pointer flex items-center justify-between mb-1"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#D84E55]" />
                              <span className="text-xs font-bold text-slate-900">Open Master Admin Panel</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#D84E55] bg-white px-1.5 py-0.5 rounded border border-red-200">
                              /admin
                            </span>
                          </div>
                        )}
                        {filteredOriginLocations.map(loc => (
                          <div
                            key={loc.city}
                            onClick={() => {
                              setOrigin(loc.city);
                              setIsOriginOpen(false);
                              setSearchOriginText('');
                            }}
                            className={`p-2.5 hover:bg-slate-50 rounded-lg transition cursor-pointer flex flex-col gap-0.5 ${
                              origin === loc.city ? 'bg-red-50 text-[#D84E55]' : 'text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{loc.city}</span>
                              <span className="text-[10px] text-slate-400">{loc.state}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate">
                              {loc.majorStops.join(' • ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Swap Button */}
              <div className="flex md:col-span-1 justify-center -my-1 md:my-0 md:-mx-2 z-20">
                <button
                  type="button"
                  onClick={handleSwapCities}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm hover:shadow text-slate-600 hover:text-[#D84E55] flex items-center justify-center transition hover:scale-105 active:scale-95 cursor-pointer"
                  title="Swap Boarding and Dropping Stops"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-[#D84E55]" />
                </button>
              </div>

              {/* Destination Bus Stop Selector */}
              <div 
                ref={destRef}
                className="md:col-span-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition relative cursor-pointer"
                onClick={() => {
                  setIsDestOpen(!isDestOpen);
                  setIsOriginOpen(false);
                  setIsCalendarOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    TO (DROPPING)
                  </span>
                  <span className="text-[9px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
                    Arrival
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-7 h-7 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center mr-2 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {destination}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                      <Building2 className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                      <span className="truncate">{BUS_STOP_LOCATIONS.find(b => b.city === destination)?.majorStops[0] || 'Central Bus Station'}</span>
                    </div>
                  </div>
                </div>

                {/* Destination Pop-Up Modal */}
                {isDestOpen && (
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setIsDestOpen(false)}
                  >
                    <div 
                      onClick={e => e.stopPropagation()}
                      className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in zoom-in-95 duration-150"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Select Dropping Stop</span>
                        <button 
                          type="button" 
                          onClick={() => setIsDestOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="py-3 border-b border-slate-100">
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            if (searchDestText.trim()) {
                              const match = filteredDestLocations.find(l => l.city.toLowerCase() === searchDestText.trim().toLowerCase());
                              const selected = match ? match.city : (filteredDestLocations.length > 0 ? filteredDestLocations[0].city : searchDestText.trim());
                              setDestination(selected);
                              setIsDestOpen(false);
                              setSearchDestText('');
                            }
                          }}
                          className="flex gap-1.5 items-center"
                        >
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={searchDestText}
                              onChange={e => setSearchDestText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (searchDestText.trim()) {
                                    const match = filteredDestLocations.find(l => l.city.toLowerCase() === searchDestText.trim().toLowerCase());
                                    const selected = match ? match.city : (filteredDestLocations.length > 0 ? filteredDestLocations[0].city : searchDestText.trim());
                                    setDestination(selected);
                                    setIsDestOpen(false);
                                    setSearchDestText('');
                                  }
                                }
                              }}
                              placeholder="Type destination & press Enter..."
                              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#D84E55] font-medium"
                              autoFocus
                            />
                          </div>
                          <button
                            type="submit"
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                          >
                            Enter
                          </button>
                        </form>
                      </div>
                      <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                        {searchDestText.trim() && !filteredDestLocations.some(l => l.city.toLowerCase() === searchDestText.trim().toLowerCase()) && (
                          <div
                            onClick={() => {
                              setDestination(searchDestText.trim());
                              setIsDestOpen(false);
                              setSearchDestText('');
                            }}
                            className="p-2.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition cursor-pointer flex items-center justify-between text-blue-700 font-bold text-xs mb-1"
                          >
                            <span>Select &quot;{searchDestText.trim()}&quot;</span>
                            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-blue-200 font-semibold">Press Enter</span>
                          </div>
                        )}
                        {searchDestText.trim().toLowerCase().includes('admin') && (
                          <div
                            onClick={() => {
                              window.history.pushState(null, '', '/admin');
                              window.dispatchEvent(new PopStateEvent('popstate'));
                              setIsDestOpen(false);
                              setSearchDestText('');
                            }}
                            className="p-2.5 bg-red-50 hover:bg-red-100/80 border border-red-200 rounded-lg transition cursor-pointer flex items-center justify-between mb-1"
                          >
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-[#D84E55]" />
                              <span className="text-xs font-bold text-slate-900">Open Master Admin Panel</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#D84E55] bg-white px-1.5 py-0.5 rounded border border-red-200">
                              /admin
                            </span>
                          </div>
                        )}
                        {filteredDestLocations.map(loc => (
                          <div
                            key={loc.city}
                            onClick={() => {
                              setDestination(loc.city);
                              setIsDestOpen(false);
                              setSearchDestText('');
                            }}
                            className={`p-2.5 hover:bg-slate-50 rounded-lg transition cursor-pointer flex flex-col gap-0.5 ${
                              destination === loc.city ? 'bg-blue-50 text-blue-700' : 'text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold">{loc.city}</span>
                              <span className="text-[10px] text-slate-400">{loc.state}</span>
                            </div>
                            <span className="text-[11px] text-slate-500 truncate">
                              {loc.majorStops.join(' • ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Date of Journey Selector */}
              <div 
                ref={calendarRef}
                className="md:col-span-3 bg-slate-50 hover:bg-slate-100/80 p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition relative cursor-pointer"
                onClick={() => {
                  setIsCalendarOpen(!isCalendarOpen);
                  setIsOriginOpen(false);
                  setIsDestOpen(false);
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    DATE OF JOURNEY
                  </span>
                  <span className="text-[9px] font-semibold text-slate-600 bg-slate-200/70 px-1.5 py-0.2 rounded">
                    {currentDisplay.dayName}
                  </span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-7 h-7 rounded-md bg-slate-200/80 text-slate-700 flex items-center justify-center mr-2 shrink-0">
                    <CalendarIcon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-sm font-bold text-slate-900 truncate">
                      {currentDisplay.dayNum} {currentDisplay.monthName} {currentDisplay.year}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium truncate">
                      {selectedDate === todayStr ? 'Today (Fast booking)' : selectedDate === tomorrowStr ? 'Tomorrow' : 'Scheduled Date'}
                    </div>
                  </div>
                </div>

                {/* Calendar Pop-Up Modal */}
                {isCalendarOpen && (
                  <div 
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
                    onClick={() => setIsCalendarOpen(false)}
                  >
                    <div 
                      onClick={e => e.stopPropagation()}
                      className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in zoom-in-95 duration-150"
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">Select Travel Date</span>
                        <button 
                          type="button" 
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quick Presets */}
                      <div className="py-2 border-b border-slate-100">
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(todayStr);
                              setIsCalendarOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                              selectedDate === todayStr
                                ? 'bg-[#D84E55] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>Today</span>
                            <span className="text-[9px] opacity-80">{formatDisplayDate(todayStr).dayName}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(tomorrowStr);
                              setIsCalendarOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                              selectedDate === tomorrowStr
                                ? 'bg-[#D84E55] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>Tomorrow</span>
                            <span className="text-[9px] opacity-80">{formatDisplayDate(tomorrowStr).dayName}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDate(weekendStr);
                              setIsCalendarOpen(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center cursor-pointer ${
                              selectedDate === weekendStr
                                ? 'bg-[#D84E55] text-white shadow-sm'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            <span>Weekend</span>
                            <span className="text-[9px] opacity-80">Saturday</span>
                          </button>
                        </div>
                      </div>

                      {/* Calendar Month Header */}
                      <div className="flex items-center justify-between my-2">
                        <h4 className="text-xs font-bold text-slate-900 capitalize">
                          {monthName}
                        </h4>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="w-7 h-7 rounded-md hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Weekday Labels */}
                      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
                        <span>Su</span>
                        <span>Mo</span>
                        <span>Tu</span>
                        <span>We</span>
                        <span>Th</span>
                        <span>Fr</span>
                        <span>Sa</span>
                      </div>

                      {/* Calendar Matrix */}
                      <div className="grid grid-cols-7 gap-1 text-center">
                        {Array.from({ length: firstDayIndex }).map((_, i) => (
                          <div key={`empty-${i}`} className="h-7" />
                        ))}
                        {Array.from({ length: daysInCalMonth }).map((_, i) => {
                          const day = i + 1;
                          const monthFormatted = String(calMonth + 1).padStart(2, '0');
                          const dayFormatted = String(day).padStart(2, '0');
                          const dateString = `${calYear}-${monthFormatted}-${dayFormatted}`;
                          const isSelected = selectedDate === dateString;
                          const isToday = todayStr === dateString;

                          return (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleSelectDay(day)}
                              className={`h-7 w-full rounded-md text-xs font-semibold transition flex items-center justify-center cursor-pointer ${
                                isSelected
                                  ? 'bg-[#D84E55] text-white font-bold shadow-sm'
                                  : isToday
                                  ? 'bg-red-50 text-[#D84E55] border border-red-200'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{currentDisplay.full}</span>
                        <button
                          type="button"
                          onClick={() => setIsCalendarOpen(false)}
                          className="text-[#D84E55] font-bold hover:underline cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search Action Button */}
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsOriginOpen(false);
                    setIsDestOpen(false);
                    setIsCalendarOpen(false);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <Search className="w-4 h-4" />
                  <span>SEARCH BUSES</span>
                </button>
              </div>
            </div>

            {/* Quick Offers Bar – dynamic from admin */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Tag className="w-3.5 h-3.5 text-[#D84E55]" />
                {liveOffers.length > 0 ? (
                  <span>
                    Use coupon{' '}
                    <strong className="text-[#D84E55] font-bold">{liveOffers[0].code}</strong>
                    {' '}for{' '}
                    {liveOffers[0].discountType === 'FLAT'
                      ? `flat ₹${liveOffers[0].discountValue} OFF`
                      : `${liveOffers[0].discountValue}% OFF`}
                  </span>
                ) : (
                  <span>Exclusive offers available — book now &amp; save!</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Free Cancellation
                </span>
                <span className="flex items-center gap-1 text-blue-700 font-medium hidden sm:inline-flex">
                  <Radio className="w-3 h-3 text-blue-600" /> Live Bus Tracking
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===========================================================
          OFFERS FOR YOU — Redbus-style, fully admin-controlled
          =========================================================== */}
      {liveOffers.length > 0 && (
        <div id="offers-section" className="space-y-3.5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D84E55]" />
              <span>Offers for you</span>
            </h2>
            <span className="text-xs text-slate-500 font-medium">Click any offer for Terms &amp; Conditions</span>
          </div>

          {/* Offer cards — horizontal scroll on mobile, grid on desktop */}
          <div className="flex gap-3.5 overflow-x-auto pb-1 sm:pb-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 snap-x snap-mandatory">
            {liveOffers.map(offer => {
              const validDate = offer.validUntil
                ? new Date(offer.validUntil + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : null;
              const categoryLabel = offer.category
                ? { BUS: 'Bus', TRAIN: 'Train', HOTEL: 'Hotel', ALL: 'All' }[offer.category] || 'Bus'
                : 'Bus';

              return (
                <div
                  key={offer.id}
                  className="shrink-0 snap-start w-64 sm:w-auto bg-[#FFF5F5] border border-rose-100 rounded-2xl overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group cursor-pointer flex flex-col"
                  onClick={() => setSelectedOfferModal(offer)}
                >
                  {/* Top: image area */}
                  <div className="relative h-[110px] bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-end overflow-hidden px-4">
                    {/* Decorative sunburst */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-10">
                      <div className="w-40 h-40 rounded-full border-[20px] border-rose-400" />
                    </div>

                    {/* Category badge */}
                    <span className="absolute top-3 left-3 text-[9px] font-black px-2 py-0.5 rounded bg-slate-800 text-white uppercase tracking-wider">
                      {categoryLabel}
                    </span>

                    {/* Image */}
                    {offer.imageUrl ? (
                      <img
                        src={offer.imageUrl}
                        alt={offer.title}
                        className="h-20 w-auto object-contain relative z-10 drop-shadow-md group-hover:scale-105 transition"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="h-20 w-24 flex items-center justify-center relative z-10">
                        <svg viewBox="0 0 200 100" className="h-full w-full drop-shadow-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <rect x="5" y="30" width="190" height="60" rx="12" fill="#D84E55"/>
                          <rect x="15" y="38" width="170" height="40" rx="8" fill="#E85C5C"/>
                          <rect x="25" y="44" width="30" height="20" rx="3" fill="#fff" fillOpacity="0.8"/>
                          <rect x="70" y="44" width="30" height="20" rx="3" fill="#fff" fillOpacity="0.8"/>
                          <rect x="115" y="44" width="30" height="20" rx="3" fill="#fff" fillOpacity="0.8"/>
                          <circle cx="45" cy="90" r="12" fill="#222"/>
                          <circle cx="45" cy="90" r="6" fill="#555"/>
                          <circle cx="150" cy="90" r="12" fill="#222"/>
                          <circle cx="150" cy="90" r="6" fill="#555"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Bottom: offer info */}
                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-extrabold text-slate-900 leading-snug group-hover:text-[#D84E55] transition">
                        {offer.savingsText || offer.title}
                      </p>
                      {validDate && (
                        <p className="text-[10px] text-slate-500 font-medium">Valid till {validDate}</p>
                      )}
                    </div>

                    {/* Coupon code row */}
                    <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-rose-100">
                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-slate-400 bg-white">
                        <Tag className="w-3 h-3 text-slate-500" />
                        <span className="font-mono font-black text-[11px] text-slate-800 uppercase">{offer.code}</span>
                      </div>
                      <span className="text-[10px] text-[#D84E55] font-bold underline flex items-center gap-0.5">
                        T&amp;C Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===========================================================
          OFFER DETAILS, TERMS & CONDITIONS & HOW TO USE POPUP MODAL
          =========================================================== */}
      {selectedOfferModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 space-y-0 relative max-h-[90vh] flex flex-col">
            {/* Modal Header Banner */}
            <div className="relative bg-gradient-to-r from-[#D84E55] via-[#C93F46] to-[#B83238] text-white p-5 sm:p-6">
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                {selectedOfferModal.imageUrl ? (
                  <img
                    src={selectedOfferModal.imageUrl}
                    alt={selectedOfferModal.title}
                    className="w-16 h-16 object-contain bg-white/10 rounded-2xl p-1.5 shrink-0 border border-white/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                    <Tag className="w-8 h-8 text-white" />
                  </div>
                )}

                <div className="space-y-1 pr-6">
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase tracking-wider">
                    {selectedOfferModal.category || 'BUS'} EXCLUSIVE OFFER
                  </div>
                  <h3 className="text-lg font-black leading-snug">{selectedOfferModal.title}</h3>
                  {selectedOfferModal.validUntil && (
                    <p className="text-xs text-red-100 font-medium">
                      Valid till {new Date(selectedOfferModal.validUntil + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body content (scrollable) */}
            <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1 text-xs">
              {/* Promo Coupon Code Box */}
              <div className="p-4 bg-rose-50/70 border-2 border-dashed border-rose-200 rounded-2xl flex items-center justify-between gap-3">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Use Coupon Code</div>
                  <div className="font-mono font-black text-xl text-slate-900 tracking-wider">
                    {selectedOfferModal.code}
                  </div>
                  <div className="text-[11px] text-[#D84E55] font-bold mt-0.5">
                    {selectedOfferModal.badgeTag || (selectedOfferModal.discountType === 'FLAT' ? `Flat ₹${selectedOfferModal.discountValue} OFF` : `${selectedOfferModal.discountValue}% OFF`)}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedOfferModal.code)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                    offerCopied === selectedOfferModal.code
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#D84E55] hover:bg-[#C33E44] text-white'
                  }`}
                >
                  {offerCopied === selectedOfferModal.code ? (
                    <><CheckCircle2 className="w-4 h-4" /> Copied!</>
                  ) : (
                    <><Tag className="w-4 h-4" /> Copy Code</>
                  )}
                </button>
              </div>

              {/* Offer Subtext / Description */}
              {selectedOfferModal.description && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-xs font-medium">
                  {selectedOfferModal.description}
                </div>
              )}

              {/* How to Use Section */}
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>How to Redeem this Offer</span>
                </h4>
                <ol className="space-y-2 pl-1">
                  {(selectedOfferModal.howToUse && selectedOfferModal.howToUse.length > 0
                    ? selectedOfferModal.howToUse
                    : [
                        'Search buses for your route and select your preferred seats.',
                        'Proceed to passenger details page.',
                        `Enter code ${selectedOfferModal.code} in the Promo Code section and click Apply.`,
                        'Enjoy instant discount on your total booking fare!'
                      ]
                  ).map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-slate-700 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-rose-100 text-[#D84E55] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Terms & Conditions Section */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <h4 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#D84E55]" />
                  <span>Terms &amp; Conditions</span>
                </h4>
                <ul className="space-y-2 pl-1">
                  {(selectedOfferModal.termsAndConditions && selectedOfferModal.termsAndConditions.length > 0
                    ? selectedOfferModal.termsAndConditions
                    : [
                        `Offer valid on minimum booking transaction value of ₹${selectedOfferModal.minBookingAmount || 0}.`,
                        'Discount applicable once per user account per booking.',
                        'Applicable on all eligible bus schedules on wABus.',
                        'Offer cannot be combined with any other promotional voucher.',
                        'wABus reserves the right to modify or discontinue the offer at any time.'
                      ]
                  ).map((tc, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-slate-600 leading-relaxed text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D84E55] shrink-0 mt-1.5" />
                      <span>{tc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOfferModal(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => {
                  handleCopyCode(selectedOfferModal.code);
                  setSelectedOfferModal(null);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="flex-1 py-2.5 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md transition cursor-pointer"
              >
                <span>Book Bus with {selectedOfferModal.code}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Filter and Schedule Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        {/* Left: Schedule type (All / Day / Night) */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-600 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter:</span>
          </span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                categoryFilter === 'ALL'
                  ? 'bg-white text-[#D84E55] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Buses
            </button>
            <button
              onClick={() => setCategoryFilter('DAY_COACH')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                categoryFilter === 'DAY_COACH'
                  ? 'bg-white text-[#D84E55] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Day Coach</span>
            </button>
            <button
              onClick={() => setCategoryFilter('NIGHT_COACH')}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                categoryFilter === 'NIGHT_COACH'
                  ? 'bg-white text-[#D84E55] shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Night Sleeper</span>
            </button>
          </div>
        </div>

        {/* Right: Bus Class Filter */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-medium">Bus Type:</span>
          <select
            value={busTypeFilter}
            onChange={e => setBusTypeFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#D84E55]"
          >
            <option value="ALL">All Types (Sleeper & Seater)</option>
            <option value="AC_SLEEPER_2_1">AC Sleeper (2+1)</option>
            <option value="VOLVO_MULTI_AXLE_2_2">Volvo Multi-Axle (2+2)</option>
            <option value="SCANIA_LUXURY_SLEEPER">Scania Luxury Sleeper</option>
          </select>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>{filteredTrips.length} Buses Available</span>
            <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Real-Time Sync Active
            </span>
          </h2>
          <span className="text-xs text-slate-500">
            from <strong className="text-slate-900">{origin}</strong> to <strong className="text-slate-900">{destination}</strong>
          </span>
        </div>

        {filteredTrips.length < trips.length && (
          <button
            type="button"
            onClick={() => {
              setOrigin('');
              setDestination('');
              setCategoryFilter('ALL');
              setBusTypeFilter('ALL');
            }}
            className="text-xs font-bold text-[#D84E55] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Show All Live Buses ({trips.length})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Realistic Bus Cards List */}
      <div className="space-y-3.5">
        {filteredTrips.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center space-y-3 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-red-50 text-[#D84E55] flex items-center justify-center mx-auto">
              <BusIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No buses found for this combination</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Showing <strong>{trips.length} total live buses</strong> in the network. Try viewing all buses or selecting popular corridors like <strong>Bhubaneswar ⇄ Puri</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => {
                  setOrigin('');
                  setDestination('');
                  setCategoryFilter('ALL');
                  setBusTypeFilter('ALL');
                }}
                className="text-xs px-4 py-2 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-xs cursor-pointer"
              >
                View All {trips.length} Network Buses
              </button>
              <button
                onClick={() => {
                  setOrigin('Bhubaneswar');
                  setDestination('Puri');
                  setCategoryFilter('ALL');
                  setBusTypeFilter('ALL');
                }}
                className="text-xs px-4 py-2 rounded-xl bg-[#D84E55] text-white font-bold hover:bg-[#C33E44] shadow-xs cursor-pointer"
              >
                Reset to Popular Route (Bhubaneswar ⇄ Puri)
              </button>
            </div>
          </div>
        ) : (
          filteredTrips.map((trip, idx) => {
            const isSelected = selectedTripId === trip.id;
            const hasSurge = featureFlags.enableSurgePricing && trip.surgeMultiplier > 1;
            const isNewlyAdded = trip.id.startsWith('trip-gen-');

            return (
              <motion.div
                key={trip.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(idx * 0.05, 0.3), ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.006, translateY: -2 }}
                className={`bg-white border transition-all duration-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md glass-card ${
                  isSelected
                    ? 'border-[#D84E55] ring-2 ring-red-500/20 bg-red-50/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Highlight Banner for Real-Time Admin Added Buses */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bus Registration Number */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-xs">
                      <BusIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{trip.bus?.registrationNumber || 'OD-02-AX-8910'}</span>
                    </span>

                    {/* From -> To Corridor */}
                    <span className="inline-flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                      <span>{trip.originCity}</span>
                      <span className="text-[#D84E55]">➔</span>
                      <span>{trip.destinationCity}</span>
                    </span>

                    {isNewlyAdded && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-[#D84E55] font-extrabold text-[10px] border border-red-200">
                        <Sparkles className="w-3 h-3 text-[#D84E55]" /> NEWLY ADDED REAL-TIME
                      </span>
                    )}
                  </div>

                  {/* Conductor Details Badge */}
                  <div className="flex items-center gap-2 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-lg text-[11px] text-purple-900 font-medium">
                    <span className="font-bold text-purple-950">👮 Conductor: {trip.bus?.conductorName || 'Bijay Nayak'}</span>
                    <span className="text-purple-700 font-mono font-bold">({trip.bus?.conductorId || 'COND-7890'})</span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left & Middle Details */}
                  <div className="space-y-2.5 flex-1">
                    {/* Operator & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        {trip.bus?.operatorName || 'OSRTC Volvo Premier'}
                      </h3>

                      {/* Green Star Rating */}
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#388E3C] text-white text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>{trip.bus?.operatorRating || 4.8}</span>
                      </div>

                      {/* Primo / Verified Badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        <Award className="w-3 h-3 text-blue-600" /> Primo Certified
                      </span>

                      {/* Coach & Model */}
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                        Coach: {trip.bus?.model || 'Executive AC Bus'}
                      </span>

                      {trip.category === 'NIGHT_COACH' ? (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                          <Moon className="w-3 h-3" /> Night Sleeper
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          <Sun className="w-3 h-3" /> Day Express
                        </span>
                      )}
                    </div>

                    {/* Schedule Timings: Start Time & Reach Time */}
                    <div className="flex items-center gap-4 sm:gap-8 pt-1">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Start Time (Arrival at Origin)</span>
                        <div className="text-lg sm:text-xl font-extrabold text-slate-900">{trip.departureTime}</div>
                        <div className="text-xs text-slate-600 font-semibold">{trip.originCity}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                          {(trip.boardingPoints || [])[0]?.name || 'Central Terminal'}
                        </div>
                      </div>

                      <div className="flex flex-col items-center">
                        <span className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
                          {trip.category === 'DAY_COACH' ? '1h 30m' : '1h 45m'}
                        </span>
                        <div className="w-20 sm:w-32 h-0.5 bg-slate-200 relative my-1.5">
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[#D84E55]"></div>
                        </div>
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded">
                          Non-Stop Express
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Reach Time (Arrival at Dest)</span>
                        <div className="text-lg sm:text-xl font-extrabold text-slate-900">{trip.arrivalTime}</div>
                        <div className="text-xs text-slate-600 font-semibold">{trip.destinationCity}</div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[130px]">
                          {(trip.droppingPoints || [])[0]?.name || 'Main Stand'}
                        </div>
                      </div>
                    </div>

                    {/* Amenities Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {(trip.bus?.amenities || ['AC', 'WiFi', 'Charging Point']).slice(0, 5).map((amenity, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Side: Fare & Select Button */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center border-t lg:border-t-0 border-slate-100 pt-3 lg:pt-0 gap-3 min-w-[160px]">
                    <div className="text-left lg:text-right">
                      {hasSurge && (
                        <div className="flex items-center lg:justify-end gap-1 text-[11px] font-semibold text-amber-600">
                          <Zap className="w-3 h-3 fill-amber-500" />
                          <span>Surge Applied (x{trip.surgeMultiplier})</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1.5 lg:justify-end">
                        <span className="text-xl sm:text-2xl font-black text-slate-900">₹{trip.effectiveFare}</span>
                        {hasSurge && (
                          <span className="text-xs text-slate-400 line-through">₹{trip.baseFare}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600 font-medium">
                        <strong className="text-[#388E3C] font-bold">{trip.availableSeatsCount}</strong> seats left
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectTrip(trip)}
                      className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-[#D84E55] hover:bg-[#C33E44] text-white hover:shadow-md'
                      }`}
                    >
                      <span>{isSelected ? 'Viewing Seats' : 'SELECT SEATS'}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};
