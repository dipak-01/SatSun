import { useState } from "react";
import api from "../lib/api";
export default function Login() {
  const [email, setEmail] = useState("dipak@gmail.com");
  const [password, setPassword] = useState("abcd1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post(`auth/login`, { email, password });
      const data = await res.data;
      console.log(data);
      if (!data) {
        setError(data?.error || "Login failed");
      } else {
        setMessage("Logged in");

       
        if (data?.user) {
          try {
            localStorage.setItem("user", JSON.stringify(data.user));
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
      window.location.href = "/";
    }
  }

  return (
    <section className="w-full flex items-center justify-center py-12">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md h-fit bg-base-300 shadow-sm"
        noValidate
      >
        <div className="card-body">
          <div className="flex justify-between">
            <h2 className="text-3xl font-bold py-2">Login</h2>
          </div>
          <p className="text-sm opacity-80 mb-2">
            Just click the Login button below to proceed.
          </p>
          {error && (
            <div className="alert alert-error text-sm py-2">{error}</div>
          )}
          {message && !error && (
            <div className="alert alert-success text-sm py-2">{message}</div>
          )}
          <label className="input validator w-full">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <rect width="20" height="16" x="2" y="4" rx="2"></rect>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
              </g>
            </svg>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="mail@site.com"
              name="email"
              autoComplete="email"
              required
              defaultValue={"dipak@gmail.com"}
              className="w-full"
            />
          </label>
          <div className="validator-hint hidden">Enter valid email address</div>
          <label className="input validator w-full">
            <svg
              className="h-[1em] opacity-50"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <g
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeWidth="2.5"
                fill="none"
                stroke="currentColor"
              >
                <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"></path>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"></circle>
              </g>
            </svg>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              name="password"
              type="password"
              required
              placeholder="Password"
              defaultValue={"abcd1234"}
              className="w-full"
            />
          </label>
          <p className="validator-hint hidden">
            Must be more than 8 characters, including
            <br />
            At least one number <br />
            At least one lowercase letter <br />
            At least one uppercase letter
          </p>
          <div className="mt-6">
            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={loading || !email || !password}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
