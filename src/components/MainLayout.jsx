import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdLogout,
  MdPeople,
  MdSchool,
  MdCurrencyRupee,
  MdAnalytics,
  MdTrendingUp,
  MdMenu,
  MdClose,
} from "react-icons/md";
import { supabase } from "../services/supabase";

function MainLayout({ children }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("full_name, role")
          .eq("id", user.id)
          .single();
        if (!error) setProfile(data);
      }
    }
    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div className="layout">
      {isMobileOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      <button
        className="mobile-menu-toggle-trigger"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <MdClose size={20} /> : <MdMenu size={20} />}
      </button>

      <aside
        className={`sidebar ${
          isMobileOpen ? "mobile-expanded" : "mobile-collapsed"
        }`}
      >
        <div className="logo-container">
          <img src="/logo.png" alt="SWC Logo" className="sidebar-logo" />
        </div>

        <nav>
          <Link
            to="/"
            className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdDashboard />
            <span className="nav-text">Dashboard</span>
          </Link>
          <Link
            to="/students"
            className={`nav-link ${
              location.pathname.startsWith("/students") ? "active" : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdPeople />
            <span className="nav-text">Students</span>
          </Link>
          <Link
            to="/teachers"
            className={`nav-link ${
              location.pathname === "/teachers" ? "active" : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdSchool />
            <span className="nav-text">Teachers</span>
          </Link>
          <Link
            to="/promotion"
            className={`nav-link ${
              location.pathname.startsWith("/promotion") ? "active" : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdTrendingUp />
            <span className="nav-text">Student Promotion</span>
          </Link>
          <Link
            to="/fees"
            className={`nav-link ${
              location.pathname === "/fees" ? "active" : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdCurrencyRupee />
            <span className="nav-text">Fees</span>
          </Link>
          <Link
            to="/reports"
            className={`nav-link ${
              location.pathname === "/reports" ? "active" : ""
            }`}
            onClick={() => setIsMobileOpen(false)}
          >
            <MdAnalytics />
            <span className="nav-text">Billing</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-info">
              <div className="user-name">
                {profile?.full_name || "Loading..."}
              </div>
              <div className="user-role">{profile?.role || ""}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <MdLogout size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

export default MainLayout;
