import { useEffect, useState } from "react";

const THEME_KEY = "theme";
const THEMES = [
  { value: "dark", label: "Default" },
  { value: "light", label: "Chill & Cozy" },
  { value: "peakpulse", label: "Active & Adventurous" },
  { value: "confettiglow-light", label: "Social & Festive" },
  { value: "caramellatte", label: "Creative & Inspiring" },
  { value: "lemonade", label: "Mindful & Reset" },
];

export default function ThemeController() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return (
      localStorage.getItem(THEME_KEY) ||
      document.documentElement.getAttribute("data-theme") ||
      "dark"
    );
  });

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const onPick = (val) => setTheme(val);

  return (
    <div className="dropdown dropdown-bottom dropdown-end">
      <div
        tabIndex={0}
        role="button"
        aria-haspopup="listbox"
        aria-label="Theme selector"
        className="btn"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.currentTarget.click();
          }
        }}
      >
        <span className="mr-2">Theme</span>
        <svg
          width="12px"
          height="12px"
          className="ml-2 inline-block h-2 w-2 fill-current opacity-60"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
          aria-hidden="true"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </div>
      <ul
        tabIndex={0}
        role="listbox"
        aria-label="Available themes"
        className="dropdown-content bg-base-300 rounded-box z-10 w-60 p-2 shadow-2xl"
      >
        {THEMES.map((t) => (
          <li key={t.value} role="none">
            <label className="flex items-center gap-2 w-full">
              <input
                type="radio"
                name="theme-dropdown"
                className="theme-controller radio radio-sm"
                aria-label={t.label}
                aria-checked={theme === t.value}
                value={t.value}
                checked={theme === t.value}
                onChange={() => onPick(t.value)}
              />
              <span className="flex-1 btn btn-sm btn-ghost justify-start">
                {t.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
