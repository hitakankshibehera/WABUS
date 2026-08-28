import React, { useState, useRef, useEffect } from 'react';
import { 
  Bus, Smartphone, ShieldCheck, Database, Zap, Sparkles, HelpCircle, 
  PhoneCall, Radio, User, LogIn, UserPlus, LogOut, ChevronDown, BadgeCheck, 
  Search, ArrowRight, X, Ticket, Wallet, Gift, Tag, Info, List, ChevronRight 
} from 'lucide-react';
import { FeatureFlags, Booking } from '../types';
import { useAuth } from '../context/AuthContext';
import { WalletModal, GiftCardModal, AboutModal, CancelTicketModal } from './Account/AccountModals';

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
  const [quickSearch, setQuickSearch] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals triggered from Account Menu
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isGiftCardOpen, setIsGiftCardOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isCancelTicketOpen, setIsCancelTicketOpen] = useState(false);

  const totalTicketsCount = bookings.reduce((sum, b) => sum + b.passengers.length, 0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut listener: Press '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = quickSearch.trim().toLowerCase();
    if (query === '/admin' || query === 'admin' || query === '/admin-portal' || query === 'master admin') {
      setActiveTab('ADMIN');
      setQuickSearch('');
      setIsSearchOpen(false);
    } else if (query === '/conductor' || query === 'conductor') {
      setActiveTab('CONDUCTOR');
      setQuickSearch('');
      setIsSearchOpen(false);
    } else if (query === '/architecture' || query === 'architecture' || query === 'ddl') {
      setActiveTab('ARCHITECTURE');
      setQuickSearch('');
      setIsSearchOpen(false);
    } else {
      setActiveTab('PASSENGER');
      setQuickSearch('');
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      {/* Dynamic Emergency / Maintenance Banner from Remote Config */}
      {featureFlags.maintenanceMode && (
        <div className="bg-[#D84E55] px-4 py-2 text-center text-xs font-semibold tracking-wide text-white flex items-center justify-center gap-2">
          <span>⚠️ SYSTEM ALERT: Scheduled Maintenance Mode is currently active in Remote Config. New bookings may experience delay.</span>
        </div>
      )}
      {featureFlags.emergencyAlertBanner && (
        <div className="bg-[#B83E44] px-4 py-1.5 text-center text-xs font-semibold tracking-wide text-white">
          📢 {featureFlags.emergencyAlertBanner}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* wABus Iconic Logo & Name with Floating Micro-Animation */}
          <div className="flex items-center space-x-3 cursor-pointer select-none group" onClick={() => setActiveTab('PASSENGER')}>
            <div className="w-11 h-11 rounded-2xl bg-gray-900 overflow-hidden shadow-md border border-gray-200 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shrink-0 flex items-center justify-center animate-float-slow">
              <img src="/logo.png" alt="Wonderlight Adventure WA Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl tracking-tighter text-gray-900 transition-colors group-hover:text-[#D84E55]">
                  Bus<span className="text-[#D84E55] font-extrabold">ivo</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-[#D84E55] border border-red-200 flex items-center gap-1 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D84E55] animate-ping"></span>
                  <span>India</span>
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium -mt-1 hidden sm:block">Wonderlight Adventure Co. Ecosystem</p>
            </div>
          </div>

          {/* Quick Route & /admin Search Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-6">
            <form onSubmit={handleQuickSearchSubmit} className="relative w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                placeholder="Search or type /admin..."
                className="w-full pl-9 pr-14 py-1.5 bg-gray-50 hover:bg-gray-100/80 focus:bg-white border border-gray-200 focus:border-[#D84E55] rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none transition"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-400">
                /
              </span>
              {quickSearch.trim().toLowerCase().includes('admin') && (
                <div 
                  onClick={() => {
                    setActiveTab('ADMIN');
                    setQuickSearch('');
                  }}
                  className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-red-200 rounded-xl shadow-lg p-2.5 z-50 text-left cursor-pointer hover:bg-red-50 transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D84E55]" />
                    <span className="text-xs font-bold text-gray-900">Open Master Admin Panel</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#D84E55] bg-red-100/60 px-1.5 py-0.5 rounded">
                    /admin
                  </span>
                </div>
              )}
            </form>
          </div>

          {/* Stakeholder Portal Switcher (Clean Consumer wABus Top Nav) */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('PASSENGER')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'PASSENGER'
                  ? 'bg-red-50 text-[#D84E55] border border-red-200 shadow-xs'
                  : 'text-gray-600 hover:text-[#D84E55] hover:bg-gray-50'
              }`}
            >
              <Bus className={`w-4 h-4 ${activeTab === 'PASSENGER' ? 'text-[#D84E55]' : 'text-gray-500'}`} />
              <span>Bus Tickets</span>
            </button>

            <button
              onClick={() => setActiveTab('CONDUCTOR')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                activeTab === 'CONDUCTOR'
                  ? 'bg-red-50 text-[#D84E55] border border-red-200 shadow-xs'
                  : 'text-gray-600 hover:text-[#D84E55] hover:bg-gray-50'
              }`}
            >
              <Smartphone className={`w-4 h-4 ${activeTab === 'CONDUCTOR' ? 'text-[#D84E55]' : 'text-gray-500'}`} />
              <span>Conductor App</span>
            </button>

            {/* Master Admin tab is ONLY visible when on /admin or when role is ADMIN */}
            {(activeTab === 'ADMIN' || currentUser?.role === 'ADMIN') && (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activeTab === 'ADMIN'
                    ? 'bg-red-50 text-[#D84E55] border border-red-200 shadow-xs'
                    : 'text-gray-600 hover:text-[#D84E55] hover:bg-gray-50'
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${activeTab === 'ADMIN' ? 'text-[#D84E55]' : 'text-gray-500'}`} />
                <span>Master Admin</span>
              </button>
            )}

            {/* Architecture DDL tab is ONLY visible when explicitly on /architecture */}
            {activeTab === 'ARCHITECTURE' && (
              <button
                onClick={() => setActiveTab('ARCHITECTURE')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  activeTab === 'ARCHITECTURE'
                    ? 'bg-red-50 text-[#D84E55] border border-red-200 shadow-xs'
                    : 'text-gray-600 hover:text-[#D84E55] hover:bg-gray-50'
                }`}
              >
                <Database className={`w-4 h-4 ${activeTab === 'ARCHITECTURE' ? 'text-[#D84E55]' : 'text-gray-500'}`} />
                <span>PostgreSQL & Redis DDL</span>
              </button>
            )}
          </nav>

          {/* Quick Engine Status & User Account Dropdown */}
          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span className="font-bold text-[11px]">Redis TTL Active</span>
            </div>

            {/* 24x7 Help & Support Button */}
            {onOpenSupport && (
              <button
                onClick={onOpenSupport}
                className="hidden sm:flex items-center gap-1.5 py-1.5 px-3 rounded-2xl border border-red-200 bg-red-50 hover:bg-red-100 text-[#D84E55] font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#D84E55]" />
                <span>24x7 Support</span>
              </button>
            )}

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition cursor-pointer"
              title="Search routes or /admin"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* User Account / Sign In Dropdown Button */}
            <div className="relative" ref={accountMenuRef}>
              {currentUser ? (
                <button
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center gap-2 py-1.5 px-3 rounded-2xl border border-gray-200 hover:border-[#D84E55] bg-gray-50 hover:bg-white text-gray-800 transition cursor-pointer shadow-2xs"
                >
                  {currentUser.avatarUrl ? (
                    <img 
                      src={currentUser.avatarUrl} 
                      alt={currentUser.name} 
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover border border-[#D84E55]"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#D84E55] text-white flex items-center justify-center text-xs font-bold">
                      {currentUser.name.charAt(0)}
                    </div>
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-gray-900 block leading-tight max-w-[100px] truncate">
                        {currentUser.name}
                      </span>
                      {totalTicketsCount > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-50 text-[#D84E55] font-black border border-red-200">
                          {totalTicketsCount} Ticket{totalTicketsCount > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#D84E55] font-semibold block leading-none">
                      {currentUser.role === 'PASSENGER' ? 'Passenger Account' : currentUser.role === 'CONDUCTOR' ? 'Conductor Staff' : 'Admin'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-500 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => openAuthModal('PASSENGER', 'SIGN_IN')}
                  className="flex items-center gap-1.5 py-2 px-4 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-bold text-xs shadow-xs hover:shadow-md transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In / Register</span>
                </button>
              )}

              {/* Account Dropdown Popover (Redbus Style matching screenshot) */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-5 z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800 space-y-4 max-h-[85vh] overflow-y-auto">
                  {/* Header Block */}
                  {!currentUser ? (
                    <div className="space-y-3 pb-3 border-b border-gray-100">
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        Log in to manage your bookings
                      </h3>
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openAuthModal('PASSENGER', 'SIGN_IN');
                        }}
                        className="w-full py-3 rounded-full bg-[#D84E55] hover:bg-[#C33E44] text-white font-black text-xs uppercase tracking-wider shadow-md transition cursor-pointer text-center block"
                      >
                        Log in
                      </button>
                      <p className="text-xs text-slate-500 text-center">
                        Don’t have an account?{' '}
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            openAuthModal('PASSENGER', 'SIGN_UP');
                          }}
                          className="text-slate-900 font-bold underline cursor-pointer hover:text-[#D84E55]"
                        >
                          Sign up
                        </button>
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-rose-50/60 border border-rose-100 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {currentUser.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-9 h-9 rounded-full object-cover border-2 border-[#D84E55] shrink-0" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#D84E55] text-white flex items-center justify-center font-black text-sm shrink-0">
                              {currentUser.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 text-xs flex items-center gap-1 truncate">
                              <span className="truncate">{currentUser.name}</span>
                              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            </div>
                            <p className="text-[10px] text-slate-500 truncate max-w-[130px]">{currentUser.email || currentUser.phone}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            logout();
                          }}
                          className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-rose-50 text-[#D84E55] font-bold text-[11px] transition cursor-pointer shrink-0"
                          title="Log Out"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Section 1: My details */}
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 px-1">My details</h4>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openProfileModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <List className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Bookings</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          openProfileModal();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Personal information</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Section 2: Payments */}
                  <div className="space-y-1 pt-1 border-t border-gray-100">
                    <h4 className="text-xs font-black text-slate-900 px-1">Payments</h4>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsWalletOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>wABus Wallet</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsGiftCardOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Gift className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Redeem gift card</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Section 3: More */}
                  <div className="space-y-1 pt-1 border-t border-gray-100">
                    <h4 className="text-xs font-black text-slate-900 px-1">More</h4>
                    <div className="space-y-0.5">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setActiveTab('PASSENGER');
                          setTimeout(() => {
                            const offersEl = document.getElementById('offers-section');
                            if (offersEl) offersEl.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-[#D84E55] transition cursor-pointer text-xs font-bold"
                      >
                        <div className="flex items-center gap-3">
                          <Tag className="w-4 h-4 text-[#D84E55] shrink-0" />
                          <span>Offers</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#D84E55]" />
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsAboutOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Info className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Know about wABus</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          if (onOpenSupport) onOpenSupport();
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Help</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>

                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setIsCancelTicketOpen(true);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 text-slate-700 hover:text-slate-900 transition cursor-pointer text-xs font-semibold"
                      >
                        <div className="flex items-center gap-3">
                          <Ticket className="w-4 h-4 text-slate-700 shrink-0" />
                          <span>Cancel Ticket</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>

                  {/* Section 4: Role Portals */}
                  <div className="pt-2 border-t border-gray-100 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-1">Platform Portals</span>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setActiveTab('CONDUCTOR');
                        }}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold transition cursor-pointer text-center border border-amber-200"
                      >
                        Conductor Staff
                      </button>
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          setActiveTab('ADMIN');
                        }}
                        className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-900 text-[11px] font-bold transition cursor-pointer text-center border border-[#D84E55]/30"
                      >
                        Master Admin
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Expansion */}
        {isSearchOpen && (
          <div className="lg:hidden pb-3 pt-1">
            <form onSubmit={handleQuickSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                placeholder="Search or type /admin..."
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-[#D84E55]"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
              {quickSearch.trim().toLowerCase().includes('admin') && (
                <div 
                  onClick={() => {
                    setActiveTab('ADMIN');
                    setQuickSearch('');
                    setIsSearchOpen(false);
                  }}
                  className="mt-1 bg-white border border-red-200 rounded-xl shadow-md p-2.5 text-left cursor-pointer hover:bg-red-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D84E55]" />
                    <span className="text-xs font-bold text-gray-900">Open Master Admin Panel</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-[#D84E55] bg-red-100/60 px-1.5 py-0.5 rounded">
                    /admin
                  </span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Mobile Navigation Row (Clean Consumer Nav) */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-gray-100 gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('PASSENGER')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'PASSENGER' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Bus Tickets
          </button>
          
          {currentUser && (
            <button
              onClick={openProfileModal}
              className="flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap bg-red-50 text-[#D84E55] border border-red-200"
            >
              🎟️ Journeys
            </button>
          )}

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap bg-gray-100 text-gray-800"
            >
              ❓ Help
            </button>
          )}

          <button
            onClick={() => setActiveTab('CONDUCTOR')}
            className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap ${
              activeTab === 'CONDUCTOR' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Conductor
          </button>
          {(activeTab === 'ADMIN' || currentUser?.role === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('ADMIN')}
              className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'ADMIN' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Admin
            </button>
          )}
          {activeTab === 'ARCHITECTURE' && (
            <button
              onClick={() => setActiveTab('ARCHITECTURE')}
              className={`flex-1 py-1.5 px-2 text-center text-xs font-bold rounded-lg transition whitespace-nowrap ${
                activeTab === 'ARCHITECTURE' ? 'bg-[#D84E55] text-white shadow-xs' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              DDL Schema
            </button>
          )}
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
      </div>
    </header>
  );
};
