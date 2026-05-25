import React, { useState } from 'react';
import { motion } from 'framer-motion';

const MiniReview = ({ questions, onSubmit }) => {
  const [answers, setAnswers] = useState({});

  const handleSubmit = () => {
    onSubmit(answers);
  };

  return (
    <div className="mini-review">
      <h2>📝 Quick Review</h2>
      <p>Answer these questions to complete your session:</p>

      {questions.map((q, index) => (
        <div key={index} className="review-question">
          <label>{q.question}</label>
          <textarea
            placeholder="Type your answer..."
            value={answers[index] || ''}
            onChange={(e) => setAnswers({ ...answers, [index]: e.target.value })}
          />
        </div>
      ))}

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleSubmit}
        className="submit-review"
      >
        Submit Review
      </motion.button>
    </div>
  );
};

export default MiniReview;





