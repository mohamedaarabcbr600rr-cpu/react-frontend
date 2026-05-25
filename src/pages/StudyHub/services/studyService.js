// src/pages/StudyHub/services/studyService.js
import axios from '../../../axios';  // الـ axios ديالك القديم

export const studyService = {
  uploadDocument: async (data) => {
    const formData = new FormData();
    formData.append('subject', data.subject);
    formData.append('title', data.title);
    if (data.file) formData.append('file', data.file);
    if (data.text) formData.append('text', data.text);
    
    // ✅ زدت /api في البداية
    const res = await axios.post('/api/study/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },

  generatePlan: async (materialId) => {
    // ✅ زدت /api
    const res = await axios.get(`/api/study/generate-plan/${materialId}`);
    return res.data;
  },

  startSession: async (studyMaterialId) => {
    // ✅ زدت /api
    const res = await axios.post('/api/focus/start', { study_material_id: studyMaterialId });
    return res.data;
  },

  getCurrentTask: async (sessionId) => {
    // ✅ زدت /api
    const res = await axios.get(`/api/focus/current-task/${sessionId}`);
    return res.data;
  },

  completeTask: async (taskId) => {
    // ✅ زدت /api
    const res = await axios.post('/api/focus/complete-task', { task_id: taskId });
    return res.data;
  },

  getReview: async (sessionId) => {
    // ✅ زدت /api
    const res = await axios.get(`/api/focus/review/${sessionId}`);
    return res.data;
  },

  finalizeSession: async (sessionId, focusScore, weakPoints) => {
    // ✅ زدت /api
    const res = await axios.post(`/api/focus/finalize/${sessionId}`, {
      focus_score: focusScore,
      weak_points: weakPoints
    });
    return res.data;
  },

  getHistory: async () => {
    // ✅ زدت /api
    const res = await axios.get('/api/focus/history');
    return res.data;
  }
};

