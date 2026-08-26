import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  LogOut, 
  Ticket, 
  Sparkles, 
  Calendar, 
  Smartphone, 
  BadgeCheck, 
  Bus,
  CheckCircle2
} from 'lucide-react';

export const PassengerProfileModal: React.FC<{
  onOpenTicketLookup?: () => void;
}> = ({ onOpenTicketLookup }) => {
  const { currentUser, isProfileModalOpen, closeProfileModal, logout, openAuthModal } = useAuth();

  if (!isProfileModalOpen || !currentUser) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Profile Card Header */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#B83E44] text-white p-6 relative">
          <button
            onClick={closeProfileModal}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-white/60"
              />
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-white text-[#D84E55] flex items-center justify-center font-black text-xl shadow-md border-2 border-white/40">
                {currentUser.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-lg font-black text-white">{currentUser.name}</h3>
                <BadgeCheck className="w-4 h-4 text-white fill-white text-[#D84E55]" />
              </div>
              <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/20 text-white border border-white/30 mt-0.5">
                {currentUser.role === 'PASSENGER' ? 'Verified Passenger' : currentUser.role === 'CONDUCTOR' ? 'Certified Conductor' : 'Master Administrator'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 space-y-5 text-gray-800">
          <div className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-gray-400" /> Phone:
              </span>
              <span className="font-bold text-gray-900">{currentUser.phone}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gray-400" /> Email:
              </span>
              <span className="font-bold text-gray-900">{currentUser.email}</span>
            </div>

            {currentUser.employeeId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-gray-400" /> Employee ID:
                </span>
                <span className="font-bold text-[#D84E55]">{currentUser.employeeId}</span>
              </div>
            )}

            {currentUser.assignedOperator && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  <Bus className="w-3.5 h-3.5 text-gray-400" /> Operator:
                </span>
                <span className="font-bold text-gray-900">{currentUser.assignedOperator}</span>
              </div>
            )}

            {currentUser.adminDepartment && (
              <div className="flex items-center justify-between">
                <span className="text-gray-500 font-medium flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gray-400" /> Dept:
                </span>
                <span className="font-bold text-purple-700">{currentUser.adminDepartment}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
              <span className="text-gray-500 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Auth Engine:
              </span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span>Firebase Auth (wabus-c5a2a)</span>
              </span>
            </div>
          </div>

          {/* Quick Perks / Info */}
          <div className="p-3.5 rounded-2xl bg-red-50 border border-red-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D84E55] text-white flex items-center justify-center shrink-0">
              <Ticket className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-900">wABus Primo Privileges</h4>
              <p className="text-[11px] text-gray-500">
                Earn 5% wABus Coins on every Day & Night Coach booking.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                closeProfileModal();
                openAuthModal('PASSENGER', 'SIGN_IN');
              }}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold text-xs transition cursor-pointer"
            >
              Switch Account
            </button>

            <button
              onClick={() => {
                logout();
                closeProfileModal();
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-[#D84E55] font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
