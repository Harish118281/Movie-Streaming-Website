import { Check } from "lucide-react";
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
  return (
    <footer className="site-footer">
      <section className="footer-column footer-company">
        <h2>Company</h2>

        <nav aria-label="Company">
          {COMPANY_LINKS.map((link) => (
            <a href="#" key={link}>
              {link}
            </a>
          ))}
        </nav>

        <p className="footer-copyright">&copy; 2026 STAR. All Rights Reserved.</p>

        <nav className="footer-legal-links" aria-label="Legal links">
          {LEGAL_LINKS.map((link) => (
            <a href="#" key={link}>
              {link}
            </a>
          ))}
        </nav>
      </section>

      <section className="footer-column">
        <h2>View Website in</h2>

        <div className="footer-language-button" aria-label="Website language">
          <Check size={23} strokeWidth={2.4} />
          <span>English</span>
        </div>
      </section>

      <section className="footer-column">
        <h2>Need Help?</h2>

        <nav aria-label="Help links">
          {HELP_LINKS.map((link) => (
            <a href="#" key={link}>
              {link}
            </a>
          ))}
        </nav>
      </section>

      <section className="footer-column footer-connect">
        <h2>Connect with Us</h2>

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
              <small>{store.eyebrow}</small>
              <strong>{store.label}</strong>
            </a>
          ))}
        </div>
      </section>
    </footer>
  );
}
