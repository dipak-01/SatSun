import ThemeController from "./ThemeController";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { logout as apiLogout } from "../lib/api";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    setIsLoggedIn(!!raw);
  }, []);

  function closeMenu() {
    const el = document.activeElement;
    if (el && typeof el.blur === "function") el.blur();
  }
  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      /* ignore network errors */
    }
    try {
      localStorage.removeItem("user");
    } catch {
      /* ignore storage errors */
    }
    setIsLoggedIn(false);
    navigate("/login");
  }
  return (
    <header
      className="sticky top-0 z-30 border-b border-base-300 backdrop-blur-md supports-[backdrop-filter]:bg-base-100/60 bg-gradient-to-r from-base-100/80 via-primary/5 to-base-100/80"
      role="banner"
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 btn btn-sm"
      >
        Skip to content
      </a>
      <div className="navbar container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="navbar-start">
          <Link
            to="/"
            aria-label="SatSun home"
            className="btn btn-ghost px-2 sm:px-3 text-xl font-bold tracking-tight"
          >
            <span className="flex items-center gap-2">
              <img src="/logo.svg" alt="SatSun" className="h-6 w-6" />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                SatSun
              </span>
            </span>
          </Link>
        </div>

        <div
          className="navbar-center hidden md:flex"
          role="navigation"
          aria-label="Primary"
        >
          <nav className="menu menu-horizontal gap-1">
            <Link
              to="/weekend-planner"
              className={`btn btn-ghost btn-sm rounded-full ${
                location.pathname.startsWith("/weekend-planner")
                  ? "btn-active text-primary bg-primary/10"
                  : "hover:bg-base-200"
              }`}
              aria-label="Planner"
            >
              Planner
            </Link>
            <Link
              to="/activities"
              className={`btn btn-ghost btn-sm rounded-full ${
                location.pathname.startsWith("/activities")
                  ? "btn-active text-primary bg-primary/10"
                  : "hover:bg-base-200"
              }`}
              aria-label="Activities"
            >
              Activities
            </Link>
            <Link
              to="/calendar"
              className={`btn btn-ghost btn-sm rounded-full ${
                location.pathname.startsWith("/calendar")
                  ? "btn-active text-primary bg-primary/10"
                  : "hover:bg-base-200"
              }`}
              aria-label="Calendar"
            >
              Calendar
            </Link>
          </nav>
        </div>

        <div className="navbar-end gap-2">
          <ThemeController />
          <div className="dropdown dropdown-end md:hidden">
            <div
              tabIndex={0}
              role="button"
              aria-haspopup="menu"
              aria-label="Open menu"
              className="btn btn-ghost btn-square"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.currentTarget.click();
                }
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 6h18v2H3zM3 11h18v2H3zM3 16h18v2H3z" />
              </svg>
            </div>
            <ul
              tabIndex={0}
              role="menu"
              className="dropdown-content menu bg-base-200 rounded-box w-56 p-2 shadow"
            >
              {/* <li>
                <Link role="menuitem" to="/weekend">
                  Weekend
                </Link>
              </li> */}
              <li>
                <Link
                  role="menuitem"
                  to="/weekend-planner"
                  className={
                    location.pathname.startsWith("/weekend-planner")
                      ? "active"
                      : undefined
                  }
                  onClick={() => {
                    closeMenu();
                  }}
                >
                  Planner
                </Link>
              </li>
              <li>
                <Link
                  role="menuitem"
                  to="/activities"
                  className={
                    location.pathname.startsWith("/activities")
                      ? "active"
                      : undefined
                  }
                  onClick={() => {
                    closeMenu();
                  }}
                >
                  Activities
                </Link>
              </li>
              <li>
                <Link
                  role="menuitem"
                  to="/calendar"
                  className={
                    location.pathname.startsWith("/calendar")
                      ? "active"
                      : undefined
                  }
                  onClick={() => {
                    closeMenu();
                  }}
                >
                  Calendar
                </Link>
              </li>
            </ul>
          </div>

          <div className="dropdown dropdown-end">
            <div
              className="avatar"
              tabIndex={0}
              role="button"
              aria-haspopup="menu"
              aria-label="Account menu"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.currentTarget.click();
                }
              }}
            >
              <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2 hover:ring-4 transition-all">
                <img
                  src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp"
                  alt="User avatar"
                />
              </div>
            </div>
            <ul
              tabIndex={0}
              role="menu"
              className="dropdown-content menu bg-base-200 rounded-box z-10 w-52 p-2 shadow mt-2"
            >
              {isLoggedIn ? (
                <>
                  <li className="menu-title px-2 py-1">
                    <span className="text-xs opacity-70">Account</span>
                  </li>
                  <li>
                    <button
                      role="menuitem"
                      onClick={() => {
                        // close menu then logout
                        const el = document.activeElement;
                        if (el && typeof el.blur === "function") el.blur();
                        handleLogout();
                      }}
                      className="justify-between"
                    >
                      Logout
                    </button>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link role="menuitem" to="/login">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link role="menuitem" to="/register">
                      Register
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
