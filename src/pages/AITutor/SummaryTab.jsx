import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const SummaryTab = () => {
  const [file, setFile] = useState(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [summaryHistory, setSummaryHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const { t } = useTranslation();

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError(t('summary.errors.unsupportedFormat'));
      return false;
    }

    if (file.size > maxSize) {
      setError(t('summary.errors.fileTooLarge'));
      return false;
    }

    setError("");
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setFileSize(formatFileSize(selectedFile.size));
      setSummary(""); // Clear previous summary when new file is selected
    } else {
      setFile(null);
      setFileName("");
      setFileSize("");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return `0 ${t('summary.fileSize.bytes')}`;
    const k = 1024;
    const sizes = [
      t('summary.fileSize.bytes'),
      t('summary.fileSize.kb'),
      t('summary.fileSize.mb'),
      t('summary.fileSize.gb')
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setFileName(droppedFile.name);
      setFileSize(formatFileSize(droppedFile.size));
      setSummary("");
    } else {
      setFile(null);
      setFileName("");
      setFileSize("");
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('summary.errors.noFileSelected'));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/generate-summary`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000, // 120 seconds timeout
        }
      );

      const newSummary = res.data.summary;
      setSummary(newSummary);

      // Add to history
      const historyItem = {
        id: Date.now(),
        fileName: fileName,
        date: new Date(),
        summary: newSummary,
        fileSize: fileSize
      };
      setSummaryHistory(prev => [historyItem, ...prev].slice(0, 10)); // Keep last 10 summaries

      // Clear file after successful upload
      setFile(null);
      setFileName("");
      setFileSize("");

    } catch (err) {
      console.error(t('summary.errors.uploadError'), err);
      if (err.code === "ECONNABORTED") {
        setError(t('summary.errors.timeout'));
      } else if (err.response) {
        setError(err.response.data.message || t('summary.errors.generationError'));
      } else {
        setError(t('summary.errors.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setFileName("");
    setFileSize("");
    setSummary("");
    setError("");
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    alert(t('summary.copiedToClipboard'));
  };

  const downloadSummary = () => {
    const element = document.createElement("a");
    const file = new Blob([summary], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${t('summary.downloadPrefix')}${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2 className="summary-title">
          <svg className="title-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
          {t('summary.title')}
        </h2>
        <p className="summary-subtitle">
          {t('summary.subtitle')}
        </p>
      </div>

      <div className="summary-content">
        {/* Upload Section */}
        <div className="upload-section">
          <div
            className={`drop-zone ${dragActive ? "drag-active" : ""}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-input"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
            <label htmlFor="file-input" className="upload-label">
              <div className="upload-icon">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div className="upload-text">
                {fileName ? (
                  <>
                    <strong>{fileName}</strong>
                    <span className="file-size">({fileSize})</span>
                  </>
                ) : (
                  <>
                    {t('summary.dropZone.text')} <span className="browse-link">{t('summary.dropZone.browse')}</span>
                  </>
                )}
              </div>
              <div className="upload-hint">
                {t('summary.dropZone.hint')}
              </div>
            </label>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                  <path d="M12 9v4"/>
                  <path d="M12 17h.01"/>
                </svg>
              </span>
              <span>{error}</span>
            </div>
          )}

          <div className="action-buttons">
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className={`btn-primary ${(!file || loading) ? "disabled" : ""}`}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  {t('summary.generating')}
                </>
              ) : (
                <>
                  <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
                  </svg>
                  {t('summary.generateSummary')}
                </>
              )}
            </button>

            {file && (
              <button onClick={handleClear} className="btn-secondary">
                <svg className="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
                {t('summary.clear')}
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <p>{t('summary.loading.analyzing')}</p>
            <p className="loading-hint">{t('summary.loading.hint')}</p>
          </div>
        )}

        {/* Summary Result */}
        {summary && !loading && (
          <div className="result-section">
            <div className="result-header">
              <h3>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", verticalAlign: "middle", marginRight: 8}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {t('summary.result.title')}
              </h3>
              <div className="result-actions">
                <button onClick={copyToClipboard} className="icon-btn" title={t('summary.result.copy')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                  </svg>
                </button>
                <button onClick={downloadSummary} className="icon-btn" title={t('summary.result.download')}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="summary-content-box">
              {summary.split("\n").map((line, index) => {
                const cleanLine = line.trim().replace(/\*\*/g, "");

                // detect titles automatically
                const isTitle =
                  cleanLine.endsWith(":") ||
                  cleanLine.toLowerCase().includes("introduction") ||
                  cleanLine.toLowerCase().includes("conclusion") ||
                  cleanLine.toLowerCase().includes("point") ||
                  cleanLine.toLowerCase().includes("important") ||
                  cleanLine.toLowerCase().includes("concept");

                if (isTitle) {
                  return (
                    <h2 key={index} className="summary-main-title">
                      {cleanLine}
                    </h2>
                  );
                }

                // bullet points
                if (
                  cleanLine.startsWith("*") ||
                  cleanLine.startsWith("-")
                ) {
                  return (
                    <li key={index} className="summary-list-item">
                      {cleanLine.replace(/^[-*]\s*/, "")}
                    </li>
                  );
                }

                // paragraph
                return cleanLine !== "" ? (
                  <p key={index} className="summary-paragraph">
                    {cleanLine}
                  </p>
                ) : null;
              })}
            </div>

            <div className="summary-stats">
              <div className="stat-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", verticalAlign: "middle", marginRight: 6}}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {t('summary.stats.words', { count: summary.split(" ").length })}
              </div>
              <div className="stat-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", verticalAlign: "middle", marginRight: 6}}>
                  <polyline points="4 7 4 4 20 4 20 7"/>
                  <line x1="9" y1="20" x2="15" y2="20"/>
                  <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
                {t('summary.stats.characters', { count: summary.length })}
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {summaryHistory.length > 0 && (
          <div className="history-section">
            <div
              className="history-header"
              onClick={() => setShowHistory(!showHistory)}
            >
              <h3>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display: "inline", verticalAlign: "middle", marginRight: 8}}>
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                  <path d="M3 3v5h5"/>
                  <path d="M12 7v5l4 2"/>
                </svg>
                {t('summary.history.title')}
              </h3>
              <button className="toggle-btn">
                {showHistory ? "▲" : "▼"}
              </button>
            </div>

            {showHistory && (
              <div className="history-list">
                {summaryHistory.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <div className="history-file-info">
                        <span className="history-file-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        </span>
                        <div>
                          <div className="history-file-name">{item.fileName}</div>
                          <div className="history-date">
                            {new Date(item.date).toLocaleString(t('summary.locale'))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSummary(item.summary)}
                        className="history-load-btn"
                      >
                        {t('summary.history.load')}
                      </button>
                    </div>
                    <div className="history-summary-preview">
                      {item.summary.substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Features Section */}
        <div className="features-section">
          <h3>{t('summary.features.title')}</h3>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8V4H8"/>
                  <rect width="16" height="12" x="4" y="8" rx="2"/>
                  <path d="M2 14h2"/>
                  <path d="M20 14h2"/>
                  <path d="M15 13v2"/>
                  <path d="M9 13v2"/>
                </svg>
              </span>
              <h4>{t('summary.features.ai.title')}</h4>
              <p>{t('summary.features.ai.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
              </span>
              <h4>{t('summary.features.fast.title')}</h4>
              <p>{t('summary.features.fast.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </span>
              <h4>{t('summary.features.secure.title')}</h4>
              <p>{t('summary.features.secure.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--brand-600)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/>
                  <path d="M12 18h.01"/>
                </svg>
              </span>
              <h4>{t('summary.features.responsive.title')}</h4>
              <p>{t('summary.features.responsive.description')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryTab;