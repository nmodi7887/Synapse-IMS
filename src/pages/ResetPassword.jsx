import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter them.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess("Password updated successfully. Redirecting to login...");

    // Close the recovery session so the admin signs in cleanly with the new password.
    await supabase.auth.signOut();

    redirectTimer.current = setTimeout(() => navigate("/login"), 2000);
  };

  return (
    <div className="reset-page">
      <div className="login-form-wrapper">
        <header className="login-form-head">
          <h2 className="login-title">Set new password</h2>
          <p className="login-subtitle">
            Choose a strong password (minimum 6 characters) for your Synapse IMS
            admin account.
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <p className="login-alert login-alert--error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="login-alert login-alert--success" role="status">
              {success}
            </p>
          )}

          <div className="login-field">
            <label htmlFor="new-password">New Password</label>
            <input
              id="new-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <div className="login-field">
            <label htmlFor="confirm-password">Confirm New Password</label>
            <input
              id="confirm-password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading || Boolean(success)}
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <p className="login-footnote">
          Remembered it? <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}

export default ResetPassword;
