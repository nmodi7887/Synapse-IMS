const DENIED_KEYS = ["ArrowUp", "ArrowDown", "PageUp", "PageDown"];

export default function SecureNumberInput({ onWheel, onKeyDown, ...props }) {
  const handleWheel = (e) => {
    e.preventDefault();
    e.target.blur();
    onWheel?.(e);
  };

  const handleKeyDown = (e) => {
    if (DENIED_KEYS.includes(e.key)) {
      e.preventDefault();
    }
    onKeyDown?.(e);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      onWheel={handleWheel}
      onKeyDown={handleKeyDown}
      {...props}
    />
  );
}
