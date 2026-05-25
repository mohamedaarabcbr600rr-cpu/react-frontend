import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SubjectSelector from './components/SubjectSelector';
import DocumentUploader from './components/DocumentUploader';
import StudyPlanView from './components/StudyPlanView';
import FocusFullscreen from './components/FocusFullscreen';
import SessionAnalysis from './components/SessionAnalysis';
import './study-hub.css';

const StudyHub = () => {
  const [step, setStep] = useState('subject'); // subject, upload, plan, focus, analysis
  const [studyMaterial, setStudyMaterial] = useState(null);
  const [studyPlan, setStudyPlan] = useState(null);
  const [sessionData, setSessionData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  return (
    <div className="study-hub">
      <AnimatePresence mode="wait">
        {step === 'subject' && (
          <motion.div
            key="subject"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SubjectSelector onSelect={() => setStep('upload')} />
          </motion.div>
        )}

        {step === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <DocumentUploader
              onComplete={(material) => {
                setStudyMaterial(material);
                setStep('plan');
              }}
            />
          </motion.div>
        )}

        {step === 'plan' && studyMaterial && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <StudyPlanView
              material={studyMaterial}
              onStart={(plan, session) => {
                setStudyPlan(plan);
                setSessionData(session);
                setStep('focus');
              }}
            />
          </motion.div>
        )}

        {step === 'focus' && sessionData && (
          <FocusFullscreen
            sessionId={sessionData.session.id}
            onComplete={(analysis) => {
              setAnalysisData(analysis);
              setStep('analysis');
            }}
          />
        )}

        {step === 'analysis' && analysisData && (
          <motion.div
            key="analysis"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <SessionAnalysis
              data={analysisData}
              onNewSession={() => {
                setStep('subject');
                setStudyMaterial(null);
                setStudyPlan(null);
                setSessionData(null);
                setAnalysisData(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StudyHub;