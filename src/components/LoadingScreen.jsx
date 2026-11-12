export default function LoadingScreen({ label = "Loading workspace…" }) {
  return (
    <div className="loading-screen" role="status" aria-live="polite">
      <div className="loading-screen-card">
        <span className="loading-screen-badge">Secure Session Check</span>

        <div className="loading-screen-brand">
          <img src="/Synapse_logo.png" alt="" className="loading-screen-logo" />
          <span className="loading-screen-name">Synapse IMS</span>
        </div>

        <div className="loading-screen-bar" aria-hidden="true">
          <span className="loading-screen-bar-fill" />
        </div>

        <p className="loading-screen-label">{label}</p>
      </div>
    </div>
  );
}
