import ThemeController from "./ThemeController";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header
      className="sticky top-0 z-30 bg-base-100/80 backdrop-blur supports-[backdrop-filter]:bg-base-100/60 border-b border-base-300"
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
            className="btn btn-ghost text-xl font-semibold"
          >
            SatSun
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
              className="btn btn-ghost"
              aria-label="Planner"
            >
              Planner
            </Link>
            <Link
              to="/activities"
              className="btn btn-ghost"
              aria-label="Activities"
            >
              Activities
            </Link>
            <Link
              to="/calendar"
              className="btn btn-ghost"
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
              className="btn btn-ghost"
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
                <Link role="menuitem" to="/weekend-planner">
                  Planner
                </Link>
              </li>
              <li>
                <Link role="menuitem" to="/activities">
                  Activities
                </Link>
              </li>
              <li>
                <Link role="menuitem" to="/calendar">
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
              <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2">
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
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
