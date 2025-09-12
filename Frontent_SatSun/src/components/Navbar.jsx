import ThemeController from "./ThemeController";
function Navbar() {
  return (
    <>
      <div className="navbar bg-primary-100 shadow-sm">
        <div className="navbar-start">
          <a onClick={()=>{
            window.location.href = "/"
          }} className="btn btn-ghost text-xl">SatSun</a>
        </div>
        <div className="navbar-center hidden lg:flex gap-2">
          <a href="/weekend" className="btn btn-ghost">
            Weekend
          </a>
          <a href="/weekend-planner" className="btn btn-ghost">
            Planner
          </a>
          <a href="/activities" className="btn btn-ghost">
            Activities
          </a>
          <a href="/calendar" className="btn btn-ghost">
            Calendar
          </a>
        </div>

        <div className="navbar-end space-x-4">
          {" "}
          <ThemeController />
          <div className="dropdown dropdown-end">
            <div className="avatar " tabIndex={0} role="button">
              <div className="ring-primary ring-offset-base-100 w-8 rounded-full ring-2 ring-offset-2">
                <img src="https://img.daisyui.com/images/profile/demo/spiderperson@192.webp" />
              </div>
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-300 rounded-box z-1 w-52 p-2 shadow-sm mt-2"
            >
              <li>
                <a>Item 1</a>
              </li>
              <li>
                <a>Item 2</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Navbar;
