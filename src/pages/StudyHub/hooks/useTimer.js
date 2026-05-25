import { useState, useEffect, useCallback } from 'react';

export const useTimer = (initialMinutes = 25) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const reset = useCallback((newMinutes = initialMinutes) => {
    setMinutes(newMinutes);
    setSeconds(0);
    setIsRunning(false);
    setIsComplete(false);
  }, [initialMinutes]);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            setIsRunning(false);
            setIsComplete(true);
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, minutes, seconds]);

  const start = () => setIsRunning(true);
  const pause = () => setIsRunning(false);
  
  const formatTime = () => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return { minutes, seconds, formatTime, isRunning, isComplete, start, pause, reset };
};