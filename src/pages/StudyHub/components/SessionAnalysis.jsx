import React from 'react';
import { motion } from 'framer-motion';

const SessionAnalysis = ({ data, onNewSession }) => {
  const getScoreColor = (score) => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    return '#ef4444';
  };

  const getScoreMessage = (score) => {
    if (score >= 80) return 'Excellent work! 🔥';
    if (score >= 60) return 'Good progress! Keep going! ⚡';
    return 'Keep practicing, you will improve! 💪';
  };

  return (
    <div className="session-analysis">
      <h1>📊 Session Complete!</h1>

      <div className="score-circle" style={{ borderColor: getScoreColor(data.score) }}>
        <span className="score-number">{data.score}%</span>
        <span className="score-label">Focus Score</span>
      </div>

      <p className="score-message">{getScoreMessage(data.score)}</p>

      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-value">{data.totalTasks}</span>
          <span className="stat-label">Total Tasks</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.completedTasks}</span>
          <span className="stat-label">Completed</span>
        </div>
      </div>

      {data.weakPoints && data.weakPoints.length > 0 && (
        <div className="weak-points">
          <h3>📌 Areas to improve:</h3>
          <ul>
            {data.weakPoints.map((point, i) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="action-buttons">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewSession}
          className="new-session-btn"
        >
          📚 New Study Session
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/dashboard'}
          className="dashboard-btn"
        >
          📊 View Dashboard
        </motion.button>
      </div>
    </div>
  );
};

export default SessionAnalysis;
