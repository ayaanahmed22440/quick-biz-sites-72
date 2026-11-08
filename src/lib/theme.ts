import { useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";
const KEY = "ww-theme";

/** Inline script run in <head> before paint so there is no white flash. */
export const THEME_INIT_SCRIPT = `(function(){try{var p=localStorage.getItem("${KEY}")||"system";var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

function apply(pref: ThemePref) {
  const dark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const root = document.documentElement;
  root.classList.toggle("dark", dark);
  root.style.colorScheme = dark ? "dark" : "light";
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>("system");

  useEffect(() => {
    const stored = (localStorage.getItem(KEY) as ThemePref | null) ?? "system";
    setPref(stored);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if ((localStorage.getItem(KEY) ?? "system") === "system") apply("system");
    };
    const onSync = (e: Event) => setPref((e as CustomEvent<ThemePref>).detail);
    mq.addEventListener("change", onChange);
    window.addEventListener("ww-theme", onSync);
    return () => {
      mq.removeEventListener("change", onChange);
      window.removeEventListener("ww-theme", onSync);
    };
  }, []);

  const setTheme = (next: ThemePref) => {
    localStorage.setItem(KEY, next);
    apply(next);
    setPref(next);
    window.dispatchEvent(new CustomEvent("ww-theme", { detail: next }));
  };

  return { theme: pref, setTheme };
}
