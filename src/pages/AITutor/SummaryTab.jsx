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
          <span className="title-icon">📄</span>
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
              <div className="upload-icon">📁</div>
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
              <span className="error-icon">⚠️</span>
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
                  <span className="btn-icon">✨</span>
                  {t('summary.generateSummary')}
                </>
              )}
            </button>
            
            {file && (
              <button onClick={handleClear} className="btn-secondary">
                <span className="btn-icon">🗑️</span>
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
                <span className="result-icon">📝</span>
                {t('summary.result.title')}
              </h3>
              <div className="result-actions">
                <button onClick={copyToClipboard} className="icon-btn" title={t('summary.result.copy')}>
                  📋
                </button>
                <button onClick={downloadSummary} className="icon-btn" title={t('summary.result.download')}>
                  💾
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
                <span>{t('summary.stats.words', { count: summary.split(" ").length })}</span>
              </div>
              <div className="stat-badge">
                <span>{t('summary.stats.characters', { count: summary.length })}</span>
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
                <span className="history-icon">📜</span>
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
                        <span className="history-file-icon">📄</span>
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
              <span className="feature-icon">🤖</span>
              <h4>{t('summary.features.ai.title')}</h4>
              <p>{t('summary.features.ai.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">⚡</span>
              <h4>{t('summary.features.fast.title')}</h4>
              <p>{t('summary.features.fast.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🔒</span>
              <h4>{t('summary.features.secure.title')}</h4>
              <p>{t('summary.features.secure.description')}</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📱</span>
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






