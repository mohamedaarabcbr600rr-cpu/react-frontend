import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import axios from "axios";

const QCMTab = () => {
  const [file, setFile] = useState(null);
  const [qcm, setQCM] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [qcmTitle, setQcmTitle] = useState("");
  const { t } = useTranslation();

  // 🔐 Récupérer le token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // 📡 Configuration axios avec token
  const axiosInstance = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL}/api`,
  });

  // Interceptor pour ajouter le token
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // دالة لتطبيع الإجابات (استخراج الحرف فقط)
  const normalizeAnswer = (answer) => {
    if (!answer) return "";
    const match = answer.toString().match(/^([A-Da-d])/);
    if (match) return match[1].toUpperCase();
    if (typeof answer === "number") {
      return String.fromCharCode(64 + answer);
    }
    return answer.toString().charAt(0).toUpperCase();
  };

  const validateFile = (file) => {
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError(t('qcm.errors.unsupportedFormat'));
      return false;
    }

    if (file.size > maxSize) {
      setError(t('qcm.errors.fileTooLarge'));
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
      // Reset all states when new file is selected
      setQCM([]);
      setAnswers({});
      setScore(null);
      setSubmitted(false);
      setShowResults(false);
      setQcmTitle("");
      setError("");
    } else {
      setFile(null);
      setFileName("");
    }
  };

  const generateQCM = async () => {
    if (!file) {
      setError(t('qcm.errors.noFileSelected'));
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setLoading(true);
    setError("");

    try {
      // ✅ Utiliser l'instance axios avec token
      const res = await axiosInstance.post(
        "/generate-qcm",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 120000,
        }
      );

      console.log("📥 Données du serveur:", res.data);
      
      if (res.data.success && res.data.qcm && res.data.qcm.questions) {
        res.data.qcm.questions.forEach((q, i) => {
          console.log(`${t('qcm.debug.question')} ${i+1}: ${t('qcm.debug.correctAnswer')} = "${q.correct}" (${t('qcm.debug.type')}: ${typeof q.correct})`);
        });
        
        setQCM(res.data.qcm.questions);
        setQcmTitle(res.data.qcm.title || t('qcm.defaultTitle'));
        setAnswers({});
        setScore(null);
        setSubmitted(false);
        setShowResults(false);
      } else {
        setError(t('qcm.errors.invalidFormat'));
        console.error("Structure inattendue:", res.data);
      }
      
    } catch (err) {
      console.error(t('qcm.errors.generateError'), err);
      
      if (err.code === "ECONNABORTED") {
        setError(t('qcm.errors.timeout'));
      } else if (err.response) {
        if (err.response.status === 401) {
          setError(t('qcm.errors.sessionExpired'));
        } else {
          setError(err.response.data.error || err.response.data.message || t('qcm.errors.generationError'));
        }
      } else if (err.message && err.message.includes("Node cannot be found")) {
        setError(t('qcm.errors.nodeError'));
      } else {
        setError(t('qcm.errors.connectionError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (qIndex, option) => {
    if (!submitted) {
      setAnswers({ ...answers, [qIndex]: option });
    }
  };

  const calculateScore = async () => {
    let correct = 0;
    let wrongAnswers = [];

    qcm.forEach((q, index) => {
      const userAnswer = answers[index];
      const correctAnswer = q.correct;
      
      const normalizedUser = normalizeAnswer(userAnswer);
      const normalizedCorrect = normalizeAnswer(correctAnswer);
      
      console.log(`${t('qcm.debug.question')} ${index + 1}:`, {
        userAnswer: userAnswer,
        correctAnswer: correctAnswer,
        normalizedUser: normalizedUser,
        normalizedCorrect: normalizedCorrect,
        isCorrect: normalizedUser === normalizedCorrect
      });
      
      if (normalizedUser === normalizedCorrect) {
        correct++;
      } else {
        wrongAnswers.push(q.question);
      }
    });

    const finalScore = Math.round((correct / qcm.length) * 100);
    setScore(finalScore);
    setSubmitted(true);
    setShowResults(true);

    try {
      const res = await axiosInstance.post("/save-score", {
        score: finalScore,
        total_questions: qcm.length,
        wrong_answers: wrongAnswers
      });
      
      console.log("✅ Score sauvegardé:", res.data);
      
      if (res.data.niveau) {
        console.log(`${t('qcm.debug.newLevel')}: ${res.data.niveau}`);
      }
      
    } catch (err) {
      console.error(t('qcm.errors.saveScoreError'), err);
      
      if (err.response && err.response.status === 401) {
        alert(t('qcm.errors.sessionExpiredSave'));
      } else {
        alert(t('qcm.errors.saveErrorDisplay'));
      }
    }
  };

  const resetQCM = () => {
    setQCM([]);
    setAnswers({});
    setScore(null);
    setSubmitted(false);
    setShowResults(false);
    setFile(null);
    setFileName("");
    setQcmTitle("");
    setError("");
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "excellent";
    if (score >= 60) return "good";
    if (score >= 40) return "average";
    return "poor";
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return t('qcm.scoreMessages.excellent');
    if (score >= 60) return t('qcm.scoreMessages.good');
    if (score >= 40) return t('qcm.scoreMessages.average');
    return t('qcm.scoreMessages.poor');
  };

  const getProgressColor = () => {
    const answeredCount = Object.keys(answers).length;
    const percentage = (answeredCount / qcm.length) * 100;
    if (percentage === 100) return "complete";
    if (percentage >= 50) return "partial";
    return "low";
  };

  return (
    <div className="qcm-container">
      <div className="qcm-header">
        <h2 className="qcm-title">
          <span className="title-icon">❓</span>
          {t('qcm.title')}
        </h2>
        <p className="qcm-subtitle">
          {t('qcm.subtitle')}
        </p>
      </div>

      <div className="qcm-content">
        {/* Upload Section */}
        {qcm.length === 0 && !loading && (
          <div className="upload-section">
            <div className="upload-card">
              <div className="upload-icon-large">📄</div>
              <h3>{t('qcm.upload.title')}</h3>
              <p>{t('qcm.upload.description')}</p>
              
              <div className="file-input-wrapper">
                <input
                  type="file"
                  id="file-input"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
                <label htmlFor="file-input" className="file-input-label">
                  <span className="file-input-icon">📁</span>
                  {fileName || t('qcm.upload.chooseFile')}
                </label>
                {fileName && (
                  <span className="file-name">{fileName}</span>
                )}
              </div>

              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{error}</span>
                  <button 
                    onClick={generateQCM} 
                    className="retry-btn"
                    style={{
                      marginLeft: "10px",
                      padding: "5px 10px",
                      backgroundColor: "#007bff",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    {t('qcm.retry')}
                  </button>
                </div>
              )}

              <button
                onClick={generateQCM}
                disabled={!file}
                className={`generate-btn ${!file ? "disabled" : ""}`}
              >
                <span className="btn-icon">✨</span>
                {t('qcm.generate')}
              </button>

              <div className="upload-hint">
                <small>{t('qcm.upload.supportedFormats')}</small>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            <div className="loading-animation">
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
              <div className="loading-dot"></div>
            </div>
            <p>{t('qcm.loading.title')}</p>
            <p className="loading-hint">{t('qcm.loading.hint')}</p>
          </div>
        )}

        {/* QCM Content */}
        {qcm.length > 0 && !loading && (
          <div className="qcm-section">
            <div className="qcm-info-bar">
              <div className="qcm-info">
                <span className="info-badge">📋 {qcmTitle}</span>
                <span className="info-badge">{t('qcm.info.questions', { count: qcm.length })}</span>
                <span className="info-badge">
                  {t('qcm.info.answered', { answered: Object.keys(answers).length, total: qcm.length })}
                </span>
              </div>
              <button onClick={resetQCM} className="reset-btn">
                {t('qcm.newQCM')}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="progress-section">
              <div className="progress-bar-container">
                <div 
                  className={`progress-bar-fill ${getProgressColor()}`}
                  style={{ width: `${(Object.keys(answers).length / qcm.length) * 100}%` }}
                ></div>
              </div>
              <span className="progress-text">
                {t('qcm.progress', { percentage: Math.round((Object.keys(answers).length / qcm.length) * 100) })}
              </span>
            </div>

            {/* Questions */}
            <div className="questions-container">
              {qcm.map((q, index) => {
                const options = q.options || [];
                
                return (
                  <div 
                    key={index} 
                    className={`question-card ${answers[index] ? "answered" : ""} ${submitted && normalizeAnswer(answers[index]) !== normalizeAnswer(q.correct) ? "wrong" : ""}`}
                  >
                    <div className="question-header">
                      <span className="question-number">{index + 1}</span>
                      <span className="question-text" dir="auto">{q.question}</span>
                      {submitted && (
                        <span className="question-status">
                          {normalizeAnswer(answers[index]) === normalizeAnswer(q.correct) ? "✅" : "❌"}
                        </span>
                      )}
                    </div>

                    <div className="options-container">
                      {options.map((opt, i) => {
                        const optionLetter = String.fromCharCode(65 + i); // A, B, C, D
                        const isSelected = answers[index] === optionLetter;
                        const isCorrect = submitted && optionLetter === normalizeAnswer(q.correct);
                        const isWrong = submitted && isSelected && optionLetter !== normalizeAnswer(q.correct);

                        return (
                          <label
                            key={i}
                            className={`option-label 
                              ${isSelected ? "selected" : ""} 
                              ${isCorrect ? "correct" : ""} 
                              ${isWrong ? "incorrect" : ""}
                              ${submitted ? "disabled" : ""}
                            `}
                            onClick={() => !submitted && handleAnswer(index, optionLetter)}
                          >
                            <div className="option-radio">
                              <input
                                type="radio"
                                name={`question-${index}`}
                                checked={isSelected}
                                onChange={() => {}}
                                disabled={submitted}
                              />
                              <span className="custom-radio"></span>
                            </div>
                            <div className="option-content">
                              <span className="option-letter">{optionLetter}.</span>
                              <span className="option-text" dir="auto">{opt}</span>
                            </div>
                            {submitted && isCorrect && (
                              <span className="option-badge correct-badge">{t('qcm.correctAnswer')}</span>
                            )}
                            {submitted && isWrong && (
                              <span className="option-badge wrong-badge">{t('qcm.yourChoice')}</span>
                            )}
                          </label>
                        );
                      })}
                    </div>

                    {submitted && normalizeAnswer(answers[index]) !== normalizeAnswer(q.correct) && (
                      <div className="explanation-box">
                        <span className="explanation-icon">💡</span>
                        <span>
                          {t('qcm.explanation', { 
                            letter: normalizeAnswer(q.correct), 
                            answer: options[normalizeAnswer(q.correct).charCodeAt(0) - 65] 
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Submit Button */}
            {!submitted && Object.keys(answers).length === qcm.length && (
              <div className="submit-section">
                <button onClick={calculateScore} className="submit-btn">
                  {t('qcm.submit')}
                </button>
              </div>
            )}

            {!submitted && Object.keys(answers).length < qcm.length && (
              <div className="incomplete-warning">
                <span className="warning-icon">⚠️</span>
                <span>{t('qcm.incomplete', { remaining: qcm.length - Object.keys(answers).length })}</span>
              </div>
            )}

            {/* Results Section */}
            {showResults && score !== null && (
              <div className="results-section">
                <div className={`results-card ${getScoreColor(score)}`}>
                  <div className="results-header">
                    <span className="results-icon">🎯</span>
                    <h3>{t('qcm.results.title')}</h3>
                  </div>
                  <div className="score-circle">
                    <span className="score-value">{score}%</span>
                  </div>
                  <p className="score-message">{getScoreMessage(score)}</p>
                  <div className="score-details">
                    <div className="detail-item">
                      <span>{t('qcm.results.correct')} :</span>
                      <strong>{Math.round((score / 100) * qcm.length)}/{qcm.length}</strong>
                    </div>
                    <div className="detail-item">
                      <span>{t('qcm.results.incorrect')} :</span>
                      <strong>{qcm.length - Math.round((score / 100) * qcm.length)}/{qcm.length}</strong>
                    </div>
                  </div>
                  <button onClick={() => setShowResults(false)} className="review-btn">
                    {t('qcm.results.review')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QCMTab;







