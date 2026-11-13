import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthSessionUser, LoginRequestBody } from '../types/api';
import {
  AUTH_USER_KEY,
  setStoredToken,
} from '../api/client';
import { getMeApi, loginApi, logoutApi } from '../api/endpoints';

interface AuthContextValue {
  user: AuthSessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequestBody) => Promise<AuthSessionUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUser(): AuthSessionUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthSessionUser) : null;
  } catch {
    return null;
  }
}

function setStoredUser(user: AuthSessionUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthSessionUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await getMeApi();
      const sessionUser: AuthSessionUser = {
        _id: profile._id,
        accountId: profile.accountId,
        fullName: profile.fullName,
        initials: profile.initials,
        role: profile.role,
        status: profile.status,
        yearGroup: profile.yearGroup,
        activeLoansCount: profile.activeLoansCount,
        maxLoansLimit: profile.maxLoansLimit,
      };
      setUser(sessionUser);
      setStoredUser(sessionUser);
    } catch {
      setStoredToken(null);
      setStoredUser(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async (credentials: LoginRequestBody): Promise<AuthSessionUser> => {
      const session = await loginApi(credentials);
      setStoredToken(session.accessToken || null);
      setStoredUser(session.user);
      setUser(session.user);
      return session.user;
    },
    [],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutApi();
    } catch {
      // Ignore logout network error and clear local state regardless
    } finally {
      setStoredToken(null);
      setStoredUser(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
