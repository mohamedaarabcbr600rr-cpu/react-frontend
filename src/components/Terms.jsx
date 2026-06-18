import React, { useEffect } from "react";
import { LegalFooter } from "./About";
import "./LegalPages.css";

const LAST_UPDATED = "June 18, 2025";
const CONTACT_EMAIL = "legal@studmo.com";

const Terms = () => {
  useEffect(() => {
    document.title = "Terms of Service — Studmo Student Network";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content =
      "Studmo Terms of Service: understand your rights and responsibilities as a student on our AI-powered learning platform. Community guidelines, content ownership, and usage policies.";

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = "https://studmo.com/terms";

    return () => { document.title = "Studmo"; };
  }, []);

  return (
    <div className="legal-page">
      <header className="legal-hero legal-hero--compact">
        <div className="legal-hero__eyebrow">Legal</div>
        <h1 className="legal-hero__title">Terms of Service</h1>
        <p className="legal-hero__subtitle">
          Please read these terms carefully before using Studmo. By accessing or using our platform,
          you agree to be bound by these terms.
        </p>
        <div className="legal-hero__meta">Last updated: {LAST_UPDATED}</div>
      </header>

      <div className="legal-container">

        {/* Intro */}
        <section className="legal-section legal-section--highlight">
          <p>
            These Terms of Service ("Terms") govern your access to and use of Studmo ("platform",
            "service"), operated by Studmo ("we", "us", "our") at{" "}
            <a href="https://studmo.com" className="legal-link">studmo.com</a>. By creating an
            account or using any part of our platform, you agree to these Terms in full.
          </p>
          <p>
            If you do not agree to these Terms, you may not access or use the Studmo platform. We
            reserve the right to update these Terms at any time, with notice provided to registered
            users.
          </p>
        </section>

        {/* TOC */}
        <nav className="legal-toc" aria-label="Table of contents">
          <h2 className="legal-toc__title">Contents</h2>
          <ol className="legal-toc__list">
            <li><a href="#eligibility">Eligibility</a></li>
            <li><a href="#account">Account Registration & Security</a></li>
            <li><a href="#user-responsibilities">User Responsibilities</a></li>
            <li><a href="#community-guidelines">Community Guidelines</a></li>
            <li><a href="#prohibited-behavior">Prohibited Behavior</a></li>
            <li><a href="#content-ownership">Content Ownership & License</a></li>
            <li><a href="#ai-features">AI Features — Terms of Use</a></li>
            <li><a href="#intellectual-property">Studmo Intellectual Property</a></li>
            <li><a href="#account-termination">Account Suspension & Termination</a></li>
            <li><a href="#disclaimers">Disclaimers</a></li>
            <li><a href="#liability">Limitation of Liability</a></li>
            <li><a href="#governing-law">Governing Law</a></li>
            <li><a href="#contact-legal">Contact Us</a></li>
          </ol>
        </nav>

        {/* 1 — Eligibility */}
        <section id="eligibility" className="legal-section" aria-labelledby="eligibility-heading">
          <h2 id="eligibility-heading" className="legal-section__title">1. Eligibility</h2>
          <p>
            To use Studmo, you must be at least 13 years old. In jurisdictions where the minimum age
            for digital consent is higher, the higher age applies. By using Studmo, you represent
            and warrant that you meet this requirement.
          </p>
          <p>
            Studmo is designed for students, educators, and learners. While anyone who meets the age
            requirement may register, the platform is optimized for academic use. We reserve the
            right to limit access to non-educational commercial entities.
          </p>
        </section>

        {/* 2 — Account */}
        <section id="account" className="legal-section" aria-labelledby="account-heading">
          <h2 id="account-heading" className="legal-section__title">2. Account Registration & Security</h2>
          <p>
            You must provide accurate and complete information when registering. You are responsible
            for maintaining the confidentiality of your account credentials and for all activity that
            occurs under your account.
          </p>
          <ul className="legal-list">
            <li>You may only register one account per person. Multiple accounts are prohibited.</li>
            <li>You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a> if you believe your account has been compromised.</li>
            <li>You are solely responsible for any actions taken through your account.</li>
            <li>You may not share, sell, or transfer your account to another person.</li>
          </ul>
        </section>

        {/* 3 — User Responsibilities */}
        <section id="user-responsibilities" className="legal-section" aria-labelledby="responsibilities-heading">
          <h2 id="responsibilities-heading" className="legal-section__title">3. User Responsibilities</h2>
          <p>As a Studmo user, you agree to:</p>
          <ul className="legal-list">
            <li>Use the platform only for lawful, educational, and legitimate purposes.</li>
            <li>Represent yourself honestly — no impersonation of other students, educators, or institutions.</li>
            <li>Respect the intellectual property rights of others when sharing content.</li>
            <li>Comply with all applicable local, national, and international laws and regulations.</li>
            <li>Use AI-generated outputs (quizzes, summaries) responsibly and in compliance with your institution's academic integrity policies.</li>
            <li>Not use AI-generated content to commit academic fraud, plagiarism, or dishonesty.</li>
            <li>Report content or behavior that violates these Terms using available reporting tools.</li>
          </ul>
        </section>

        {/* 4 — Community Guidelines */}
        <section id="community-guidelines" className="legal-section legal-section--highlight" aria-labelledby="guidelines-heading">
          <div className="legal-section__badge">Community</div>
          <h2 id="guidelines-heading" className="legal-section__title">4. Community Guidelines</h2>
          <p>
            Studmo is a community built on respect, knowledge-sharing, and academic growth. To
            maintain a safe and productive environment for all students, we ask every member to
            uphold these standards:
          </p>

          <h3 className="legal-section__subtitle">Be respectful</h3>
          <p>
            Treat every member with dignity. Disagreement is fine — harassment, personal attacks,
            and discrimination are not. This includes discrimination based on race, gender, sexual
            orientation, religion, nationality, disability, or academic background.
          </p>

          <h3 className="legal-section__subtitle">Share knowledge, not misinformation</h3>
          <p>
            Prioritize accuracy. If you're unsure about a fact or academic claim, say so. Do not
            deliberately spread false or misleading academic information.
          </p>

          <h3 className="legal-section__subtitle">Support each other</h3>
          <p>
            Studmo exists to help students succeed. Actively support your peers, share what you know,
            and contribute to an environment where everyone feels they can ask questions and grow.
          </p>

          <h3 className="legal-section__subtitle">Keep it academic</h3>
          <p>
            This is a learning platform. While personality and community are valued, keep
            engagement focused on academic subjects, learning, and student life. Off-topic
            commercial promotion is not permitted.
          </p>
        </section>

        {/* 5 — Prohibited Behavior */}
        <section id="prohibited-behavior" className="legal-section" aria-labelledby="prohibited-heading">
          <h2 id="prohibited-heading" className="legal-section__title">5. Prohibited Behavior</h2>
          <p>
            The following behaviors are strictly prohibited on Studmo and will result in immediate
            account suspension or permanent termination:
          </p>
          <ul className="legal-list">
            <li>Harassment, bullying, threats, or intimidation of any user.</li>
            <li>Posting hate speech, violent content, or content that incites discrimination.</li>
            <li>Sharing sexually explicit, graphic, or adult-only content.</li>
            <li>Impersonating another person, institution, or official entity.</li>
            <li>Attempting to access or interfere with another user's account or data.</li>
            <li>Using automated bots, scrapers, or scripts to access the platform without written permission.</li>
            <li>Attempting to reverse engineer, decompile, or disassemble any part of the Studmo platform.</li>
            <li>Uploading malware, viruses, or any malicious code.</li>
            <li>Circumventing rate limits, authentication, or security measures.</li>
            <li>Using AI features to generate content intended to deceive, defraud, or harm others.</li>
            <li>Selling, renting, or commercially exploiting access to the Studmo platform or its features.</li>
            <li>Posting spam, unsolicited advertisements, or pyramid schemes.</li>
            <li>Sharing another user's private information without their consent (doxxing).</li>
          </ul>
        </section>

        {/* 6 — Content Ownership */}
        <section id="content-ownership" className="legal-section" aria-labelledby="content-heading">
          <h2 id="content-heading" className="legal-section__title">6. Content Ownership & License</h2>

          <h3 className="legal-section__subtitle">6.1 Your Content</h3>
          <p>
            You retain full ownership of the content you create and share on Studmo — including
            posts, uploaded documents, and AI-generated outputs created using your materials.
          </p>

          <h3 className="legal-section__subtitle">6.2 License to Studmo</h3>
          <p>
            By posting content on Studmo, you grant us a non-exclusive, worldwide, royalty-free
            license to store, display, and distribute your content solely for the purpose of
            operating and improving the platform. We do not sell your content or use it in external
            advertising.
          </p>

          <h3 className="legal-section__subtitle">6.3 AI-Generated Content</h3>
          <p>
            Quizzes, summaries, and other content generated by Studmo's AI tools using your
            uploaded materials belong to you. However, you are responsible for ensuring that your
            use of AI-generated content complies with your institution's academic integrity policies.
            Studmo is not liable for any academic consequences resulting from misuse of AI-generated
            content.
          </p>

          <h3 className="legal-section__subtitle">6.4 Third-Party Content</h3>
          <p>
            Do not post content that you do not have the rights to share. This includes copyrighted
            texts, images, and academic materials protected by intellectual property law. Studmo will
            respond to valid DMCA takedown notices.
          </p>
        </section>

        {/* 7 — AI Features */}
        <section id="ai-features" className="legal-section" aria-labelledby="ai-terms-heading">
          <h2 id="ai-terms-heading" className="legal-section__title">7. AI Features — Terms of Use</h2>
          <p>
            Studmo's AI-powered tools (quiz generator, study summaries, learning assistant) are
            provided as-is and subject to the following terms:
          </p>
          <ul className="legal-list">
            <li>AI outputs are generated automatically and may contain inaccuracies. Always verify AI-generated content against authoritative sources.</li>
            <li>Do not upload documents containing sensitive personal data, confidential research, or proprietary institutional information.</li>
            <li>AI features are for personal learning assistance only. Commercial use requires written approval from Studmo.</li>
            <li>We reserve the right to limit AI feature usage to prevent abuse and ensure service quality for all users.</li>
            <li>AI outputs do not constitute professional academic, legal, or medical advice.</li>
          </ul>
        </section>

        {/* 8 — IP */}
        <section id="intellectual-property" className="legal-section" aria-labelledby="ip-heading">
          <h2 id="ip-heading" className="legal-section__title">8. Studmo Intellectual Property</h2>
          <p>
            The Studmo name, logo, platform design, UI, codebase, AI systems, and all associated
            intellectual property are owned exclusively by Studmo and protected by applicable
            intellectual property laws. You may not copy, reproduce, adapt, or create derivative
            works from any Studmo IP without explicit written permission.
          </p>
        </section>

        {/* 9 — Termination */}
        <section id="account-termination" className="legal-section" aria-labelledby="termination-heading">
          <h2 id="termination-heading" className="legal-section__title">9. Account Suspension & Termination</h2>

          <h3 className="legal-section__subtitle">9.1 By Studmo</h3>
          <p>
            We reserve the right to suspend or permanently terminate your account, with or without
            notice, if you violate these Terms, engage in prohibited behavior, or if continued access
            presents a risk to the platform or other users.
          </p>
          <p>
            For minor violations, we may issue a warning or temporary suspension before permanent
            termination. Serious violations (harassment, illegal activity, security threats) will
            result in immediate permanent termination.
          </p>

          <h3 className="legal-section__subtitle">9.2 By You</h3>
          <p>
            You may delete your account at any time through your account settings or by contacting
            us at <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a>.
            Upon deletion, your data is handled per our Privacy Policy.
          </p>

          <h3 className="legal-section__subtitle">9.3 Effect of Termination</h3>
          <p>
            Upon termination, your license to use the platform immediately ceases. Content you
            posted may be removed. Provisions of these Terms that by their nature should survive
            termination will continue to apply.
          </p>
        </section>

        {/* 10 — Disclaimers */}
        <section id="disclaimers" className="legal-section" aria-labelledby="disclaimers-heading">
          <h2 id="disclaimers-heading" className="legal-section__title">10. Disclaimers</h2>
          <p>
            Studmo is provided <strong>"as is"</strong> and <strong>"as available"</strong> without
            warranties of any kind, either express or implied. We do not warrant that:
          </p>
          <ul className="legal-list">
            <li>The platform will be uninterrupted, error-free, or fully secure at all times.</li>
            <li>AI-generated content (quizzes, summaries) will be accurate, complete, or suitable for academic submission.</li>
            <li>The platform will meet your specific academic or institutional requirements.</li>
            <li>Any defects will be corrected immediately.</li>
          </ul>
          <p>
            As a platform currently in beta, Studmo is actively being developed. Some features may
            change, break, or be deprecated as we iterate.
          </p>
        </section>

        {/* 11 — Liability */}
        <section id="liability" className="legal-section" aria-labelledby="liability-heading">
          <h2 id="liability-heading" className="legal-section__title">11. Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by applicable law, Studmo and its team shall not be
            liable for any indirect, incidental, special, consequential, or punitive damages,
            including but not limited to:
          </p>
          <ul className="legal-list">
            <li>Loss of data, content, or academic materials.</li>
            <li>Academic consequences resulting from AI-generated content.</li>
            <li>Unauthorized access to your account.</li>
            <li>Loss of profits or business opportunities.</li>
            <li>Damages resulting from platform downtime or service interruptions.</li>
          </ul>
          <p>
            In any case where liability cannot be fully excluded, Studmo's total liability to you
            shall not exceed the greater of the amount you paid to Studmo in the past 12 months or
            €50 EUR.
          </p>
        </section>

        {/* 12 — Governing Law */}
        <section id="governing-law" className="legal-section" aria-labelledby="law-heading">
          <h2 id="law-heading" className="legal-section__title">12. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with applicable law. Any
            disputes arising from these Terms or your use of Studmo shall be resolved through
            good-faith negotiation first. If unresolved, disputes shall be submitted to binding
            arbitration or the competent courts of the applicable jurisdiction.
          </p>
          <p>
            Users in the European Union retain all rights granted to them under EU consumer
            protection and digital services legislation, including the Digital Services Act (DSA).
          </p>
        </section>

        {/* 13 — Contact */}
        <section id="contact-legal" className="legal-section legal-section--highlight" aria-labelledby="legal-contact-heading">
          <div className="legal-section__badge">Contact</div>
          <h2 id="legal-contact-heading" className="legal-section__title">13. Contact Us</h2>
          <p>
            For questions about these Terms of Service, please contact our legal team:
          </p>
          <div className="legal-contact-block">
            <p><strong>Studmo Legal Team</strong></p>
            <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="legal-link">{CONTACT_EMAIL}</a></p>
            <p>Website: <a href="https://studmo.com" className="legal-link">studmo.com</a></p>
          </div>
        </section>

      </div>

      <LegalFooter />
    </div>
  );
};

export default Terms;
