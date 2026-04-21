import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearToken, getToken, setToken } from "../lib/storage";
import {
  login as loginRequest,
  register as registerRequest,
  type AuthResponse,
  type LoginPayload,
  type RegisterPayload,
} from "../api/auth";

type AuthState = {
  token: string | null;
  user: AuthResponse["user"] | null;
  tenant: AuthResponse["tenant"] | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

const USER_KEY = "qr_auth_user";
const TENANT_KEY = "qr_auth_tenant";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(getToken());
  const [user, setUser] = useState<AuthResponse["user"] | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });
  const [tenant, setTenant] = useState<AuthResponse["tenant"] | null>(() => {
    const raw = localStorage.getItem(TENANT_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const persistAuth = useCallback((data: AuthResponse) => {
    setToken(data.token);
    setTokenState(data.token);
    setUser(data.user);
    setTenant(data.tenant);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(TENANT_KEY, JSON.stringify(data.tenant));
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const data = await loginRequest(payload);
    persistAuth(data);
  }, [persistAuth]);

  const register = useCallback(async (payload: RegisterPayload) => {
    const data = await registerRequest(payload);
    persistAuth(data);
  }, [persistAuth]);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
    setUser(null);
    setTenant(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANT_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      tenant,
      isAuthenticated: Boolean(token),
      login,
      register,
      logout,
    }),
    [token, user, tenant, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("AuthContext missing");
  return value;
}
