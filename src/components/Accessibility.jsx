import React, { useEffect } from "react";
import { LegalFooter } from "./About";
import "./LegalPages.css";

const CONTACT_EMAIL = "accessibility@studmo.com";

const Accessibility = () => {
  useEffect(() => {
    document.title = "Accessibility — Studmo Student Network";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Studmo's commitment to accessibility in education technology: our standards, current status, and roadmap for making AI-powered student learning inclusive for all.";

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://studmo.com/accessibility";

    return () => { document.title = "Studmo"; };
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-hero">
        <div className="legal-hero__eyebrow">Accessibility</div>
        <h1 className="legal-hero__title">
          Education should be<br />
          <span className="legal-hero__accent">accessible to everyone.</span>
        </h1>
        <p className="legal-hero__subtitle">
          We are committed to making Studmo accessible to all students — regardless of disability,
          learning difference, device, or bandwidth. This page outlines our accessibility standards,
          current implementation, and ongoing roadmap.
        </p>
      </header>

      <div className="legal-container">

        {/* Statement */}
        <section className="legal-section legal-section--highlight" aria-labelledby="statement-heading">
          <div className="legal-section__badge">Our Commitment</div>
          <h2 id="statement-heading" className="legal-section__title">
            Accessibility is not an afterthought — it's a core design principle.
          </h2>
          <p>
            Studmo is built for all students. We recognize that students with visual impairments,
            motor disabilities, cognitive differences, or those accessing our platform from
            low-bandwidth or low-spec devices deserve the same quality of experience as anyone else.
          </p>
          <p>
            We are actively working toward conformance with the{" "}
            <strong>Web Content Accessibility Guidelines (WCAG) 2.1 Level AA</strong>, the
            international standard for web accessibility. As a platform in active development, we
            acknowledge there is ongoing work to do — and we commit to full transparency about where
            we are and where we're going.
          </p>
        </section>

        {/* Standards */}
        <section className="legal-section" aria-labelledby="standards-heading">
          <h2 id="standards-heading" className="legal-section__title">Standards We Follow</h2>

          <h3 className="legal-section__subtitle">WCAG 2.1 — Web Content Accessibility Guidelines</h3>
          <p>
            WCAG 2.1 is the international benchmark for accessible web content. It is organized
            around four principles: Perceivable, Operable, Understandable, and Robust (POUR). Our
            goal is to meet Level AA requirements across all core platform features.
          </p>

          <h3 className="legal-section__subtitle">WAI-ARIA</h3>
          <p>
            We use WAI-ARIA (Accessible Rich Internet Applications) attributes in our React
            components to make dynamic content and interactive UI elements accessible to assistive
            technologies, including screen readers.
          </p>

          <h3 className="legal-section__subtitle">Semantic HTML</h3>
          <p>
            We use proper semantic HTML elements throughout the platform — headings, landmarks,
            lists, buttons, and form labels — to provide a clear and navigable document structure
            that assistive technologies can interpret correctly.
          </p>
        </section>

        {/* What we've done */}
        <section className="legal-section" aria-labelledby="done-heading">
          <h2 id="done-heading" className="legal-section__title">What We've Implemented</h2>

          <div className="legal-features-grid">
            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🎨</div>
              <h3>Color Contrast</h3>
              <p>
                UI text and interactive elements meet or exceed WCAG AA contrast ratios (4.5:1 for
                normal text, 3:1 for large text), ensuring legibility for users with low vision or
                color vision deficiencies.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">⌨️</div>
              <h3>Keyboard Navigation</h3>
              <p>
                Core platform interactions — navigation, posting, following users, and accessing
                features — are operable via keyboard alone. We maintain visible focus indicators
                for all interactive elements.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🏷️</div>
              <h3>ARIA Labels & Roles</h3>
              <p>
                Interactive components such as modals, buttons, and navigation menus include
                appropriate ARIA labels and roles, making them correctly announced by screen readers
                such as NVDA, VoiceOver, and JAWS.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">📱</div>
              <h3>Responsive Design</h3>
              <p>
                Studmo is fully responsive across mobile, tablet, and desktop viewports. The
                interface adapts to different screen sizes, orientations, and zoom levels — up to
                200% zoom without loss of functionality.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">🖼️</div>
              <h3>Alternative Text</h3>
              <p>
                Images on the platform include descriptive alt text. Profile pictures include the
                user's name as an alternative, ensuring that users of screen readers receive
                meaningful descriptions of visual content.
              </p>
            </article>

            <article className="legal-feature-card">
              <div className="legal-feature-card__icon">✍️</div>
              <h3>Form Accessibility</h3>
              <p>
                All forms — including login, registration, and profile editing — use explicit labels,
                error messages associated with their respective fields, and logical tab order.
              </p>
            </article>
          </div>
        </section>

        {/* Known limitations */}
        <section className="legal-section" aria-labelledby="limitations-heading">
          <h2 id="limitations-heading" className="legal-section__title">Known Limitations & Ongoing Work</h2>
          <p>
            We believe in transparency. The following are known areas where our accessibility
            implementation is still in progress. These are active items on our development roadmap:
          </p>
          <ul className="legal-list">
            <li>
              <strong>PDF processing UI</strong> — The document upload and AI processing flow
              requires additional ARIA live region announcements to properly notify screen reader
              users of processing status and results.
            </li>
            <li>
              <strong>Complex interactive components</strong> — Some newer UI elements in the Focus
              Hub are undergoing accessibility review and improvement.
            </li>
            <li>
              <strong>Video and audio content</strong> — As we introduce multimedia content,
              captions and transcripts will be provided. This feature is on our roadmap.
            </li>
            <li>
              <strong>Reduced motion</strong> — We are implementing support for the
              <code>prefers-reduced-motion</code> CSS media query to disable animations for users
              who are sensitive to motion.
            </li>
            <li>
              <strong>Automated accessibility testing</strong> — We are integrating automated
              accessibility tests (Axe, Lighthouse) into our CI/CD pipeline to catch regressions
              earlier in development.
            </li>
          </ul>
        </section>

        {/* Roadmap */}
        <section className="legal-section legal-section--highlight" aria-labelledby="roadmap-heading">
          <div className="legal-section__badge">Roadmap</div>
          <h2 id="roadmap-heading" className="legal-section__title">Accessibility Roadmap</h2>
          <p>Planned accessibility improvements for Studmo include:</p>
          <ul className="legal-list">
            <li>Full WCAG 2.1 Level AA audit and remediation by end of 2025.</li>
            <li>Screen reader compatibility testing across NVDA (Windows), VoiceOver (macOS/iOS), and TalkBack (Android).</li>
            <li>High-contrast mode toggle in user settings.</li>
            <li>Dyslexia-friendly font option (OpenDyslexic or similar).</li>
            <li>Text size adjustment controls within the platform UI.</li>
            <li>Reduced motion preference detection and application across all animations.</li>
            <li>Closed caption support for any video content introduced.</li>
            <li>Third-party accessibility audit by 2026 with public disclosure of findings.</li>
          </ul>
        </section>

        {/* AI & Accessibility */}
        <section className="legal-section" aria-labelledby="ai-access-heading">
          <h2 id="ai-access-heading" className="legal-section__title">AI Features & Accessibility</h2>
          <p>
            We believe AI can be a powerful equalizer in education. Studmo's AI tools are designed
            with accessibility in mind:
          </p>
          <ul className="legal-list">
            <li>
              <strong>AI study summaries</strong> can assist students with reading difficulties,
              dyslexia, or cognitive processing differences by condensing dense academic text into
              structured, digestible formats.
            </li>
            <li>
              <strong>AI quizzes</strong> can support students with memory-related challenges by
              providing repeated, low-stakes practice that adapts to their material.
            </li>
            <li>
              <strong>AI learning assistant</strong> provides a conversational interface that
              removes barriers for students who struggle with traditional academic formats.
            </li>
          </ul>
          <p>
            We are exploring how AI can further reduce barriers — including potential features for
            text-to-speech integration, simplified-language modes, and personalized cognitive
            support.
          </p>
        </section>

        {/* Assistive Tech */}
        <section className="legal-section" aria-labelledby="assistive-heading">
          <h2 id="assistive-heading" className="legal-section__title">Assistive Technology Compatibility</h2>
          <p>
            We test Studmo for compatibility with the following assistive technologies:
          </p>
          <ul className="legal-list">
            <li>NVDA with Google Chrome (Windows)</li>
            <li>VoiceOver with Safari (macOS and iOS)</li>
            <li>TalkBack with Chrome (Android)</li>
            <li>Windows Narrator with Edge (Windows)</li>
            <li>Zoom text magnification tools</li>
          </ul>
          <p>
            If you encounter issues using Studmo with an assistive technology not listed above,
            please let us know so we can investigate and improve.
          </p>
        </section>

        {/* Feedback */}
        <section className="legal-section legal-section--highlight" aria-labelledby="feedback-heading">
          <div className="legal-section__badge">Feedback</div>
          <h2 id="feedback-heading" className="legal-section__title">Report an Accessibility Issue</h2>
          <p>
            We actively want to hear from users who encounter accessibility barriers on Studmo. Your
            feedback directly shapes our development priorities.
          </p>
          <p>To report an issue or request an accommodation:</p>
          <div className="legal-contact-block">
            <p><strong>Studmo Accessibility Team</strong></p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
          <p>Please include in your report:</p>
          <ul className="legal-list">
            <li>The page or feature where you encountered the issue.</li>
            <li>The assistive technology and browser/device you are using.</li>
            <li>A description of the expected and actual behavior.</li>
          </ul>
          <p>
            We aim to acknowledge accessibility reports within <strong>5 business days</strong> and
            provide an initial response with a remediation plan.
          </p>
          <p>
            Studmo does not tolerate discrimination of any kind. Users with disabilities have the
            same rights to full platform access as all other users, and we are committed to
            removing any barriers that stand in the way of that.
          </p>
        </section>

      </div>

      <LegalFooter />
    </div>
  );
};

export default Accessibility;
