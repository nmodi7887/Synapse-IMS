import React from 'react';
import '../styles/components/footer.css';
import { Link } from 'react-router-dom';
import { MdPhone, MdEmail } from 'react-icons/md';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        <div className="footer-col">
          <h4 className="footer-heading">ABOUT US</h4>
          <p className="footer-desc">
            Synapse IMS provides student administration, fee management, and institutional record keeping for coaching centers and educational institutes.
          </p>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">QUICK LINKS</h4>
          <ul className="footer-links">
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/students">Students</a></li>
            <li><a href="/fees">Fees Workspace</a></li>
            <li><a href="/reports">Reports & Analytics</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">INFORMATION</h4>
          <ul className="footer-links">
            <li><a href="#terms">Terms & Conditions</a></li>
            <li><Link to="/privacy-policy">Privacy Policy</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">CONTACT & SUPPORT</h4>
          <div className="footer-contact-item">
            <span className="contact-icon" aria-hidden="true">
              <MdPhone size={17} />
            </span>
            <div>
              <div className="contact-label">Helpdesk</div>
              <div className="contact-value">+91 8271834789</div>
            </div>
          </div>
          <div className="footer-contact-item">
            <span className="contact-icon" aria-hidden="true">
              <MdEmail size={17} />
            </span>
            <div>
              <div className="contact-label">Email</div>
              <div className="contact-value">staviqstudio@gmail.com</div>
            </div>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>Copyright © 2026 Synapse IMS. All rights reserved.</p>
      </div>
    </footer>
  );
}