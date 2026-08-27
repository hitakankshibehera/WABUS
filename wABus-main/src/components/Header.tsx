import React, { useState, useRef, useEffect } from 'react';
import { Bus, Smartphone, ShieldCheck, Database, Zap, Sparkles, HelpCircle, PhoneCall, Radio, User, LogIn, UserPlus, LogOut, ChevronDown, BadgeCheck, Search, ArrowRight, X, Ticket } from 'lucide-react';
import { FeatureFlags, Booking } from '../types';
import { useAuth } from '../context/AuthContext';

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
          {/* wABus Iconic Logo & Name */}
          <div className="flex items-center space-x-3 cursor-pointer select-none" onClick={() => setActiveTab('PASSENGER')}>
            <div className="w-11 h-11 rounded-2xl bg-gray-900 overflow-hidden shadow-md border border-gray-200 transition-transform hover:scale-105 shrink-0 flex items-center justify-center">
              <img src="/logo.png" alt="Wonderlight Adventure WA Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-2xl tracking-tighter text-[#D84E55]">
                  wA<span className="text-gray-900 font-extrabold">Bus</span>
                </span>
                <span className="text-[9px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded bg-red-50 text-[#D84E55] border border-red-200">
                  India
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

              {/* Account Dropdown Popover */}
              {isAccountMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  {currentUser && (
                    <div className="px-4 py-2.5 border-b border-gray-100 space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-gray-900 truncate">{currentUser.name}</span>
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        </div>
                        {totalTicketsCount > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold border border-amber-200">
                            🎟️ {totalTicketsCount} Ticket{totalTicketsCount > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">{currentUser.email || currentUser.phone}</p>
                      <span className="inline-block text-[9px] uppercase font-extrabold px-1.5 py-0.2 rounded bg-red-50 text-[#D84E55] border border-red-200">
                        Active Role: {currentUser.role}
                      </span>
                    </div>
                  )}

                  <div className="py-1">
                    {currentUser && (
                      <>
                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            openProfileModal();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-bold text-[#D84E55] hover:bg-red-50 flex items-center gap-2 cursor-pointer border-b border-gray-100"
                        >
                          <Ticket className="w-4 h-4 text-[#D84E55]" />
                          <span>View Your Journey & QR Passes</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsAccountMenuOpen(false);
                            openProfileModal();
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                        >
                          <User className="w-4 h-4 text-gray-400" />
                          <span>View My Account</span>
                        </button>
                      </>
                    )}

                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      Switch or Sign In As:
                    </div>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openAuthModal('PASSENGER', 'SIGN_IN');
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-blue-600" />
                      <span>Passenger Sign In / Sign Up</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        openAuthModal('CONDUCTOR', 'SIGN_IN');
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Conductor Sign In / Sign Up</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsAccountMenuOpen(false);
                        setActiveTab('ADMIN');
                        openAuthModal('ADMIN', 'SIGN_IN');
                      }}
                      className="w-full text-left px-4 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                      <span>Master Admin Sign In / Sign Up</span>
                    </button>
                  </div>

                  {currentUser && (
                    <div className="pt-1 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-bold text-[#D84E55] hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-[#D84E55]" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
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
      </div>
    </header>
  );
};
