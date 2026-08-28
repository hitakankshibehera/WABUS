import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, UserRole } from '../types';
import { api } from '../services/api';
import {
  auth,
  signInWithGoogle,
  signInWithEmail,
  signUpWithEmail,
  logoutFirebase,
  sendResetPassword,
  onAuthStateChanged,
  type FirebaseUser,
  firebaseConfig
} from '../services/firebase';

export interface AuthContextType {
  currentUser: UserAccount | null;
  firebaseUser: FirebaseUser | null;
  isFirebaseConnected: boolean;
  sendEmailOtp: (email: string) => Promise<any>;
  verifyEmailOtp: (email: string, otp: string) => Promise<UserAccount>;
  resendEmailOtp: (email: string) => Promise<any>;
  loginWithGoogle: (role?: UserRole) => Promise<UserAccount>;
  loginWithFirebaseEmail: (email: string, pass: string, role?: UserRole) => Promise<UserAccount>;
  signupWithFirebaseEmail: (
    name: string,
    email: string,
    pass: string,
    phone: string,
    role?: UserRole,
    extra?: { employeeId?: string; assignedOperator?: string; assignedBusNumber?: string; adminDepartment?: string }
  ) => Promise<UserAccount>;
  sendPasswordReset: (email: string) => Promise<void>;
  loginPassenger: (identifier: string, otpOrPassword?: string) => Promise<UserAccount>;
  signupPassenger: (name: string, email: string, phone: string) => Promise<UserAccount>;
  loginConductor: (employeeIdOrPhone: string, pin: string) => Promise<UserAccount>;
  signupConductor: (data: { name: string; email: string; phone: string; employeeId: string; assignedOperator: string; assignedBusNumber: string }) => Promise<UserAccount>;
  loginAdmin: (email: string, masterKey: string, twoFactorCode?: string) => Promise<UserAccount>;
  signupAdmin: (data: { name: string; email: string; phone: string; department?: string; adminDepartment?: string; masterKey?: string }) => Promise<UserAccount>;
  logout: () => Promise<void>;
  switchDemoRole: (role: UserRole) => void;
  isAuthModalOpen: boolean;
  authModalInitialRole: UserRole;
  authModalInitialMode: 'SIGN_IN' | 'SIGN_UP';
  openAuthModal: (role?: UserRole, mode?: 'SIGN_IN' | 'SIGN_UP') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;
}

export const DEMO_USERS: Record<UserRole, UserAccount> = {
  PASSENGER: {
    id: 'usr-pass-101',
    name: 'Rahul Sharma',
    email: 'rahul.sharma@gmail.com',
    phone: '+91 98765 43210',
    role: 'PASSENGER',
    createdAt: '2025-01-15T10:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    authProvider: 'DEMO'
  },
  CONDUCTOR: {
    id: 'usr-cond-202',
    name: 'Bijay Nayak',
    email: 'conductor.bijay@osrtc.gov.in',
    phone: '+91 94371 00001',
    role: 'CONDUCTOR',
    employeeId: 'COND-7890',
    badgeNumber: 'OSRTC-BBSR-04',
    assignedOperator: 'OSRTC Volvo Premier',
    assignedBusNumber: 'OD-02-AX-8910',
    assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
    createdAt: '2024-06-10T08:30:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    authProvider: 'DEMO'
  },
  ADMIN: {
    id: 'usr-adm-303',
    name: 'Wonderlight Adventure Admin',
    email: 'wonderlightadventure@gmail.com',
    phone: '+91 98300 11223',
    role: 'ADMIN',
    adminDepartment: 'Central Fleet & Master Admin Operations',
    adminLevel: 'SUPER_ADMIN',
    twoFactorEnabled: true,
    createdAt: '2023-11-01T09:00:00Z',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    authProvider: 'MASTER_KEY'
  }
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isFirebaseConnected, setIsFirebaseConnected] = useState<boolean>(true);

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('wabus_user_session') || localStorage.getItem('redbus_user_session');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalInitialRole, setAuthModalInitialRole] = useState<UserRole>('PASSENGER');
  const [authModalInitialMode, setAuthModalInitialMode] = useState<'SIGN_IN' | 'SIGN_UP'>('SIGN_IN');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Sync Firebase onAuthStateChanged listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // Detect role or reuse existing role
        let role: UserRole = 'PASSENGER';
        const emailLower = (fbUser.email || '').toLowerCase();
        if (emailLower.includes('admin') || emailLower.includes('mohapatrapurnataya18')) {
          role = 'ADMIN';
        } else if (emailLower.includes('conductor')) {
          role = 'CONDUCTOR';
        } else if (currentUser?.role && currentUser.isFirebaseUser) {
          role = currentUser.role;
        }

        const userAccount: UserAccount = {
          id: fbUser.uid,
          firebaseUid: fbUser.uid,
          isFirebaseUser: true,
          authProvider: fbUser.providerData[0]?.providerId || 'firebase',
          emailVerified: fbUser.emailVerified,
          name: fbUser.displayName || (fbUser.email ? fbUser.email.split('@')[0] : 'Firebase User'),
          email: fbUser.email || 'user@firebase.app',
          phone: fbUser.phoneNumber || currentUser?.phone || '+91 98765 43210',
          role: role,
          avatarUrl: fbUser.photoURL || undefined,
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
          ...(role === 'CONDUCTOR' ? {
            employeeId: currentUser?.employeeId || 'COND-' + fbUser.uid.substring(0, 4).toUpperCase(),
            assignedOperator: currentUser?.assignedOperator || 'OSRTC Volvo Premier',
            assignedBusNumber: currentUser?.assignedBusNumber || 'OD-02-AX-8910'
          } : {}),
          ...(role === 'ADMIN' ? {
            adminDepartment: currentUser?.adminDepartment || 'Enterprise Cloud & Fleet Ops',
            adminLevel: 'SUPER_ADMIN'
          } : {})
        };

        setCurrentUser(userAccount);
      }
    });

    return () => unsubscribe();
  }, []);

  // Restore active server session on mount
  useEffect(() => {
    let isMounted = true;
    api.getSession().then((res) => {
      if (isMounted && res.authenticated && res.user) {
        setCurrentUser(res.user);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const sendEmailOtp = async (email: string) => {
    return await api.sendOtp(email);
  };

  const verifyEmailOtp = async (email: string, otp: string): Promise<UserAccount> => {
    const res = await api.verifyOtp(email, otp);
    if (res.user) {
      setCurrentUser(res.user);
      closeAuthModal();
      return res.user;
    }
    throw new Error(res.error || 'Verification failed');
  };

  const resendEmailOtp = async (email: string) => {
    return await api.resendOtp(email);
  };

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('wabus_user_session', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('wabus_user_session');
      localStorage.removeItem('redbus_user_session');
    }
  }, [currentUser]);

  const openAuthModal = (role: UserRole = 'PASSENGER', mode: 'SIGN_IN' | 'SIGN_UP' = 'SIGN_IN') => {
    setAuthModalInitialRole(role);
    setAuthModalInitialMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  // 1. Firebase Google Auth Login
  const loginWithGoogle = async (role: UserRole = 'PASSENGER'): Promise<UserAccount> => {
    const fbUser = await signInWithGoogle();
    let computedRole = role;
    const emailLower = (fbUser.email || '').toLowerCase();
    if (emailLower.includes('admin') || emailLower.includes('mohapatrapurnataya18')) {
      computedRole = 'ADMIN';
    }

    const user: UserAccount = {
      id: fbUser.uid,
      firebaseUid: fbUser.uid,
      isFirebaseUser: true,
      authProvider: 'google.com',
      emailVerified: fbUser.emailVerified,
      name: fbUser.displayName || 'Google User',
      email: fbUser.email || '',
      phone: fbUser.phoneNumber || '+91 98765 43210',
      role: computedRole,
      avatarUrl: fbUser.photoURL || undefined,
      createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
      ...(computedRole === 'CONDUCTOR' ? {
        employeeId: 'COND-' + fbUser.uid.substring(0, 4).toUpperCase(),
        assignedOperator: 'OSRTC Volvo Premier',
        assignedBusNumber: 'OD-02-AX-8910'
      } : {}),
      ...(computedRole === 'ADMIN' ? {
        adminDepartment: 'Enterprise Cloud & Fleet Ops',
        adminLevel: 'SUPER_ADMIN'
      } : {})
    };

    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  // 2. Firebase Email/Password Sign-In
  const loginWithFirebaseEmail = async (email: string, pass: string, role: UserRole = 'PASSENGER'): Promise<UserAccount> => {
    // Quick validation check for Wonderlight Adventure Admin Master Credentials
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'wonderlightadventure@gmail.com' || cleanEmail === 'admin@wabus.in' || cleanEmail === 'admin@redbus.in') {
      if (pass === 'Wa@1234' || pass === 'ADMIN_MASTER_2025' || pass === 'admin123') {
        setCurrentUser(DEMO_USERS.ADMIN);
        closeAuthModal();
        return DEMO_USERS.ADMIN;
      }
    }

    try {
      const fbUser = await signInWithEmail(email, pass);
      let computedRole = role;
      const emailLower = (fbUser.email || '').toLowerCase();
      if (emailLower.includes('admin') || emailLower.includes('wonderlightadventure')) computedRole = 'ADMIN';
      else if (emailLower.includes('conductor')) computedRole = 'CONDUCTOR';

      const user: UserAccount = {
        id: fbUser.uid,
        firebaseUid: fbUser.uid,
        isFirebaseUser: true,
        authProvider: 'password',
        emailVerified: fbUser.emailVerified,
        name: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        phone: '+91 98765 43210',
        role: computedRole,
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        ...(computedRole === 'CONDUCTOR' ? {
          employeeId: 'COND-' + fbUser.uid.substring(0, 4).toUpperCase(),
          assignedOperator: 'OSRTC Volvo Premier',
          assignedBusNumber: 'OD-02-AX-8910'
        } : {}),
        ...(computedRole === 'ADMIN' ? {
          adminDepartment: 'Central Fleet & Master Admin Operations',
          adminLevel: 'SUPER_ADMIN'
        } : {})
      };

      setCurrentUser(user);
      closeAuthModal();
      return user;
    } catch (firebaseErr: any) {
      // Fallback for custom master admin credentials
      if (cleanEmail === 'wonderlightadventure@gmail.com' && pass === 'Wa@1234') {
        setCurrentUser(DEMO_USERS.ADMIN);
        closeAuthModal();
        return DEMO_USERS.ADMIN;
      }
      throw firebaseErr;
    }
  };

  // 3. Firebase Email/Password Sign-Up
  const signupWithFirebaseEmail = async (
    name: string,
    email: string,
    pass: string,
    phone: string,
    role: UserRole = 'PASSENGER',
    extra?: { employeeId?: string; assignedOperator?: string; assignedBusNumber?: string; adminDepartment?: string }
  ): Promise<UserAccount> => {
    const fbUser = await signUpWithEmail(email, pass, name);

    const user: UserAccount = {
      id: fbUser.uid,
      firebaseUid: fbUser.uid,
      isFirebaseUser: true,
      authProvider: 'password',
      emailVerified: fbUser.emailVerified,
      name: name || fbUser.displayName || 'Passenger',
      email: fbUser.email || email,
      phone: phone || '+91 98765 43210',
      role: role,
      createdAt: new Date().toISOString(),
      ...(role === 'CONDUCTOR' ? {
        employeeId: extra?.employeeId || 'COND-' + fbUser.uid.substring(0, 4).toUpperCase(),
        assignedOperator: extra?.assignedOperator || 'OSRTC Volvo Premier',
        assignedBusNumber: extra?.assignedBusNumber || 'OD-02-AX-8910'
      } : {}),
      ...(role === 'ADMIN' ? {
        adminDepartment: extra?.adminDepartment || 'Operations & Automation',
        adminLevel: 'SUPER_ADMIN'
      } : {})
    };

    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  // 4. Send Password Reset
  const sendPasswordReset = async (email: string) => {
    await sendResetPassword(email);
  };

  // 5. Passenger Instant Auth
  const loginPassenger = async (identifier: string, otpOrPassword?: string): Promise<UserAccount> => {
    const isEmail = identifier.includes('@');
    const user: UserAccount = {
      id: 'usr-pass-' + Math.random().toString(36).substring(2, 8),
      name: isEmail ? identifier.split('@')[0].toUpperCase() : 'Passenger (' + identifier.slice(-4) + ')',
      email: isEmail ? identifier : `${identifier.replace(/[^0-9]/g, '')}@wabus-guest.in`,
      phone: isEmail ? '+91 98765 43210' : identifier,
      role: 'PASSENGER',
      authProvider: 'OTP_PHONE',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  const signupPassenger = async (name: string, email: string, phone: string): Promise<UserAccount> => {
    const user: UserAccount = {
      id: 'usr-pass-' + Math.random().toString(36).substring(2, 8),
      name,
      email,
      phone,
      role: 'PASSENGER',
      authProvider: 'DIRECT_REGISTER',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  // 6. Conductor Login & Signup
  const loginConductor = async (employeeIdOrPhone: string, pin: string): Promise<UserAccount> => {
    try {
      const res = await api.loginConductor(employeeIdOrPhone, pin);
      const cond = res.conductor;
      const user: UserAccount = {
        id: cond.id || 'usr-cond-' + Date.now(),
        name: cond.name,
        email: cond.email,
        phone: cond.phone,
        role: 'CONDUCTOR',
        employeeId: cond.employeeId,
        badgeNumber: 'BDG-' + cond.employeeId,
        assignedOperator: cond.assignedOperator,
        assignedBusNumber: cond.assignedBusNumber,
        assignedRoute: cond.assignedRoute,
        authProvider: 'EMPLOYEE_CREDENTIALS',
        createdAt: new Date().toISOString()
      };
      setCurrentUser(user);
      closeAuthModal();
      return user;
    } catch (err) {
      if (employeeIdOrPhone === 'COND-7890' || employeeIdOrPhone.includes('94371')) {
        setCurrentUser(DEMO_USERS.CONDUCTOR);
        closeAuthModal();
        return DEMO_USERS.CONDUCTOR;
      }
      throw err;
    }
  };

  const signupConductor = async (data: {
    name: string;
    email: string;
    phone: string;
    employeeId: string;
    assignedOperator: string;
    assignedBusNumber: string;
  }): Promise<UserAccount> => {
    const user: UserAccount = {
      id: 'usr-cond-' + Math.random().toString(36).substring(2, 8),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'CONDUCTOR',
      employeeId: data.employeeId,
      badgeNumber: 'BDG-' + Math.floor(1000 + Math.random() * 9000),
      assignedOperator: data.assignedOperator,
      assignedBusNumber: data.assignedBusNumber,
      assignedRoute: 'Bhubaneswar ⇄ Puri Superfast Express',
      authProvider: 'STAFF_REGISTER',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  // 7. Admin Login & Signup
  const loginAdmin = async (email: string, masterKey: string, twoFactorCode?: string): Promise<UserAccount> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanKey = masterKey.trim();

    // Check specific credentials requested by user
    if (
      (cleanEmail === 'wonderlightadventure@gmail.com' && (cleanKey === 'Wa@1234' || cleanKey === 'ADMIN_MASTER_2025' || cleanKey === 'admin123')) ||
      (cleanEmail.includes('admin') && (cleanKey === 'Wa@1234' || cleanKey === 'admin123' || cleanKey === 'wabus@2026' || cleanKey === 'redbus@2026' || cleanKey === 'ADMIN_MASTER_2025')) ||
      cleanKey === 'Wa@1234'
    ) {
      const adminUser: UserAccount = {
        ...DEMO_USERS.ADMIN,
        email: cleanEmail || 'wonderlightadventure@gmail.com'
      };
      setCurrentUser(adminUser);
      closeAuthModal();
      return adminUser;
    }

    if (cleanEmail === 'wonderlightadventure@gmail.com' && cleanKey !== 'Wa@1234') {
      throw new Error('Incorrect Master Password for wonderlightadventure@gmail.com. Please use Wa@1234');
    }

    const user: UserAccount = {
      id: 'usr-adm-' + Math.random().toString(36).substring(2, 8),
      name: (cleanEmail.split('@')[0] || 'Admin').toUpperCase(),
      email: cleanEmail,
      phone: '+91 98300 11223',
      role: 'ADMIN',
      adminDepartment: 'Central Fleet & Remote Configuration',
      adminLevel: 'SUPER_ADMIN',
      twoFactorEnabled: true,
      authProvider: 'MASTER_KEY',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  const signupAdmin = async (data: {
    name: string;
    email: string;
    phone: string;
    department?: string;
    adminDepartment?: string;
    masterKey?: string;
  }): Promise<UserAccount> => {
    const user: UserAccount = {
      id: 'usr-adm-' + Math.random().toString(36).substring(2, 8),
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: 'ADMIN',
      adminDepartment: data.department || data.adminDepartment || 'Operations & Automation',
      adminLevel: 'SUPER_ADMIN',
      twoFactorEnabled: true,
      authProvider: 'ADMIN_SIGNUP',
      createdAt: new Date().toISOString()
    };
    setCurrentUser(user);
    closeAuthModal();
    return user;
  };

  // 8. Logout
  const logout = async () => {
    try {
      await api.logout();
      await logoutFirebase();
    } catch {
      // ignore
    }
    setCurrentUser(null);
  };

  const switchDemoRole = (role: UserRole) => {
    setCurrentUser(DEMO_USERS[role]);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        firebaseUser,
        isFirebaseConnected,
        sendEmailOtp,
        verifyEmailOtp,
        resendEmailOtp,
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
        logout,
        switchDemoRole,
        isAuthModalOpen,
        authModalInitialRole,
        authModalInitialMode,
        openAuthModal,
        closeAuthModal,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
