import React, { useState, useRef, useEffect } from 'react';
import { 
  Bus, 
  Sparkles, 
  HelpCircle, 
  Radio, 
  User, 
  LogIn, 
  LogOut, 
  ChevronDown, 
  BadgeCheck, 
  Search, 
  Ticket, 
  Wallet, 
  Gift, 
  Tag, 
  Info, 
  List, 
  ChevronRight,
  Bot, 
  Bell,
  Users,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { FeatureFlags, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { WalletModal, GiftCardModal, AboutModal, CancelTicketModal } from './Account/AccountModals';
import { LiveBusTracker } from './Passenger/LiveBusTracker';
import { MargPointsModal } from './Passenger/MargPointsModal';
import { CustomerDashboardModal } from './Passenger/CustomerDashboardModal';
import { MargPathAIAssistant } from './Passenger/MargPathAIAssistant';
import { JourneySafetyModal } from './Passenger/JourneySafetyModal';

export type ActiveTab = 'PASSENGER' | 'CONDUCTOR' | 'ADMIN' | 'ARCHITECTURE';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  featureFlags: FeatureFlags;
  bookings?: Booking[];
  onOpenQuickTicket?: () => void;
  onOpenSupport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  featureFlags,
  bookings = [],
  onOpenSupport,
}) => {
  const { currentUser, openAuthModal, openProfileModal, logout } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isHeaderTrackerOpen, setIsHeaderTrackerOpen] = useState(false);
  const [isNotificationPopupOpen, setIsNotificationPopupOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Modals triggered from Account Menu & Header
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGiftCardOpen, setIsGiftCardOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCancelTicketOpen, setIsCancelTicketOpen] = useState(false);
  const [isMargPointsOpen, setIsMargPointsOpen] = useState(false);
  const [margPointsTab, setMargPointsTab] = useState<'POINTS' | 'REFERRAL'>('POINTS');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationPopupOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'MP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Find user's active booking for quick tracker
  const userActiveBooking = bookings.find(b => {
    if (b.checkInStatus === 'CANCELLED') return false;
    if (!currentUser) return false;
    const cleanEmail = (currentUser.email || '').trim().toLowerCase();
    return (b.userId && b.userId === currentUser.id) || 
           (b.contactEmail && b.contactEmail.trim().toLowerCase() === cleanEmail);
  }) || (currentUser ? bookings.find(b => b.pnr === 'MP100284') : null);

  const handleNavigateHome = () => {
    setActiveTab('PASSENGER');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleScrollToSearch = () => {
    setActiveTab('PASSENGER');
    setTimeout(() => {
      const searchEl = document.getElementById('bus-search-bar');
      if (searchEl) {
        searchEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 50);
  };

  const handleScrollToOffers = () => {
    setActiveTab('PASSENGER');
    setTimeout(() => {
      const offersEl = document.getElementById('offers-section');
      if (offersEl) {
        offersEl.scrollIntoView({ behavior: 'smooth' });
      } else {
        handleScrollToSearch();
      }
    }, 100);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Remote Config Alert Banner */}
      {featureFlags.maintenanceMode && (
        <div className="bg-[#D84E55] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2">
          <span>⚠️ Scheduled Maintenance Notice: Real-time bookings continue normally with high priority.</span>
        </div>
      )}

      {/* Main Commercial Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          
          {/* MARGPATH Iconic Brand Logo */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none group" 
            onClick={handleNavigateHome}
          >
            <div className="w-11 h-11 rounded-2xl bg-white overflow-hidden shadow-xs border border-gray-200 transition-all duration-300 group-hover:scale-105 shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="MargPath Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl tracking-tight text-slate-900 transition-colors group-hover:text-[#D84E55]">
                  Marg<span className="text-[#D84E55] font-extrabold">Path</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-[#D84E55] border border-red-200 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D84E55] animate-ping"></span>
                  <span>India</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium -mt-1 hidden sm:block">Explore. Connect. Experience.</p>
            </div>
          </div>

          {/* Clean Commercial Route Search Input */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
            <div 
              onClick={handleScrollToSearch}
              className="relative w-full cursor-pointer group"
            >
              <Search className="w-4 h-4 text-gray-400 group-hover:text-[#D84E55] absolute left-3.5 top-1/2 -translate-y-1/2 transition" />
              <input
                type="text"
                readOnly
                placeholder="Search bus routes, destinations..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 cursor-pointer transition shadow-2xs"
              />
            </div>
          </div>

          {/* Smart Customer Navigation Links (Requirement 1 & 11) */}
          <nav className="hidden md:flex items-center space-x-1">
            {/* Home */}
            <button
              type="button"
              onClick={handleNavigateHome}
              className="px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#D84E55] hover:bg-gray-50 transition cursor-pointer"
            >
              Home
            </button>

            {/* Book Bus */}
            <button
              type="button"
              onClick={handleScrollToSearch}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#D84E55] hover:bg-gray-50 transition cursor-pointer"
            >
              <Bus className="w-3.5 h-3.5 text-[#D84E55]" />
              <span>Book Bus</span>
            </button>

            {/* Post-Login Smart Links: My Trips & Track */}
            {currentUser && (
              <>
                <button
                  type="button"
                  onClick={openProfileModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#D84E55] hover:bg-gray-50 transition cursor-pointer"
                >
                  <Ticket className="w-3.5 h-3.5 text-blue-600" />
                  <span>My Trips</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsHeaderTrackerOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition cursor-pointer shadow-2xs"
                  title="Track your booked bus in real-time"
                >
                  <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  <span>Track Journey</span>
                </button>
              </>
            )}

            {/* Offers */}
            <button
              type="button"
              onClick={handleScrollToOffers}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#D84E55] hover:bg-gray-50 transition cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Offers</span>
            </button>

            {/* Help / Support */}
            {onOpenSupport && (
              <button
                type="button"
                onClick={onOpenSupport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:text-[#D84E55] hover:bg-gray-50 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Help</span>
              </button>
            )}

            {/* AI Assistant Pill */}
            <button
              type="button"
              onClick={() => setIsAIAssistantOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition cursor-pointer shadow-2xs"
              title="Ask AI Trip Assistant"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span>AI Copilot</span>
            </button>
          </nav>

          {/* Right Header Controls: Notification Bell & Profile Avatar */}
          <div className="flex items-center gap-2.5">
            
            {/* Notification Bell (Visible when logged in) */}
            {currentUser && (
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotificationPopupOpen(!isNotificationPopupOpen)}
                  className="w-9 h-9 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 flex items-center justify-center text-gray-700 transition cursor-pointer relative"
                  title="Journey Notifications"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4 text-gray-600" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D84E55]" />
                </button>

                {/* Notifications Dropdown Popover */}
                {isNotificationPopupOpen && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                        <Bell className="w-3.5 h-3.5 text-[#D84E55]" />
                        <span>Notifications</span>
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        Live
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="p-2.5 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Bus MP-204 is on schedule</span>
                          <span className="text-[10px] text-slate-400">Just now</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Approaching Pipili Square Toll (4.8 km to your boarding point).
                        </p>
                      </div>

                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900">Weekend Puri Special</span>
                          <span className="text-[10px] text-slate-400">2h ago</span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Use code BHARAT100 to get ₹100 flat discount on your next ride.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Account / Profile Dropdown Button */}
            <div className="relative" ref={accountMenuRef}>
              {currentUser ? (
                /* Logged-In Customer Avatar with Initials (e.g. RK, RS) */
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-2.5 sm:px-3 rounded-2xl border border-gray-200 hover:border-[#D84E55] bg-gray-50 hover:bg-white text-gray-800 transition cursor-pointer shadow-2xs"
                  aria-label="User Account Menu"
                >
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border-2 border-[#D84E55]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#D84E55] to-orange-500 text-white flex items-center justify-center text-xs font-black tracking-wider">
                      {getInitials(currentUser.name)}
                    </div>
                  )}

                  <div className="text-left hidden sm:block">
                    <span className="text-xs font-extrabold text-gray-900 block leading-tight max-w-[110px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block leading-none truncate max-w-[110px]">
                      {currentUser.email || currentUser.phone}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-0.5" />
                </button>
              ) : (
                /* Logged-Out Commercial Login / Sign Up CTA */
                <button
                  type="button"
                  onClick={() => openAuthModal('PASSENGER', 'SIGN_IN')}
                  className="flex items-center gap-2 py-2 px-4 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs shadow-xs hover:shadow-md transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login / Sign Up</span>
                </button>
              )}

              {/* Customer Account Popover Menu (Requirement 5) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-76 bg-white rounded-3xl shadow-2xl border border-gray-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 space-y-3">
                  
                  {/* Customer Information Header */}
                  {currentUser && (
                    <div className="p-3 bg-gradient-to-r from-rose-50/70 to-orange-50/40 border border-rose-100 rounded-2xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {currentUser.avatarUrl ? (
                          <img 
                            src={currentUser.avatarUrl} 
                            alt={currentUser.name} 
                            className="w-10 h-10 rounded-full object-cover border-2 border-[#D84E55] shrink-0" 
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#D84E55] to-orange-500 text-white flex items-center justify-center font-black text-sm shrink-0">
                            {getInitials(currentUser.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1 truncate">
                            <span className="truncate">{currentUser.name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">{currentUser.email || currentUser.phone}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          logout();
                        }}
                        className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 text-[#D84E55] transition cursor-pointer shrink-0"
                        title="Logout"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Customer Account Navigation Items */}
                  <div className="space-y-0.5 pt-1">
                    {/* My Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <User className="w-4 h-4 text-slate-600" />
                        <span>My Profile</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* My Bookings */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <List className="w-4 h-4 text-slate-600" />
                        <span>My Bookings</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* My Tickets */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Ticket className="w-4 h-4 text-slate-600" />
                        <span>My Tickets</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* My Rewards */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setMargPointsTab('POINTS');
                        setIsMargPointsOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/70 text-amber-900 transition cursor-pointer text-xs font-bold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>My Rewards (450 pts)</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-amber-500" />
                    </button>

                    {/* Refer & Earn (Share Link) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setMargPointsTab('REFERRAL');
                        setIsMargPointsOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-orange-50/70 text-orange-950 transition cursor-pointer text-xs font-bold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Gift className="w-4 h-4 text-orange-500" />
                        <span>Refer & Earn (Share Link)</span>
                      </div>
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-extrabold">₹100</span>
                    </button>

                    {/* Saved Passengers */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openProfileModal();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-slate-600" />
                        <span>Saved Passengers</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>

                    {/* Notifications */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setIsNotificationPopupOpen(true);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-slate-600" />
                        <span>Notifications</span>
                      </div>
                      <span className="text-[10px] bg-red-50 text-[#D84E55] px-2 py-0.5 rounded-full font-bold">New</span>
                    </button>

                    {/* Help & Support */}
                    {onOpenSupport && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          onOpenSupport();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-2.5">
                          <HelpCircle className="w-4 h-4 text-slate-600" />
                          <span>Help & Support</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    )}

                    {/* Logout */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-rose-50 text-[#D84E55] transition cursor-pointer text-xs font-bold pt-2 border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-[#D84E55]" />
                        <span>Logout</span>
                      </div>
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

        </div>
      </div>

      {/* Render Modals triggered from Account Menu */}
      <WalletModal isOpen={isWalletOpen} onClose={() => setIsWalletOpen(false)} />
      <GiftCardModal isOpen={isGiftCardOpen} onClose={() => setIsGiftCardOpen(false)} />
      <AboutModal isOpen={isAboutOpen} onClose={() => setIsAboutOpen(false)} />
      <CancelTicketModal 
        isOpen={isCancelTicketOpen} 
        onClose={() => setIsCancelTicketOpen(false)} 
        bookings={bookings}
      />
      {/* Live Bus Tracker Modal */}
      {isHeaderTrackerOpen && (
        <LiveBusTracker
          bookingId={userActiveBooking?.pnr || 'MP100284'}
          onClose={() => setIsHeaderTrackerOpen(false)}
        />
      )}

      {/* MargPoints Modal */}
      {isMargPointsOpen && (
        <MargPointsModal 
          initialTab={margPointsTab}
          onClose={() => setIsMargPointsOpen(false)} 
        />
      )}

      {/* Customer Dashboard Modal */}
      {isDashboardOpen && (
        <CustomerDashboardModal onClose={() => setIsDashboardOpen(false)} />
      )}

      {/* MargPath AI Assistant Modal */}
      {isAIAssistantOpen && (
        <MargPathAIAssistant onClose={() => setIsAIAssistantOpen(false)} />
      )}

      {/* Journey Safety Modal */}
      {isSafetyModalOpen && (
        <JourneySafetyModal onClose={() => setIsSafetyModalOpen(false)} />
      )}
    </header>
  );
};
