import { useState } from "react";
import usePortfolioContent from "./usePortfolioContent.js";

const initialForm = { name: "", email: "", message: "" };

function ContactForm({ labels, email }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [sending, setSending] = useState(false);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((currentForm) => ({ ...currentForm, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSending(true);
    setStatus({ type: "", message: "" });

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Your message could not be sent.");

      setStatus({ type: "success", message: result.message });
      setForm(initialForm);
    } catch (error) {
      setStatus({
        type: "error",
        message: error.message || "Could not connect to the server. Please email me directly.",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <label>
        {labels.name}
        <input
          name="name"
          required
          maxLength="100"
          autoComplete="name"
          value={form.name}
          onChange={updateField}
          placeholder="Jane Smith"
        />
      </label>
      <label>
        {labels.email}
        <input
          name="email"
          type="email"
          required
          maxLength="254"
          autoComplete="email"
          value={form.email}
          onChange={updateField}
          placeholder="jane@example.com"
        />
      </label>
      <label>
        {labels.message}
        <textarea
          name="message"
          required
          maxLength="5000"
          rows="4"
          value={form.message}
          onChange={updateField}
          placeholder="Tell me a little about your idea…"
        />
      </label>
      <button className="button button-primary form-submit" type="submit" disabled={sending} aria-busy={sending}>
        {sending ? "Sending…" : <>{labels.submit} <span>↗</span></>}
      </button>
      {status.message && (
        <p className={`form-status ${status.type}`} role="status">
          {status.message}
          {status.type === "error" && (
            <> <a href={`mailto:${email}`}>Email me instead ↗</a></>
          )}
        </p>
      )}
    </form>
  );
}

function ContactSection() {
  const { contact } = usePortfolioContent();
  return (
    <section className="contact-section section-shell" id="contact">
      <div className="contact-glow" />

      <div className="contact-main">
        <div className="contact-content reveal">
          <div className="section-kicker">{contact.kicker}</div>
          <p className="contact-overline">{contact.overline}</p>
          <h2>{contact.heading}<br /><span className="gradient-text">{contact.headingAccent}</span></h2>
          <a className="button button-primary contact-button" href={`mailto:${contact.email}`}>
            {contact.directAction} <span>↗</span>
          </a>
        </div>

        <div className="contact-form-wrap reveal"><ContactForm labels={contact.formLabels} email={contact.email} /></div>
      </div>

      <div className="contact-bottom reveal">
        <p>{contact.pitch.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
        <div className="contact-links">
          {contact.links.map(({ label, href }) => {
            const isExternalLink = href.startsWith("https://");
            return (
              <a
                key={label}
                href={href}
                target={isExternalLink ? "_blank" : undefined}
                rel={isExternalLink ? "noreferrer" : undefined}
              >
                {label} <span>↗</span>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default ContactSection;
