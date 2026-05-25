// pages/Profile/components/PostsTab.jsx - Unified Posts Tab
// Works for both own profile and other users' profiles
import React from 'react';
import PostCard from '../../../components/PostCard';
import './PostsTab.css';

const PostsTab = ({
  experiences = [],
  user,
  currentUser,
  onLike,
  onComment,
  onDeleteComment,
  onShare,
  onSend,
  commentTexts = {},
  setCommentTexts,
  activeCommentId,
  setActiveCommentId,
  hasUserLiked = () => false,
  getUserReaction = () => null,
  getInitials,
  friends = [],
  shareUsers = [],
  isMyProfile = false
}) => {
  // Compute if this is the current user's own post
  const isOwnPost = (expUserId) => {
    return currentUser && expUserId === currentUser.id;
  };

  if (!experiences || experiences.length === 0) {
    return (
      <div className="posts-empty">
        <div className="posts-empty-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 19l7-7 3 3-7 7-3-3z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 2l7.586 7.586" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="11" cy="11" r="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h3 className="posts-empty-title">No posts yet</h3>
        <p className="posts-empty-text">
          {isMyProfile
            ? "Start sharing your first experience or idea!"
            : `${user?.name || 'This user'} hasn't shared any posts yet.`}
        </p>
        {isMyProfile && <div className="posts-empty-emoji">🚀</div>}
      </div>
    );
  }

  return (
    <div className="posts-container">
      {experiences.map((exp, index) => (
        <div
          key={exp.id}
          className="post-wrapper"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <PostCard
  experience={exp}
  user={currentUser}        
  onLike={onLike}
  onComment={onComment}
  onDeleteComment={onDeleteComment}
  onShare={onShare}
  onSend={onSend}
  commentTexts={commentTexts}
  setCommentTexts={setCommentTexts}
  activeCommentId={activeCommentId}
  setActiveCommentId={setActiveCommentId}
  hasUserLiked={hasUserLiked}
  getUserReaction={getUserReaction}
  getInitials={getInitials}
  isOwnPost={isOwnPost(exp.user_id)}
  friends={friends}
  shareUsers={shareUsers}
/>
        </div>
      ))}
    </div>
  );
};

export default PostsTab;