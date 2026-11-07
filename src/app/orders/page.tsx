
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Customer = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state?: string;
  pincode: string;
};

type OrderItem = {
  productId?: string;
  name: string;
  category?: string;
  imageUrl?: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  orderId: string;
  createdAt: string;
  customer: Customer;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: "Pending" | "Shipped" | "Delivered" | "Cancelled";
  paymentMethod: string;
  paymentStatus: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const savedAccount = localStorage.getItem("shopsphere-account");

        if (!savedAccount) {
          setError("Please login to view your orders.");
          return;
        }

        const account = JSON.parse(savedAccount);
        const customerEmail = String(account.email || "")
          .trim()
          .toLowerCase();

        if (!customerEmail) {
          setError("Customer email not found. Please login again.");
          return;
        }

        setEmail(customerEmail);

        const response = await fetch(
          `/api/orders?email=${encodeURIComponent(customerEmail)}`,
          { cache: "no-store" }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load orders.");
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading orders."
        );
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const formatPrice = (price: number) =>
    `₹${Number(price || 0).toLocaleString("en-IN")}`;

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cancelOrder = async () => {
    if (!selectedOrder || canceling) return;

    setCanceling(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: selectedOrder,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to cancel order.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.orderId === selectedOrder
            ? { ...order, status: "Cancelled" }
            : order
        )
      );

      setMessage("Your order has been cancelled successfully.");
      setSelectedOrder(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to cancel this order."
      );
    } finally {
      setCanceling(false);
    }
  };

  const getStatusStyle = (status: Order["status"]) => {
    switch (status) {
      case "Delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Cancelled":
        return "bg-red-50 text-red-700 border-red-200";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200";
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f8fafc]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600" />
          <p className="mt-4 text-sm font-medium text-gray-500">
            Loading your orders...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8fafc] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href="/"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-purple-600 transition hover:text-purple-800"
            >
              ← Back to Shop
            </Link>

            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              My Orders
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Track and manage your ShopSphere purchases.
            </p>
          </div>

          <div className="rounded-2xl border border-purple-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs font-medium text-gray-500">Total Orders</p>
            <p className="text-2xl font-extrabold text-purple-700">
              {orders.length}
            </p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 animate-[fadeIn_.3s_ease-out]">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 ? (
          <section className="rounded-3xl border border-gray-100 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-purple-50 text-4xl">
              📦
            </div>

            <h2 className="mt-6 text-2xl font-bold text-gray-900">
              No orders yet!
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              You haven&apos;t placed any orders with this account. Explore our
              products and find something you love.
            </p>

            <Link
              href="/"
              className="mt-7 inline-flex rounded-xl bg-purple-600 px-7 py-3 font-bold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-1 hover:bg-purple-700"
            >
              Start Shopping →
            </Link>
          </section>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <article
                key={order._id}
                style={{ animationDelay: `${index * 80}ms` }}
                className="animate-[fadeIn_.45s_ease-out_both] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 bg-gray-50/80 px-5 py-5 sm:px-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      Order ID
                    </p>

                    <p className="mt-1 break-all font-bold text-gray-900">
                      #{order.orderId}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`rounded-full border px-4 py-2 text-xs font-bold ${getStatusStyle(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>

                    {order.status === "Pending" && (
                      <button
                        type="button"
                        onClick={() => setSelectedOrder(order.orderId)}
                        className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 hover:scale-105 active:scale-95"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5 sm:p-7">

                  {/* Products */}
                  <div>
                    <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">
                      Order Items
                    </h3>

                    <div className="space-y-4">
                      {(order.items || []).map((item, itemIndex) => (
                        <div
                          key={`${item.productId || item.name}-${itemIndex}`}
                          className="flex gap-4 rounded-2xl border border-gray-100 p-3 transition hover:border-purple-100 hover:bg-purple-50/30 sm:p-4"
                        >
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50 sm:h-24 sm:w-24">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name || "Product"}
                                className="h-full w-full object-contain p-2"
                              />
                            ) : (
                              <span className="text-3xl">🛍️</span>
                            )}
                          </div>

                          <div className="flex min-w-0 flex-1 flex-col justify-center">
                            <h4 className="line-clamp-2 font-bold text-gray-900">
                              {item.name || "Product"}
                            </h4>

                            {item.category && (
                              <p className="mt-1 text-xs text-gray-500">
                                {item.category}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                              <span className="font-bold text-purple-700">
                                {formatPrice(item.price)}
                              </span>

                              <span className="text-gray-500">
                                Qty: {item.quantity}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 items-center">
                            <p className="font-bold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Delivery and Summary */}
                  <div className="mt-7 grid gap-6 border-t border-gray-100 pt-6 md:grid-cols-2">
                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                        Delivery Details
                      </h3>

                      <div className="rounded-2xl bg-gray-50 p-4 text-sm leading-7 text-gray-600">
                        <p className="font-bold text-gray-900">
                          {order.customer?.name || "Customer"}
                        </p>
                        <p>{order.customer?.phone}</p>
                        <p>{order.customer?.email}</p>
                        <p>{order.customer?.address}</p>
                        <p>
                          {[
                            order.customer?.city,
                            order.customer?.state,
                            order.customer?.pincode,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">
                        Order Summary
                      </h3>

                      <div className="rounded-2xl bg-gray-50 p-4">
                        <div className="flex justify-between py-2 text-sm text-gray-600">
                          <span>Subtotal</span>
                          <span>{formatPrice(order.subtotal)}</span>
                        </div>

                        <div className="flex justify-between py-2 text-sm text-gray-600">
                          <span>Shipping</span>
                          <span>
                            {order.shipping === 0
                              ? "FREE"
                              : formatPrice(order.shipping)}
                          </span>
                        </div>

                        <div className="my-2 border-t border-dashed border-gray-200" />

                        <div className="flex justify-between py-2">
                          <span className="font-bold text-gray-900">
                            Total Amount
                          </span>
                          <span className="text-xl font-extrabold text-purple-700">
                            {formatPrice(order.total)}
                          </span>
                        </div>

                        <div className="mt-3 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs text-gray-600">
                          <p>
                            <span className="font-bold text-gray-800">
                              Payment:
                            </span>{" "}
                            {order.paymentMethod || "Demo Payment"}
                          </p>

                          <p className="mt-1">
                            <span className="font-bold text-gray-800">
                              Payment Status:
                            </span>{" "}
                            {order.paymentStatus || "Not Collected"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-10 pb-6 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-purple-600 transition hover:text-purple-800"
          >
            ← Continue Shopping
          </Link>

          <p className="mt-3 text-xs text-gray-400">
            © {new Date().getFullYear()} ShopSphere. All rights reserved.
          </p>
        </div>
      </div>

      {/* Animated Cancel Confirmation */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]"
          onClick={() => !canceling && setSelectedOrder(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-title"
            className="w-full max-w-md animate-[modalIn_.3s_ease-out_both] rounded-3xl bg-white p-7 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              ⚠️
            </div>

            <h2
              id="cancel-title"
              className="mt-5 text-center text-2xl font-extrabold text-gray-900"
            >
              Cancel this order?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-gray-500">
              Are you sure you want to cancel this order? This action cannot
              be undone.
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                disabled={canceling}
                onClick={() => setSelectedOrder(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50"
              >
                Keep Order
              </button>

              <button
                type="button"
                disabled={canceling}
                onClick={cancelOrder}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {canceling ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.94);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}
