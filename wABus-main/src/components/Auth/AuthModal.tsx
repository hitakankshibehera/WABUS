import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_USERS } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { firebaseConfig } from '../../services/firebase';
import { 
  X, 
  User, 
  Smartphone, 
  ShieldCheck, 
  Bus, 
  Lock, 
  Mail, 
  Phone, 
  KeyRound, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  BadgeCheck, 
  AlertCircle,
  Loader2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalInitialRole, 
    authModalInitialMode,
    loginWithGoogle,
    loginWithFirebaseEmail,
    signupWithFirebaseEmail,
    sendPasswordReset,
    loginPassenger,
    signupPassenger,
    loginConductor,
    signupConductor,
    loginAdmin,
    signupAdmin,
    switchDemoRole
  } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('PASSENGER');
  const [mode, setMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [authMethod, setAuthMethod] = useState<'FIREBASE_EMAIL' | 'PHONE_OTP'>('FIREBASE_EMAIL');

  // Form states
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Rahul Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');

  // Conductor specific
  const [condEmpId, setCondEmpId] = useState('COND-7890');
  const [condOperator, setCondOperator] = useState('OSRTC Volvo Premier');
  const [condBusNum, setCondBusNum] = useState('OD-02-AX-8910');

  // Admin specific
  const [adminDept, setAdminDept] = useState('Central Fleet & Yield Operations');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveRole(authModalInitialRole || 'PASSENGER');
      setMode(authModalInitialMode || 'SIGN_IN');
      setErrorMsg(null);
      setSuccessMsg(null);
      if (authModalInitialRole === 'ADMIN') {
        setEmail('wonderlightadventure@gmail.com');
        setPassword('Wa@1234');
      } else if (authModalInitialRole === 'CONDUCTOR') {
        setEmail('conductor.bijay@osrtc.gov.in');
        setPassword('');
      } else {
        setEmail('user@example.com');
        setPassword('');
      }
    }
  }, [isAuthModalOpen, authModalInitialRole, authModalInitialMode]);

  if (!isAuthModalOpen) return null;

  // Friendly error formatter for Firebase auth
  const parseFirebaseError = (err: any): string => {
    const msg = err?.message || String(err);
    if (msg.includes('auth/wrong-password') || msg.includes('auth/invalid-credential')) {
      return 'Invalid email or password. Please verify and try again.';
    }
    if (msg.includes('auth/user-not-found')) {
      return 'No account found with this email. Click "Register / Sign Up" to create one.';
    }
    if (msg.includes('auth/email-already-in-use')) {
      return 'An account already exists with this email. Please sign in instead.';
    }
    if (msg.includes('auth/weak-password')) {
      return 'Password should be at least 6 characters long.';
    }
    if (msg.includes('auth/invalid-email')) {
      return 'Please enter a valid email address.';
    }
    if (msg.includes('auth/popup-closed-by-user')) {
      return 'Google sign-in popup was closed before completing.';
    }
    return msg || 'Authentication error. Please check your credentials.';
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle(activeRole);
    } catch (err: any) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'SIGN_IN') {
        if (authMethod === 'PHONE_OTP') {
          await loginPassenger(phone);
        } else {
          if (!email || !password) {
            throw new Error('Please enter both email and password.');
          }
          await loginWithFirebaseEmail(email, password, activeRole);
        }
      } else {
        // Sign Up
        if (!email || !password || !name) {
          throw new Error('Please fill in your name, email, and password.');
        }
        await signupWithFirebaseEmail(
          name,
          email,
          password,
          phone,
          activeRole,
          {
            employeeId: condEmpId,
            assignedOperator: condOperator,
            assignedBusNumber: condBusNum,
            adminDepartment: adminDept
          }
        );
      }
    } catch (err: any) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email || !email.includes('@')) {
      setErrorMsg('Please enter your email address first to receive a password reset link.');
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordReset(email);
      setSuccessMsg(`Password reset link sent to ${email}. Check your inbox!`);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(parseFirebaseError(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with wABus styling */}
        <div className="bg-gradient-to-r from-[#D84E55] to-[#B83E44] text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={closeAuthModal}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 mb-1">
            <Bus className="w-5 h-5 text-white" />
            <span className="text-xs uppercase font-extrabold tracking-wider text-red-100">
              wABus Identity & Authorization
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {mode === 'SIGN_IN' ? 'Sign In to Your Account' : 'Create an Account'}
          </h2>
          <p className="text-xs text-red-100 mt-1">
            Firebase Authentication enabled with project <span className="font-mono font-bold bg-black/20 px-1.5 py-0.5 rounded text-[10px]">{firebaseConfig.projectId}</span>
          </p>

          {/* Role Switcher Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('PASSENGER');
                setErrorMsg(null);
                setEmail('user@example.com');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeRole === 'PASSENGER'
                  ? 'bg-white text-[#D84E55] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Passenger</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('CONDUCTOR');
                setErrorMsg(null);
                setEmail('conductor.bijay@osrtc.gov.in');
                setPassword('');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeRole === 'CONDUCTOR'
                  ? 'bg-white text-[#D84E55] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Conductor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRole('ADMIN');
                setErrorMsg(null);
                setEmail('wonderlightadventure@gmail.com');
                setPassword('Wa@1234');
              }}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeRole === 'ADMIN'
                  ? 'bg-white text-[#D84E55] shadow-xs'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Google Sign-in Firebase Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading || isLoading}
            className="w-full py-3 px-4 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs flex items-center justify-center gap-3 transition shadow-xs cursor-pointer disabled:opacity-60"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#D84E55]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>Continue with Google ({activeRole.toLowerCase()})</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200" />
            <span className="text-[11px] font-bold text-gray-400 uppercase">Or with Email / Password</span>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Sign In vs Sign Up Toggle */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-2">
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_IN');
                  setErrorMsg(null);
                }}
                className={`text-sm font-bold pb-1 cursor-pointer transition ${
                  mode === 'SIGN_IN'
                    ? 'text-[#D84E55] border-b-2 border-[#D84E55]'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('SIGN_UP');
                  setErrorMsg(null);
                }}
                className={`text-sm font-bold pb-1 cursor-pointer transition ${
                  mode === 'SIGN_UP'
                    ? 'text-[#D84E55] border-b-2 border-[#D84E55]'
                    : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                Register / Sign Up
              </button>
            </div>

            {/* Quick Demo Login Preset Button */}
            <button
              type="button"
              onClick={() => switchDemoRole(activeRole)}
              className="text-[11px] font-bold text-[#D84E55] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-200 transition flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D84E55]" />
              <span>1-Click Test {activeRole === 'PASSENGER' ? 'Passenger' : activeRole === 'CONDUCTOR' ? 'Conductor' : 'Admin'}</span>
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-[#D84E55] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                {mode === 'SIGN_IN' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] text-[#D84E55] font-bold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password (min 6 characters)"
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                  required
                />
              </div>
            </div>

            {mode === 'SIGN_UP' && (
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Mobile Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                  />
                </div>
              </div>
            )}

            {activeRole === 'CONDUCTOR' && mode === 'SIGN_UP' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Operator</label>
                  <input
                    type="text"
                    value={condOperator}
                    onChange={e => setCondOperator(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">Assigned Bus</label>
                  <input
                    type="text"
                    value={condBusNum}
                    onChange={e => setCondBusNum(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 rounded-xl bg-[#D84E55] hover:bg-[#C33E44] text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authorizing via Firebase...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'SIGN_IN' ? `Sign In (${activeRole})` : `Create ${activeRole} Account`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Firebase Project Trust Badge */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-[11px] text-slate-600">
            <div className="flex items-center gap-1.5 font-medium">
              <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Firebase Auth &amp; Cloud Database</span>
            </div>
            <span className="font-mono text-[10px] text-slate-500 font-bold">
              wabus-c5a2a
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
