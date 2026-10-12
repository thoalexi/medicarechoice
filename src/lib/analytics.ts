declare global {
  interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; __ppgGa?: boolean }
}

/** Send a GA4 event; silently does nothing if analytics isn't loaded. */
export function track(name: string, params: Record<string, unknown> = {}) {
  if (typeof window !== "undefined" && window.gtag) window.gtag("event", name, params);
}

export function initGa(id: string) {
  if (window.__ppgGa) return;
  window.__ppgGa = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // eslint-disable-next-line prefer-rest-params -- gtag.js needs the Arguments object
    window.dataLayer!.push(arguments);
  };
  window.gtag("set", "developer_id.dZjgwMW", true);
  window.gtag("js", new Date());
  // Page views are sent manually so in-site navigation is counted; full URL keeps UTM tags.
  window.gtag("config", id, { send_page_view: false });
  pageView();

  // Primary calls to action: any click on a link to a key page or the main buttons.
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    const dest = url.pathname;
    const map: Record<string, string> = { "/guide": "start_questionnaire", "/compare": "open_compare", "/donate": "donate_click", "/formulary-check": "check_drugs_click", "/feedback": "feedback_click" };
    const action = map[dest];
    if (action) track("cta_click", { cta_action: action, cta_text: (a.textContent || "").trim().slice(0, 100), link_url: dest + url.hash, page_path: location.pathname });
  }, { capture: true });
}

let last = "";
export function pageView() {
  const href = location.href;
  if (!window.gtag || href === last) return;
  last = href;
  window.gtag("event", "page_view", { page_location: href, page_path: location.pathname + location.search, page_title: document.title });
}
