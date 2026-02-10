import { ApiError } from "@/libs/types/signup/signup.input";

export const API_URL_NEXT =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL);

// Custom error class for API errors
export class AuthApiError extends Error {
  constructor(
    public statusCode: number,
    public errors: string[],
    public originalError: ApiError,
  ) {
    super(Array.isArray(errors) ? errors.join(", ") : errors[0]);
    this.name = "AuthApiError";
  }
}

export const Messages = {
  REGISTER_FAILED: "Registration failed. Please try again.",
  LOGIN_FAILED: "Login failed. Please check your credentials and try again.",
  NETWORK_ERROR: "Network error",
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  CONNECTION_ERROR: "Network error. Please check your connection and try again."
};
