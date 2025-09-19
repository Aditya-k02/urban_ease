import { useState, useEffect, useCallback } from 'react';

const TIMER_KEY_PREFIX = 'booking_timer_';
const TIMEOUT_DURATION_MS = 10 * 60 * 1000;

export const useTimer = (bookingId, onTimeout) => {
    const key = `${TIMER_KEY_PREFIX}${bookingId}`;

    const getInitialRemaining = useCallback(() => {
        const storedExpiration = localStorage.getItem(key);
        if (storedExpiration) {
            const expirationTime = parseInt(storedExpiration, 10);
            const remaining = expirationTime - Date.now();
            if (remaining > 1000) {
                return remaining;
            } else {
                localStorage.removeItem(key);
                return 0;
            }
        }
        return 0;
    }, [key]);

    const [timeRemaining, setTimeRemaining] = useState(getInitialRemaining);

    const startTimer = useCallback((id = bookingId) => {
        const currentKey = `${TIMER_KEY_PREFIX}${id}`;
        const expirationTime = Date.now() + TIMEOUT_DURATION_MS;
        localStorage.setItem(currentKey, expirationTime.toString());
        setTimeRemaining(TIMEOUT_DURATION_MS);
    }, [bookingId]);

    const clearTimer = useCallback((id = bookingId) => {
        const currentKey = `${TIMER_KEY_PREFIX}${id}`;
        localStorage.removeItem(currentKey);
        setTimeRemaining(0);
    }, [bookingId]);

    useEffect(() => {
        let intervalId;

        if (timeRemaining > 0) {
            intervalId = setInterval(() => {
                setTimeRemaining((prevRemaining) => {
                    const newRemaining = prevRemaining - 1000;
                    if (newRemaining <= 1000) {
                        clearInterval(intervalId);
                        localStorage.removeItem(key);
                        onTimeout(bookingId);
                        return 0;
                    }
                    return newRemaining;
                });
            }, 1000);
        }

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [timeRemaining, key, bookingId, onTimeout]);

    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    return {
        timeRemaining,
        startTimer,
        clearTimer,
        formatTime,
        isTiming: timeRemaining > 0,
    };
};