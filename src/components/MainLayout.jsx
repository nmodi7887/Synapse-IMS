import { useEffect, useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdPeople,
  MdSchool,
  MdCurrencyRupee,
  MdAnalytics,
  MdTrendingUp,
  MdMenu,
  MdClose,
  MdReceiptLong,
  MdSearch,
} from "react-icons/md";
import { supabase } from "../services/supabase";
import Footer from "./Footer";

function MainLayout({ children }) {
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [navbarHidden, setNavbarHidden] = useState(false);

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

  /* Reset the two-step sign-out whenever the mega-menu closes */
  useEffect(() => {
    if (!isMobileOpen) setConfirmSignOut(false);
  }, [isMobileOpen]);

  /* Auto-hide the floating navbar while scrolling down */
  useEffect(() => {
    // Keep the navbar (and its mega-menu) pinned while the menu is open.
    if (isMobileOpen) {
      setNavbarHidden(false);
      return undefined;
    }

    // A route change resets scroll, so bring the navbar back into view.
    setNavbarHidden(false);

    let prevScrollY = window.scrollY;
    let frameId = null;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > prevScrollY && currentScrollY > 60) {
        setNavbarHidden(true);
      } else if (currentScrollY < prevScrollY) {
        setNavbarHidden(false);
      }

      prevScrollY = currentScrollY;
      frameId = null;
    };

    const onScroll = () => {
      if (frameId === null) {
        frameId = window.requestAnimationFrame(handleScroll);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frameId !== null) window.cancelAnimationFrame(frameId);
    };
  }, [isMobileOpen, location.pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  const closeMenu = () => setIsMobileOpen(false);

  const userInitial = (
    user?.email?.trim()?.charAt(0) ||
    profile?.full_name?.trim()?.charAt(0) ||
    "A"
  ).toUpperCase();

  return (
    <div className="layout">
      {isMobileOpen && (
        <div className="mobile-overlay" onClick={closeMenu} />
      )}

      <aside
        className={`sidebar ${
          isMobileOpen ? "mobile-expanded" : "mobile-collapsed"
        }${navbarHidden ? " navbar--hidden" : ""}`}
      >
        {/* Top row — the pill bar when closed, the card header when expanded */}
        <header className="sidebar-bar">
          <button
            type="button"
            className="menu-toggle"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle menu"
          >
            {isMobileOpen ? <MdClose size={16} /> : <MdMenu size={16} />}
            <span>{isMobileOpen ? "Close" : "Menu"}</span>
          </button>

          <Link to="/" className="nav-brand" onClick={closeMenu}>
            <img src="/logo.png" alt="SWC Logo" className="brand-logo" />
            <span className="brand-name">Success With Class</span>
          </Link>

          <div className="nav-actions">
            <button
              type="button"
              className="user-chip"
              onClick={() => setIsMobileOpen(true)}
            >
              <span className="user-initials" aria-hidden="true">
                {userInitial}
              </span>
              <span className="user-chip-name">
                {profile?.full_name || "Account"}
              </span>
            </button>
          </div>
        </header>

        {/* Unified mega-menu body */}
        <div className="mega-body">
          <nav>
            <span className="menu-col-title">System Directory</span>
            <div className="directory-grid">
              <Link
                to="/"
                className={`nav-link ${
                  location.pathname === "/" ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdDashboard />
                <span className="nav-text">Dashboard</span>
                <span className="nav-sub">Overview &amp; live metrics</span>
              </Link>
              <Link
                to="/students"
                className={`nav-link ${
                  location.pathname.startsWith("/students") ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdPeople />
                <span className="nav-text">Students</span>
                <span className="nav-sub">Manage enrolled registry</span>
              </Link>
              <Link
                to="/teachers"
                className={`nav-link ${
                  location.pathname === "/teachers" ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdSchool />
                <span className="nav-text">Teachers</span>
                <span className="nav-sub">Faculty directory &amp; assignments</span>
              </Link>
              <Link
                to="/promotion"
                className={`nav-link ${
                  location.pathname.startsWith("/promotion") ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdTrendingUp />
                <span className="nav-text">Student Promotion</span>
                <span className="nav-sub">Batch class upgrades</span>
              </Link>
              <Link
                to="/fees"
                className={`nav-link ${
                  location.pathname === "/fees" ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdCurrencyRupee />
                <span className="nav-text">Fees Workspace</span>
                <span className="nav-sub">Process &amp; track receipts</span>
              </Link>
              <Link
                to="/reports"
                className={`nav-link ${
                  location.pathname === "/reports" ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdReceiptLong />
                <span className="nav-text">Billing &amp; Invoices</span>
                <span className="nav-sub">Generate bills &amp; invoice logs</span>
              </Link>
              <Link
                to="/reports"
                className={`nav-link ${
                  location.pathname === "/reports" ? "active" : ""
                }`}
                onClick={closeMenu}
              >
                <MdAnalytics />
                <span className="nav-text">Reports &amp; Analytics</span>
                <span className="nav-sub">Registry &amp; transaction metrics</span>
              </Link>
              <Link
                to="/students"
                className="nav-link"
                onClick={closeMenu}
              >
                <MdSearch />
                <span className="nav-text">Search</span>
                <span className="nav-sub">Student, ID, or class finder</span>
              </Link>
            </div>
          </nav>

          <div className="account-card">
            <span className="session-tag">Active Session</span>
            <div className="account-name">
              {profile?.full_name || "Loading..."}
            </div>
            <div className="account-role">{profile?.role || "—"}</div>
            <div className="account-email">{user?.email || "—"}</div>

            {confirmSignOut ? (
              <div className="signout-confirm">
                <p>Confirm sign out?</p>
                <div className="signout-actions">
                  <button
                    type="button"
                    className="signout-cancel"
                    onClick={() => setConfirmSignOut(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="signout-confirm-btn"
                    onClick={handleLogout}
                  >
                    Confirm Logout
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="sign-out-btn"
                onClick={() => setConfirmSignOut(true)}
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </aside>

      <main className="main-content">
        {children}
        <Footer />
      </main>
    </div>
  );
}

export default MainLayout;
