// pages/Profile/components/StoryViewer.jsx - Unified Story Viewer
// Works for both own profile and other users' profiles
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from '../../../axios';
import './StoryViewer.css';

const StoryViewer = ({ stories, initialStoryIndex, onClose, currentUserId }) => {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex || 0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [storyViews, setStoryViews] = useState({});

  const currentStory = stories[currentIndex];

  // Helper to get full URL
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/storage')) {
      return `import.meta.env.VITE_API_URL${url}`;
    }
    return `import.meta.env.VITE_API_URL/storage/${url}`;
  };

  // Marquer la story comme vue
  const markStoryAsViewed = useCallback(async (storyId) => {
    if (storyViews[storyId]) return;

    try {
      await axios.post(`/api/stories/${storyId}/view`);
      setStoryViews(prev => ({ ...prev, [storyId]: true }));
    } catch (error) {
      console.error("Error marking story as viewed:", error);
    }
  }, [storyViews]);

  // Progress bar animation
  useEffect(() => {
    if (isPaused || !currentStory) return;

    const duration = currentStory.type === 'video' || currentStory.story_url?.endsWith('.mp4') ? 5000 : 3000;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      if (!isPaused) {
        elapsed += interval;
        const newProgress = (elapsed / duration) * 100;

        if (newProgress >= 100) {
          clearInterval(timer);
          handleNext();
        } else {
          setProgress(newProgress);
        }
      }
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, currentStory]);

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'Escape') onClose();
    if (e.key === ' ') setIsPaused(prev => !prev);
  }, [currentIndex]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Mark story as viewed when it becomes current
  useEffect(() => {
    if (currentStory) {
      markStoryAsViewed(currentStory.id);
    }
  }, [currentIndex, currentStory, markStoryAsViewed]);

  if (!currentStory) return null;

  const isVideo = currentStory.story_url?.endsWith('.mp4') ||
                  currentStory.type === 'video' ||
                  currentStory.story_url?.includes('video');

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-container" onClick={(e) => e.stopPropagation()}>
        {/* Progress bars */}
        <div className="story-progress-bars">
          {stories.map((story, idx) => (
            <div key={story.id || idx} className="story-progress-bar-container">
              <div
                className="story-progress-bar"
                style={{
                  width: `${idx < currentIndex ? 100 : idx === currentIndex ? progress : 0}%`
                }}
              />
            </div>
          ))}
        </div>

        {/* Header avec infos utilisateur */}
        <div className="story-viewer-header">
          <Link
            to={`/profile/${currentStory.user_id}`}
            className="story-user-info"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            {currentStory.user_avatar ? (
              <img
                src={currentStory.user_avatar}
                alt={currentStory.user_name || "User"}
                className="story-user-avatar"
                onError={(e) => e.target.src = '/default-avatar.png'}
              />
            ) : (
              <div className="story-user-avatar-placeholder">
                {currentStory.user_name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span className="story-user-name">{currentStory.user_name || "User"}</span>
            <span className="story-time">
              {currentStory.created_at && new Date(currentStory.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </Link>

          <div className="story-header-actions">
            <button
              className="story-action-btn"
              onClick={() => setIsPaused(prev => !prev)}
              aria-label={isPaused ? "Play" : "Pause"}
            >
              {isPaused ? (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              )}
            </button>
            <button className="story-action-btn story-close-btn" onClick={onClose} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="white" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Contenu de la story */}
        <div
          className="story-content"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {currentStory.story_url ? (
            isVideo ? (
              <video
                src={getFullUrl(currentStory.story_url)}
                className="story-media"
                autoPlay
                muted={false}
                loop={!isPaused}
                onError={(e) => {
                  console.error("Failed to load video:", currentStory.story_url);
                  handleNext();
                }}
              />
            ) : (
              <img
                src={getFullUrl(currentStory.story_url)}
                alt="Story"
                className="story-media"
                onError={(e) => {
                  console.error("Failed to load image:", currentStory.story_url);
                  e.target.src = '/placeholder-image.png';
                }}
              />
            )
          ) : (
            <div className="story-placeholder">
              <p>Content not available</p>
            </div>
          )}

          {/* Navigation zones */}
          <div className="story-nav-left" onClick={handlePrevious} />
          <div className="story-nav-right" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
};

export default StoryViewer;


