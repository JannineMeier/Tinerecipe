// ui.js - minimale Utilities
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const h = (tag, attrs = {}, ...children) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    }
    return el;
  };

  // kleine Toast-Info (unten)
  function toast(msg) {
    let t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      left: "50%",
      transform: "translateX(-50%)",
      bottom: "18px",
      background: "#ff7fb3",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: "12px",
      boxShadow: "0 6px 20px rgba(0,0,0,.18)",
      zIndex: 9999,
      fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1500);
  }

  window.UI = { $, $$, h, toast };
})();
