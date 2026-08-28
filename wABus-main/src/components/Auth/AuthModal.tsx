import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { firebaseConfig } from '../../services/firebase';
import { OtpInput } from './OtpInput';
import { 
  X, 
  User, 
  Smartphone, 
  ShieldCheck, 
  Bus, 
  Lock, 
  Mail, 
  Phone, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit2
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalInitialRole, 
    authModalInitialMode,
    sendEmailOtp,
    verifyEmailOtp,
    resendEmailOtp,
    loginWithGoogle,
    loginWithFirebaseEmail,
    signupWithFirebaseEmail,
    sendPasswordReset,
    switchDemoRole
  } = useAuth();

  const [activeRole, setActiveRole] = useState<UserRole>('PASSENGER');
  const [authMethod, setAuthMethod] = useState<'EMAIL_OTP' | 'PASSWORD'>('EMAIL_OTP');

  // OTP Flow States
  const [otpStep, setOtpStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('user@example.com');
  const [otp, setOtp] = useState('');
  const [resendCountdown, setResendCountdown] = useState(45);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fallback Password States for Admin/Conductor
  const [password, setPassword] = useState('');
  const [name, setName] = useState('Rahul Sharma');
  const [phone, setPhone] = useState('+91 98765 43210');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthModalOpen) {
      setActiveRole(authModalInitialRole || 'PASSENGER');
      setOtpStep('EMAIL');
      setOtp('');
      setErrorMsg(null);
      setSuccessMsg(null);
      if (authModalInitialRole === 'ADMIN') {
        setEmail('wonderlightadventure@gmail.com');
        setAuthMethod('PASSWORD');
        setPassword('Wa@1234');
      } else if (authModalInitialRole === 'CONDUCTOR') {
        setEmail('conductor.bijay@osrtc.gov.in');
        setAuthMethod('PASSWORD');
        setPassword('');
      } else {
        setEmail('user@example.com');
        setAuthMethod('EMAIL_OTP');
      }
    }
  }, [isAuthModalOpen, authModalInitialRole, authModalInitialMode]);

  // Resend Countdown Timer
  useEffect(() => {
    if (otpStep === 'OTP' && resendCountdown > 0) {
      timerRef.current = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [otpStep, resendCountdown]);

  if (!isAuthModalOpen) return null;

  const startResendTimer = (seconds: number = 45) => {
    setResendCountdown(seconds);
    setCanResend(false);
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await sendEmailOtp(cleanEmail);
      setOtpStep('OTP');
      setOtp('');
      startResendTimer(res.resendAllowedInSeconds || 45);
      setSuccessMsg(`We sent a 6-digit verification code to ${res.email || cleanEmail}`);
    } catch (err: any) {
      const errMsg = err.message || '';
      if (errMsg.toLowerCase().includes('wait') || errMsg.toLowerCase().includes('active verification')) {
        setOtpStep('OTP');
        setOtp('');
        startResendTimer(45);
        setSuccessMsg(`An active 6-digit verification code was already sent to ${cleanEmail}. Check your email inbox!`);
      } else {
        setErrorMsg(errMsg || 'Failed to send verification code. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpToVerify?: string) => {
    if (isLoading) return;
    const code = (otpToVerify || otp).trim();
    if (!code || code.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await verifyEmailOtp(email.trim(), code);
      setSuccessMsg('Authentication successful! Logged in.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Incorrect verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || isLoading) return;

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resendEmailOtp(email.trim());
      setOtp('');
      startResendTimer(res.resendAllowedInSeconds || 45);
      setSuccessMsg(`A new 6-digit verification code was sent to ${email.trim()}`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    try {
      await loginWithGoogle(activeRole);
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Sign-In failed.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await loginWithFirebaseEmail(email, password, activeRole);
      closeAuthModal();
    } catch (err: any) {
      setErrorMsg(err.message || 'Password authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
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
              wABus Passwordless Identity
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            {activeRole === 'PASSENGER' 
              ? (otpStep === 'EMAIL' ? 'Sign in to continue' : 'Verify your email') 
              : `${activeRole} Portal Access`}
          </h2>
          <p className="text-xs text-red-100 mt-1">
            {otpStep === 'EMAIL'
              ? 'Enter your email address and we will send you a one-time verification code.'
              : `We sent a 6-digit verification code to ${email}`}
          </p>

          {/* Role Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-xl mt-4">
            <button
              type="button"
              onClick={() => {
                setActiveRole('PASSENGER');
                setAuthMethod('EMAIL_OTP');
                setOtpStep('EMAIL');
                setErrorMsg(null);
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
                setAuthMethod('PASSWORD');
                setEmail('conductor.bijay@osrtc.gov.in');
                setErrorMsg(null);
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
                setAuthMethod('PASSWORD');
                setEmail('wonderlightadventure@gmail.com');
                setPassword('Wa@1234');
                setErrorMsg(null);
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
          
          {/* Quick Google Login */}
          {activeRole === 'PASSENGER' && (
            <>
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
                <span>Continue with Google Account</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] font-bold text-gray-400 uppercase">Or Passwordless Email OTP</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
            </>
          )}

          {/* Quick Demo Preset */}
          <div className="flex items-center justify-between bg-red-50/50 p-2.5 rounded-xl border border-red-100">
            <span className="text-xs font-semibold text-slate-700">Testing Demo Account?</span>
            <button
              type="button"
              onClick={() => switchDemoRole(activeRole)}
              className="text-xs font-bold text-[#D84E55] hover:bg-red-100 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer border border-red-200 bg-white"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D84E55]" />
              <span>Instant Log In ({activeRole})</span>
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

          {/* STEP 1: EMAIL INPUT FOR OTP */}
          {activeRole === 'PASSENGER' && authMethod === 'EMAIL_OTP' && otpStep === 'EMAIL' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55] focus:bg-white transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3.5 bg-[#D84E55] hover:bg-[#c44349] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Verification Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 2: 6-DIGIT OTP VERIFICATION */}
          {activeRole === 'PASSENGER' && authMethod === 'EMAIL_OTP' && otpStep === 'OTP' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-bold text-slate-800">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setOtpStep('EMAIL');
                    setOtp('');
                    setErrorMsg(null);
                  }}
                  className="text-xs font-bold text-[#D84E55] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Change email</span>
                </button>
              </div>

              <div>
                <label className="block text-center text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Enter 6-Digit OTP Code
                </label>
                
                <OtpInput
                  value={otp}
                  onChange={setOtp}
                  onComplete={(completedOtp) => handleVerifyOtp(completedOtp)}
                  disabled={isLoading}
                  hasError={Boolean(errorMsg)}
                />
              </div>

              <button
                type="button"
                onClick={() => handleVerifyOtp()}
                disabled={isLoading || otp.length !== 6}
                className="w-full py-3.5 bg-[#D84E55] hover:bg-[#c44349] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Resend OTP Section */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                <span className="text-slate-500">Did not receive the code?</span>
                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={isLoading}
                    className="font-bold text-[#D84E55] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Resend OTP</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-500 font-mono">
                    Resend OTP in 00:{resendCountdown < 10 ? `0${resendCountdown}` : resendCountdown}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ADMIN & CONDUCTOR AUTHENTICATION FORM */}
          {activeRole !== 'PASSENGER' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Email / Official ID
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password / Access Key
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#D84E55]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-[#D84E55] hover:bg-[#c44349] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to {activeRole} Portal</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
