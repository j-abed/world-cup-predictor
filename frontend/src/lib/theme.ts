const DARK_MEDIA = "(prefers-color-scheme: dark)";

export function initTheme(): void {
  if (typeof window === "undefined") return;

  const media = window.matchMedia(DARK_MEDIA);

  const apply = () => {
    document.documentElement.classList.toggle("dark", media.matches);
  };

  apply();
  media.addEventListener("change", apply);
}
