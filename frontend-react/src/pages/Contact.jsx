import React from "react";

const Contact = () => {
  return (
    <main>
      {/* Hero */}
      <section className="section page-hero muted">
        <div className="section-header">
          <h1>Contact Glowaura</h1>
          <p>
            Questions about skincare, body care routines, product suggestions, or
            collaborations? We’re here to help you glow better every day.
          </p>
        </div>
      </section>

      {/* Contact + Info */}
      <section className="section">
        <div className="contact-layout">

          {/* Contact form */}
          <form className="card contact-form">
            <div className="card-tag">Glow With Us ✨</div>
            <h3>Send a Skincare Message</h3>

            <div className="field">
              <label htmlFor="c-name">Full Name</label>
              <input id="c-name" type="text" placeholder="Your name" required />
            </div>

            <div className="field">
              <label htmlFor="c-email">Email</label>
              <input
                id="c-email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="c-type">Message Type</label>
              <select id="c-type">
                <option>Skincare consultation</option>
                <option>Body care recommendation</option>
                <option>Product inquiry</option>
                <option>Brand collaboration</option>
                <option>Website / support issue</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="c-message">Your Message</label>
              <textarea
                id="c-message"
                rows={5}
                placeholder="Tell us about your skin goals, concerns, or routine..."
              />
            </div>

            <button type="submit" className="btn primary full">
              Send Message
            </button>

            <p className="hint" style={{ marginTop: "0.9rem" }}>
              * This is a demo form for Glowaura. You can connect it to a backend
              later for real skincare consultations.
            </p>
          </form>

          {/* Info panel */}
          <aside className="card contact-info">
            <div className="card-tag">Connect</div>
            <h3>Glowaura Studio</h3>

            <p>
              <strong>Location:</strong> Kathmandu, Nepal (Online Skincare Store)
            </p>

            <p>
              <strong>Email:</strong> hello@glowaura.com
            </p>

            <p>
              <strong>WhatsApp:</strong> +977-9800000000
            </p>

            <div className="socials">
              <span>Follow Glow:</span>
              <a href="#">Instagram</a>
              <a href="#">TikTok</a>
              <a href="#">Pinterest</a>
            </div>

            <hr
              style={{
                border: "none",
                borderTop: "1px dashed var(--border)",
                margin: "1rem 0",
              }}
            />

            <h4 style={{ fontSize: "0.96rem", marginBottom: "0.3rem" }}>
              Skincare FAQs
            </h4>

            <ul
              style={{
                listStyle: "none",
                fontSize: "0.88rem",
                color: "var(--muted)",
              }}
            >
              <li>
                <strong>Do you offer skincare guidance?</strong>
                <br />
                Yes, we help you build simple routines for glow, hydration, and body care.
              </li>

              <li style={{ marginTop: "0.6rem" }}>
                <strong>Are your products dermatology safe?</strong>
                <br />
                We focus on gentle, skin-friendly formulations for daily use.
              </li>

              <li style={{ marginTop: "0.6rem" }}>
                <strong>Can I get personalized routine help?</strong>
                <br />
                Yes, select “Skincare consultation” and tell us your skin type.
              </li>
            </ul>

            <p className="contact-foot">
              Glowaura is your daily skincare & bodycare companion for healthy,
              glowing skin.
            </p>
          </aside>

        </div>
      </section>
    </main>
  );
};

export default Contact;