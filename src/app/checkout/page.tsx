
"use client";

import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  category?: string;
  price: number;
  oldPrice?: number;
  image?: string;
  description?: string;
  emoji: string;
  tag: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
};

type PaymentResult = "success" | "failed" | "";

const emptyCustomer: Customer = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
};

function normalizeCart(data: unknown): CartItem[] {
  if (!Array.isArray(data)) return [];

  return data
    .map((item: any) => {
      const raw = item?.product ?? item;
      const id = String(raw?.id ?? raw?._id ?? raw?.productId ?? "");
      const price = Number(raw?.price ?? raw?.sellingPrice ?? 0);
      const quantity = Math.max(1, Number(item?.quantity ?? 1));

      if (!id || !raw?.name || !Number.isFinite(price)) return null;

      return {
        product: {
          id,
          name: String(raw.name),
          category: raw.category ?? "",
          price,
          oldPrice: Number(raw.oldPrice ?? raw.mrp ?? price),
          image: raw.image ?? raw.imageUrl ?? "",
          description: raw.description ?? "",
          emoji: raw.emoji ?? "🛍️",
          tag: raw.tag ?? raw.badge ?? "",
        },
        quantity,
      };
    })
    .filter(Boolean) as CartItem[];
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [paymentResult, setPaymentResult] = useState<PaymentResult>("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("shopsphere-cart");
      const savedAccount = localStorage.getItem("shopsphere-account");

      if (savedCart) {
        setCartItems(normalizeCart(JSON.parse(savedCart)));
      }

      if (savedAccount) {
        const account = JSON.parse(savedAccount);

        setCustomer((previous) => ({
          ...previous,
          name: account.name ?? "",
          email: account.email ?? "",
          phone: account.phone ?? "",
        }));
      }
    } catch {
      setError("Unable to load your cart. Please try again.");
    } finally {
      setPageLoading(false);
    }
  }, []);

  const subtotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const shipping = 0;
  const total = subtotal;

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;

    setCustomer((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handlePlaceOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (customer.phone.length < 10) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (customer.pincode.length !== 6) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    if (!paymentResult) {
      setError("Please select a test payment result.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          items: cartItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
          })),
          paymentResult,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Payment could not be completed.");
      }

      setOrderId(data.order?.orderId ?? data.orderId ?? "");

      localStorage.setItem(
        "shopsphere-account",
        JSON.stringify(customer)
      );

      localStorage.removeItem("shopsphere-cart");
      setCartItems([]);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (pageLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="font-semibold text-gray-600">
          Loading checkout...
        </p>
      </main>
    );
  }

  if (success) {
    return (
      <main className="success-background relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
        <div className="success-glow success-glow-one" />
        <div className="success-glow success-glow-two" />

        <div className="confetti-container" aria-hidden="true">
          {Array.from({ length: 32 }).map((_, index) => (
            <span
              key={index}
              className="confetti-piece"
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(index % 12) * 0.12}s`,
                animationDuration: `${3 + (index % 5) * 0.35}s`,
                backgroundColor: [
                  "#22c55e",
                  "#f59e0b",
                  "#38bdf8",
                  "#a78bfa",
                  "#fb7185",
                ][index % 5],
              }}
            />
          ))}
        </div>

        <div className="success-card relative z-10 w-full max-w-xl overflow-hidden rounded-[32px] border border-white/70 bg-white/95 p-7 text-center shadow-[0_30px_100px_rgba(15,23,42,0.13)] backdrop-blur-xl sm:p-12">
          <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-green-400 via-emerald-500 to-green-300" />

          <div className="success-icon-wrapper mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-green-50">
            <div className="success-ring flex h-20 w-20 items-center justify-center rounded-full border-[3px] border-green-500 bg-green-500 shadow-[0_10px_30px_rgba(34,197,94,0.25)]">
              <svg viewBox="0 0 52 52" className="h-12 w-12" fill="none">
                <path
                  className="checkmark-path"
                  d="M13 27L22 36L40 17"
                  stroke="white"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="success-content">
            <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.3em] text-green-600">
              Demo Payment Successful
            </p>

            <h1 className="mt-4 text-4xl font-black tracking-tight text-gray-900 sm:text-5xl">
              Order Placed<span className="text-green-500">!</span>
            </h1>

            <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-gray-500 sm:text-base">
              Your demo payment was successful and your order has been
              confirmed. Thank you for choosing ShopSphere!
            </p>

            {orderId && (
              <div className="order-id-box mt-8 rounded-2xl border border-green-100 bg-green-50/80 p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-green-700">
                  Your Order ID
                </p>

                <p className="mt-2 break-all text-xl font-black tracking-wide text-gray-900 sm:text-2xl">
                  {orderId}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Keep this ID for future reference.
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center gap-3 rounded-2xl bg-gray-50 p-4 text-left">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-xl shadow-sm">
                📦
              </div>

              <div>
                <p className="text-sm font-bold text-gray-800">
                  What&apos;s next?
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Your order is now being processed.
                </p>
              </div>
            </div>

            <Link
              href="/"
              className="mt-8 flex w-full items-center justify-center gap-3 rounded-2xl bg-gray-950 px-6 py-4 font-bold text-white shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-green-600 hover:shadow-xl active:scale-[0.98]"
            >
              Continue Shopping
              <span className="text-xl">→</span>
            </Link>

            <p className="mt-6 text-[11px] font-medium tracking-wide text-gray-400">
              THANK YOU FOR SHOPPING WITH SHOPSPHERE
            </p>
          </div>
        </div>

        <style jsx global>{`
          .success-background {
            background:
              radial-gradient(circle at 15% 20%, rgba(34, 197, 94, 0.09), transparent 32%),
              radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.09), transparent 30%),
              #f8fafc;
          }

          .success-glow {
            position: absolute;
            width: 280px;
            height: 280px;
            border-radius: 50%;
            filter: blur(80px);
            pointer-events: none;
          }

          .success-glow-one {
            top: -100px;
            left: -100px;
            background: rgba(34, 197, 94, 0.13);
          }

          .success-glow-two {
            right: -100px;
            bottom: -100px;
            background: rgba(16, 185, 129, 0.12);
          }

          .success-card {
            animation: successCardIn 0.75s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .success-icon-wrapper {
            animation: iconPop 0.7s 0.15s cubic-bezier(0.2, 0.8, 0.2, 1) both;
          }

          .success-ring {
            animation: ringPulse 2s 0.9s ease-in-out infinite;
          }

          .checkmark-path {
            stroke-dasharray: 50;
            stroke-dashoffset: 50;
            animation: drawCheck 0.65s 0.65s ease forwards;
          }

          .success-content {
            animation: contentFade 0.7s 0.35s ease both;
          }

          .order-id-box {
            animation: contentFade 0.7s 0.55s ease both;
          }

          .confetti-container {
            position: absolute;
            inset: 0;
            overflow: hidden;
            pointer-events: none;
          }

          .confetti-piece {
            position: absolute;
            top: -20px;
            width: 7px;
            height: 12px;
            border-radius: 2px;
            opacity: 0;
            animation-name: confettiFall;
            animation-timing-function: ease-in;
            animation-iteration-count: 1;
          }

          @keyframes successCardIn {
            from { opacity: 0; transform: translateY(35px) scale(0.96); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }

          @keyframes iconPop {
            0% { opacity: 0; transform: scale(0.3); }
            70% { opacity: 1; transform: scale(1.12); }
            100% { transform: scale(1); }
          }

          @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
          }

          @keyframes ringPulse {
            0%, 100% { box-shadow: 0 10px 30px rgba(34, 197, 94, 0.25); }
            50% { box-shadow: 0 10px 45px rgba(34, 197, 94, 0.45); }
          }

          @keyframes contentFade {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes confettiFall {
            0% { opacity: 0; transform: translateY(0) rotate(0deg); }
            10% { opacity: 0.9; }
            100% { opacity: 0; transform: translateY(100vh) rotate(720deg); }
          }

          @media (prefers-reduced-motion: reduce) {
            .success-card,
            .success-icon-wrapper,
            .success-ring,
            .checkmark-path,
            .success-content,
            .order-id-box,
            .confetti-piece {
              animation: none !important;
            }

            .checkmark-path {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-2xl font-extrabold text-gray-900">
              🛍 ShopSphere
            </Link>

            <p className="mt-2 text-sm text-gray-500">
              Complete your purchase
            </p>
          </div>

          <Link
            href="/"
            className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-100"
          >
            ← Continue Shopping
          </Link>
        </div>

        {cartItems.length === 0 ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-6xl">🛒</div>

            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">
              Your cart is empty
            </h2>

            <p className="mt-2 text-gray-500">
              Add some products before proceeding to checkout.
            </p>

            <Link
              href="/"
              className="mt-6 inline-block rounded-xl bg-black px-7 py-3.5 font-bold text-white transition hover:bg-amber-600"
            >
              Start Shopping →
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
            <section className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h1 className="text-2xl font-extrabold text-gray-900">
                Checkout
              </h1>

              <p className="mt-2 text-sm text-gray-500">
                Enter your delivery details below.
              </p>

              <form onSubmit={handlePlaceOrder} className="mt-8 space-y-5">
                <h2 className="border-b pb-3 text-lg font-bold text-gray-900">
                  Delivery Information
                </h2>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={customer.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Email Address
                    </label>

                    <input
                      type="email"
                      name="email"
                      value={customer.email}
                      onChange={handleChange}
                      required
                      placeholder="example@email.com"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      Phone Number
                    </label>

                    <input
                      type="tel"
                      name="phone"
                      value={customer.phone}
                      onChange={handleChange}
                      required
                      minLength={10}
                      maxLength={15}
                      placeholder="Enter phone number"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Delivery Address
                  </label>

                  <textarea
                    name="address"
                    value={customer.address}
                    onChange={(event) =>
                      setCustomer((previous) => ({
                        ...previous,
                        address: event.target.value,
                      }))
                    }
                    required
                    rows={3}
                    placeholder="House number, street, area"
                    className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      City
                    </label>

                    <input
                      type="text"
                      name="city"
                      value={customer.city}
                      onChange={handleChange}
                      required
                      placeholder="Enter city"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                      State
                    </label>

                    <input
                      type="text"
                      name="state"
                      value={customer.state}
                      onChange={handleChange}
                      required
                      placeholder="Enter state"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Pincode
                  </label>

                  <input
                    type="text"
                    name="pincode"
                    value={customer.pincode}
                    onChange={handleChange}
                    required
                    minLength={6}
                    maxLength={6}
                    placeholder="Enter 6-digit pincode"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-slate-900 outline-none transition focus:border-amber-500"
                  />
                </div>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-bold text-gray-900">
                    Payment Method
                  </p>

                  <p className="mt-1 text-sm text-gray-600">
                    ShopSphere Demo Payment Simulator
                  </p>

                  <p className="mt-2 text-xs text-gray-500">
                    Select a test result below. No real money will be collected.
                  </p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setPaymentResult("success");
                        setError("");
                      }}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        paymentResult === "success"
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <span className="text-xl">✅</span>
                      <span className="mt-2 block font-bold text-gray-900">
                        Test Payment Success
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Simulate a successful payment.
                      </span>
                    </button>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => {
                        setPaymentResult("failed");
                        setError("");
                      }}
                      className={`rounded-xl border-2 p-4 text-left transition ${
                        paymentResult === "failed"
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white hover:border-red-300"
                      }`}
                    >
                      <span className="text-xl">❌</span>
                      <span className="mt-2 block font-bold text-gray-900">
                        Test Payment Failed
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        Simulate a failed payment.
                      </span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-600"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cartItems.length === 0}
                  className="w-full rounded-xl bg-black px-6 py-4 font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Processing Payment..."
                    : `Pay ₹${total.toLocaleString("en-IN")}`}
                </button>

                <p className="text-center text-xs text-gray-400">
                  Demo simulator only · No real payment is processed.
                </p>
              </form>
            </section>

            <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-extrabold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 divide-y">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="flex gap-4 py-5">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="h-20 w-20 rounded-xl bg-gray-100 object-cover"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100 text-3xl">
                        {item.product.emoji}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-gray-900">
                        {item.product.name}
                      </h3>

                      <p className="mt-1 text-sm text-gray-500">
                        Quantity: {item.quantity}
                      </p>

                      <p className="mt-2 font-bold text-gray-900">
                        ₹
                        {(
                          item.product.price * item.quantity
                        ).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-4 border-t pt-5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-semibold text-gray-900">
                    ₹{subtotal.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">
                    FREE
                  </span>
                </div>

                <div className="flex justify-between border-t pt-5 text-lg font-extrabold text-gray-900">
                  <span>Total</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <p className="mt-6 text-center text-xs text-gray-400">
                Thank you for shopping with ShopSphere!
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
