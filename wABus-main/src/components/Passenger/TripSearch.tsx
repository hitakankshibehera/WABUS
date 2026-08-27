import React, { useState, useRef, useEffect } from 'react';
import { Trip, TripCategory, CoachType, FeatureFlags } from '../../types';
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

  // Filtered stop locations
  const filteredOriginLocations = BUS_STOP_LOCATIONS.filter(loc =>
    loc.city.toLowerCase().includes(searchOriginText.toLowerCase()) ||
    loc.majorStops.some(s => s.toLowerCase().includes(searchOriginText.toLowerCase()))
  );

  const filteredDestLocations = BUS_STOP_LOCATIONS.filter(loc =>
    loc.city.toLowerCase().includes(searchDestText.toLowerCase()) ||
    loc.majorStops.some(s => s.toLowerCase().includes(searchDestText.toLowerCase()))
  );

  const filteredTrips = trips.filter(t => {
    const matchOrigin = origin ? t.originCity.toLowerCase().includes(origin.toLowerCase()) : true;
    const matchDest = destination ? t.destinationCity.toLowerCase().includes(destination.toLowerCase()) : true;
    const matchCat = categoryFilter === 'ALL' || t.category === categoryFilter;
    const matchType = busTypeFilter === 'ALL' || t.bus.busType === busTypeFilter;
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

                {/* Origin Dropdown Popover */}
                {isOriginOpen && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="fixed sm:absolute inset-x-4 top-28 sm:inset-x-auto sm:top-full sm:left-0 mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Select Boarding Stop</span>
                      <button 
                        type="button" 
                        onClick={() => setIsOriginOpen(false)}
                        className="text-slate-400 hover:text-slate-600 sm:hidden p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchOriginText}
                          onChange={e => setSearchOriginText(e.target.value)}
                          placeholder="Search city or bus stop..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#D84E55] font-medium"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 py-1">
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

                {/* Destination Dropdown Popover */}
                {isDestOpen && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="fixed sm:absolute inset-x-4 top-28 sm:inset-x-auto sm:top-full sm:left-0 mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Select Dropping Stop</span>
                      <button 
                        type="button" 
                        onClick={() => setIsDestOpen(false)}
                        className="text-slate-400 hover:text-slate-600 sm:hidden p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="p-2 border-b border-slate-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={searchDestText}
                          onChange={e => setSearchDestText(e.target.value)}
                          placeholder="Search city or destination stop..."
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#D84E55] font-medium"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 py-1">
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

                {/* Calendar Dropdown Popover */}
                {isCalendarOpen && (
                  <div 
                    onClick={e => e.stopPropagation()}
                    className="fixed sm:absolute inset-x-4 top-28 sm:inset-x-auto sm:top-full sm:right-0 sm:left-auto mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-900">Select Travel Date</span>
                      <button 
                        type="button" 
                        onClick={() => setIsCalendarOpen(false)}
                        className="text-slate-400 hover:text-slate-600 sm:hidden p-1"
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

            {/* Quick Offers Bar */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Tag className="w-3.5 h-3.5 text-[#D84E55]" />
                <span>Use coupon <strong className="text-[#D84E55] font-bold">BHARAT100</strong> for flat ₹100 OFF</span>
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
          filteredTrips.map(trip => {
            const isSelected = selectedTripId === trip.id;
            const hasSurge = featureFlags.enableSurgePricing && trip.surgeMultiplier > 1;
            const isNewlyAdded = trip.id.startsWith('trip-gen-');

            return (
              <div
                key={trip.id}
                className={`bg-white border transition-all duration-150 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-sm ${
                  isSelected
                    ? 'border-[#D84E55] ring-2 ring-red-500/20'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Highlight Banner for Real-Time Admin Added Buses */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Bus Registration Number */}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white font-mono font-bold text-xs tracking-wider shadow-xs">
                      <BusIcon className="w-3.5 h-3.5 text-amber-400" />
                      <span>{trip.bus.registrationNumber}</span>
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
                    <span className="font-bold text-purple-950">👮 Conductor: {trip.bus.conductorName}</span>
                    <span className="text-purple-700 font-mono font-bold">({trip.bus.conductorId || 'COND-7890'})</span>
                    <span className="text-purple-600 hidden sm:inline">&bull; 📞 {trip.bus.conductorPhone}</span>
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left & Middle Details */}
                  <div className="space-y-2.5 flex-1">
                    {/* Operator & Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-extrabold text-slate-900 tracking-tight">
                        {trip.bus.operatorName}
                      </h3>

                      {/* Green Star Rating */}
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#388E3C] text-white text-[11px] font-bold">
                        <Star className="w-3 h-3 fill-white text-white" />
                        <span>{trip.bus.operatorRating}</span>
                      </div>

                      {/* Primo / Verified Badge */}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        <Award className="w-3 h-3 text-blue-600" /> Primo Certified
                      </span>

                      {/* Coach & Model */}
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 font-bold">
                        Coach: {trip.bus.model}
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
                          {trip.boardingPoints[0]?.name || 'Central Terminal'}
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
                          {trip.droppingPoints[0]?.name || 'Main Stand'}
                        </div>
                      </div>
                    </div>

                    {/* Amenities Badges Row */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      {trip.bus.amenities.slice(0, 5).map((amenity, idx) => (
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
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
