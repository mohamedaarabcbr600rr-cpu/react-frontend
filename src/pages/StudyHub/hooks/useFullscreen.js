import { useState, useCallback, useRef } from 'react';

export const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const elementRef = useRef(null);

  const enterFullscreen = useCallback(() => {
    const element = elementRef.current;
    if (element?.requestFullscreen) {
      element.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  }, [isFullscreen, enterFullscreen, exitFullscreen]);

  return { elementRef, isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen };
};





