import {
  API_URL_NEXT,
  AuthApiError,
  Messages,
} from "@/libs/components/types/config";
import {
  ApiError,
  AuthResponse,
  LoginData,
  RegisterData,
  UserInfo,
} from "@/libs/types/signup/signup.input";

// Re-export for convenience
export { AuthApiError } from "@/libs/components/types/config";
export type { ApiError, AuthResponse, LoginData, RegisterData, UserInfo } from "@/libs/types/signup/signup.input";

// API Configuration
const API_URL = API_URL_NEXT || "http://167.172.90.235:5031";
const API_BASE = `${API_URL}/api`;

export async function signup(data: RegisterData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();
    console.log("Signup response data:", responseData);

    if (!response.ok) {
      const errorMessages = Array.isArray(responseData.message)
        ? responseData.message
        : [responseData.message || Messages.REGISTER_FAILED];

      throw new AuthApiError(response.status, errorMessages, responseData);
    }

    return responseData as AuthResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // Network or other errors
    throw new AuthApiError(500, [Messages.CONNECTION_ERROR], {
      statusCode: 500,
      message: Messages.NETWORK_ERROR,
      error: Messages.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Login an existing user
 * @param data - Login credentials (email, password)
 * @returns Promise with access token and user info
 * @throws AuthApiError if login fails
 */
export async function login(data: LoginData): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessages = Array.isArray(responseData.message)
        ? responseData.message
        : [responseData.message || Messages.LOGIN_FAILED];

      throw new AuthApiError(response.status, errorMessages, responseData);
    }

    return responseData as AuthResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    // Network or other errors
    throw new AuthApiError(
      500,
      [Messages.CONNECTION_ERROR],
      {
        statusCode: 500,
        message: Messages.NETWORK_ERROR,
        error: Messages.INTERNAL_SERVER_ERROR,
      },
    );
  }
}

/**
 * Save authentication token to localStorage
 * @param token - JWT access token
 */
export function saveAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
}

/**
 * Get authentication token from localStorage
 * @returns JWT access token or null
 */
export function getAuthToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
}

/**
 * Remove authentication token from localStorage
 */
export function removeAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
  }
}

/**
 * Save user info to localStorage
 * @param user - User information
 */
export function saveUserInfo(user: UserInfo): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_info", JSON.stringify(user));
  }
}

/**
 * Get user info from localStorage
 * @returns User information or null
 */
export function getUserInfo(): UserInfo | null {
  if (typeof window !== "undefined") {
    const userInfo = localStorage.getItem("user_info");
    return userInfo ? JSON.parse(userInfo) : null;
  }
  return null;
}

/**
 * Remove user info from localStorage
 */
export function removeUserInfo(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("user_info");
  }
}

/**
 * Logout user - removes token and user info
 */
export function logout(): void {
  removeAuthToken();
  removeUserInfo();
}

/**
 * Check if user is authenticated
 * @returns true if user has a valid token
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}
