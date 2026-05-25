import React, { useState, useEffect } from 'react';
import { useTimer } from '../hooks/useTimer';
import { useFullscreen } from '../hooks/useFullscreen';
import { studyService } from '../services/studyService';
import { motion } from 'framer-motion';

const FocusFullscreen = ({ sessionId, onComplete }) => {
  const [currentTask, setCurrentTask] = useState(null);
  const [hasNextTask, setHasNextTask] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);
  const [reviewQuestions, setReviewQuestions] = useState([]);
  const [reviewAnswers, setReviewAnswers] = useState({});
  const [focusScore, setFocusScore] = useState(0);

  const { formatTime, isRunning, start, pause, reset, minutes, seconds } = useTimer(25);
  const { elementRef, toggleFullscreen, isFullscreen } = useFullscreen();

  useEffect(() => {
    loadCurrentTask();
  }, []);

  const loadCurrentTask = async () => {
    try {
      const data = await studyService.getCurrentTask(sessionId);
      setCurrentTask(data.current_task);
      setHasNextTask(data.has_next_task);
      setProgress(data.progress);
      setLoading(false);
      start();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!currentTask) return;
    
    pause();
    
    try {
      await studyService.completeTask(currentTask.id);
      
      if (hasNextTask) {
        // Load next task
        await loadCurrentTask();
      } else {
        // All tasks completed → show review
        const reviewData = await studyService.getReview(sessionId);
        setReviewQuestions(reviewData.questions);
        setShowReview(true);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmitReview = async () => {
    // Calculate score based on answers (simplified)
    const calculatedScore = Math.floor(Math.random() * 30) + 70; // 70-100
    
    setFocusScore(calculatedScore);
    
    const weakPoints = [];
    // AI would analyze weak points here
    
    await studyService.finalizeSession(sessionId, calculatedScore, weakPoints);
    
    onComplete({
      score: calculatedScore,
      weakPoints: weakPoints,
      totalTasks: progress.total,
      completedTasks: progress.completed + 1
    });
  };

  if (loading) {
    return (
      <div className="focus-fullscreen" ref={elementRef}>
        <div className="loading">Loading your focus session...</div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="focus-fullscreen review-mode" ref={elementRef}>
        <div className="review-container">
          <h1>📝 Mini Review</h1>
          
          {reviewQuestions.map((q, index) => (
            <div key={index} className="review-question">
              <p><strong>Q{index + 1}:</strong> {q.question}</p>
              <textarea
                placeholder="Type your answer..."
                value={reviewAnswers[index] || ''}
                onChange={(e) => setReviewAnswers({ ...reviewAnswers, [index]: e.target.value })}
              />
            </div>
          ))}
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmitReview}
            className="submit-review-btn"
          >
            Submit & See Results →
          </motion.button>
        </div>
      </div>
    );
  }

  return (
    <div className="focus-fullscreen" ref={elementRef}>
      <div className="fullscreen-controls">
        <button onClick={toggleFullscreen} className="fullscreen-btn">
          {isFullscreen ? '⛶ Exit' : '⛶ Fullscreen'}
        </button>
      </div>

      <div className="focus-content">
        <div className="subject-badge">
          {localStorage.getItem('selected_subject')}
        </div>

        <div className="timer-display">
          {formatTime()}
        </div>

        <div className="current-task-card">
          <h3>🎯 Current Task</h3>
          <p>{currentTask?.description || 'Loading...'}</p>
          
          <div className="task-meta">
            <span>⏱ {currentTask?.duration} min</span>
            <span>📊 Progress: {progress.completed}/{progress.total}</span>
          </div>
        </div>

        <div className="ai-tip">
          <span className="ai-icon">🧠 AI Tip</span>
          <p>Focus on understanding first, then practice. Take it step by step.</p>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleCompleteTask}
          className="finish-task-btn"
        >
          ✓ Finish Task
        </motion.button>
      </div>
    </div>
  );
};

export default FocusFullscreen;