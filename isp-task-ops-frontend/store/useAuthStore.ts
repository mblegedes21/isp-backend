"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, extractApiMessage } from "@/lib/api";
import type { AuthToken, User } from "@/types/auth";
import type { Role } from "@/types/role";

type RoleInput = Role;

interface AuthState {
  user: User | null;
  token: AuthToken | null;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    passwordConfirmation: string;
    role: RoleInput;
    branchId: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  isAuthenticated: () => boolean;
  enforceTokenExpiry: () => Promise<void>;
  setHydrated: (value: boolean) => void;
}

interface AuthResponsePayload {
  token?: AuthToken | null;
  message?: string;
  user?: {
    id?: string | number;
    name?: string;
    email?: string;
    role?:
      | Role
      | "TECHNICIAN"
      | "WAREHOUSE_ADMIN";
    branch_id?: string | number | null;
    branch_name?: string | null;
    branchId?: string | number | null;
    branchName?: string | null;
  } | null;
}

type AuthUserPayload = NonNullable<AuthResponsePayload["user"]>;
type AuthUserRole = AuthUserPayload["role"];

const normalizeRole = (role: RoleInput | AuthUserRole) => {
  const roleMap: Record<string, Role> = {
    NOC: "NOC",
    LEADER: "LEADER",
    ADMIN_GUDANG: "ADMIN_GUDANG",
    TEKNISI: "TEKNISI",
    MANAGER: "MANAGER",
    MITRA: "MITRA",
    TECHNICIAN: "TEKNISI",
    WAREHOUSE_ADMIN: "ADMIN_GUDANG",
    noc: "NOC",
    leader: "LEADER",
    warehouse: "ADMIN_GUDANG",
    technician: "TEKNISI",
    manager: "MANAGER",
    mitra: "MITRA",
    admin_gudang: "ADMIN_GUDANG",
    teknisi: "TEKNISI",
  };

  return roleMap[String(role)] ?? "NOC";
};

const normalizeUser = (payload: {
  id: string | number;
  name: string;
  email: string;
  role: AuthUserRole;
  branch_id?: string | number | null;
  branch_name?: string | null;
  branchId?: string | number | null;
  branchName?: string | null;
}): User => {
  const resolvedBranchId = payload.branchId ?? payload.branch_id;

  return {
    id: String(payload.id),
    name: payload.name,
    email: payload.email,
    role: normalizeRole(payload.role),
    branchId: resolvedBranchId !== null && resolvedBranchId !== undefined ? String(resolvedBranchId) : null,
    branchName: payload.branchName ?? payload.branch_name ?? null,
  };
};

const ensureValidAuthResponse = (payload: AuthResponsePayload, fallbackMessage: string) => {
  if (!payload.user?.id || !payload.user.role) {
    throw new Error(fallbackMessage);
  }

  return {
    token: payload.token ?? null,
    user: normalizeUser({
      id: payload.user.id,
      name: payload.user.name ?? "",
      email: payload.user.email ?? "",
      role: payload.user.role,
      branch_id: payload.user.branch_id,
      branch_name: payload.user.branch_name,
      branchId: payload.user.branchId,
      branchName: payload.user.branchName,
    }),
  };
};

const getResponsePayload = <T>(payload: { data?: T } | T): T => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }

  return payload as T;
};

const createAuthRequest = async <TPayload extends Record<string, unknown>>(
  url: "/api/register" | "/api/login",
  payload: TPayload
) => {
  console.info("Auth payload", {
    url,
    payload,
  });

  const response = await authApi.post<AuthResponsePayload>(url, payload, {
    headers: {
      Accept: "application/json",
    },
  });

  console.info("Auth response.data", response.data);

  return getResponsePayload<AuthResponsePayload>(response.data);
};

export const register = async (payload: {
  name: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: RoleInput;
  branchId: string;
}) => {
  const responsePayload = await createAuthRequest("/api/register", {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    password_confirmation: payload.passwordConfirmation,
    role: payload.role,
    branch_id: Number(payload.branchId),
  });

  return ensureValidAuthResponse(responsePayload, "Respons registrasi tidak valid.");
};

export const login = async (email: string, password: string) => {
  const payload = {
    email,
    password,
  };

  console.log("LOGIN URL:", "http://127.0.0.1:8000/api/login");
  console.log("PAYLOAD:", payload);

  const responsePayload = await createAuthRequest("/api/login", payload);

  return ensureValidAuthResponse(responsePayload, "Respons login tidak valid.");
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hydrated: false,
      login: async (email, password) => {
        try {
          const { token, user } = await login(email, password);

          set({
            user,
            token,
          });

          if (typeof window !== "undefined" && token) {
            window.localStorage.setItem("auth_token", token);
          }

          return user;
        } catch (error) {
          throw new Error(extractApiMessage(error, "Login gagal."));
        }
      },
      register: async ({ name, email, password, passwordConfirmation, role, branchId }) => {
        try {
          const { token, user } = await register({
            name,
            email,
            password,
            passwordConfirmation,
            role,
            branchId,
          });

          set({
            user,
            token,
          });

          if (typeof window !== "undefined" && token) {
            window.localStorage.setItem("auth_token", token);
          }

          return user;
        } catch (error) {
          throw new Error(extractApiMessage(error, "Registrasi gagal."));
        }
      },
      logout: async () => {
        try {
          await authApi.post("/api/auth/logout", undefined, {
            headers: {
              Accept: "application/json",
            },
          });
        } catch {
          // Ignore logout API failure and clear local session anyway.
        }

        set({ user: null, token: null });

        if (typeof window !== "undefined") {
          window.localStorage.removeItem("auth_token");
        }
      },
      hasRole: (role) => get().user?.role === role,
      isAuthenticated: () => Boolean(get().token && get().user),
      enforceTokenExpiry: async () => {
        const token = get().token;
        if (!token) {
          return;
        }

        try {
          const response = await authApi.get<{ user?: AuthResponsePayload["user"] }>("/api/auth/me", {
            headers: {
              Accept: "application/json",
            },
          });

          const payload = getResponsePayload<{ user?: AuthResponsePayload["user"] }>(response.data);

          if (!payload.user) {
            await get().logout();
            return;
          }

          set({
            user: normalizeUser({
              id: payload.user.id ?? "",
              name: payload.user.name ?? "",
              email: payload.user.email ?? "",
              role: payload.user.role ?? "NOC",
              branch_id: payload.user.branch_id,
              branch_name: payload.user.branch_name,
              branchId: payload.user.branchId,
              branchName: payload.user.branchName,
            }),
          });
        } catch {
          await get().logout();
        }
      },
      setHydrated: (value) => set({ hydrated: value }),
    }),
    {
      name: "ops-auth",
      migrate: (persistedState: unknown) => {
        const state = persistedState as {
          user?: Parameters<typeof normalizeUser>[0] | null;
          token?: string | { accessToken?: string | null } | null;
        };

        return {
          ...state,
          user: state.user ? normalizeUser(state.user) : null,
          token: typeof state.token === "string" ? state.token : state.token?.accessToken ?? null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
