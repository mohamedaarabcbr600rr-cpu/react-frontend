// pages/Profile/components/StoriesSection.jsx - Unified Stories Section
// Works for both own profile and other users' profiles
import React from "react";
import "./StoriesSection.css";

const StoriesSection = ({
  stories = [],
  onAddStory,
  onStoryClick,
  isMyProfile = false
}) => {
  const safeStories = Array.isArray(stories) ? stories : [];

  // Helper pour obtenir l'URL complete
  const getFullUrl = (url) => {
    if (!url) return '/default-avatar.png';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/storage')) {
      return `http://127.0.0.1:8000${url}`;
    }
    return `http://127.0.0.1:8000/storage/${url}`;
  };

  // Don't render if no stories and not own profile
  if (!isMyProfile && safeStories.length === 0) {
    return null;
  }

  return (
    <div className="stories-container">
      <div className="stories-scroll">
        {/* Add Story Button - Only for own profile */}
        {isMyProfile && (
          <div
            className="story-item add-story"
            onClick={(e) => {
              e.stopPropagation();
              if (onAddStory) onAddStory();
            }}
            role="button"
            tabIndex={0}
            aria-label="Add a story"
          >
            <div className="story-avatar-wrapper">
              <div className="story-avatar add-story-avatar">
                <span className="add-icon">+</span>
              </div>
            </div>
            <span className="story-username">Add</span>
          </div>
        )}

        {/* Stories List */}
        {safeStories.map((story, index) => (
          <div
            key={story.id}
            className="story-item"
            onClick={() => onStoryClick?.(story, index)}
            role="button"
            tabIndex={0}
          >
            <div className="story-avatar-wrapper">
              <div className="story-avatar has-story">
                <img
                  src={getFullUrl(story.story_url)}
                  alt={story.title || "Story"}
                  loading="lazy"
                  onError={(e) => {
                    console.error("Failed to load story image:", story.story_url);
                    e.target.src = '/default-avatar.png';
                  }}
                />
              </div>
            </div>
            <span className="story-username">
              {story.title?.length > 10
                ? `${story.title.substring(0, 10)}...`
                : story.title || "Story"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoriesSection;