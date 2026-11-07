
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAIL = "admin@shopsphere.com";
const ADMIN_PASSWORD = "ShopSphere@123";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (
      email.trim().toLowerCase() === ADMIN_EMAIL &&
      password === ADMIN_PASSWORD
    ) {
      sessionStorage.setItem("shopsphere-admin-logged-in", "true");
      router.push("/admin");
    } else {
      setError("Invalid email or password. Please try again.");
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-7 sm:p-9">
        <Link
          href="/"
          className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
        >
          ← Back to Store
        </Link>

        <div className="text-center mt-7 mb-8">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center text-3xl mx-auto">
            🔐
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mt-5">
            Admin Login
          </h1>

          <p className="text-gray-500 text-sm mt-2">
            Sign in to ShopSphere dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Admin Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter admin email"
              className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter password"
                className="w-full border border-gray-300 rounded-lg p-3 pr-20 text-gray-900 bg-white outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-indigo-700"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error && (
            <p className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-lg font-bold transition"
          >
            Login to Admin Panel
          </button>
        </form>

        <div className="mt-6 bg-indigo-50 rounded-xl p-4">
          <p className="text-sm font-bold text-indigo-900">
            Demo Login Details
          </p>
          <p className="text-sm text-gray-700 mt-2">
            Email: admin@shopsphere.com
          </p>
          <p className="text-sm text-gray-700 mt-1">
            Password: ShopSphere@123
          </p>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          Demo login only. This is not secure production authentication.
        </p>
      </div>
    </main>
  );
}
