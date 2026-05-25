// pages/Profile/Profile.jsx - Unified Profile Component
// Works for both own profile and other users' profiles
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../../axios";
import ProfileHeader from "./components/ProfileHeader";
import StoriesSection from "./components/StoriesSection";
import PostsTab from "./components/PostsTab";
import FollowersTab from "./components/FollowersTab";
import FollowingTab from "./components/FollowingTab";
import StoryViewer from "./components/StoryViewer";
import "./profile.css";



const Profile = ({
  userId: propUserId,
  // Props from App.jsx (optional - component can use internal data)
  user: externalUser,
  experiences: externalExperiences = [],
  friends: externalFriends = [],
  shareUsers: externalShareUsers = [],
  onLike: externalOnLike,
  onComment: externalOnComment,
  onDeleteComment: externalOnDeleteComment,
  onShare: externalOnShare,
  onSend: externalOnSend,
  commentTexts: externalCommentTexts,
  setCommentTexts: externalSetCommentTexts,
  activeCommentId: externalActiveCommentId,
  setActiveCommentId: externalSetActiveCommentId,
  hasUserLiked: externalHasUserLiked,
  getUserReaction: externalGetUserReaction,
  getInitials: externalGetInitials,
  fetchExperiences: externalFetchExperiences,
  onNavigateToExperience: externalOnNavigateToExperience
}) => {
  const { username } = useParams();
  // Nettoyer le paramètre : enlever tout ce qui n'est pas un chiffre ou lettre
  const cleanUsername = username ? username.split(':')[0].trim() : null;
  const isNumericId = cleanUsername && !isNaN(cleanUsername) && parseInt(cleanUsername, 10) > 0;
  const navigate = useNavigate();

  // === State Management ===
  const [currentUserFollowing, setCurrentUserFollowing] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [experiences, setExperiences] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [friends, setFriends] = useState([]);
  const [shareUsers, setShareUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");

  const [commentTexts, setCommentTexts] = useState({});
  const [activeCommentId, setActiveCommentId] = useState(null);

  // --- States pour Stories ---
  const [showStoryModal, setShowStoryModal] = useState(false);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);
  const [selectedStoryFile, setSelectedStoryFile] = useState(null);
  const [storyPreview, setStoryPreview] = useState(null);
  const [uploadingStory, setUploadingStory] = useState(false);
  const fileInputRef = useRef(null);

  // === Use external props or internal state ===
  const activeCommentId_val = activeCommentId !== undefined ? activeCommentId : externalActiveCommentId;
  const setActiveCommentId_fn = setActiveCommentId !== undefined ? setActiveCommentId : externalSetActiveCommentId;
  const commentTexts_val = Object.keys(commentTexts).length > 0 ? commentTexts : (externalCommentTexts || {});
  const setCommentTexts_fn = setCommentTexts !== undefined ? setCommentTexts : externalSetCommentTexts;
  const friends_val = friends.length > 0 ? friends : (externalFriends || []);
  const shareUsers_val = shareUsers.length > 0 ? shareUsers : (externalShareUsers || []);

  // === Compute if this is the current user's own profile ===
  const isMyProfile = currentUser && profileUser && currentUser.id === profileUser.id;

  // === Helper function pour obtenir l'URL complète ===
  const getFullUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    if (url.startsWith('/storage')) {
      return `import.meta.env.VITE_API_URL${url}`;
    }
    return `import.meta.env.VITE_API_URL/storage/${url}`;
  };

  // Memory leak cleanup
  useEffect(() => {
    return () => {
      if (storyPreview) {
        URL.revokeObjectURL(storyPreview);
      }
    };
  }, [storyPreview]);

  // === Fetch current user first ===
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        if (externalUser && externalUser.id) {
          setCurrentUser(externalUser);
          if (!username) {
            setProfileUser(externalUser);
          }
        } else {
          const res = await axios.get("/api/profile");
          setCurrentUser(res.data);
          if (!username) {
            setProfileUser(res.data);
          }
        }
      } catch (err) {
        console.log("Impossible de récupérer l'utilisateur actuel:", err);
      }
    };
    fetchCurrentUser();
  }, []);

  // === Use external experiences if provided ===
  useEffect(() => {
    if (externalExperiences && externalExperiences.length > 0) {
      setExperiences(externalExperiences);
    }
  }, [externalExperiences]);

  // Dans fetchProfileData, après avoir récupéré currentUser, charge ses following
const fetchCurrentUserFollowing = async () => {
  if (!currentUser) return;
  try {
    const res = await axios.get(`/api/users/${currentUser.id}/following`);
    setCurrentUserFollowing(res.data);
  } catch (err) {
    console.error("Error fetching current user following:", err);
  }
};

// Appelle cette fonction après avoir chargé currentUser
useEffect(() => {
  if (currentUser) {
    fetchCurrentUserFollowing();
  }
}, [currentUser]);

// Calcule si le profil affiché est suivi par l'utilisateur courant
const isFollowedByCurrentUser = useMemo(() => {
  if (!currentUser || !profileUser || currentUser.id === profileUser.id) return false;
  return currentUserFollowing.some(u => u.id === profileUser.id);
}, [currentUserFollowing, profileUser, currentUser]);
  // === Fonction de fetch du profil (corrigée) ===
  const fetchProfileData = async () => {
    try {
      setLoading(true);
      let user = null;

      if (isNumericId) {
        // Cas 1 : URL contient un ID numérique → /profile/1
        const numericId = parseInt(cleanUsername, 10);
        const res = await axios.get(`/api/users/${numericId}`);
        user = res.data;
      } else if (cleanUsername && cleanUsername !== 'me') {
        // Cas 2 : URL contient un username texte → /profile/john
        const res = await axios.get(`/api/users/username/${cleanUsername}`);
        user = res.data;
      } else if (propUserId && propUserId !== 'me') {
        // Cas 3 : ID passé en prop
        const res = await axios.get(`/api/users/${propUserId}`);
        user = res.data;
      } else {
        // Cas 4 : Propre profil
        const res = await axios.get("/api/profile");
        user = res.data;
      }

      // Si aucun user trouvé → arrêt
      if (!user) {
        setLoading(false);
        setProfileUser(null);
        return;
      }

      // Formater et stocker le user du profil
      const formattedUser = {
        ...user,
        profile_pic: user.profile_pic ? getFullUrl(user.profile_pic) : null
      };
      setProfileUser(formattedUser);

      const fetchUserId = user.id;

      // Experiences
      const expRes = await axios.get(`/api/users/${fetchUserId}/experiences`);
      setExperiences(expRes.data || []);

      // Stories
      try {
        const storiesRes = await axios.get(`/api/users/${fetchUserId}/stories`);
        setProfileUser(prev =>
          prev
            ? { ...prev, stories: storiesRes.data || [] }
            : { ...formattedUser, stories: storiesRes.data || [] }
        );
      } catch (err) {
        console.log("Stories not available");
      }

      // Followers + Following
      try {
        const followersRes = await axios.get(`/api/users/${fetchUserId}/followers`);
        const followingRes = await axios.get(`/api/users/${fetchUserId}/following`);

        const followersWithData = followersRes.data.map(f => ({
          ...f,
          profile_pic: f.profile_pic ? getFullUrl(f.profile_pic) : null,
          isFollowing: followingRes.data.some(u => u.id === f.id)
        }));

        const followingWithData = followingRes.data.map(f => ({
          ...f,
          profile_pic: f.profile_pic ? getFullUrl(f.profile_pic) : null,
          isFollowing: true
        }));

        setFollowers(followersWithData);
        setFollowing(followingWithData);
      } catch (err) {
        console.log("Followers not available:", err);
      }

      // Friends & shares (seulement pour son propre profil)
      const isOwnProfile = !cleanUsername || cleanUsername === 'me';
      if (isOwnProfile || (currentUser && user.id === currentUser.id)) {
        try {
          const friendsRes = await axios.get("/api/friends");
          setFriends(friendsRes.data || []);
        } catch (err) {}
        try {
          const sharesRes = await axios.get("/api/my-shares");
          setShareUsers(sharesRes.data || []);
        } catch (err) {}
      }

    } catch (error) {
      console.error("Profile fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentUser) return;
    fetchProfileData();
  }, [currentUser, cleanUsername, propUserId]);

  // === Fonction pour mettre a jour l'utilisateur apres modification ===
  const handleUpdateUser = (updatedUser) => {
    setProfileUser(updatedUser);
  };

  // === Fonction pour Follow/Unfollow avec synchronisation ===
  // === Fonction pour Follow/Unfollow avec synchronisation (CORRIGÉE) ===
const handleFollow = async (targetUserId, targetUserData = null) => {
  if (!currentUser) return;

  const isCurrentlyFollowing = currentUserFollowing.some(u => u.id === targetUserId);
  
  console.log("État actuel - following:", isCurrentlyFollowing);
  console.log("Target user:", targetUserId);

  try {
    let response;
    
    if (isCurrentlyFollowing) {
      // UNFOLLOW - Utiliser DELETE
      console.log("📡 Envoi requête UNFOLLOW (DELETE):", `/api/users/${targetUserId}/follow`);
      response = await axios.delete(`/api/users/${targetUserId}/follow`);
      console.log("✅ Réponse UNFOLLOW:", response.data);
    } else {
      // FOLLOW - Utiliser POST
      console.log("📡 Envoi requête FOLLOW (POST):", `/api/users/${targetUserId}/follow`);
      response = await axios.post(`/api/users/${targetUserId}/follow`);
      console.log("✅ Réponse FOLLOW:", response.data);
    }
    
    // Rafraîchir les listes
    console.log("🔄 Rafraîchissement des listes...");
    const res = await axios.get(`/api/users/${currentUser.id}/following`);
    console.log("📋 Nouvelle liste following:", res.data);
    setCurrentUserFollowing(res.data);
    
    // Rafraîchir le profil si nécessaire
    if (profileUser && targetUserId === profileUser.id) {
      await fetchProfileData();
    } else {
      // Juste rafraîchir les compteurs
      await fetchProfileData();
    }
    
    console.log("✅ Profil rafraîchi");
    
  } catch (error) {
    console.error("❌ Erreur lors du follow/unfollow:", error);
    alert("Une erreur est survenue, veuillez reessayer");
  }
};

  // === Has User Liked Helper ===
  const hasUserLikedFn = useCallback((experience) => {
    return experience.likes?.some(like => like.user_id === currentUser?.id) || false;
  }, [currentUser?.id]);

  const getUserReactionFn = useCallback((experience) => {
    if (!currentUser || !experience.likes) return null;
    const userLike = experience.likes.find(like => like.user_id === currentUser.id);
    return userLike?.reaction_type || null;
  }, [currentUser?.id]);

  // === Handlers pour les posts ===
  const handleLike = async (experienceId, reactionType = 'like') => {
    if (!currentUser) return;

    const currentReaction = getUserReactionFn(experiences.find(e => e.id === experienceId));

    setExperiences(prevExperiences =>
      prevExperiences.map(exp => {
        if (exp.id === experienceId) {
          const filteredLikes = exp.likes?.filter(like => like.user_id !== currentUser.id) || [];
          if (currentReaction === reactionType) {
            return { ...exp, likes: filteredLikes };
          }
          return {
            ...exp,
            likes: [...filteredLikes, { user_id: currentUser.id, reaction_type: reactionType, id: Date.now() }]
          };
        }
        return exp;
      })
    );

    try {
      await axios.post(`/api/experiences/${experienceId}/like`, { reaction_type: reactionType });
    } catch (error) {
      console.error("Erreur lors du like:", error);
      alert("Une erreur est survenue, veuillez reessayer.");
      fetchProfileData();
    }
  };

  const handleDeleteComment = async (experienceId, commentId) => {
    if (!currentUser) return;

    setExperiences(prevExperiences =>
      prevExperiences.map(exp => {
        if (exp.id === experienceId) {
          return { ...exp, comments: exp.comments?.filter(c => c.id !== commentId) || [] };
        }
        return exp;
      })
    );

    try {
      await axios.delete(`/api/comments/${commentId}`);
    } catch (error) {
      console.error("Erreur lors de la suppression du commentaire:", error);
      alert("Erreur lors de la suppression du commentaire");
      fetchProfileData();
    }
  };

  const handleShare = async (experienceId, targetUserId) => {
    try {
      await axios.post(`/api/experiences/${experienceId}/share`, { target_user_id: targetUserId });
      alert("Partage successful!");
      fetchProfileData();
    } catch (error) {
      console.error("Erreur lors du partage:", error);
      alert("Erreur lors du partage");
    }
  };

  const handleSend = async (experienceId, friendId) => {
    try {
      await axios.post(`/api/experiences/${experienceId}/send`, { friend_id: friendId });
      alert("Envoi reussi!");
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      alert("Erreur lors de l'envoi");
    }
  };

  const handleComment = async (experienceId) => {
    const commentContent = commentTexts_val[experienceId]?.trim();
    if (!commentContent || !currentUser) return;

    setCommentTexts_fn(prev => ({ ...prev, [experienceId]: '' }));
    setActiveCommentId_fn(null);

    const tempComment = {
      id: Date.now(),
      content: commentContent,
      user_id: currentUser.id,
      user_name: currentUser.name,
      user_avatar: currentUser.profile_pic,
      created_at: new Date().toISOString(),
    };

    setExperiences(prevExperiences =>
      prevExperiences.map(exp => {
        if (exp.id === experienceId) {
          return { ...exp, comments: [...(exp.comments || []), tempComment] };
        }
        return exp;
      })
    );

    try {
      const res = await axios.post(`/api/experiences/${experienceId}/comment`, {
        content: commentContent
      });

      setExperiences(prevExperiences =>
        prevExperiences.map(exp => {
          if (exp.id === experienceId) {
            const commentsWithoutTemp = exp.comments.filter(c => c.id !== tempComment.id);
            return { ...exp, comments: [...commentsWithoutTemp, res.data] };
          }
          return exp;
        })
      );
    } catch (error) {
      console.error("Erreur lors de l'ajout du commentaire:", error);
      alert("Erreur lors de l'ajout du commentaire");
      setExperiences(prevExperiences =>
        prevExperiences.map(exp => {
          if (exp.id === experienceId) {
            return { ...exp, comments: exp.comments.filter(c => c.id !== tempComment.id) };
          }
          return exp;
        })
      );
    }
  };

  const getInitialsFn = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  // === Handlers pour Stories ===
  const handleAddStory = () => {
    setShowStoryModal(true);
  };

  const handleStoryFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      if (storyPreview) URL.revokeObjectURL(storyPreview);
      setSelectedStoryFile(file);
      const previewUrl = URL.createObjectURL(file);
      setStoryPreview(previewUrl);
    } else {
      alert("Veuillez choisir une image ou video valide");
    }
  };

  const handleUploadStory = async () => {
    if (!selectedStoryFile) return;
    setUploadingStory(true);

    const formData = new FormData();
    formData.append('story', selectedStoryFile);

    try {
      const response = await axios.post('/api/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const newStory = {
        ...response.data,
        story_url: getFullUrl(response.data.story_url)
      };

      setProfileUser(prevUser => ({
        ...prevUser,
        stories: [newStory, ...(prevUser.stories || [])]
      }));

      setShowStoryModal(false);
      if (storyPreview) URL.revokeObjectURL(storyPreview);
      setSelectedStoryFile(null);
      setStoryPreview(null);
      alert("Story added successfully!");
    } catch (error) {
      console.error("Error uploading story:", error);
      alert("Erreur lors du telechargement de la story: " + (error.response?.data?.message || error.message));
    } finally {
      setUploadingStory(false);
    }
  };

  const handleStoryClick = (story, index) => {
    setSelectedStoryIndex(index);
    setShowStoryViewer(true);
  };

  const getAllStories = () => {
    const sortedStories = [...(profileUser?.stories || [])].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
    return sortedStories.map(story => ({
      ...story,
      user_name: profileUser?.name,
      user_avatar: profileUser?.profile_pic ? getFullUrl(profileUser?.profile_pic) : null,
      story_url: getFullUrl(story.story_url)
    }));
  };

  const stats = {
    posts: experiences.length,
    followers: followers.length,
    following: following.length,
  };

  // === Loading State ===
  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loading-spinner"></div>
        <p className="profile-loading-text">Chargement du profil...</p>
      </div>
    );
  }

  // === Error State ===
  if (!profileUser && !loading) {
    return (
      <div className="profile-error">
        <div className="profile-error-icon">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6"/>
          </svg>
        </div>
        <h3>Utilisateur non trouve</h3>
      </div>
    );
  }


  
  // === Render ===
  return (
    <div className="profile-page">
      <ProfileHeader
        user={profileUser}
        currentUser={currentUser}
        getInitials={getInitialsFn}
        postsCount={stats.posts}
        followersCount={stats.followers}
        followingCount={stats.following}
        onUpdateUser={handleUpdateUser}
        onTabChange={setActiveTab}
        activeTab={activeTab}
        onFollowToggle={handleFollow}
        following={following}
        onMessageClick={(userId) => navigate(`/messages/${userId}`)}
        isFollowedByCurrentUser={isFollowedByCurrentUser}
      />

      <StoriesSection
        stories={profileUser.stories || []}
        onAddStory={isMyProfile ? handleAddStory : undefined}
        onStoryClick={handleStoryClick}
        isMyProfile={isMyProfile}
      />

      <div className="profile-content">
        {activeTab === "posts" && (
          <PostsTab
            experiences={experiences}
            user={profileUser}
            currentUser={currentUser}
            onLike={handleLike}
            onComment={handleComment}
            onDeleteComment={handleDeleteComment}
            onShare={handleShare}
            onSend={handleSend}
            commentTexts={commentTexts_val}
            setCommentTexts={setCommentTexts_fn}
            activeCommentId={activeCommentId_val}
            setActiveCommentId={setActiveCommentId_fn}
            hasUserLiked={hasUserLikedFn}
            getUserReaction={getUserReactionFn}
            getInitials={getInitialsFn}
            friends={friends_val}
            shareUsers={shareUsers_val}
            isMyProfile={isMyProfile}
            
          />
        )}

        {activeTab === "followers" && (
          <FollowersTab
            followers={followers}
            onFollowToggle={handleFollow}
            currentUserId={currentUser?.id}
          />
        )}

        {activeTab === "following" && (
          <FollowingTab
            following={following}
            onFollowToggle={handleFollow}
            currentUserId={currentUser?.id}
          />
        )}
      </div>

      {/* Story Viewer Modal */}
      {showStoryViewer && (
        <StoryViewer
          stories={getAllStories()}
          initialStoryIndex={selectedStoryIndex}
          onClose={() => setShowStoryViewer(false)}
          currentUserId={currentUser?.id}
        />
      )}

      {/* Upload Story Modal */}
      {showStoryModal && (
        <div
          className="story-modal-overlay"
          onClick={() => {
            if (!uploadingStory) {
              setShowStoryModal(false);
              if (storyPreview) URL.revokeObjectURL(storyPreview);
              setStoryPreview(null);
              setSelectedStoryFile(null);
            }
          }}
        >
          <div className="story-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="story-modal-header">
              <h3>Ajouter une story</h3>
              <button
                className="story-modal-close"
                onClick={() => {
                  if (!uploadingStory) {
                    setShowStoryModal(false);
                    if (storyPreview) URL.revokeObjectURL(storyPreview);
                    setStoryPreview(null);
                    setSelectedStoryFile(null);
                  }
                }}
                disabled={uploadingStory}
              >
                X
              </button>
            </div>

            <div className="story-modal-body">
              {!storyPreview ? (
                <div
                  className="story-upload-area"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="story-upload-icon">📸</div>
                  <p>Cliquez pour choisir une image ou video</p>
                  <small>MP4, JPG, PNG (max 50MB)</small>
                </div>
              ) : (
                <div className="story-preview-area">
                  {selectedStoryFile?.type.startsWith('image/') ? (
                    <img src={storyPreview} alt="Story preview" />
                  ) : (
                    <video src={storyPreview} controls autoPlay loop muted />
                  )}
                  <button
                    className="story-change-btn"
                    onClick={() => {
                      if (!uploadingStory) {
                        if (storyPreview) URL.revokeObjectURL(storyPreview);
                        setSelectedStoryFile(null);
                        setStoryPreview(null);
                      }
                    }}
                    disabled={uploadingStory}
                  >
                    Changer
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                id="storyFileInput"
                accept="image/*,video/*"
                style={{ display: 'none' }}
                onChange={handleStoryFileChange}
                disabled={uploadingStory}
              />
            </div>

            <div className="story-modal-footer">
              <button
                className="story-cancel-btn"
                onClick={() => {
                  if (!uploadingStory) {
                    setShowStoryModal(false);
                    if (storyPreview) URL.revokeObjectURL(storyPreview);
                    setStoryPreview(null);
                    setSelectedStoryFile(null);
                  }
                }}
                disabled={uploadingStory}
              >
                Annuler
              </button>
              <button
                className="story-upload-btn"
                onClick={handleUploadStory}
                disabled={!selectedStoryFile || uploadingStory}
              >
                {uploadingStory ? (
                  <>
                    <span className="spinner"></span>
                    Telechargement...
                  </>
                ) : (
                  'Publier la story'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;


