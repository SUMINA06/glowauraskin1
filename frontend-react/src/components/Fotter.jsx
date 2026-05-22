import React from "react";

const Fotter = () => {
  return (
    <>
      <footer class="footer">
        <div class="footer-container">
          <div class="footer-box">
            <h4>NEWS LETTER</h4>
            <p>
              Sign up with your email to get updates about new products,
              releases and special offers.
            </p>
            <div class="newsletter">
              <input type="email" placeholder="Your email address" />
              <button>Subscribe</button>
            </div>
          </div>

          <div class="footer-box">
            <h4>QUICK LINKS</h4>
            <ul>
              <li>
                <a href="#">FAQs</a>
              </li>
              <li>
                <a href="#">Terms and Conditions</a>
              </li>
              <li>
                <a href="#" class="highlight">
                  Refund and Returns Policy
                </a>
              </li>
            </ul>
          </div>
          <div class="footer-box">
            <h4>GET IN TOUCH</h4>
            <p>
              Kathmandu, Nepal
              <br />
            
            </p>
            <p>📧 hello@glowaura.com</p>
            <p>📞 +61-478198195</p>
            <p>📱 +977-1-5300647</p>
          </div>

          <div class="footer-box">
            <h4>SECURE PAYMENTS WITH</h4>
            <div class="payment-icons">
              <img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/ff/Esewa_logo.webp/960px-Esewa_logo.webp.png?20220908142913"
                alt="eSewa"
              />
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0j99ZjCtg1sj_OF5dmWJT87cQekV0pvbmUQ&s"
                alt="Khalti"
              />
            </div>
            <div class="secure-lock">🔒 100% Secure Payments</div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Fotter;
