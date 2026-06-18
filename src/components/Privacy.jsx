import React, { useEffect } from "react";
import { LegalFooter } from "./About";
import "./LegalPages.css";

const LAST_UPDATED = "June 18, 2025";
const CONTACT_EMAIL = "privacy@studmo.com";

const Privacy = () => {
  useEffect(() => {
    document.title = "Privacy Policy — Studmo Student Network";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Studmo's Privacy Policy: how we collect, use, protect, and handle your personal data on the AI-powered student social network. GDPR-compliant and student-first.";

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://studmo.com/privacy";

    return () => { document.title = "Studmo"; };
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-hero legal-hero--compact">
        <div className="legal-hero__eyebrow">Legal</div>
        <h1 className="legal-hero__title">Privacy Policy</h1>
        <p className="legal-hero__subtitle">
          We are committed to protecting your privacy. This policy explains exactly what data we
          collect, why we collect it, and how you can control it.
        </p>
        <div className="legal-hero__meta">Last updated: {LAST_UPDATED}</div>
      </header>

      <div className="legal-container">

        {/* Intro */}
        <section className="legal-section legal-section--highlight">
          <p>
            Studmo ("we", "our", "us") operates <strong>studmo.com</strong>, an AI-powered student
            social network and learning platform. This Privacy Policy describes how we collect, use,
            disclose, and safeguard your personal information when you use our platform.
          </p>
          <p>
            By creating an account or using Studmo, you agree to the collection and use of
            information in accordance with this policy. If you do not agree, please do not use our
            platform.
          </p>
          <p>
            This policy applies to all users globally. Users located in the European Economic Area
            (EEA) benefit from additional rights under the General Data Protection Regulation (GDPR),
            which are described throughout this document.
          </p>
        </section>

        {/* Table of contents */}
        <nav className="legal-toc" aria-label="Table of contents">
          <h2 className="legal-toc__title">Contents</h2>
          <ol className="legal-toc__list">
            <li><a href="#data-we-collect">Information We Collect</a></li>
            <li><a href="#how-we-use-data">How We Use Your Information</a></li>
            <li><a href="#cookies">Cookies & Tracking Technologies</a></li>
            <li><a href="#data-sharing">Data Sharing & Disclosure</a></li>
            <li><a href="#data-retention">Data Retention</a></li>
            <li><a href="#data-security">Data Security</a></li>
            <li><a href="#user-rights">Your Rights & Choices</a></li>
            <li><a href="#gdpr">GDPR — Rights for EEA Users</a></li>
            <li><a href="#children">Children's Privacy</a></li>
            <li><a href="#ai-features">AI Features & Your Data</a></li>
            <li><a href="#changes">Changes to This Policy</a></li>
            <li><a href="#contact-privacy">Contact Us</a></li>
          </ol>
        </nav>

        {/* 1 — Data We Collect */}
        <section id="data-we-collect" className="legal-section" aria-labelledby="collect-heading">
          <h2 id="collect-heading" className="legal-section__title">1. Information We Collect</h2>

          <h3 className="legal-section__subtitle">1.1 Account Information</h3>
          <p>When you register for a Studmo account, we collect:</p>
          <ul className="legal-list">
            <li>Full name</li>
            <li>Email address</li>
            <li>Password (stored as a cryptographic hash — never in plain text)</li>
            <li>Profile picture (optional)</li>
            <li>Academic bio or headline (optional)</li>
            <li>University or institution (optional)</li>
          </ul>

          <h3 className="legal-section__subtitle">1.2 Content You Create</h3>
          <p>We collect and store content you actively create or upload, including:</p>
          <ul className="legal-list">
            <li>Posts, comments, and reactions you publish on the platform</li>
            <li>Documents, PDFs, and files you upload for AI processing</li>
            <li>AI-generated quizzes (QCM) and study summaries you create</li>
            <li>Messages sent through the platform</li>
            <li>Connections, followers, and following relationships</li>
          </ul>

          <h3 className="legal-section__subtitle">1.3 Usage Data</h3>
          <p>
            When you use Studmo, we automatically collect certain technical information, including:
          </p>
          <ul className="legal-list">
            <li>IP address</li>
            <li>Browser type and version</li>
            <li>Device type and operating system</li>
            <li>Pages visited and features used</li>
            <li>Timestamps and session duration</li>
            <li>Referring URLs</li>
          </ul>

          <h3 className="legal-section__subtitle">1.4 Communications</h3>
          <p>
            If you contact us via email or support channels, we retain those communications in order
            to respond to your inquiry and improve our service.
          </p>
        </section>

        {/* 2 — How We Use Data */}
        <section id="how-we-use-data" className="legal-section" aria-labelledby="use-heading">
          <h2 id="use-heading" className="legal-section__title">2. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul className="legal-list">
            <li><strong>Provide and operate the platform</strong> — authenticating your account, displaying your profile, enabling connections and posts.</li>
            <li><strong>Power AI features</strong> — processing uploaded documents to generate quizzes and summaries via AI services. Documents are processed transiently and are not used to train third-party models without your consent.</li>
            <li><strong>Personalize your experience</strong> — generating suggestions for students to follow and content relevant to your academic interests.</li>
            <li><strong>Communicate with you</strong> — sending account-related emails such as password resets, security alerts, and product updates. You can unsubscribe from non-essential communications at any time.</li>
            <li><strong>Ensure safety and security</strong> — detecting and preventing fraudulent activity, abuse, spam, and violations of our Terms of Service.</li>
            <li><strong>Improve the platform</strong> — analyzing aggregated, anonymized usage data to understand which features are most useful and how to improve them.</li>
            <li><strong>Comply with legal obligations</strong> — retaining data as required by applicable law and responding to lawful requests from authorities.</li>
          </ul>
          <p>
            <strong>We do not sell your personal data to third parties. Ever.</strong>
          </p>
        </section>

        {/* 3 — Cookies */}
        <section id="cookies" className="legal-section" aria-labelledby="cookies-heading">
          <h2 id="cookies-heading" className="legal-section__title">3. Cookies & Tracking Technologies</h2>

          <h3 className="legal-section__subtitle">3.1 What are cookies?</h3>
          <p>
            Cookies are small text files stored on your device when you visit a website. Studmo uses
            cookies and similar technologies (such as local storage) to operate the platform and
            improve your experience.
          </p>

          <h3 className="legal-section__subtitle">3.2 Types of cookies we use</h3>
          <ul className="legal-list">
            <li><strong>Essential cookies</strong> — Required for authentication and core platform functionality. These cannot be disabled without breaking the service.</li>
            <li><strong>Preference cookies</strong> — Remember your settings, language preferences, and UI configuration.</li>
            <li><strong>Analytics cookies</strong> — Help us understand how users interact with the platform, which pages are visited most, and where users encounter issues. This data is aggregated and anonymized.</li>
          </ul>

          <h3 className="legal-section__subtitle">3.3 Managing cookies</h3>
          <p>
            You can control cookies through your browser settings. Disabling essential cookies may
            affect your ability to log in and use core features of the platform. For non-essential
            cookies, we provide preference controls in your account settings.
          </p>
        </section>

        {/* 4 — Data Sharing */}
        <section id="data-sharing" className="legal-section" aria-labelledby="sharing-heading">
          <h2 id="sharing-heading" className="legal-section__title">4. Data Sharing & Disclosure</h2>
          <p>
            Studmo does not sell, rent, or trade your personal information. We share data only in
            the following limited circumstances:
          </p>
          <ul className="legal-list">
            <li>
              <strong>AI processing providers</strong> — When you use AI features (quiz generation, summaries), document content is transmitted to AI API providers (such as Groq, OpenRouter, or Google Gemini) solely for processing. These providers operate under strict data processing agreements and are not permitted to retain or use your data for their own purposes.
            </li>
            <li>
              <strong>Infrastructure providers</strong> — We use cloud hosting services (such as Railway) to run the platform. These providers access data only as necessary to provide their infrastructure services.
            </li>
            <li>
              <strong>Legal requirements</strong> — We may disclose your information if required to do so by law, court order, or government authority, or if we believe in good faith that such action is necessary to comply with a legal obligation, protect our rights, or prevent harm.
            </li>
            <li>
              <strong>Business transfers</strong> — In the event of a merger, acquisition, or sale of all or part of our assets, user data may be transferred as part of that transaction. You will be notified via email prior to any such transfer.
            </li>
          </ul>
        </section>

        {/* 5 — Retention */}
        <section id="data-retention" className="legal-section" aria-labelledby="retention-heading">
          <h2 id="retention-heading" className="legal-section__title">5. Data Retention</h2>
          <p>
            We retain your personal data only for as long as necessary to fulfill the purposes
            described in this policy:
          </p>
          <ul className="legal-list">
            <li><strong>Active accounts</strong> — Data is retained for the duration of your account's existence.</li>
            <li><strong>Deleted accounts</strong> — Upon account deletion, your profile, posts, and personal data are removed within 30 days, except where retention is required by law.</li>
            <li><strong>AI-processed documents</strong> — Files uploaded for AI processing are not stored permanently. They are processed transiently and deleted from AI provider systems immediately after processing is complete.</li>
            <li><strong>Backups</strong> — Deleted data may persist in encrypted backups for up to 90 days before being permanently purged.</li>
          </ul>
        </section>

        {/* 6 — Security */}
        <section id="data-security" className="legal-section" aria-labelledby="security-heading">
          <h2 id="security-heading" className="legal-section__title">6. Data Security</h2>
          <p>
            Protecting your data is a core responsibility we take seriously. Our security measures
            include:
          </p>
          <ul className="legal-list">
            <li>All data in transit is encrypted using TLS (HTTPS).</li>
            <li>Passwords are hashed using bcrypt — never stored in plain text.</li>
            <li>Database access is restricted to authenticated internal services only.</li>
            <li>API access is protected by token-based authentication (Laravel Sanctum).</li>
            <li>Regular security reviews and dependency audits.</li>
            <li>Secure hosting infrastructure with Railway, with environment variable isolation.</li>
          </ul>
          <p>
            Despite these measures, no system is completely secure. In the event of a data breach
            that affects your personal information, we will notify you as required by applicable law
            — within 72 hours for EEA users under GDPR.
          </p>
        </section>

        {/* 7 — User Rights */}
        <section id="user-rights" className="legal-section" aria-labelledby="rights-heading">
          <h2 id="rights-heading" className="legal-section__title">7. Your Rights & Choices</h2>
          <p>You have the following rights regarding your personal data on Studmo:</p>
          <ul className="legal-list">
            <li><strong>Access</strong> — You can view and download your account data at any time from your profile settings.</li>
            <li><strong>Correction</strong> — You can update your profile information directly in the platform.</li>
            <li><strong>Deletion</strong> — You can delete your account and request permanent data removal by contacting us at <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a>.</li>
            <li><strong>Portability</strong> — You can request a machine-readable export of your personal data.</li>
            <li><strong>Opt-out</strong> — You can opt out of non-essential communications through your notification settings.</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a>. We will
            respond within 30 days.
          </p>
        </section>

        {/* 8 — GDPR */}
        <section id="gdpr" className="legal-section legal-section--highlight" aria-labelledby="gdpr-heading">
          <div className="legal-section__badge">GDPR</div>
          <h2 id="gdpr-heading" className="legal-section__title">8. Rights for EEA Users (GDPR)</h2>
          <p>
            If you are located in the European Economic Area, you have additional rights under the
            General Data Protection Regulation (GDPR):
          </p>
          <ul className="legal-list">
            <li><strong>Right to be forgotten</strong> — You may request the complete erasure of your personal data.</li>
            <li><strong>Right to restriction of processing</strong> — You may request that we limit how we process your data in certain circumstances.</li>
            <li><strong>Right to object</strong> — You may object to processing based on our legitimate interests.</li>
            <li><strong>Right to lodge a complaint</strong> — You have the right to lodge a complaint with your local data protection authority.</li>
          </ul>
          <p>
            <strong>Legal basis for processing:</strong> We process your data on the basis of
            contract performance (operating your account), legitimate interests (platform security
            and improvement), and your consent (for optional features and communications).
          </p>
          <p>
            <strong>Data transfers:</strong> As an internationally operating platform, your data may
            be processed outside the EEA (e.g., by our AI processing providers). We ensure
            appropriate safeguards are in place, including Standard Contractual Clauses where
            required.
          </p>
        </section>

        {/* 9 — Children */}
        <section id="children" className="legal-section" aria-labelledby="children-heading">
          <h2 id="children-heading" className="legal-section__title">9. Children's Privacy</h2>
          <p>
            Studmo is intended for users who are at least 13 years of age. We do not knowingly
            collect personal information from children under 13. If you believe a child under 13
            has created an account, please contact us immediately at{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a> and we
            will promptly delete the account and associated data.
          </p>
          <p>
            In jurisdictions where the age of digital consent is higher (e.g., 16 in many EEA
            countries), we apply the higher threshold.
          </p>
        </section>

        {/* 10 — AI Features */}
        <section id="ai-features" className="legal-section" aria-labelledby="ai-heading">
          <h2 id="ai-heading" className="legal-section__title">10. AI Features & Your Data</h2>
          <p>
            Studmo uses AI services to power quiz generation and study summary features. Here is
            exactly how your data is handled in these workflows:
          </p>
          <ul className="legal-list">
            <li>When you upload a PDF or document, it is transmitted to an AI API provider for processing only.</li>
            <li>We do not store your uploaded documents on our servers after processing is complete.</li>
            <li>AI providers we use operate under data processing agreements that prohibit them from retaining or training on your uploaded content.</li>
            <li>The generated output (quiz, summary) belongs to you and is stored in your Studmo account.</li>
            <li>We do not use your uploaded documents to train Studmo's own AI models.</li>
          </ul>
        </section>

        {/* 11 — Changes */}
        <section id="changes" className="legal-section" aria-labelledby="changes-heading">
          <h2 id="changes-heading" className="legal-section__title">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically to reflect changes in our practices, legal
            requirements, or platform features. When we make material changes, we will:
          </p>
          <ul className="legal-list">
            <li>Update the "Last updated" date at the top of this page.</li>
            <li>Notify you by email if the change materially affects how we use your data.</li>
            <li>In some cases, ask for your explicit consent before applying the change.</li>
          </ul>
          <p>
            Continued use of Studmo after any change constitutes acceptance of the updated policy.
          </p>
        </section>

        {/* 12 — Contact */}
        <section id="contact-privacy" className="legal-section legal-section--highlight" aria-labelledby="contact-heading">
          <div className="legal-section__badge">Contact</div>
          <h2 id="contact-heading" className="legal-section__title">12. Contact Us</h2>
          <p>
            For any questions, concerns, or requests regarding this Privacy Policy or your personal
            data, please contact our privacy team:
          </p>
          <div className="legal-contact-block">
            <p><strong>Studmo Privacy Team</strong></p>
            <p>
              Email:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">
                {CONTACT_EMAIL}
              </a>
            </p>
            <p>Website: <a href="https://studmo.com" className="legal-link">studmo.com</a></p>
          </div>
          <p>We aim to respond to all privacy-related requests within <strong>30 calendar days</strong>.</p>
        </section>

      </div>

      <LegalFooter />
    </div>
  );
};

export default Privacy;
