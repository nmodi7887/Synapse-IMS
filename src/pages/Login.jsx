import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/");
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetMessage("");
    setResetLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResetLoading(false);
    if (error) {
      setResetError(error.message);
    } else {
      setResetMessage("Recovery link sent. Check your email inbox.");
    }
  };

  const enterResetMode = () => {
    setResetError("");
    setResetMessage("");
    setIsResetMode(true);
  };

  const leaveResetMode = () => {
    setResetError("");
    setResetMessage("");
    setIsResetMode(false);
  };

  return (
    <div className="login-page">
      {/* ---------- Left: midnight brand canvas ---------- */}
      <aside className="login-brand">
        <div className="login-brand-top">
          <div className="login-brand-id">
            <img
              src="/Synapse_logo.png"
              alt="Synapse IMS logo"
              className="login-brand-logo"
            />
            <span className="login-brand-name">Synapse IMS</span>
          </div>
        </div>

        <div className="login-brand-copy">
          <h1 className="login-display">
            Loved by Institutes,
            <br />
            <span className="login-display-accent">Working </span>Made Easy.
          </h1>
          <p className="login-brand-sub">
            Unified student management, real-time fee collection and
            automated billing oversight.
          </p>
        </div>

        <div className="login-status-strip">
          <div className="login-status-item">
            <span className="login-status-label">System Status</span>
            <span className="login-status-value">
              <span className="login-status-dot" aria-hidden="true" />
              Operational
            </span>
          </div>
          <div className="login-status-item">
            <span className="login-status-label">Access Level</span>
            <span className="login-status-value">Authorized Staff Only</span>
          </div>
        </div>
      </aside>

      {/* ---------- Right: authentication workspace ---------- */}
      <section className="login-panel">
        <div className="login-form-wrapper">
          {isResetMode ? (
            <>
              <header className="login-form-head">
                <h2 className="login-title">Reset password</h2>
                <p className="login-subtitle">
                  Enter your registered admin email and we'll send you a secure
                  recovery link.
                </p>
              </header>

              <form className="login-form" onSubmit={handlePasswordReset}>
                {resetError && (
                  <p className="login-alert login-alert--error" role="alert">
                    {resetError}
                  </p>
                )}
                {resetMessage && (
                  <p className="login-alert login-alert--success" role="status">
                    {resetMessage}
                  </p>
                )}

                <div className="login-field">
                  <label htmlFor="reset-email">Email address</label>
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="name@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="login-btn"
                  disabled={resetLoading}
                >
                  {resetLoading ? "Sending..." : "Send Recovery Link"}
                </button>
              </form>

              <button
                type="button"
                className="login-back-btn"
                onClick={leaveResetMode}
              >
                ← Back to Sign In
              </button>
            </>
          ) : (
            <>
              <header className="login-form-head">
                <h2 className="login-title">Welcome back</h2>
                <p className="login-subtitle">
                  Enter your administrative credentials to access the workspace.
                </p>
              </header>

              <form
                className="login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
              >
                <div className="login-field">
                  <label htmlFor="login-email">Email address</label>
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="login-field">
                  <label htmlFor="login-password">Password</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="login-forgot-row">
                    <button
                      type="button"
                      className="login-link-btn"
                      onClick={enterResetMode}
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button type="submit" className="login-btn">
                  Sign In
                </button>
              </form>

              <p className="login-footnote">
                Protected by Synapse IMS •{" "}
                <Link to="/privacy-policy">Privacy Policy</Link>
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

export default Login;
