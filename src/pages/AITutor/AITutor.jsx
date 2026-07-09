import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  MessageCircle,
  FileText,
  LayoutDashboard,
  History,
  BarChart3,
  Brain,
  Moon,
  Sun,
  Sparkles
} from "lucide-react";

import AIChat from "./AIChat.jsx";
import AICoach from "./AICoach.jsx";
import QCMTab from "./QCMTab.jsx";
import HistoryTab from "./HistoryTab.jsx";
import ScoreChart from "./ScoreChart.jsx";
import StudentDashboard from "./StudentDashboard.jsx";
import SummaryTab from "./SummaryTab.jsx";

import "./aiTutor.css";
import "./components.css";

const AITutor = () => {
  const [activeTab, setActiveTab] = useState("chat");
  const [darkMode, setDarkMode] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const menu = [
    { id: "chat", icon: <MessageCircle size={20} />, label: t("tutor.menu.chat") },
    { id: "qcm", icon: <FileText size={20} />, label: t("tutor.menu.qcm") },
    { id: "summary", icon: <LayoutDashboard size={20} />, label: t("tutor.menu.summary") },
    { id: "dashboard", icon: <BarChart3 size={20} />, label: t("tutor.menu.dashboard") },
    { id: "history", icon: <History size={20} />, label: t("tutor.menu.history") },
    { id: "score", icon: <BarChart3 size={20} />, label: t("tutor.menu.score") },
    { id: "coach", icon: <Brain size={20} />, label: t("tutor.menu.coach") }
  ];

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [drawerOpen]);

  const handleSelect = (id) => {
    setActiveTab(id);
    setDrawerOpen(false);
  };

  return (
    <div className={darkMode ? "app dark" : "app"}>

      {/* ================= TOPBAR MOBILE ================= */}
      <div className="topbar">
        <button className="menu-btn" onClick={() => setDrawerOpen(true)} aria-label={t("tutor.openMenu")}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <h3>{t("tutor.title")}</h3>
        <button className="theme-btn" onClick={() => setDarkMode(!darkMode)} aria-label={t("tutor.toggleTheme")}>
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>

      {/* ================= SIDEBAR DESKTOP ================= */}
      <div className="sidebar-desktop">
        <div style={{ marginBottom: 24, padding: "0 12px" }}>
          <h3>{t("tutor.title")}</h3>
        </div>
        {menu.map((item) => (
          <div
            key={item.id}
            className={`menu-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
        <div className="toggle" onClick={() => setDarkMode(!darkMode)} role="button" tabIndex={0}>
          {darkMode ? (
            <>
              <Sun size={14} />
              {t("tutor.lightMode")}
            </>
          ) : (
            <>
              <Moon size={14} />
              {t("tutor.darkMode")}
            </>
          )}
        </div>
      </div>

      {/* ================= OVERLAY MOBILE ================= */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ================= DRAWER MOBILE ================= */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            className="drawer"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onDragEnd={(e, info) => {
              if (info.offset.x < -100) setDrawerOpen(false);
            }}
          >
            <div style={{ marginBottom: 24, padding: "0 12px" }}>
              <h3>{t("tutor.title")}</h3>
            </div>
            {menu.map((item) => (
              <motion.div
                key={item.id}
                className={`drawer-item ${activeTab === item.id ? "active" : ""}`}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(item.id)}
                role="button"
                tabIndex={0}
                aria-label={item.label}
              >
                {item.icon}
                <span>{item.label}</span>
              </motion.div>
            ))}
            <div className="toggle" onClick={() => setDarkMode(!darkMode)} role="button" tabIndex={0}>
              {darkMode ? (
                <>
                  <Sun size={14} />
                  {t("tutor.lightMode")}
                </>
              ) : (
                <>
                  <Moon size={14} />
                  {t("tutor.darkMode")}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= CONTENT ================= */}
      <motion.div
        className="content"
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === "chat" && <AIChat />}
        {activeTab === "qcm" && <QCMTab />}
        {activeTab === "summary" && <SummaryTab />}
        {activeTab === "dashboard" && <StudentDashboard />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "score" && <ScoreChart />}
        {activeTab === "coach" && <AICoach />}
      </motion.div>

      {/* ================= FLOATING ACTION BUTTON ================= */}
      <motion.button
        className="fab"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={() => setActiveTab("chat")}
        aria-label={t("tutor.goToChat")}
        title={t("tutor.goToChat")}
      >
        <Sparkles size={24} />
      </motion.button>

      {/* ================= BOTTOM NAV MOBILE ================= */}
      <div className="bottom-nav">
        {menu.map((item) => (
          <motion.div
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            whileTap={{ scale: 0.85 }}
            onClick={() => setActiveTab(item.id)}
            role="button"
            tabIndex={0}
            aria-label={item.label}
          >
            {item.icon}
            <span style={{ fontSize: 10 }}>{item.label}</span>
          </motion.div>
        ))}
      </div>

    </div>
  );
};

export default AITutor;