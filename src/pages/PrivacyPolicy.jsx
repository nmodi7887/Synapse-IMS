import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function PrivacyPolicy() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (active) setUser(currentUser);
    }

    loadSession();

    return () => {
      active = false;
    };
  }, []);

  const backTarget = user ? "/dashboard" : "/login";
  const backLabel = user ? "← Back to Dashboard" : "← Back to Sign In";

  return (
    <div className="policy-page">
      <nav className="policy-nav">
        <div className="policy-nav-brand">
          <img
            src="/logo.png"
            alt="Success With Class logo"
            className="policy-nav-logo"
          />
          <span className="policy-nav-name">Success With Class</span>
        </div>

        <Link to={backTarget} className="policy-back">
          {backLabel}
        </Link>
      </nav>

      <div className="policy-body">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '18px',
            padding: '40px',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#2563eb',
              textTransform: 'uppercase',
            }}
          >
            Legal & Compliance
          </span>
          <h1 style={{ fontSize: '28px', marginTop: '8px', marginBottom: '8px', color: '#0f172a' }}>
            Privacy Policy
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '32px' }}>
            Last updated: November 2026 • Synapse IMS (Success With Class)
          </p>

          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#0f172a' }}>
              1. Information We Collect
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
              Synapse IMS collects institutional records strictly necessary for academic and fee
              administration, including student names, enrollment IDs, guardian contact details,
              class assignments, faculty records, and fee transaction receipts.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#0f172a' }}>
              2. How Institutional Data Is Used
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
              All collected data is used exclusively for internal institute operations: generating
              fee receipts, tracking pending balances, managing student promotions, and producing
              financial audit reports. We never sell, rent, or share student or faculty data with
              third-party advertisers.
            </p>
          </section>

          <section style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#0f172a' }}>
              3. Data Storage & Security
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
              Records are stored securely using encrypted cloud infrastructure with role-based
              authentication. Only authorized administrators and staff members with valid
              credentials can access or modify student and billing records.
            </p>
          </section>

          <section>
            <h3 style={{ fontSize: '16px', marginBottom: '8px', color: '#0f172a' }}>
              4. Contact & Data Requests
            </h3>
            <p style={{ fontSize: '14px', lineHeight: '1.7', color: '#475569' }}>
              For record corrections, data exports, or privacy inquiries, contact the institute
              administration at <strong>staviqstudio@gmail.com</strong> or call{' '}
              <strong>+91 8271834789</strong>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
