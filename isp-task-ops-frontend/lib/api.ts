import axios from "axios";
import type { AxiosRequestConfig } from "axios";
import type { User } from "@/types/auth";

type LaravelValidationErrors = Record<string, string[]>;

type LaravelApiPayload = {
  data?: unknown;
  message?: string;
  errors?: LaravelValidationErrors;
};

const API_BASE_URL = "http://127.0.0.1:8000";

const LOGIN_ROUTE = "/auth/login";

const getRequestUrl = (config?: AxiosRequestConfig) => {
  const baseURL = config?.baseURL?.replace(/\/+$/, "");
  const url = config?.url ?? "";

  if (!url) {
    return baseURL ?? "";
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  if (!baseURL) {
    return url;
  }

  const normalizedUrl = url.startsWith("/") ? url : `/${url}`;
  return `${baseURL}${normalizedUrl}`;
};

const getCookieValue = (key: string) => {
  if (typeof document === "undefined") {
    return null;
  }

  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${key}=`));

  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
};

export const getAuthToken = () => {
  if (typeof window === "undefined") {
    return null;
  }

  const directToken = window.localStorage.getItem("auth_token");
  if (directToken) {
    return directToken;
  }

  const persisted = window.localStorage.getItem("ops-auth");
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted) as {
        state?: { token?: string | { accessToken?: string | null } | null };
      };

      const persistedToken =
        typeof parsed.state?.token === "string"
          ? parsed.state.token
          : parsed.state?.token?.accessToken;

      if (persistedToken) {
        return persistedToken;
      }
    } catch {
      // Ignore malformed persisted auth state.
    }
  }

  return getCookieValue("auth_token");
};

const normalizeApiPath = (url?: string) => {
  if (!url || /^https?:\/\//i.test(url) || url.startsWith("/api/") || url === "/api") {
    return url;
  }

  if (url.startsWith("/sanctum/")) {
    return url;
  }

  return url.startsWith("/") ? `/api${url}` : `/api/${url}`;
};

const asLaravelPayload = (value: unknown): LaravelApiPayload | undefined => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  return value as LaravelApiPayload;
};

const getLaravelMessage = (payload: LaravelApiPayload | undefined) => {
  if (typeof payload?.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }

  const validationMessage = payload?.errors
    ? Object.values(payload.errors)
        .flat()
        .find((message) => typeof message === "string" && message.trim())
    : undefined;

  return validationMessage?.trim();
};

const getAxiosDebugMeta = (error: unknown) => {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error ? error.message : String(error),
      fullError: error,
    };
  }

  return {
    baseURL: error.config?.baseURL,
    requestUrl: getRequestUrl(error.config),
    method: error.config?.method?.toUpperCase(),
    errorCode: error.code,
    errorMessage: error.message,
    errorRequest: error.request,
    errorResponse: error.response,
    errorResponseData: error.response?.data,
    fullError: typeof error.toJSON === "function" ? error.toJSON() : error,
  };
};

export const publicApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
  },
});

export const authApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

export const apiClient = authApi;

publicApi.interceptors.request.use((config) => {
  config.url = normalizeApiPath(config.url);
  return config;
});

authApi.interceptors.request.use((config) => {
  config.url = normalizeApiPath(config.url);
  config.baseURL = API_BASE_URL;
  config.headers = config.headers ?? {};
  config.headers.Accept = "application/json";

  const token = getAuthToken();

  console.log("API token before request:", token);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if ("Authorization" in config.headers) {
    delete config.headers.Authorization;
  }

  console.log("API request headers:", config.headers);

  return config;
});

authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && typeof window !== "undefined") {
      console.error("Global 401 detected", {
        requestUrl: getRequestUrl(error.config),
        headers: error.config?.headers,
      });
      window.localStorage.removeItem("auth_token");
      window.location.replace(LOGIN_ROUTE);
    }

    return Promise.reject(error);
  }
);

export const buildActorHeaders = (user: User | null | undefined) => {
  const token = getAuthToken();

  console.log("buildActorHeaders token:", token);

  if (!user || !token) {
    return {
      Accept: "application/json",
    };
  }

  return {
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-User-Id": user.id,
  };
};

export const unwrapApiData = <T>(payload: T | { success?: boolean; data?: T }) => {
  if (payload && typeof payload === "object" && "data" in (payload as Record<string, unknown>)) {
    return ((payload as { data?: T }).data ?? null) as T;
  }

  return payload as T;
};

export const extractApiMessage = (error: unknown, fallback = "Terjadi kesalahan") => {
  if (axios.isAxiosError(error)) {
    const payload = asLaravelPayload(error.response?.data);

    if (payload?.message) {
      return payload.message;
    }

    if (payload?.errors) {
      return Object.values(payload.errors).flat().join(", ");
    }

    if (error.request) {
      return "Server tidak terhubung";
    }

    return fallback;
  }

  return fallback;
};

export const extractApiErrors = (error: unknown): LaravelValidationErrors => {
  if (!axios.isAxiosError(error)) {
    return {};
  }

  const payload = asLaravelPayload(error.response?.data);
  return payload?.errors ?? {};
};
