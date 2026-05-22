import React from "react";

const About = () => {
  return (
    <main>
      {/* Hero */}
      <section className="section page-hero muted">
        <div className="section-header">
          <h1>About GlowAura</h1>
          <p>
            A modern skincare and body care brand focused on healthy,
            radiant skin through simple, effective, and nourishing products.
          </p>
        </div>
      </section>

      {/* Who we are */}
      <section className="section">
        <div className="about-layout">
          <div className="about-text">
            <h2
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "1.6rem",
                marginBottom: "0.6rem",
              }}
            >
              Who We Are
            </h2>

            <p>
              GlowAura is a skincare-focused platform dedicated to{" "}
              <strong>healthy skin, self-care, and confidence</strong>. From
              hydrating moisturizers to glow-boosting serums, we bring carefully
              selected products into one clean, minimal, and modern experience.
            </p>

            <p>
              We believe skincare should be simple, accessible, and effective.
              Our goal is to provide products that support{" "}
              <strong>real skin needs</strong>—hydration, repair, protection, and
              long-term care.
            </p>

            <div className="about-points" style={{ marginTop: "1.5rem" }}>
              <div>
                <h4>Skin First Approach</h4>
                <p>
                  Every product is chosen to support healthy skin, not just
                  temporary beauty.
                </p>
              </div>

              <div>
                <h4>Safe & Transparent</h4>
                <p>
                  Clear ingredients, honest pricing, and products you can trust
                  daily.
                </p>
              </div>

              <div>
                <h4>Minimal Aesthetic</h4>
                <p>
                  Soft tones, clean design, and calming visuals inspired by
                  modern skincare brands.
                </p>
              </div>
            </div>
          </div>

          {/* Side card */}
          <aside className="about-card">
            <h3>Our Focus</h3>
            <ul>
              <li>
                <strong>Face Care</strong> – cleansers, serums, treatments
              </li>

              <li>
                <strong>Body Care</strong> – lotions, scrubs, hydration
              </li>

              <li>
                <strong>Hair & Wellness</strong> – scalp and nourishment care
              </li>
            </ul>

            <p className="about-note">
              GlowAura is built to simplify your routine and bring out your
              natural glow.
            </p>
          </aside>
        </div>
      </section>

      {/* Mission / Vision / Values */}
      <section className="section muted">
        <div className="section-header">
          <h2>Our Mission, Vision &amp; Values</h2>
          <p>Built around care, confidence, and clean beauty.</p>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))" }}
        >
          <article className="card">
            <div className="card-tag">Mission</div>
            <h3>Healthy Skin for All</h3>
            <p>
              To provide effective skincare products that help everyone achieve
              healthy, glowing skin with confidence.
            </p>
          </article>

          <article className="card">
            <div className="card-tag">Vision</div>
            <h3>Modern Skincare Hub</h3>
            <p>
              To become a trusted destination for skincare and body care,
              combining simplicity, quality, and modern design.
            </p>
          </article>

          <article className="card">
            <div className="card-tag">Values</div>
            <h3>Clean & Honest</h3>
            <p>
              We value transparency, skin-friendly ingredients, and long-term
              care over quick fixes.
            </p>
          </article>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="section-header">
          <h2>How GlowAura Works</h2>
          <p>Your skincare journey made simple and effective.</p>
        </div>

        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))" }}
        >
          <article className="card">
            <div className="card-tag">Step 1</div>
            <h3>Discover Products</h3>
            <p>
              Explore a curated collection of skincare and body care essentials.
            </p>
          </article>

          <article className="card">
            <div className="card-tag">Step 2</div>
            <h3>Choose Your Routine</h3>
            <p>
              Select products based on your skin type and personal needs.
            </p>
          </article>

          <article className="card">
            <div className="card-tag">Step 3</div>
            <h3>Order Easily</h3>
            <p>
              Add to cart and enjoy a smooth, secure shopping experience.
            </p>
          </article>

          <article className="card">
            <div className="card-tag">Step 4</div>
            <h3>Glow Everyday</h3>
            <p>
              Use consistently and achieve healthy, radiant, and confident skin.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
};

export default About;