import React from "react";
import { motion } from "framer-motion";

const SubjectSelector = () => {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-slate-950 via-purple-950 to-black relative overflow-hidden">

      {/* BACKGROUND GLOW EFFECTS */}
      <div className="absolute w-[500px] h-[500px] bg-purple-600/20 blur-[120px] rounded-full top-10 left-10"></div>
      <div className="absolute w-[400px] h-[400px] bg-cyan-500/20 blur-[120px] rounded-full bottom-10 right-10"></div>

      {/* MAIN CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl relative z-10"
      >

        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-10 shadow-2xl">

          {/* TITLE */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-500 to-cyan-400 bg-clip-text text-transparent mb-6"
          >
            COMING SOON 🚀
          </motion.h1>

          {/* SUBTITLE */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl md:text-3xl text-white font-semibold mb-10"
          >
            Your AI Study Ecosystem
          </motion.p>

          {/* FEATURES */}
          <div className="space-y-5 text-gray-300 text-lg md:text-xl">

            <motion.p
              whileHover={{ scale: 1.05, x: 10 }}
              className="transition"
            >
              📚 AI Smart Learning Assistant
            </motion.p>

            <motion.p
              whileHover={{ scale: 1.05, x: 10 }}
            >
              🧠 AI Study Planner & Focus System
            </motion.p>

            <motion.p
              whileHover={{ scale: 1.05, x: 10 }}
            >
              🎯 AI Productivity & Exam Coach
            </motion.p>

          </div>

          {/* CTA GLOW BUTTON */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="mt-10"
          >
            <button className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-cyan-500 text-white font-semibold shadow-lg shadow-purple-500/30 hover:shadow-cyan-500/30 transition">
              Launch Preview
            </button>
          </motion.div>

        </div>
      </motion.div>
    </div>
  );
};

export default SubjectSelector;





