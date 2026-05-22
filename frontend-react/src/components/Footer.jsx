import React from "react";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-box">
          <h4>NEWS LETTER</h4>
          <p>
            Sign up with your email to get updates about new products, releases
            and special offers.
          </p>
          <div className="newsletter">
            <input type="email" placeholder="Your email address" />
            <button>Subscribe</button>
          </div>
        </div>

        <div className="footer-box">
          <h4>QUICK LINKS</h4>
          <ul>
            <li>
              <a href="#">FAQs</a>
            </li>
            <li>
              <a href="#">Terms and Conditions</a>
            </li>
            <li>
              <a href="#" className="highlight">
                Refund and Returns Policy
              </a>
            </li>
          </ul>
        </div>

        <div className="footer-box">
          <h4>GET IN TOUCH</h4>
          <p>
            kathmandu, Nepal
            <br />
          
          </p>
          <p> hello@glowaura.com</p>
          <p> +61-478198195</p>
          <p> +977-1-5300647</p>
        </div>

        <div className="footer-box">
          <h4>SECURE PAYMENTS WITH</h4>
          <div className="payment-icons">
            <img
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Esewa_logo.webp/960px-Esewa_logo.webp.png?20220908142913"
              alt="eSewa"
            />
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0j99ZjCtg1sj_OF5dmWJT87cQekV0pvbmUQ&s"
              alt="Khalti"
            />
          </div>
          <div className="secure-lock">100% Secure Payments</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
