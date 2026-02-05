import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import { useRouter } from "next/router";
import { animate } from "animejs";
import styles from "../../scss/Signup.module.scss";
import { Alert, Snackbar } from "@mui/material";
import {
  signup,
  login,
  saveAuthToken,
  saveUserInfo,
  isAuthenticated,
  AuthApiError,
} from "@/libs/server/HomePage/signup";

// --- Shared Components ---
interface SnakeInputProps {
  label: string;
  type?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  name?: string;
}

const SnakeInput = React.forwardRef<HTMLInputElement, SnakeInputProps>(
  ({ label, type = "text", value, onChange, onKeyDown, name }, ref) => {
    const pathRef = useRef<SVGPathElement>(null);
    const pathLengthRef = useRef<number>(0);

    useLayoutEffect(() => {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        pathLengthRef.current = length;
        pathRef.current.style.strokeDasharray = `${length}`;
        pathRef.current.style.strokeDashoffset = `${length}`;
      }
    }, []);

    const handleFocus = () => {
      if (!pathRef.current) return;
      animate(pathRef.current, {
        strokeDashoffset: [pathLengthRef.current, 0],
        opacity: [0, 1],
        easing: "easeInOutSine",
        duration: 300,
      });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (!pathRef.current) return;
      if (e.target.value === "") {
        animate(pathRef.current, {
          strokeDashoffset: [0, pathLengthRef.current],
          opacity: [1, 0],
          easing: "easeInOutSine",
          duration: 300,
        });
      }
    };

    return (
      <div className={styles.inputGroup}>
        <input
          ref={ref}
          className={styles.inputField}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder=" "
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <label className={styles.label}>{label}</label>
        <svg
          className={styles.snakeSvg}
          viewBox="0 0 300 2"
          preserveAspectRatio="none"
        >
          <path ref={pathRef} className={styles.snakePath} d="M0,2 L300,2" />
        </svg>
      </div>
    );
  }
);

SnakeInput.displayName = 'SnakeInput';

// --- Page Component ---
const SignupPage = () => {
  const router = useRouter();
  const [isSignup, setIsSignup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Input refs for signup
  const signupNameRef = useRef<HTMLInputElement>(null);
  const signupEmailRef = useRef<HTMLInputElement>(null);
  const signupPasswordRef = useRef<HTMLInputElement>(null);

  // Input refs for login
  const loginEmailRef = useRef<HTMLInputElement>(null);
  const loginPasswordRef = useRef<HTMLInputElement>(null);

  // Signup Form State
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Login Form State
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Security: If user is already logged in, redirect to home
  useEffect(() => {
    if (isAuthenticated()) {
      // Token exists - redirect to home page
      const redirectPath = (router.query.redirect as string) || '/';
      router.replace(redirectPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle Animation Logic
  useEffect(() => {
    if (!overlayRef.current) return;

    if (isSignup) {
      animate(overlayRef.current, {
        left: "0%",
        easing: "easeInOutQuad",
        duration: 600,
      });
    } else {
      animate(overlayRef.current, {
        left: "50%",
        easing: "easeInOutQuad",
        duration: 600,
      });
    }

    // Animate Inputs Stagger
    setTimeout(() => {
      const inputs = overlayRef.current?.querySelectorAll(
        `.${styles.inputGroup}`,
      );
      if (inputs) {
        animate(inputs, {
          opacity: 0,
          translateY: 20,
          duration: 0,
        });
        animate(inputs, {
          opacity: [0, 1],
          translateY: [20, 0],
          delay: (el, i) => i * 100,
          easing: "easeOutExpo",
        });
      }
    }, 100);
  }, [isSignup]);

  const handleSignupInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleLoginInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleSignup = async () => {
    if (!signupData.email || !signupData.password) {
      setStatus({ type: "error", message: "Email and password are required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup({
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
      });

      // Save token and user info
      saveAuthToken(response.access_token);
      saveUserInfo(response.user);

      setStatus({
        type: "success",
        message: "Account created successfully! Redirecting...",
      });
      setSignupData({ name: "", email: "", password: "" });

      // Use hard navigation to ensure localStorage token is available
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setStatus({
          type: "error",
          message: error.errors.join(", "),
        });
      } else {
        setStatus({ type: "error", message: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginData.email || !loginData.password) {
      setStatus({ type: "error", message: "Email and password are required" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await login({
        email: loginData.email,
        password: loginData.password,
      });

      // Save token and user info
      saveAuthToken(response.access_token);
      saveUserInfo(response.user);

      setStatus({
        type: "success",
        message: "Login successful! Redirecting...",
      });
      setLoginData({ email: "", password: "" });

      // Use hard navigation to ensure localStorage token is available
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error) {
      if (error instanceof AuthApiError) {
        setStatus({
          type: "error",
          message: error.errors.join(", "),
        });
      } else {
        setStatus({ type: "error", message: "An unexpected error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    nextRef?: React.RefObject<HTMLInputElement | null>,
    submitAction?: () => void
  ) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
      } else if (submitAction) {
        submitAction();
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Left Background (For switching to Signup) - Visible when we are in Login Mode */}
        <div
          className={styles.backgroundLayer}
          style={{
            opacity: isSignup ? 0 : 1,
            pointerEvents: isSignup ? "none" : "all",
            transition: "opacity 0.6s ease",
          }}
        >
          <h2>Don't have an account?</h2>
          <p>Join us to create amazing visuals.</p>
          <button
            className={styles.toggleButton}
            onClick={() => setIsSignup(true)}
            disabled={isLoading}
          >
            Sign Up
          </button>
        </div>

        {/* Right Background (For switching to Login) - Visible when we are in Signup Mode */}
        <div
          className={styles.backgroundLayer}
          style={{
            opacity: isSignup ? 1 : 0,
            pointerEvents: isSignup ? "all" : "none",
            transition: "opacity 0.6s ease",
          }}
        >
          <h2>Already have an account?</h2>
          <p>Welcome back to ROMIMI.</p>
          <button
            className={styles.toggleButton}
            onClick={() => setIsSignup(false)}
            disabled={isLoading}
          >
            Login
          </button>
        </div>

        {/* Overlay Card (Slides) */}
        <div className={styles.overlayCard} ref={overlayRef}>
          <div className={styles.formContent}>
            {/* Mobile Tab Switcher - Only visible on mobile */}
            <div className={styles.mobileTabSwitcher}>
              <button
                className={`${styles.mobileTab} ${!isSignup ? styles.active : ''}`}
                onClick={() => setIsSignup(false)}
                disabled={isLoading}
              >
                Sign In
              </button>
              <button
                className={`${styles.mobileTab} ${isSignup ? styles.active : ''}`}
                onClick={() => setIsSignup(true)}
                disabled={isLoading}
              >
                Sign Up
              </button>
            </div>

            <h1>ROMIMI</h1>
            <h2>{isSignup ? "Create Account" : "Welcome Back"}</h2>

            {isSignup ? (
              <>
                <SnakeInput
                  ref={signupNameRef}
                  name="name"
                  label="Name"
                  value={signupData.name}
                  onChange={handleSignupInputChange}
                  onKeyDown={(e) => handleKeyDown(e, signupEmailRef)}
                />
                <SnakeInput
                  ref={signupEmailRef}
                  name="email"
                  label="Email"
                  type="email"
                  value={signupData.email}
                  onChange={handleSignupInputChange}
                  onKeyDown={(e) => handleKeyDown(e, signupPasswordRef)}
                />
                <SnakeInput
                  ref={signupPasswordRef}
                  name="password"
                  label="Password"
                  type="password"
                  value={signupData.password}
                  onChange={handleSignupInputChange}
                  onKeyDown={(e) => handleKeyDown(e, undefined, handleSignup)}
                />
                <button
                  className={styles.submitButton}
                  onClick={handleSignup}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </button>
              </>
            ) : (
              <>
                <SnakeInput
                  ref={loginEmailRef}
                  name="email"
                  label="Email"
                  type="email"
                  value={loginData.email}
                  onChange={handleLoginInputChange}
                  onKeyDown={(e) => handleKeyDown(e, loginPasswordRef)}
                />
                <SnakeInput
                  ref={loginPasswordRef}
                  name="password"
                  label="Password"
                  type="password"
                  value={loginData.password}
                  onChange={handleLoginInputChange}
                  onKeyDown={(e) => handleKeyDown(e, undefined, handleLogin)}
                />
                <button
                  className={styles.submitButton}
                  onClick={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <Snackbar
        open={!!status}
        autoHideDuration={6000}
        onClose={() => setStatus(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={status?.type} onClose={() => setStatus(null)}>
          {status?.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default SignupPage;
