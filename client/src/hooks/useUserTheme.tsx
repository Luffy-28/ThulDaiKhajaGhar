// useUserTheme.ts
import { useEffect } from "react";

export function useUserTheme() {
  const saveTheme = (theme: string) => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  };

  const applyTheme = (theme: string) => {
    const body = document.body;
    if (theme === "default") {
      body.style.background = "#fff";
      body.style.color = "#000";
    } else if (theme === "dark") {
      body.style.background = "#121212";
      body.style.color = "#fff";
    } else if (theme.startsWith("linear-gradient")) {
      body.style.background = theme;
      body.style.color = "#000";
    } else {
      body.style.background = theme;
      body.style.color = "#000";
    }
    // Update buttons/cards globally
    document.documentElement.style.setProperty("--btn-bg", theme === "dark" ? "#333" : "#00796b");
    document.documentElement.style.setProperty("--card-bg", theme === "dark" ? "#1e1e1e" : "#fff");
  };

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved) applyTheme(saved);
  }, []);

  return { saveTheme };
}
