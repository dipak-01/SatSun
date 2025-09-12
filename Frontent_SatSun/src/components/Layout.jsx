import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-base-100">
      <Navbar />
      <main
        id="main-content"
        className="flex-1 container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6"
        role="main"
      >
        {children}
      </main>
      <Footer />
    </div>
  );
}
