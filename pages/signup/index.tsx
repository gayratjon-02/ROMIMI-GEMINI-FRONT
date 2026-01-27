import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { animate } from 'animejs';
import styles from '../../scss/Signup.module.scss';
import { Typography, Alert, Snackbar } from '@mui/material';
import { API_URL } from '../../libs/components/types/config';

// --- Shared Components ---
interface SnakeInputProps {
    label: string;
    type?: string;
    value?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name?: string;
}

const SnakeInput = ({ label, type = "text", value, onChange, name }: SnakeInputProps) => {
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
            easing: 'easeInOutSine',
            duration: 300,
        });
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (!pathRef.current) return;
        if (e.target.value === "") {
            animate(pathRef.current, {
                strokeDashoffset: [0, pathLengthRef.current],
                opacity: [1, 0],
                easing: 'easeInOutSine',
                duration: 300,
            });
        }
    };

    return (
        <div className={styles.inputGroup}>
            <input
                className={styles.inputField}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder=" "
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            <label className={styles.label}>{label}</label>
            <svg className={styles.snakeSvg} viewBox="0 0 300 2" preserveAspectRatio="none">
                <path
                    ref={pathRef}
                    className={styles.snakePath}
                    d="M0,2 L300,2"
                />
            </svg>
        </div>
    );
};

// --- Page Component ---
const SignupPage = () => {
    const [isSignup, setIsSignup] = useState(false);
    const overlayRef = useRef<HTMLDivElement>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Toggle Animation Logic
    useEffect(() => {
        if (!overlayRef.current) return;

        // Animate Swipe
        if (isSignup) {
            animate(overlayRef.current, {
                left: '0%',
                easing: 'easeInOutQuad',
                duration: 600
            });
        } else {
            animate(overlayRef.current, {
                left: '50%',
                easing: 'easeInOutQuad',
                duration: 600
            });
        }

        // Animate Inputs Entrance (Staggered)
        setTimeout(() => {
            const inputs = overlayRef.current?.querySelectorAll(`.${styles.inputGroup}`);
            if (inputs) {
                // Reset first
                animate(inputs, {
                    opacity: 0,
                    translateY: 20,
                    duration: 0
                });

                // Animate In
                animate(inputs, {
                    opacity: [0, 1],
                    translateY: [20, 0],
                    delay: (el, i) => i * 100, // Stagger effect
                    easing: 'easeOutExpo'
                });
            }
        }, 100);

    }, [isSignup]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async () => {
        try {
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ type: 'success', message: 'Account created successfully! Please login.' });
                setFormData({ name: '', email: '', password: '' });
                setTimeout(() => setIsSignup(false), 2000);
            } else {
                setStatus({ type: 'error', message: data.message || 'Registration failed' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Network error. Please try again.' });
        }
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.card}>

                {/* Background Layer (Static Text) */}
                <div className={styles.bgLayer}>
                    {/* Left Side (For Signup Context) */}
                    <div className={styles.leftPanel}>
                        <h2>Already have an account?</h2>
                        <button className={styles.ghostBtn} onClick={() => setIsSignup(false)}>
                            Sign In
                        </button>
                    </div>

                    {/* Right Side (For Login Context) */}
                    <div className={styles.rightPanel}>
                        <h2>New here?</h2>
                        <button className={styles.ghostBtn} onClick={() => setIsSignup(true)}>
                            Sign Up
                        </button>
                    </div>
                </div>

                {/* Overlay Card (Slides Left/Right) */}
                <div className={styles.overlayCard} ref={overlayRef}>
                    <div className={styles.formContent}>
                        <h1>ROMIMI</h1>
                        <h2>{isSignup ? 'Create Account' : 'Welcome Back'}</h2>

                        {isSignup ? (
                            <>
                                <SnakeInput
                                    label="Name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                />
                                <SnakeInput
                                    label="Email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                                <SnakeInput
                                    label="Password"
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                <button className={styles.actionBtn} onClick={handleSignup}>
                                    Create Account
                                </button>
                            </>
                        ) : (
                            <>
                                <SnakeInput label="Email" />
                                <SnakeInput label="Password" type="password" />
                                <button className={styles.actionBtn}>
                                    Sign In
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Notification Snackbar */}
            <Snackbar
                open={!!status}
                autoHideDuration={6000}
                onClose={() => setStatus(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={status?.type} onClose={() => setStatus(null)}>
                    {status?.message}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default SignupPage;