export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-sm opacity-80">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            className="opacity-70"
            aria-hidden="true"
          >
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>© {new Date().getFullYear()} SatSun. All rights reserved.</span>
        </div>
        <nav className="flex items-center gap-4">
          <a href="#" className="link link-hover text-sm" aria-label="Twitter">
            Twitter
          </a>
          <a href="#" className="link link-hover text-sm" aria-label="YouTube">
            YouTube
          </a>
          <a href="#" className="link link-hover text-sm" aria-label="Facebook">
            Facebook
          </a>
        </nav>
      </div>
    </footer>
  );
}
