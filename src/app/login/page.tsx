
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CustomerLoginPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setError("Please enter your name and email.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    const account = {
      name: trimmedName,
      email: trimmedEmail,
    };

    localStorage.setItem("shopsphere-account", JSON.stringify(account));

    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 px-4 py-12">
      <div className="mx-auto flex min-h-[75vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl bg-white shadow-2xl md:grid-cols-2">

          <div className="flex flex-col justify-center bg-slate-950 p-10 text-white md:p-14">
            <Link href="/" className="mb-12 text-3xl font-extrabold tracking-tight">
              Shop<span className="text-orange-400">Sphere</span>
            </Link>

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.25em] text-orange-400">
              Welcome to ShopSphere
            </p>

            <h1 className="mb-5 text-4xl font-extrabold leading-tight md:text-5xl">
              Shopping made simple.
            </h1>

            <p className="max-w-md leading-7 text-slate-300">
              Sign in to explore products, manage your cart and keep track of
              your orders.
            </p>

            <div className="mt-10 space-y-4 text-sm text-slate-300">
              <p>✓ Explore exciting products</p>
              <p>✓ Manage your shopping cart</p>
              <p>✓ View your order details</p>
            </div>
          </div>

          <div className="flex items-center justify-center p-8 md:p-14">
            <div className="w-full max-w-md">

              <Link
                href="/"
                className="mb-8 inline-block text-sm font-semibold text-slate-500 transition hover:text-orange-600"
              >
                ← Back to Store
              </Link>

              <h2 className="text-3xl font-extrabold text-slate-900">
                Customer Login
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Enter your details to continue shopping.
              </p>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError("");
                    }}
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full rounded-xl bg-orange-500 py-3.5 font-bold text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 active:scale-[0.98]"
                >
                  Login to ShopSphere →
                </button>

              </form>

              <p className="mt-6 text-center text-xs leading-5 text-slate-400">
                Demo customer login. This page does not use secure
                password-based authentication.
              </p>

              <div className="mt-8 border-t border-slate-100 pt-5 text-center">
                <Link
                  href="/adminlogin"
                  className="text-sm font-semibold text-slate-500 transition hover:text-orange-600"
                >
                  Admin Login
                </Link>
              </div>

            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
