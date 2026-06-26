import { Check } from "lucide-react";
import { useLanguage, type LanguageCode } from "../../Language/LanguageContext";
import "./Footer.css";

const COMPANY_LINKS = ["About Us", "Careers"];
const HELP_LINKS = ["Visit Help Center", "Share Feedback"];
const LEGAL_LINKS = ["Terms Of Use", "Privacy Policy", "FAQ"];
const SOCIAL_LINKS = [
  { label: "Facebook", text: "f" },
  { label: "X", text: "X" },
];
const STORE_LINKS = [
  { eyebrow: "GET IT ON", label: "Google Play" },
  { eyebrow: "Download on the", label: "App Store" },
];

export default function Footer() {
  const { language, options, setLanguage, t } = useLanguage();

  return (
    <footer className="site-footer">
      <section className="footer-column footer-company">
        <h2>{t("Company")}</h2>

        <nav aria-label={t("Company")}>
          {COMPANY_LINKS.map((link) => (
            <a href="#" key={link}>
              {t(link)}
            </a>
          ))}
        </nav>

        <p className="footer-copyright">{t("© 2026 STAR. All Rights Reserved.")}</p>

        <nav className="footer-legal-links" aria-label="Legal links">
          {LEGAL_LINKS.map((link) => (
            <a href="#" key={link}>
              {t(link)}
            </a>
          ))}
        </nav>
      </section>

      <section className="footer-column">
        <h2>{t("View Website in")}</h2>

        <label className="footer-language-button">
          <Check size={23} strokeWidth={2.4} />
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as LanguageCode)}
            aria-label={t("Select language")}
          >
            {options.map((option) => (
              <option value={option.code} key={option.code}>
                {option.nativeLabel}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="footer-column">
        <h2>{t("Need Help?")}</h2>

        <nav aria-label="Help links">
          {HELP_LINKS.map((link) => (
            <a href="#" key={link}>
              {t(link)}
            </a>
          ))}
        </nav>
      </section>

      <section className="footer-column footer-connect">
        <h2>{t("Connect with Us")}</h2>

        <div className="footer-social-links">
          {SOCIAL_LINKS.map((link) => (
            <a href="#" aria-label={link.label} key={link.label}>
              {link.text}
            </a>
          ))}
        </div>

        <div className="footer-store-links">
          {STORE_LINKS.map((store) => (
            <a href="#" className="footer-store-badge" key={store.label}>
              <small>{t(store.eyebrow)}</small>
              <strong>{t(store.label)}</strong>
            </a>
          ))}
        </div>
      </section>
    </footer>
  );
}
