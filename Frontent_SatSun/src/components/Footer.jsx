export default function Footer() {
  return (
    <footer className="border-t border-base-300 bg-base-100">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            © 2025 SatSun. Built with <span aria-hidden="true">❤️</span> for {' '}
            <span style={{ color: '#1473E6' }}>Atlan</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <a href="#" className="link link-hover text-sm" aria-label="Video">
              Video
            </a>
            <a href="#" className="link link-hover text-sm" aria-label="GitHub">
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
