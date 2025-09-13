export function activateOnKeyDown(cb) {
  return (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      cb?.(e);
    }
  };
}
