import { useEffect, useState, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "./axios";
import Navbar from "./components/Navbar";
import Accueil from "./pages/Accueil";
import AuthModal from './components/Auth/AuthModal';
import { useTranslation } from "react-i18next";
import "./i18n";

// ✅ Lazy loading - chargés seulement quand nécessaire
const Profile = lazy(() => import('./pages/Profile/Profile'));
const Messagerie = lazy(() => import('./pages/Messagerie'));
const Reseau = lazy(() => import('./pages/Reseau'));
const Notifications = lazy(() => import('./pages/Notifications'));
const AITutor = lazy(() => import('./pages/AITutor/AITutor'));
const StudyHub = lazy(() => import('./pages/StudyHub/StudyHub'));
const Admin = lazy(() => import('./admin-dashboard/admin'));
const AdminLogin = lazy(() => import('./admin-dashboard/AdminLogin'));
const ProtectedRoute = lazy(() => import('./admin-dashboard/ProtectedRoute'));
 
  
// ✅ Composant principal qui contient toute la logique
const AppContent = () => {
  const [scrollToExpId, setScrollToExpId] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
const { t } = useTranslation();
const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.body.dir = i18n.language === "ar" ? "rtl" : "ltr";
  }, [i18n.language]);

  useEffect(() => {
    const savedLang = localStorage.getItem("lang");
    if (savedLang) {
      i18n.changeLanguage(savedLang);
    }
  }, []);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("linkedin_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

// ✅ UNREAD COUNTS (for Navbar badges)
const [unreadMessages, setUnreadMessages] = useState(0);
const [unreadNotifications, setUnreadNotifications] = useState(0);

useEffect(() => {
  if (!user) return;
  const fetchCounts = async () => {
    try {
      const [msgRes, notifRes] = await Promise.all([
        axios.get('/api/messages/unread-count'),
        axios.get('/api/notifications/unread-count')
      ]);
      setUnreadMessages(msgRes.data.unread_count || 0);
      setUnreadNotifications(notifRes.data.unread_count || 0);
    } catch (err) {
      console.error('fetchCounts error:', err);
    }
  };
  fetchCounts();
  const interval = setInterval(fetchCounts, 30000);
  return () => clearInterval(interval);
}, [user]);


  const [showLoginModal, setShowLoginModal] = useState(false);
  const [experiences, setExperiences] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredExperiences, setFilteredExperiences] = useState([]);
  const [commentTexts, setCommentTexts] = useState({});
  const [activeCommentId, setActiveCommentId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [friends, setFriends] = useState([]);
  const [shareUsers, setShareUsers] = useState([]);
const [adminToken, setAdminToken] = useState(() =>
  localStorage.getItem("admin_token")
);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
  const currentLang = i18n.language;

  document.body.dir = currentLang === "ar" ? "rtl" : "ltr";
  document.documentElement.lang = currentLang;
}, [i18n.language]);

  const fetchFriends = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/friends');
      setFriends(res.data || []);
    } catch (err) {
      console.error('Erreur friends:', err);
      setFriends([]);
    }
  };

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  const styles = {
    app: {
      minHeight: "100vh",
      background: "white",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif",
    },
    modalOverlay: {
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(8px)",
      display: "flex", justifyContent: "center", alignItems: "center",
      zIndex: 2000, animation: "fadeIn 0.2s ease-out",
    },
    modalContent: {
      background: "white", borderRadius: "24px", padding: "0",
      width: "90%", maxWidth: isMobile ? "95%" : "480px",
      position: "relative", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
      animation: "scaleUp 0.3s ease-out", overflow: "hidden",
    },
    modalClose: {
      position: "absolute", top: "16px", right: "16px",
      background: "#f0f2f5", border: "none", width: "36px", height: "36px",
      borderRadius: "50%", fontSize: "18px", cursor: "pointer", color: "#65676b",
      transition: "all 0.2s", zIndex: 10, display: "flex",
      alignItems: "center", justifyContent: "center",
    },
    protectedContent: {
      textAlign: 'center', padding: isMobile ? '40px 20px' : '60px 20px',
      maxWidth: '400px', margin: '0 auto', background: "white",
    },
    protectedTitle: { fontSize: isMobile ? '18px' : '20px', fontWeight: '600', marginBottom: '12px', color: '#191919' },
    protectedButton: {
      backgroundColor: "#0a66c2", color: "white", border: "none",
      padding: "10px 24px", borderRadius: "24px", fontWeight: "600",
      cursor: "pointer", fontSize: "14px", marginTop: "16px", transition: "background-color 0.2s",
    },
    keyframes: `
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes scaleUp {
        from { opacity: 0; transform: scale(0.9); }
        to { opacity: 1; transform: scale(1); }
      }
      @keyframes slideInRight {
        from { opacity: 0; transform: translateX(30px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `,
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem("linkedin_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("linkedin_user");
    }
  }, [user]);

  const fetchExperiences = async () => {
    try {
      const res = await axios.get("/api/experiences");
      setExperiences(res.data);
      setFilteredExperiences(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchExperiences(); }, []);

  const addExperience = (newExp) => {
    setExperiences([newExp, ...experiences]);
    setFilteredExperiences([newExp, ...filteredExperiences]);
  };

  const handleLike = async (id, reactionType = 'like') => {
    if (!user) { setShowLoginModal(true); return; }
    try {
      await axios.post(`/api/experiences/${id}/like`, { reaction_type: reactionType });
      fetchExperiences();
    } catch (err) {
      console.error('Like error:', err);
      alert(err.response?.data?.error || 'Erreur lors du like');
    }
  };

  const handleComment = async (expId, silent = false) => {
  if (!user) { setShowLoginModal(true); return; }
  
  if (!silent) {
    const content = commentTexts[expId]?.trim();
    if (!content) return;
    try {
      await axios.post(`/api/experiences/${expId}/comment`, { content });
      setCommentTexts({ ...commentTexts, [expId]: "" });
      setActiveCommentId(null);
    } catch (err) {
      console.error("Erreur commentaire:", err);
      alert(err.response?.data?.error || "Erreur lors de l'ajout du commentaire");
      return;
    }
  }
  
  fetchExperiences(); // ← rafraîchit dans les deux cas
};
    

  const handleDeleteComment = async (expId, commentId) => {
  if (!user) { setShowLoginModal(true); return; }
  try {
    await axios.delete(`/api/comments/${commentId}`);
    fetchExperiences();
  } catch (err) {
    console.error("Erreur suppression commentaire:", err);
    alert(err.response?.data?.error || "Erreur lors de la suppression");
  }
};

  const handleShare = async (id) => {
    if (!user) { setShowLoginModal(true); return; }
    try {
      await axios.post(`/api/experiences/${id}/share`);
      fetchExperiences();
    } catch (error) { console.log(error); }
  };

  const handleSend = async (expId, friendId) => {
    if (!user) { setShowLoginModal(true); return; }
    try {
      await axios.post(`/api/experiences/${expId}/send`, { friend_id: friendId });
      alert('Publication envoyée à votre ami!');
    } catch (err) {
      console.error("Erreur envoi:", err);
      alert(err.response?.data?.error || "Erreur lors de l'envoi");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get('/sanctum/csrf-cookie');
      await axios.post('/api/logout');
      setUser(null);
      navigate('/');
    } catch (error) {
      console.error(error);
      alert('Erreur lors du logout');
    }
  };

  const handleSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = experiences.filter(exp =>
      exp.title?.toLowerCase().includes(term) ||
      exp.content?.toLowerCase().includes(term) ||
      exp.user?.name?.toLowerCase().includes(term)
    );
    setFilteredExperiences(filtered);
  };

  const hasUserLiked = (exp) => {
    if (!user || !exp.likes) return false;
    return exp.likes.some(like => like.user_id === user.id);
  };

  const getUserReaction = (exp) => {
    if (!user || !exp.likes) return null;
    const userLike = exp.likes.find(like => like.user_id === user.id);
    return userLike?.reaction_type || null;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const myExperiences = experiences.filter(exp => user ? exp.user?.id === user.id : false);
  const otherExperiences = filteredExperiences.filter(exp => user ? exp.user?.id !== user.id : true);

  const ProtectedContent = ({ children, title = "Connexion requise" }) => {
    if (!user) {
      return (
        <div style={styles.protectedContent}>
          <span style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🔒</span>
          <h3 style={styles.protectedTitle}>{title}</h3>
          <p style={{ color: "#666", fontSize: "14px", marginBottom: "20px" }}>
            Veuillez vous connecter pour accéder à cette page
          </p>
          <button
            style={styles.protectedButton}
            onClick={() => setShowLoginModal(true)}
            onMouseEnter={(e) => e.target.style.backgroundColor = "#004182"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "#0a66c2"}
          >
            Se connecter
          </button>
        </div>
      );
    }
    return children;
  };

  return (
    <div style={styles.app}>
      <style>{styles.keyframes}</style>

      <Navbar
        user={user}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
        searchTerm={searchTerm}
        onSearch={handleSearch}
        onLogout={handleLogout}
        getInitials={getInitials}
        setLang={(lng) => {
  i18n.changeLanguage(lng);
}}
      />

      <div style={{ animation: "slideInRight 0.3s ease-out", background: "white" }}>
        <Suspense fallback={<div style={{textAlign:'center', padding:'50px'}}>Chargement...</div>}>
        <Routes>
          {/* ACCUEIL */}
          <Route path="/" element={
            <Accueil
              user={user}
              lang={i18n.language}
              myExperiences={myExperiences}
              onAddExperience={addExperience}
              scrollToExpId={scrollToExpId}
              experiences={filteredExperiences}
              onLike={handleLike}
              onComment={handleComment}
              onShare={handleShare}
              onDeleteComment={handleDeleteComment}
              onSend={handleSend}
              commentTexts={commentTexts}
              setCommentTexts={setCommentTexts}
              activeCommentId={activeCommentId}
              setActiveCommentId={setActiveCommentId}
              hasUserLiked={hasUserLiked}
              getUserReaction={getUserReaction}
              getInitials={getInitials}
              onProfileClick={() => navigate('/profile')}
              onMessagerieClick={() => navigate('/messagerie')}
              onReseauClick={() => navigate('/reseau')}
              
              openLogin={() => setShowLoginModal(true)}
              openRegister={() => setShowLoginModal(true)}
              friends={friends}
            />
          } />

          {/* ✅ PROFIL D'UN AUTRE UTILISATEUR (par ID ou username) */}
          {/* On passe user pour que Profile sache qui est connecté */}
          <Route path="/profile/:username" element={
            <Profile user={user} />
          } />

          {/* ✅ MON PROFIL */}
          <Route path="/profile" element={
            <ProtectedContent title="Connectez-vous pour voir votre profil">
              <Profile
                user={user}
                lang={i18n.language}
                experiences={myExperiences}
                onLike={handleLike}
                onComment={handleComment}
                onDeleteComment={handleDeleteComment}
                onShare={handleShare}
                onSend={handleSend}
                commentTexts={commentTexts}
                setCommentTexts={setCommentTexts}
                activeCommentId={activeCommentId}
                setActiveCommentId={setActiveCommentId}
                hasUserLiked={hasUserLiked}
                getUserReaction={getUserReaction}
                getInitials={getInitials}
                fetchExperiences={fetchExperiences}
                friends={friends}
                shareUsers={friends}
              />
            </ProtectedContent>
          } />

          

          {/* AI TUTOR */}
          <Route path="/ai" element={
            <ProtectedContent title="Connectez-vous pour utiliser AI">
              <AITutor />
            </ProtectedContent>
          } />

          {/* MESSAGERIE */}
          <Route path="/messagerie" element={
            <ProtectedContent title="Connectez-vous pour accéder à vos messages">
              <Messagerie authUserId={user?.id} />
            </ProtectedContent>
          } />

          {/* RESEAU */}
          <Route path="/reseau" element={
            <ProtectedContent title="Connectez-vous pour voir votre réseau">
              <Reseau user={user} />
            </ProtectedContent>
          } />

         {/* ADMIN LOGIN */}
<Route
  path="/admin-login"
  element={<AdminLogin setToken={setAdminToken} />}
/>

{/* ADMIN DASHBOARD */}
<Route
  path="/admin"
  element={
    <ProtectedRoute token={adminToken}>
      <Admin />
    </ProtectedRoute>
  }
/>


{/* STUDY HUB - AI Workflow Controller */}
<Route path="/focus-hub" element={
  <ProtectedContent title="Connectez-vous pour accéder au Study Hub">
    <StudyHub />
  </ProtectedContent>
} />


          {/* NOTIFICATIONS */}
          <Route path="/notifications" element={
            <ProtectedContent title="Connectez-vous pour voir vos notifications">
              <Notifications
                user={user}
                onNavigateToExperience={(expId) => {
                  navigate('/');
                  setTimeout(() => setScrollToExpId(expId), 100);
                }}
              />
            </ProtectedContent>
          } />
        </Routes>
        </Suspense>
      </div>

      {showLoginModal && (
        <div style={styles.modalOverlay} onClick={() => setShowLoginModal(false)}>
          <div
            style={{
              ...styles.modalContent,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(12px)",
              maxWidth: "500px"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button style={styles.modalClose} onClick={() => setShowLoginModal(false)}>✖</button>
            <AuthModal
              setUser={(loggedUser) => {
                setUser(loggedUser);
                setShowLoginModal(false);
              }}
              closeModal={() => setShowLoginModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;




 


