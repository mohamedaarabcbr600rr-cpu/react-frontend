// pages/DeleteAccount/DeleteAccount.jsx
import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import "./delete-account.css";

const MAIL = "privacy@studmo.com";

const CONTENT = {
  en: {
    docTitle: "Request Account Deletion | Studmo",
    title: "Request Account Deletion",
    intro:
      "If you have a Studmo account and would like to delete it, you can request the permanent deletion of your account and associated personal data by contacting our privacy team.",
    howTitle: "How to request deletion",
    subject: "Studmo Account Deletion Request",
    steps: [
      "Send an email to",
      "Use the subject line: “Studmo Account Deletion Request”.",
      "Include the email address associated with your Studmo account.",
      "Our team may contact you to verify your identity before processing your request.",
    ],
    button: "Email the privacy team",
    dataTitle: "What data will be deleted",
    data:
      "Subject to applicable legal obligations and technical limitations, your request covers your account and the personal information associated with it. This includes your profile information and other personal data linked to your account, such as posts, comments, uploaded documents, and related learning data, where applicable.",
    timeTitle: "Deletion timeframe",
    time: "Account deletion requests are reviewed and processed as soon as reasonably possible.",
    retTitle: "Data retention",
    ret:
      "Some information may be retained where it is required by law, or where it is necessary for legitimate security, fraud-prevention, or legal purposes. Information retained for these reasons is kept separately from the data that is deleted following your request.",
    noteTitle: "Important note",
    note:
      "Uninstalling the Studmo application does not automatically delete your account or personal data. You must submit a deletion request using the process described above.",
    contactTitle: "Contact",
    team: "Privacy team",
    site: "Website",
  },
  fr: {
    docTitle: "Demande de suppression de compte | Studmo",
    title: "Demande de suppression de compte",
    intro:
      "Si vous possédez un compte Studmo et souhaitez le supprimer, vous pouvez demander la suppression de votre compte et des données personnelles associées en contactant notre équipe chargée de la confidentialité.",
    howTitle: "Comment demander la suppression",
    subject: "Demande de suppression de compte Studmo",
    steps: [
      "Envoyez un e-mail à",
      "Utilisez l’objet : « Demande de suppression de compte Studmo ».",
      "Indiquez l’adresse e-mail associée à votre compte Studmo.",
      "Notre équipe pourra vous demander de confirmer votre identité avant de traiter votre demande.",
    ],
    button: "Écrire à l’équipe confidentialité",
    dataTitle: "Données concernées",
    data:
      "Sous réserve des obligations légales et des contraintes techniques applicables, votre demande porte sur votre compte et les données personnelles qui lui sont associées, notamment les informations du profil, les publications, les commentaires, les documents téléversés et les données d’apprentissage liées au compte, le cas échéant.",
    timeTitle: "Délai de traitement",
    time: "Les demandes de suppression sont examinées et traitées dans les meilleurs délais raisonnables.",
    retTitle: "Conservation de certaines données",
    ret:
      "Certaines informations peuvent être conservées lorsque la loi l’exige ou lorsque cela est nécessaire pour des raisons légitimes de sécurité, de prévention de la fraude ou de conformité juridique. Ces informations sont distinctes des données supprimées à la suite de votre demande.",
    noteTitle: "Information importante",
    note:
      "La désinstallation de l’application Studmo ne supprime pas automatiquement votre compte ni vos données personnelles. Vous devez envoyer une demande de suppression en suivant la procédure indiquée ci-dessus.",
    contactTitle: "Contact",
    team: "Équipe chargée de la confidentialité",
    site: "Site web",
  },
};

const DeleteAccount = () => {
  const { i18n } = useTranslation();

  // Le site gère déjà la langue avec i18next : on reste cohérent (fr = français, tout le reste = anglais)
  const lang = (i18n.language || "en").toLowerCase().startsWith("fr") ? "fr" : "en";
  const t = CONTENT[lang];
  const mailto = `mailto:${MAIL}?subject=${encodeURIComponent(t.subject)}`;

  // Permet d'ouvrir directement /delete-account?lang=fr (ou en)
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("lang");
    if ((q === "fr" || q === "en") && q !== lang) {
      i18n.changeLanguage(q);
      localStorage.setItem("lang", q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = t.docTitle;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = t.intro;
  }, [lang, t]);

  const changeLang = (l) => {
    i18n.changeLanguage(l);
    localStorage.setItem("lang", l);
  };

  return (
    <div className="da-page">
      <main className="da-main" lang={lang}>
        <div className="da-lang-row">
          <div className="da-lang" role="group" aria-label="Language / Langue">
            <button type="button" aria-pressed={lang === "en"} onClick={() => changeLang("en")}>English</button>
            <button type="button" aria-pressed={lang === "fr"} onClick={() => changeLang("fr")}>Français</button>
          </div>
        </div>

        <h1>{t.title}</h1>
        <p className="da-lead">{t.intro}</p>

        <section className="da-card" aria-labelledby="da-how">
          <h2 id="da-how">{t.howTitle}</h2>
          <ol>
            <li>{t.steps[0]} <a href={mailto}>{MAIL}</a>.</li>
            <li>{t.steps[1]}</li>
            <li>{t.steps[2]}</li>
            <li>{t.steps[3]}</li>
          </ol>
          <a className="da-btn" href={mailto}>{t.button}</a>
        </section>

        <section>
          <h2>{t.dataTitle}</h2>
          <p>{t.data}</p>
        </section>

        <section>
          <h2>{t.timeTitle}</h2>
          <p>{t.time}</p>
        </section>

        <section>
          <h2>{t.retTitle}</h2>
          <p>{t.ret}</p>
        </section>

        <aside className="da-note">
          <h2>{t.noteTitle}</h2>
          <p>{t.note}</p>
        </aside>

        <section>
          <h2>{t.contactTitle}</h2>
          <p>
            {t.team} : <a href={mailto}>{MAIL}</a>
            <br />
            {t.site} : <a href="https://studmo.com">https://studmo.com</a>
          </p>
        </section>
      </main>
    </div>
  );
};

export default DeleteAccount;