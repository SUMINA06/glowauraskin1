import React from "react";

const Artisans = () => {
  return (
    <main>
      <section className="section page-hero">
        <div className="section-header">
          <h1>Stories from the Hills &amp; Valleys</h1>
          <p>
            Behind every product is a Nepali artisan, a tradition, and real
            craftsmanship.
          </p>
        </div>
      </section>

      <section className="section slim">
        <div className="grid artisans-grid">
          
          <article className="card artisan-card">
            <div className="card-tag">Kathmandu Art Studio</div>
            <h3>Art &amp; Painting</h3>
            <p>
              Our paintings are inspired by Nepal’s mountains, temples, and
              everyday village life. Each artwork is created carefully with
              clean and simple brush strokes.
            </p>
            <p>
              These pieces are made for peaceful homes — easy to frame, easy to
              gift, and perfect for adding warmth to your walls.
            </p>
          </article>

          <article className="card artisan-card">
            <div className="card-tag">Bhaktapur Woodcraft</div>
            <h3>Wooden Products</h3>
            <p>
              Our wooden products are handcrafted using locally sourced wood.
              From trays to decorative items, every piece is shaped and polished
              by hand.
            </p>
            <p>
              The focus is on durability and smooth finishing — simple designs
              that fit both traditional and modern spaces.
            </p>
          </article>

          <article className="card artisan-card">
            <div className="card-tag">Terai Jute Makers</div>
            <h3>Jute Products</h3>
            <p>
              Our jute collection includes eco-friendly bags, baskets, and
              storage items. The material is natural, strong, and reusable.
            </p>
            <p>
              These products support sustainable living while keeping the
              design minimal and practical for everyday use.
            </p>
          </article>

        </div>
      </section>

      <section className="section muted">
        <div className="section-header">
          <h2>Nepali Culture in Design</h2>
          <p>
            How NepMart’s products reflect festivals, temples, and landscapes.
          </p>
        </div>

        <div className="culture-layout">
          <div className="culture-text">
            <ul className="culture-list">
              <li>
                <strong>Festivals (Dashain, Tihar, Teej)</strong>
                soft marigold orange and diya gold tones in textiles &amp; décor.
              </li>
              <li>
                <strong>Temples &amp; Gumbas</strong>
                wood carving motifs, bell shapes, mandala borders.
              </li>
              <li>
                <strong>Himalayan Landscapes</strong>
                pastel blue, misty grey, and sunrise pink in prints and scarves.
              </li>
              <li>
                <strong>Everyday Nepali Life</strong>
                chiya glasses, bamboo doko baskets, and patterns from old
                houses.
              </li>
            </ul>
          </div>

          <div className="culture-card">
            <h3>Design Language of NepMart</h3>
            <p>
              The NepMart brand uses <strong>soft, warm colors</strong> and
              rounded shapes, echoing prayer wheels, mandalas, and mountain
              silhouettes.
            </p>
            <p>
              You can extend this design into your UI: pastel backgrounds,
              muted reds, teal highlights, and gentle hover effects instead of
              harsh contrasts.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Artisans;