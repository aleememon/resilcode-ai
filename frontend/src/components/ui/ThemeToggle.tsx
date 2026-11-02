"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";

type Theme = "dark" | "light";

const THEME_STORAGE_KEY = "aegis-theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("light", theme === "light");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Storage can be unavailable in private browsing; the class still applies. */
  }

  const themeColor = document.querySelector('meta[name="theme-color"]');
  themeColor?.setAttribute("content", theme === "light" ? "#ffffff" : "#0a0e17");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        applyTheme(stored);
      }
    } catch {
      /* Keep the default dark palette. */
    }
  }, []);

  const nextTheme: Theme = theme === "dark" ? "light" : "dark";

  const toggleTheme = () => {
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-glass-line/10 bg-surface-container-low text-on-surface-variant transition-all duration-200 hover:border-primary-container/40 hover:bg-surface-container-high hover:text-primary active:scale-95"
    >
      <Icon
        name={nextTheme === "light" ? "light_mode" : "dark_mode"}
        className="text-[18px]"
      />
    </button>
  );
}
