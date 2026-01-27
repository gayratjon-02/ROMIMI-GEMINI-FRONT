import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { animate } from 'animejs';
import styles from '../../scss/Signup.module.scss';
import { Typography } from '@mui/material';

// --- Shared Components ---
const SnakeInput = ({ label, type = "text" }: { label: string, type?: string }) => {
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

    // Toggle Animation Logic
    useEffect(() => {
        if (!overlayRef.current) return;

        if (isSignup) {
            // Slide to Left (Signup Mode)
            animate(overlayRef.current, {
                left: '0%',
                easing: 'easeInOutQuad',
                duration: 600
            });
        } else {
            // Slide to Right (Login Mode)
            animate(overlayRef.current, {
                left: '50%',
                easing: 'easeInOutQuad',
                duration: 600
            });
        }
    }, [isSignup]);

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                {/* Background Layer: Left (Visible when Form is Right/Login) */}
                <div className={styles.backgroundLayer} style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                    <h2>Don't have an account?</h2>
                    <p>Start your journey with us today.</p>
                    <button className={styles.toggleButton} onClick={() => setIsSignup(true)}>
                        Sign Up
                    </button>
                </div>

                {/* Background Layer: Right (Visible when Form is Left/Signup) */}
                <div className={styles.backgroundLayer} style={{ alignItems: 'flex-end', textAlign: 'right' }}>
                    <h2>Already signed up?</h2>
                    <p>Log in to access your creative dashboard.</p>
                    <button className={styles.toggleButton} onClick={() => setIsSignup(false)}>
                        Log In
                    </button>
                </div>

                {/* Overlay Card (Slides Left/Right) */}
                <div className={styles.overlayCard} ref={overlayRef}>
                    <div className={styles.formContent}>
                        <h1>{isSignup ? 'Create Account' : 'Welcome Back'}</h1>

                        {isSignup && <SnakeInput label="Name" />}
                        <SnakeInput label="Email" />
                        <SnakeInput label="Password" type="password" />

                        <button className={styles.submitButton}>
                            {isSignup ? 'Sign Up' : 'Log In'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SignupPage;