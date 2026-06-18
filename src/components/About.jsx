import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import "./LegalPages.css";

const About = () => {
  useEffect(() => {
    document.title = "About Studmo — AI-Powered Student Social Network & Learning Platform";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Studmo is the AI-powered student social network where students connect, share knowledge, generate AI quizzes, create study summaries, and accelerate academic success. Built for the next generation of learners.";

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://studmo.com/about";

    return () => {
      document.title = "Studmo";
    };
  }, []);

  return (
    <div className="legal-page">
      {/* Hero */}
      <header className="legal-hero">
        <div className="legal-hero__eyebrow">About Studmo</div>
        <h1 className="legal-hero__title">
          The student social network<br />
          <span className="legal-hero__accent">built around your learning.</span>
        </h1>
        <p className="legal-hero__subtitle">
          Studmo combines a student community with AI-powered learning tools — so students don't just
          connect, they grow together.
        </p>
      </header>

      <div className="legal-container">

        {/* Mission */}
        <section className="legal-section legal-section--highlight" aria-labelledby="mission-heading">
          <div className="legal-section__badge">Our Mission</div>
          <h2 id="mission-heading" className="legal-section__title">
            Making quality learning accessible to every student on Earth.
          </h2>
          <p>
            Millions of students study alone, without the right tools, mentors, or community. Studmo
            exists to change that. We believe that when students connect around knowledge — not just
            socializing — they learn faster, retain more, and reach further than they ever could alone.
          </p>
          <p>
            We build at the intersection of <strong>social networking</strong> and{" "}
            <strong>artificial intelligence</strong> to give every student — regardless of their
            institution, country, or economic background — access to the tools and community that
            elite students take for granted.
          </p>
        </section>

        {/* What is Studmo */}
        <section className="legal-section" aria-labelledby="what-heading">
          <h2 id="what-heading" className="legal-section__title">What is Studmo?</h2>
          <p>
            Studmo is an <strong>AI-powered student social network</strong> currently in beta,
            designed exclusively for students and learners at all levels. Unlike generic social
            platforms, every feature on Studmo is purpose-built around one goal: helping students
            learn better together.
          </p>
          <p>
            Our platform lets students share academic posts and insights, follow peers in their
            field, collaborate on subjects, and leverage cutting-edge AI tools to turn their study
            materials into interactive learning experiences — all in one place.
          </p>

          <h3 className="legal-section__subtitle">A platform built for students, by students.</h3>
          <p>
            Studmo was born from the frustration of studying in isolation. Notes scattered across
            apps. Quizzes made by hand. Communities that don't understand academic life. We set out
            to build something different: a focused, distraction-free environment where academic
            growth is the center of gravity.
          </p>
        </section>

        {/* Key Features */}
        <section className="legal-section" aria-labelledby="features-heading">
          <h2 id="features-heading" className="legal-section__title">Core Features</h2>
          <p>
            Studmo is much more than a feed. Here's what students can do on the platform today:
          </p>

          <div className="legal-features-grid">
            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🤝</div>
              <h3>Student Social Network</h3>
              <p>
                Connect with students from your institution and beyond. Follow, interact, and build
                meaningful academic relationships. Share posts, knowledge, and achievements with a
                community that understands student life.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🧠</div>
              <h3>AI Quiz Generator (QCM)</h3>
              <p>
                Upload a lesson, textbook chapter, or PDF, and Studmo's AI generates a tailored
                multiple-choice quiz in seconds. Practice smarter, identify gaps faster, and prepare
                for exams with confidence.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">📝</div>
              <h3>AI Study Summaries</h3>
              <p>
                Transform dense lecture notes and academic documents into clear, structured summaries
                powered by AI. Save hours of manual work and focus on understanding, not transcribing.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🎯</div>
              <h3>Focus Hub & AI Learning Assistant</h3>
              <p>
                A dedicated learning environment with a smart AI assistant, a study planner, and a
                productivity coach — built to help students stay focused, plan effectively, and
                perform at their best during exams.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🌐</div>
              <h3>Student Community Network</h3>
              <p>
                Discover students in your field, explore academic discussions, and grow your network
                organically around shared subjects and goals — not random algorithmic content.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🚀</div>
              <h3>Academic Growth Tools</h3>
              <p>
                From exam coaching to personalized learning paths, Studmo gives students the
                infrastructure to track progress, stay motivated, and build the academic habits that
                lead to real results.
              </p>
            </article>
          </div>
        </section>

        {/* Why Studmo */}
        <section className="legal-section" aria-labelledby="why-heading">
          <h2 id="why-heading" className="legal-section__title">Why Studmo Exists</h2>
          <p>
            The EdTech space is full of content platforms, video courses, and flashcard apps. But
            there's a gap no one has truly filled: a <strong>social, community-first learning platform</strong>{" "}
            that integrates AI tools directly into the student's daily workflow.
          </p>
          <p>
            Students don't just need more content — they need context. They need to know other
            students are working on the same problems. They need tools that meet them where they are,
            in the format their notes are already in. They need a platform that respects their time
            and accelerates their effort.
          </p>
          <p>
            That is exactly what Studmo is being built to be.
          </p>

          <h3 className="legal-section__subtitle">Why now?</h3>
          <p>
            AI has reached a level of capability that makes it genuinely useful for education — not
            just as a novelty, but as a real force multiplier for student performance. At the same
            time, the student demographic is more digitally native, more globally connected, and more
            willing to learn through community than any previous generation.
          </p>
          <p>
            The timing is right. The technology is ready. Students deserve better tools.
          </p>
        </section>

        {/* Vision */}
        <section className="legal-section legal-section--highlight" aria-labelledby="vision-heading">
          <div className="legal-section__badge">Future Vision</div>
          <h2 id="vision-heading" className="legal-section__title">
            Building the world's most impactful student platform.
          </h2>
          <p>
            Today, Studmo is in beta. Tomorrow, we aim to be the default home for students who take
            their education seriously — a platform that spans universities, countries, and disciplines.
          </p>
          <p>Our roadmap includes:</p>
          <ul className="legal-list">
            <li>University and institution partnerships for verified student credentials</li>
            <li>Peer tutoring and mentorship marketplaces within the network</li>
            <li>AI-powered personalized learning paths adapted to each student's curriculum</li>
            <li>Group study rooms with real-time collaboration and AI facilitation</li>
            <li>Multilingual support to serve students globally — including Arabic, French, Spanish, and more</li>
            <li>Integration with LMS platforms like Moodle and Canvas</li>
            <li>Research paper discovery and academic citation tools</li>
            <li>Career tools connecting students with internships and graduate opportunities</li>
          </ul>
          <p>
            Studmo is not just building a product. We're building the infrastructure for a new
            generation of learners to reach their full potential — together.
          </p>
        </section>

        {/* Team / Founding */}
        <section className="legal-section" aria-labelledby="team-heading">
          <h2 id="team-heading" className="legal-section__title">Built in the open, growing fast.</h2>
          <p>
            Studmo is currently being built by a lean, dedicated founding team that believes in
            radical transparency and learning in public. We're in beta, actively gathering feedback
            from our first cohort of students, and iterating fast.
          </p>
          <p>
            We welcome students, educators, researchers, and partners who believe in our mission to
            reach out, collaborate, and help shape the future of Studmo.
          </p>
          <p>
            Want to get involved?{" "}
            <a href="mailto:contact@studmo.com" className="legal-link">
              contact@studmo.com
            </a>
          </p>
        </section>

        {/* CTA */}
        <section className="legal-cta" aria-labelledby="cta-heading">
          <h2 id="cta-heading" className="legal-cta__title">
            Join the student learning revolution.
          </h2>
          <p className="legal-cta__text">
            Studmo is free and open to all students. Be among the first to experience the future of
            student social learning.
          </p>
          <div className="legal-cta__actions">
            <Link to="/" className="legal-cta__btn legal-cta__btn--primary">
              Get Started Free
            </Link>
            <a href="mailto:contact@studmo.com" className="legal-cta__btn legal-cta__btn--secondary">
              Contact Us
            </a>
          </div>
        </section>

      </div>

      <LegalFooter />
    </div>
  );
};

export const LegalFooter = () => (
  <footer className="legal-page-footer">
    <div className="legal-page-footer__inner">
      <div className="legal-page-footer__brand">
        <strong>Studmo</strong> — AI-Powered Student Network
      </div>
      <nav className="legal-page-footer__links" aria-label="Legal pages">
        <Link to="/about">About</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/terms">Terms of Service</Link>
        <Link to="/privacy">Privacy Policy</Link>
      </nav>
      <p className="legal-page-footer__copy">
        © {new Date().getFullYear()} Studmo. All rights reserved.
      </p>
    </div>
  </footer>
);

export default About;
