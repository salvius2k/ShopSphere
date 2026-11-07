
"use client";

import { useEffect, useRef, useState } from "react";

export default function SiteTransition() {
  const [showIntro, setShowIntro] = useState(true);
  const [showExit, setShowExit] = useState(false);
  const navigating = useRef(false);

  useEffect(() => {
    const alreadyVisited = sessionStorage.getItem(
      "shopsphere-intro-shown"
    );

    if (alreadyVisited) {
      setShowIntro(false);
      return;
    }

    sessionStorage.setItem("shopsphere-intro-shown", "true");

    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 2400);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function handleExternalLink(event: MouseEvent) {
      const target = event.target as HTMLElement;

      const link = target.closest("a") as HTMLAnchorElement | null;

      if (!link) return;

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === "_blank" ||
        link.hasAttribute("download")
      ) {
        return;
      }

      const href = link.href;

      if (!href) return;

      let destination: URL;

      try {
        destination = new URL(href);
      } catch {
        return;
      }

      if (
        destination.origin === window.location.origin ||
        !["http:", "https:"].includes(destination.protocol)
      ) {
        return;
      }

      event.preventDefault();

      if (navigating.current) return;

      navigating.current = true;
      setShowExit(true);

      window.setTimeout(() => {
        window.location.assign(destination.href);
      }, 750);
    }

    document.addEventListener("click", handleExternalLink, true);

    return () => {
      document.removeEventListener("click", handleExternalLink, true);
    };
  }, []);

  if (!showIntro && !showExit) return null;

  return (
    <div
      className={`site-transition ${
        showExit ? "site-transition-exit" : "site-transition-intro"
      }`}
    >
      <div className="transition-content">
        <div className="transition-logo">S</div>

        <h1 className="transition-title">SHOPSPHERE</h1>

        <p className="transition-subtitle">
          YOUR WORLD. YOUR SHOP.
        </p>

        <div className="transition-line">
          <span />
        </div>
      </div>
    </div>
  );
}
