import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function NotFound() {
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
  const backLabel = user ? "← Return to Workspace" : "← Back to Sign In";

  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <span className="not-found-badge">ERROR 404 • ROUTE NOT FOUND</span>

        <h1 className="not-found-title">Page out of bounds.</h1>

        <p className="not-found-text">
          The directory or record URL you requested does not exist or has been
          moved within Synapse IMS.
        </p>

        <div className="not-found-actions">
          <Link to={backTarget} className="not-found-btn">
            {backLabel}
          </Link>
        </div>
      </div>

      <p className="not-found-foot">Success With Class • Synapse IMS</p>
    </div>
  );
}
