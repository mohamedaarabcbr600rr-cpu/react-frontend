import React, { useEffect, useState, useCallback } from "react";

const IconClose = ({ size = 22, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevronLeft = ({ size = 32, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconChevronRight = ({ size = 32, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const IconDownload = ({ size = 20, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconZoomIn = ({ size = 20, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const IconZoomOut = ({ size = 20, color = "#ffffff" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);

const ImageLightbox = ({ images, initialIndex = 0, onClose }) => {
  const [index, setIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);

  const current = images[index];

  const goPrev = useCallback(() => {
    setZoom(1);
    setIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const goNext = useCallback(() => {
    setZoom(1);
    setIndex((i) => (i < images.length - 1 ? i + 1 : i));
  }, [images.length]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [goPrev, goNext, onClose]);

  const handleDownload = async () => {
    try {
      const res = await fetch(current.url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `studmo-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Erreur téléchargement:", err);
    }
  };

  if (!current) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
        zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "16px 20px", zIndex: 2,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <span style={{ color: "#fff", fontSize: 14, opacity: 0.85 }}>
          {index + 1} / {images.length}
        </span>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} style={iconBtnStyle}><IconZoomOut /></button>
          <button onClick={() => setZoom((z) => Math.min(3, z + 0.5))} style={iconBtnStyle}><IconZoomIn /></button>
          <button onClick={handleDownload} style={iconBtnStyle}><IconDownload /></button>
          <button onClick={onClose} style={iconBtnStyle}><IconClose /></button>
        </div>
      </div>

      {/* Prev */}
      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          style={{ ...navBtnStyle, left: 16 }}
          aria-label="Précédent"
        >
          <IconChevronLeft />
        </button>
      )}

      {/* Image */}
      <div
        style={{ maxWidth: "90vw", maxHeight: "85vh", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt="media"
          style={{
            maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain",
            transform: `scale(${zoom})`, transition: "transform 0.2s ease",
            cursor: zoom > 1 ? "move" : "default",
          }}
        />
      </div>

      {/* Next */}
      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          style={{ ...navBtnStyle, right: 16 }}
          aria-label="Suivant"
        >
          <IconChevronRight />
        </button>
      )}
    </div>
  );
};

const iconBtnStyle = {
  background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
  width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer",
};

const navBtnStyle = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  background: "rgba(255,255,255,0.12)", border: "none", borderRadius: "50%",
  width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", zIndex: 2,
};

export default ImageLightbox;