
"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  _id: string;
  name: string;
  category: string;
  imageUrl: string;
  mrp: number;
  discountPercent: number;
  sellingPrice: number;
  description: string;
  stock: number;
  currency: string;
  badge: string;
};

type OrderItem = {
  productId: string;
  name: string;
  category: string;
  imageUrl: string;
  price: number;
  quantity: number;
};

type OrderStatus =
  | "Pending"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

type Order = {
  _id: string;
  orderId: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state?: string;
    pincode: string;
  };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
};

const ADMIN_KEY = "shopsphere-admin-logged-in";

const emptyForm = {
  name: "",
  category: "Electronics",
  imageUrl: "",
  mrp: "",
  discountPercent: "0",
  sellingPrice: "",
  description: "",
  stock: "10",
  currency: "INR",
  badge: "New",
};

const money = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

export default function AdminPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productError, setProductError] = useState("");
  const [productMessage, setProductMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [orderError, setOrderError] = useState("");
  const [orderLoading, setOrderLoading] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStorage.getItem(ADMIN_KEY) !== "true") {
      router.replace("/adminlogin");
      return;
    }

    setAuthorized(true);
    loadOrders();
    loadProducts();
  }, [router]);

  // LOAD ALL ORDERS FROM MONGODB
  async function loadOrders() {
    setOrderLoading(true);
    setOrderError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load orders.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the orders database."
      );
    } finally {
      setOrderLoading(false);
    }
  }

  // LOAD PRODUCTS FROM MONGODB
  async function loadProducts() {
    setProductError("");

    try {
      const response = await fetch("/api/products", {
        method: "GET",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to load products.");
      }

      setProducts(Array.isArray(data.products) ? data.products : []);
    } catch (error) {
      setProductError(
        error instanceof Error
          ? error.message
          : "Unable to connect to the product database."
      );
    } finally {
      setLoaded(true);
    }
  }

  // ADD OR EDIT PRODUCT
  async function handleProductSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const mrp = Number(form.mrp);
    const discountPercent = Number(form.discountPercent);
    const sellingPrice = Number(form.sellingPrice);
    const stock = Number(form.stock);

    if (!form.name.trim()) {
      setProductError("Enter product name.");
      return;
    }

    if (!form.category.trim()) {
      setProductError("Enter product category.");
      return;
    }

    if (!Number.isFinite(mrp) || mrp <= 0) {
      setProductError("Enter a valid MRP.");
      return;
    }

    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0) {
      setProductError("Enter a valid selling price.");
      return;
    }

    if (
      !Number.isFinite(discountPercent) ||
      discountPercent < 0 ||
      discountPercent > 100
    ) {
      setProductError("Discount must be between 0 and 100.");
      return;
    }

    if (!Number.isInteger(stock) || stock < 0) {
      setProductError("Enter a valid stock quantity.");
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      imageUrl: form.imageUrl.trim(),
      mrp,
      discountPercent,
      sellingPrice,
      description: form.description.trim(),
      stock,
      currency: form.currency,
      badge: form.badge,
    };

    setSaving(true);
    setProductError("");
    setProductMessage("");

    try {
      const response = await fetch("/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          editingId
            ? { id: editingId, ...productData }
            : productData
        ),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save product.");
      }

      const wasEditing = Boolean(editingId);

      setForm(emptyForm);
      setEditingId(null);

      setProductMessage(
        wasEditing
          ? "Product updated successfully."
          : "New product added successfully."
      );

      await loadProducts();
    } catch (error) {
      setProductError(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving."
      );
    } finally {
      setSaving(false);
    }
  }

  // EDIT PRODUCT
  function startEdit(product: Product) {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      category: product.category || "Electronics",
      imageUrl: product.imageUrl || "",
      mrp: String(product.mrp ?? ""),
      discountPercent: String(product.discountPercent ?? 0),
      sellingPrice: String(product.sellingPrice ?? ""),
      description: product.description || "",
      stock: String(product.stock ?? 0),
      currency: product.currency || "INR",
      badge: product.badge || "New",
    });

    setProductError("");
    setProductMessage("");

    document.getElementById("product-form")?.scrollIntoView({
      behavior: "smooth",
    });
  }

  // DELETE PRODUCT
  async function confirmDelete() {
    if (!deleteTarget || deleting) return;

    setDeleting(true);
    setProductError("");
    setProductMessage("");

    try {
      const response = await fetch(
        `/api/products?id=${encodeURIComponent(deleteTarget._id)}`,
        { method: "DELETE" }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to delete product.");
      }

      if (editingId === deleteTarget._id) {
        setEditingId(null);
        setForm(emptyForm);
      }

      setDeleteTarget(null);
      setProductMessage("Product deleted successfully.");

      await loadProducts();
    } catch (error) {
      setProductError(
        error instanceof Error ? error.message : "Unable to delete product."
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  // CANCEL PRODUCT EDIT
  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
    setProductError("");
    setProductMessage("");
  }

  // UPDATE ORDER STATUS IN MONGODB
  async function updateStatus(orderId: string, status: OrderStatus) {
    if (updatingOrderId) return;

    setUpdatingOrderId(orderId);
    setOrderError("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          status,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update order status.");
      }

      setOrders((previousOrders) =>
        previousOrders.map((order) =>
          order.orderId === orderId
            ? { ...order, status: data.order.status }
            : order
        )
      );
    } catch (error) {
      setOrderError(
        error instanceof Error
          ? error.message
          : "Unable to update order status."
      );
    } finally {
      setUpdatingOrderId(null);
    }
  }

  // ADMIN LOGOUT
  function handleLogout() {
    sessionStorage.removeItem(ADMIN_KEY);
    router.replace("/adminlogin");
  }

  // PRODUCT SEARCH AND CATEGORY FILTER
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.category.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        categoryFilter === "All" || product.category === categoryFilter;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  // DASHBOARD STATISTICS
  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const pendingOrders = orders.filter(
    (order) => order.status === "Pending"
  ).length;

  const shippedOrders = orders.filter(
    (order) => order.status === "Shipped"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => order.status === "Delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => order.status === "Cancelled"
  ).length;

  const outOfStock = products.filter((p) => p.stock === 0).length;
  const inStock = products.filter((p) => p.stock > 0).length;

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  const cardClass =
    "rounded-2xl border border-slate-200 bg-white shadow-sm";

  if (!authorized || !loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-indigo-400" />
          <p className="font-semibold">Preparing your dashboard...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500 text-xl font-black">
              S
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                ShopSphere
              </h1>
              <p className="text-xs text-slate-400">ADMIN CONTROL PANEL</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-2 hidden items-center gap-2 text-xs text-emerald-400 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Dashboard Active
            </span>

            <Link
              href="/"
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-800"
            >
              ↗ Visit Store
            </Link>

            <button
              onClick={handleLogout}
              className="rounded-xl bg-red-500 px-4 py-2.5 text-sm font-bold transition hover:bg-red-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* WELCOME */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Administration
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Dashboard Overview
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Manage your store, products and customer orders.
            </p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            SHOPSPHERE / ADMIN
          </p>
        </section>

        {/* MAIN STATISTICS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Total Orders</p>
              <span className="rounded-xl bg-blue-50 p-3 text-xl">📦</span>
            </div>
            <p className="mt-4 text-3xl font-black">{orders.length}</p>
            <p className="mt-1 text-xs text-slate-400">Orders recorded in MongoDB</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Demo Sales</p>
              <span className="rounded-xl bg-emerald-50 p-3 text-xl">₹</span>
            </div>
            <p className="mt-4 text-3xl font-black">{money(totalSales)}</p>
            <p className="mt-1 text-xs text-slate-400">Total recorded order value</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Pending Orders</p>
              <span className="rounded-xl bg-amber-50 p-3 text-xl">⏳</span>
            </div>
            <p className="mt-4 text-3xl font-black text-amber-600">
              {pendingOrders}
            </p>
            <p className="mt-1 text-xs text-slate-400">Awaiting processing</p>
          </div>

          <div className={`${cardClass} p-5`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-500">Delivered</p>
              <span className="rounded-xl bg-green-50 p-3 text-xl">✓</span>
            </div>
            <p className="mt-4 text-3xl font-black text-green-600">
              {deliveredOrders}
            </p>
            <p className="mt-1 text-xs text-slate-400">Successfully delivered</p>
          </div>
        </section>

        {/* INVENTORY STATISTICS */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-black">Inventory Summary</h2>
            <p className="mt-1 text-sm text-slate-500">
              Live product information from MongoDB
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-indigo-600 p-5 text-white shadow-lg shadow-indigo-200">
              <p className="text-sm font-semibold text-indigo-100">Total Products</p>
              <p className="mt-3 text-4xl font-black">{products.length}</p>
              <p className="mt-2 text-xs text-indigo-100">MongoDB catalogue</p>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-semibold text-slate-500">In Stock</p>
              <p className="mt-3 text-4xl font-black text-emerald-600">{inStock}</p>
              <p className="mt-2 text-xs text-slate-400">Products available</p>
            </div>

            <div className={`${cardClass} p-5`}>
              <p className="text-sm font-semibold text-slate-500">Out of Stock</p>
              <p className="mt-3 text-4xl font-black text-red-600">{outOfStock}</p>
              <p className="mt-2 text-xs text-slate-400">Products unavailable</p>
            </div>
          </div>
        </section>

        {/* ORDER STATUS SUMMARY */}
        <section className={`${cardClass} p-5`}>
          <h3 className="mb-4 font-black">Order Status Summary</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-700">Pending</p>
              <p className="mt-1 text-2xl font-black text-amber-800">{pendingOrders}</p>
            </div>
            <div className="rounded-xl bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-700">Shipped</p>
              <p className="mt-1 text-2xl font-black text-blue-800">{shippedOrders}</p>
            </div>
            <div className="rounded-xl bg-green-50 p-4">
              <p className="text-sm font-semibold text-green-700">Delivered</p>
              <p className="mt-1 text-2xl font-black text-green-800">{deliveredOrders}</p>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <p className="text-sm font-semibold text-red-700">Cancelled</p>
              <p className="mt-1 text-2xl font-black text-red-800">{cancelledOrders}</p>
            </div>
          </div>
        </section>

        {/* PRODUCT FORM */}
        <section id="product-form" className={`${cardClass} overflow-hidden`}>
          <div className="border-b border-slate-100 bg-white px-5 py-5 sm:px-7">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
              Product Management
            </p>
            <h2 className="mt-1 text-2xl font-black">
              {editingId ? "Edit Product" : "Add New Product"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {editingId
                ? "Update product information and inventory."
                : "Add a new product to your store catalogue."}
            </p>
          </div>

          <form onSubmit={handleProductSubmit} className="space-y-6 p-5 sm:p-7">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-bold">Product Name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Category</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home</option>
                  <option>Beauty</option>
                  <option>Sports</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Image URL</label>
                <input
                  className={inputClass}
                  value={form.imageUrl}
                  onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="Paste image URL"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">MRP (₹)</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.mrp}
                  onChange={(e) => setForm({ ...form, mrp: e.target.value })}
                  placeholder="Enter MRP"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Discount (%)</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={form.discountPercent}
                  onChange={(e) =>
                    setForm({ ...form, discountPercent: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Selling Price (₹)</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.sellingPrice}
                  onChange={(e) =>
                    setForm({ ...form, sellingPrice: e.target.value })
                  }
                  placeholder="Enter selling price"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Stock Quantity</label>
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Product Badge</label>
                <select
                  className={inputClass}
                  value={form.badge}
                  onChange={(e) => setForm({ ...form, badge: e.target.value })}
                >
                  <option>New</option>
                  <option>Popular</option>
                  <option>Trending</option>
                  <option>Sale</option>
                  <option>Premium</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">Currency</label>
                <select
                  className={inputClass}
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                >
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="mb-2 block text-sm font-bold">Description</label>
                <textarea
                  className={inputClass}
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Write a short product description..."
                />
              </div>
            </div>

            {productError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {productError}
              </div>
            )}

            {productMessage && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ {productMessage}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 px-7 py-3 font-bold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "+ Add Product"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-bold transition hover:bg-slate-100"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* PRODUCT LIST */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="space-y-4 border-b border-slate-100 p-5 sm:p-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                  Inventory
                </p>
                <h2 className="mt-1 text-2xl font-black">Manage Products</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {products.length} products in your MongoDB catalogue
                </p>
              </div>

              <button
                onClick={loadProducts}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100"
              >
                ↻ Refresh Products
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
              <input
                className={inputClass}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search product name or category..."
              />

              <select
                className={inputClass}
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === "All" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="text-5xl">📦</div>
              <h3 className="mt-4 text-lg font-black">No Products Found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Try another search or add a new product.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:px-7"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-100">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="font-black">{product.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {product.category} · {product.badge}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      Stock: {product.stock}
                    </p>
                    <span
                      className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        product.stock === 0
                          ? "bg-red-100 text-red-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {product.stock === 0 ? "Out of Stock" : "In Stock"}
                    </span>
                  </div>

                  <div className="sm:w-36">
                    <p className="text-lg font-black">
                      {money(product.sellingPrice)}
                    </p>
                    {product.mrp > product.sellingPrice && (
                      <p className="text-sm text-slate-400 line-through">
                        {money(product.mrp)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(product)}
                      className="rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(product)}
                      className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ORDERS FROM MONGODB */}
        <section className={`${cardClass} overflow-hidden`}>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Order Management
              </p>
              <h2 className="mt-1 text-2xl font-black">All Orders</h2>
              <p className="mt-1 text-sm text-slate-500">
                Live customer orders from MongoDB · {orders.length} orders
              </p>
            </div>

            <button
              onClick={loadOrders}
              disabled={orderLoading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold transition hover:bg-slate-100 disabled:opacity-50"
            >
              {orderLoading ? "Loading..." : "↻ Refresh Orders"}
            </button>
          </div>

          {orderError && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {orderError}
            </div>
          )}

          {orderLoading && orders.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />
              <p className="text-sm font-semibold text-slate-500">
                Loading customer orders...
              </p>
            </div>
          ) : orders.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="text-5xl">📭</div>
              <h3 className="mt-4 text-xl font-black">No Orders Found</h3>
              <p className="mt-2 text-sm text-slate-500">
                Customer orders will appear here after checkout.
              </p>
              <Link
                href="/"
                className="mt-5 inline-block rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white hover:bg-indigo-700"
              >
                Visit Store
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {orders.map((order) => (
                <div key={order._id} className="p-5 sm:p-7">
                  <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                        Order ID
                      </p>
                      <p className="mt-1 break-all font-black text-indigo-700">
                        {order.orderId}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString("en-IN")}
                      </p>

                      <div className="mt-5">
                        <h3 className="font-black">Customer Details</h3>
                        <p className="mt-2 text-sm font-semibold">
                          {order.customer.name}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.customer.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.customer.phone}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {order.customer.address}, {order.customer.city}
                          {order.customer.state ? `, ${order.customer.state}` : ""}
                          {" - "}{order.customer.pincode}
                        </p>
                      </div>

                      <div className="mt-5">
                        <h3 className="font-black">Products</h3>

                        {order.items.map((item, index) => (
                          <div
                            key={`${item.productId}-${index}`}
                            className="mt-3 flex flex-wrap items-center gap-3 text-sm"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="h-12 w-12 rounded-lg border border-slate-200 bg-white object-contain"
                              />
                            ) : (
                              <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-xl">
                                📦
                              </span>
                            )}

                            <div>
                              <p className="font-semibold text-slate-700">
                                {item.name} × {item.quantity}
                              </p>
                              <p className="text-xs text-slate-400">
                                {item.category}
                              </p>
                            </div>

                            <span className="ml-auto font-bold">
                              {money(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-fit rounded-2xl bg-slate-50 p-5">
                      <p className="text-sm font-semibold text-slate-500">
                        Order Total
                      </p>
                      <p className="mt-1 text-2xl font-black">
                        {money(order.total)}
                      </p>

                      <div className="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Subtotal</span>
                          <span className="font-semibold">{money(order.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Shipping</span>
                          <span className="font-semibold">{money(order.shipping)}</span>
                        </div>
                      </div>

                      <p className="mt-4 text-xs text-slate-500">
                        Payment Method: {order.paymentMethod}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Payment Status: {order.paymentStatus}
                      </p>

                      <label className="mb-2 mt-5 block text-sm font-bold">
                        Update Order Status
                      </label>

                      <select
                        value={order.status}
                        disabled={updatingOrderId === order.orderId}
                        onChange={(e) =>
                          updateStatus(
                            order.orderId,
                            e.target.value as OrderStatus
                          )
                        }
                        className={`${inputClass} disabled:cursor-wait disabled:opacity-60`}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>

                      {updatingOrderId === order.orderId ? (
                        <p className="mt-3 text-xs font-semibold text-indigo-600">
                          Saving status to MongoDB...
                        </p>
                      ) : (
                        <p className="mt-3 text-xs text-emerald-600">
                          ✓ Status saved in MongoDB
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* FOOTER */}
        <footer className="pb-6 pt-2 text-center">
          <p className="text-sm font-bold text-slate-500">
            ShopSphere Admin Dashboard
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Inventory and orders powered by MongoDB · Demo Store Management
          </p>
        </footer>
      </div>

      {/* CUSTOM DELETE CONFIRMATION */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl">
              🗑️
            </div>

            <h2
              id="delete-title"
              className="mt-5 text-center text-2xl font-black text-slate-900"
            >
              Delete Product?
            </h2>

            <p className="mt-3 text-center text-sm leading-6 text-slate-500">
              Are you sure you want to delete{" "}
              <strong className="text-slate-900">{deleteTarget.name}</strong>?
              This action cannot be undone.
            </p>

            <div className="mt-7 flex gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
