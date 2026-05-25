import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { studyService } from '../services/studyService';

const StudyPlanView = ({ material, onStart }) => {
  const [plan, setPlan] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    loadPlan();
  }, []);

  const loadPlan = async () => {
    try {
      const data = await studyService.generatePlan(material.id);
      setPlan(data.plan);
      setTasks(data.tasks);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      const session = await studyService.startSession(material.id);
      onStart(plan, session);
    } catch (error) {
      console.error(error);
      alert('Failed to start session');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="study-plan-view">
        <div className="loading-spinner">🤖 AI is creating your study plan...</div>
      </div>
    );
  }

  return (
    <div className="study-plan-view">
      <h1>📋 AI Study Plan</h1>
      <p className="material-title">For: {material.title}</p>

      <div className="tasks-list">
        <h3>Your personalized plan:</h3>
        {tasks.map((task, index) => (
          <motion.div
            key={task.id}
            className="plan-task"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="task-number">{index + 1}</div>
            <div className="task-content">
              <p>{task.description}</p>
              <span className="task-duration">⏱ {task.duration} min</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="plan-summary">
        <p>📊 Total: {tasks.length} tasks</p>
        <p>⏱ Total time: {tasks.reduce((sum, t) => sum + t.duration, 0)} minutes</p>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleStart}
        disabled={starting}
        className="start-session-btn"
      >
        {starting ? '⏳ Starting...' : '🎯 Start Focus Session'}
      </motion.button>
    </div>
  );
};

export default StudyPlanView;
