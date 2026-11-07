
"use client";

import { useEffect, useMemo, useState } from "react";

type Product = {
  id: string;
  _id?: string;
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

type Customer = {
  name?: string;
  email?: string;
  phone?: string;
};

type Order = {
  id: string;
  date: string;
  total: number;
  status: string;
  customer?: Customer;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // New animation states
  const [showIntro, setShowIntro] = useState(true);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products]
  );

  // Opening animation and scroll-to-top visibility
  useEffect(() => {
    const introTimer = window.setTimeout(() => {
      setShowIntro(false);
    }, 2000);

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.clearTimeout(introTimer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function fetchProducts() {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await fetch("/api/products");
        const data = await response.json();

        if (!response.ok || !data.success || !Array.isArray(data.products)) {
          throw new Error(data.message || "Failed to load products.");
        }

        const mongoProducts: Product[] = data.products.map(
          (product: Omit<Product, "id"> & { _id: string }) => ({
            ...product,
            id: String(product._id),
          })
        );

        if (isMounted) {
          setProducts(mongoProducts);
        }
      } catch (error) {
        console.error("Products fetch error:", error);

        if (isMounted) {
          setProductsError(
            error instanceof Error ? error.message : "Unable to load products."
          );
        }
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const savedCustomer = localStorage.getItem("shopsphere-account");
      const savedOrders = localStorage.getItem("shopsphere-orders");

      let currentCustomer: Customer | null = null;

      if (savedCustomer) {
        currentCustomer = JSON.parse(savedCustomer);
        setCustomer(currentCustomer);
      }

      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);

        if (Array.isArray(parsed)) {
          const customerOrders = currentCustomer?.email
            ? parsed.filter(
                (order: Order) =>
                  order.customer?.email?.toLowerCase() ===
                  currentCustomer?.email?.toLowerCase()
              )
            : [];

          setOrders(customerOrders);
        }
      }
    } catch {
      console.error("Could not load account information.");
    }
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(search.toLowerCase()) ||
        product.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [products, search, category]);

  const cartItems = products.filter((product) => cart[product.id]);
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const total = cartItems.reduce(
    (sum, product) => sum + product.sellingPrice * cart[product.id],
    0
  );

  function addToCart(id: string) {
    const product = products.find((item) => item.id === id);
    if (!product) return;

    setCart((previous) => {
      const currentQuantity = previous[id] || 0;

      if (currentQuantity >= product.stock) {
        alert("Sorry, maximum available stock reached.");
        return previous;
      }

      return { ...previous, [id]: currentQuantity + 1 };
    });
  }

  function changeQuantity(id: string, amount: number) {
    setCart((previous) => {
      const next = { ...previous };
      const quantity = (next[id] || 0) + amount;

      if (quantity <= 0) {
        delete next[id];
      } else {
        const product = products.find((item) => item.id === id);
        if (product && quantity > product.stock) return previous;
        next[id] = quantity;
      }

      return next;
    });
  }

  function handleLogout() {
    setLogoutConfirmOpen(true);
  }

  function confirmLogout() {
    localStorage.removeItem("shopsphere-account");
    setCustomer(null);
    setOrders([]);
    setLogoutConfirmOpen(false);
    setAccountOpen(false);
  }

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#171717]">

      {/* WEBSITE OPENING ANIMATION */}
      {showIntro && (
        <div className="intro-screen fixed inset-0 z-[100] flex items-center justify-center bg-[#111111] text-white">
          <div className="text-center">
            <div className="intro-logo mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-500 text-4xl shadow-2xl shadow-amber-500/30">
              🛍
            </div>

            <h1 className="intro-title mt-6 text-4xl font-black tracking-tight sm:text-5xl">
              Shop<span className="text-amber-400">Sphere</span>
            </h1>

            <p className="intro-subtitle mt-3 text-sm tracking-[0.3em] text-gray-400">
              YOUR SHOPPING DESTINATION
            </p>

            <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/20">
              <div className="intro-progress h-full rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-5">
          <a href="#" className="text-2xl font-extrabold tracking-tight">
            🛍 ShopSphere
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold md:flex">
            <a href="#" className="hover:text-amber-600">Home</a>
            <a href="#products" className="hover:text-amber-600">Shop</a>
            <a href="#categories" className="hover:text-amber-600">Categories</a>
            <a href="#about" className="hover:text-amber-600">About</a>
            <a href="#contact" className="hover:text-amber-600">Contact</a>
            <a href="/orders" className="hover:text-amber-600">My Orders</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAccountOpen(true)}
              className="rounded-full border border-gray-200 bg-white px-3 py-2.5 text-sm font-bold transition hover:border-amber-500 hover:text-amber-700 sm:px-4"
            >
              <span className="sm:hidden">👤</span>
              <span className="hidden sm:inline">👤 Account</span>
            </button>

            <button
              onClick={() => setCartOpen(true)}
              className="rounded-full bg-black px-3 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 sm:px-4"
            >
              🛒 Cart ({cartCount})
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-7">
        <div className="hero-section relative flex min-h-[340px] items-center overflow-hidden rounded-3xl bg-[#ded8d4]">
          <img
            src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600"
            alt="Premium headphones"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/75 to-transparent" />

          <div className="hero-content relative z-10 max-w-xl px-8 py-14 md:px-16">
            <p className="mb-3 font-semibold text-amber-700">
              PREMIUM COLLECTION
            </p>
            <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
              Elevate Your Style
            </h1>
            <p className="mt-4 text-base text-gray-700 md:text-lg">
              Discover the latest trends with unbeatable quality.
            </p>
            <a
              href="#products"
              className="mt-7 inline-block rounded-full bg-black px-8 py-3.5 font-bold text-white transition hover:bg-amber-600"
            >
              Shop Now →
            </a>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="categories" className="mx-auto max-w-7xl px-5 pt-14">
        <div className="mb-6">
          <h2 className="text-3xl font-extrabold md:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-1 text-gray-500">Find exactly what you need</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              onClick={() => setCategory(item)}
              className={`rounded-full border px-6 py-3 text-sm font-semibold transition ${
                category === item
                  ? "border-black bg-black text-white"
                  : "border-gray-200 bg-white hover:border-black"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section id="products" className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold md:text-4xl">
              Our Products
            </h2>
            <p className="mt-1 text-gray-500">
              {productsLoading ? "Loading products..." : `${filteredProducts.length} products available`}
            </p>
          </div>

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products..."
            className="w-full rounded-full border border-gray-200 bg-white px-5 py-3 outline-none focus:border-black sm:w-64"
          />
        </div>

        {productsLoading && (
          <div className="py-16 text-center text-gray-500">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-amber-500" />
            Loading products from ShopSphere...
          </div>
        )}

        {!productsLoading && productsError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <p className="font-bold text-red-700">Could not load products</p>
            <p className="mt-2 text-sm text-red-600">{productsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 rounded-full bg-black px-5 py-2 text-sm font-bold text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {!productsLoading && !productsError && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {filteredProducts.map((product) => (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <span className="absolute left-3 top-3 z-10 rounded-full bg-black px-3 py-1 text-xs font-bold text-white">
                    {product.badge}
                  </span>

                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {product.category}
                  </p>

                  <h3 className="mt-1 text-lg font-bold">{product.name}</h3>

                  <p className="mt-2 min-h-10 text-sm text-gray-500">
                    {product.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xl font-extrabold">
                      ₹{product.sellingPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-gray-400 line-through">
                      ₹{product.mrp.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-bold text-green-700">
                      {product.discountPercent}% OFF
                    </span>
                  </div>

                  <p className="mt-2 text-xs text-gray-500">
                    {product.stock > 0
                      ? `${product.stock} items in stock`
                      : "Out of stock"}
                  </p>

                  <button
                    onClick={() => addToCart(product.id)}
                    disabled={product.stock === 0}
                    className="mt-4 w-full rounded-xl bg-[#171717] py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-gray-400"
                  >
                    🛒 {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {!productsLoading && !productsError && filteredProducts.length === 0 && (
          <p className="py-16 text-center text-gray-500">
            No products found. Try another search.
          </p>
        )}
      </section>

      {/* SPECIAL OFFER */}
      <section className="mx-auto max-w-7xl px-5 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-[#171717] px-8 py-12 text-white md:px-16">
          <div className="relative z-10">
            <p className="font-bold text-amber-400">LIMITED TIME OFFER</p>
            <h2 className="mt-2 text-3xl font-extrabold md:text-5xl">
              Get 30% Off
            </h2>
            <p className="mt-2 text-gray-300">On selected smart watches</p>
            <a
              href="#products"
              className="mt-6 inline-block rounded-full bg-amber-500 px-7 py-3 font-bold text-black hover:bg-amber-400"
            >
              Shop Now →
            </a>
          </div>
        </div>
      </section>

      {/* NEW ABOUT SECTION */}
      <section id="about" className="scroll-mt-24 bg-white px-5 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-12 md:grid-cols-2">
          <div>
            <p className="font-bold uppercase tracking-[0.25em] text-amber-600">
              About ShopSphere
            </p>

            <h2 className="mt-4 text-4xl font-black leading-tight md:text-5xl">
              Shopping Made
              <span className="text-amber-500"> Simple.</span>
              <br />
              Living Made Better.
            </h2>

            <p className="mt-6 leading-8 text-gray-600">
              Welcome to ShopSphere, your online shopping destination.
              We bring together a wide range of products in one place,
              making it easier to discover the things you love.
            </p>

            <p className="mt-4 leading-8 text-gray-600">
              From everyday essentials to lifestyle products, our goal is
              to make your shopping experience simple, convenient and enjoyable.
            </p>

            <a
              href="#products"
              className="mt-8 inline-block rounded-full bg-black px-8 py-3.5 font-bold text-white transition hover:bg-amber-500"
            >
              Explore Products →
            </a>
          </div>

          <div className="about-card relative overflow-hidden rounded-3xl bg-[#171717] p-8 text-white md:p-12">
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-3xl">
                🛍️
              </div>

              <h3 className="mt-8 text-3xl font-extrabold">
                Why ShopSphere?
              </h3>

              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <span className="text-2xl">✨</span>
                  <div>
                    <h4 className="font-bold">Quality Products</h4>
                    <p className="mt-1 text-sm text-gray-400">
                      Discover products selected for your everyday needs.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-2xl">💰</span>
                  <div>
                    <h4 className="font-bold">Great Value</h4>
                    <p className="mt-1 text-sm text-gray-400">
                      Find exciting deals and offers while you shop.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <span className="text-2xl">📦</span>
                  <div>
                    <h4 className="font-bold">Easy Order Tracking</h4>
                    <p className="mt-1 text-sm text-gray-400">
                      Keep track of your orders from your account.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#171717] px-5 py-12 text-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 md:flex-row">
          <div>
            <h2 className="text-2xl font-extrabold">🛍 ShopSphere</h2>
            <p className="mt-3 max-w-sm text-sm text-gray-400">
              Discover quality products, great prices and a better shopping experience.
            </p>
          </div>

          <div id="contact">
            <h3 className="font-bold">Contact</h3>
            <p className="mt-3 text-sm text-gray-400">
              support@shopsphere.com
            </p>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          © 2026 ShopSphere. All rights reserved.
        </p>
      </footer>

      {/* SCROLL TO TOP BUTTON */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        title="Back to top"
        className={`scroll-top-button fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-2xl font-bold text-black shadow-xl transition-all duration-300 hover:-translate-y-1 hover:bg-amber-400 ${
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "pointer-events-none translate-y-5 opacity-0"
        }`}
      >
        ↑
      </button>

      {/* ACCOUNT DRAWER */}
      {accountOpen && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setAccountOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-sm animate-[slideIn_.25s_ease-out] overflow-y-auto bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-5">
              <h2 className="text-2xl font-extrabold">My Account</h2>
              <button
                onClick={() => setAccountOpen(false)}
                aria-label="Close account"
                className="rounded-full bg-gray-100 px-4 py-2 font-bold transition hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="mt-7 rounded-2xl bg-gradient-to-br from-[#171717] to-gray-700 p-6 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-2xl text-black">
                👤
              </div>

              <h3 className="mt-4 text-xl font-extrabold">
                {customer?.name || "Welcome to ShopSphere!"}
              </h3>

              <p className="mt-1 break-all text-sm text-gray-300">
                {customer?.email || "Login to access your account."}
              </p>

              {customer?.phone && (
                <p className="mt-1 text-sm text-gray-300">{customer.phone}</p>
              )}
            </div>

            {!customer ? (
              <div className="mt-6 space-y-3">
                <a
                  href="/login"
                  onClick={() => setAccountOpen(false)}
                  className="block w-full rounded-xl bg-amber-500 py-4 text-center font-bold text-black transition hover:bg-amber-400"
                >
                  Login / Create Account →
                </a>

                <p className="text-center text-xs text-gray-400">
                  Login to view your account and orders.
                </p>
              </div>
            ) : (
              <>
                <div className="mt-7">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Shopping
                  </p>

                  <a
                    href="/orders"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-4 font-semibold transition hover:border-amber-400 hover:bg-amber-50"
                  >
                    <span>📦 My Orders</span>
                    <span className="text-gray-400">→</span>
                  </a>

                  <button
                    onClick={() => {
                      setAccountOpen(false);
                      setCartOpen(true);
                    }}
                    className="mt-3 flex w-full items-center justify-between rounded-xl border border-gray-100 px-4 py-4 text-left font-semibold transition hover:border-amber-400 hover:bg-amber-50"
                  >
                    <span>🛒 My Cart</span>
                    <span className="text-gray-400">{cartCount} items →</span>
                  </button>
                </div>

                <div className="mt-7 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Total Orders
                    </span>
                    <span className="font-extrabold text-gray-900">
                      {orders.length}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">
                      Recent Order
                    </span>
                    <span className="text-sm font-bold text-purple-700">
                      {orders.length > 0 ? orders[0].status : "No orders yet"}
                    </span>
                  </div>
                </div>

                <a
                  href="/orders"
                  onClick={() => setAccountOpen(false)}
                  className="mt-6 block w-full rounded-xl bg-black py-4 text-center font-bold text-white transition hover:bg-amber-600"
                >
                  View All Orders →
                </a>

                <button
                  onClick={handleLogout}
                  className="mt-3 w-full rounded-xl border border-red-200 py-4 font-bold text-red-600 transition hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            )}

            <div className="mt-7 border-t border-gray-100 pt-5">
              <a
                href="/adminlogin"
                onClick={() => setAccountOpen(false)}
                className="block text-center text-sm font-semibold text-gray-500 transition hover:text-amber-600"
              >
                Admin Login →
              </a>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Thank you for shopping with ShopSphere!
            </p>
          </aside>
        </div>
      )}

      {/* CUSTOM LOGOUT CONFIRMATION */}
      {logoutConfirmOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          onClick={() => setLogoutConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-dialog-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-7 shadow-2xl"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-3xl">
              👋
            </div>

            <h2
              id="logout-dialog-title"
              className="mt-5 text-center text-2xl font-extrabold text-gray-900"
            >
              Ready to leave?
            </h2>

            <p className="mt-2 text-center text-sm leading-6 text-gray-500">
              Are you sure you want to logout from your ShopSphere account?
            </p>

            <div className="mt-7 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(false)}
                className="rounded-xl border border-gray-200 px-4 py-3 font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 active:scale-[0.98]"
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CART DRAWER */}
      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/50"
          onClick={() => setCartOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b pb-5">
              <h2 className="text-2xl font-extrabold">Your Cart</h2>
              <button
                onClick={() => setCartOpen(false)}
                className="rounded-full bg-gray-100 px-4 py-2 font-bold"
              >
                ✕
              </button>
            </div>

            {cartItems.length === 0 ? (
              <p className="py-16 text-center text-gray-500">
                Your cart is empty.
              </p>
            ) : (
              <>
                <div className="divide-y">
                  {cartItems.map((product) => (
                    <div key={product.id} className="flex gap-4 py-5">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-bold">{product.name}</h3>
                        <p className="mt-1 font-bold">
                          ₹{product.sellingPrice.toLocaleString("en-IN")}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <button
                            onClick={() => changeQuantity(product.id, -1)}
                            className="rounded bg-gray-100 px-3 py-1"
                          >
                            −
                          </button>
                          <span>{cart[product.id]}</span>
                          <button
                            onClick={() => changeQuantity(product.id, 1)}
                            disabled={cart[product.id] >= product.stock}
                            className="rounded bg-gray-100 px-3 py-1 disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t pt-5">
                  <div className="flex justify-between text-lg font-extrabold">
                    <span>Total</span>
                    <span>₹{total.toLocaleString("en-IN")}</span>
                  </div>

                  <button
                    onClick={() => {
                      localStorage.setItem(
                        "shopsphere-cart",
                        JSON.stringify(
                          cartItems.map((product) => ({
                            product: {
                              id: product.id,
                              name: product.name,
                              category: product.category,
                              price: product.sellingPrice,
                              oldPrice: product.mrp,
                              image: product.imageUrl,
                              description: product.description,
                              emoji: "🛍️",
                              tag: product.badge,
                            },
                            quantity: cart[product.id],
                          }))
                        )
                      );
                      window.location.href = "/checkout";
                    }}
                    className="mt-5 w-full rounded-xl bg-black py-4 font-bold text-white hover:bg-amber-600"
                  >
                    Proceed to Checkout →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .intro-screen {
          animation: introFadeOut 0.6s ease 1.4s forwards;
        }

        .intro-logo {
          animation: logoPop 0.8s ease both;
        }

        .intro-title {
          animation: introText 0.8s ease 0.2s both;
        }

        .intro-subtitle {
          animation: introText 0.8s ease 0.4s both;
        }

        .intro-progress {
          animation: progressLoad 1.5s ease both;
        }

        .hero-content {
          animation: heroEnter 1s ease 0.2s both;
        }

        .about-card {
          animation: aboutFloat 5s ease-in-out infinite;
        }

        @keyframes introFadeOut {
          to {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
          }
        }

        @keyframes logoPop {
          0% {
            opacity: 0;
            transform: scale(0.5) rotate(-20deg);
          }
          70% {
            transform: scale(1.1) rotate(5deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }

        @keyframes introText {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes progressLoad {
          from {
            width: 0;
          }
          to {
            width: 100%;
          }
        }

        @keyframes heroEnter {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes aboutFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-7px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .intro-screen,
          .intro-logo,
          .intro-title,
          .intro-subtitle,
          .intro-progress,
          .hero-content,
          .about-card {
            animation: none !important;
          }

          html {
            scroll-behavior: auto;
          }
        }
      `}</style>
    </main>
  );
}
