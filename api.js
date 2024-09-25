const packages = await (await fetch("https://api.css.gal")).json();

const tree = document.createDocumentFragment();
const ul = push(tree, "ul", { class: "packages" });

const db = [];

for (const pkg of packages) {
  const li = push(ul, "li", { class: "package", hidden: true });
  push(li, "strong", { class: "package-name" }, pkg.name);
  push(
    li,
    "a",
    { class: "package-author", href: pkg.author.url },
    `by ${pkg.author.name}`,
  );
  push(
    li,
    "p",
    { class: "package-description" },
    convertUrlsToLinks(pkg.description),
  );

  const modules = push(li, "ul", { class: "package-modules" });

  for (const module of pkg.modules) {
    const mod = push(modules, "li");
    const preview = push(mod, "a", {
      class: "package-module",
      href: `https://api.css.gal/${pkg.name}/${module.name}`,
    }, module.name);
    preview.addEventListener("click", (e) => {
      e.preventDefault();
      openPreview(pkg, module);
    });
    db.push([
      mod,
      `${module.name} ${module.description} ${pkg.name}`.toLowerCase(),
    ]);
  }
}

document.getElementById("search").append(tree);

function search(query) {
  let limit = 10;
  query = query?.toLowerCase().trim();

  if (query?.length < 2) {
    ul.querySelectorAll(":scope > li").forEach((li) => {
      li.hidden = true;
    });
    return;
  }

  for (const [el, text] of db) {
    const matches = text.includes(query);
    el.hidden = !matches;
    if (matches) {
      limit--;

      if (limit <= 0) {
        break;
      }
    }
  }

  ul.querySelectorAll(":scope > li").forEach((li) => {
    li.hidden = !li.matches(":has(li:not([hidden]))");
  });
}

const input = document.getElementById("search-input");
search(input.value);

input.addEventListener("input", () => {
  search(input.value);
});

/** Create and append a DOM element to another */
export function push(el, tag, attrs, ...children) {
  const child = dom(tag, attrs, ...children);
  el.append(child);
  return child;
}

async function openPreview(pkg, module) {
  const url = `https://api.css.gal/${pkg.name}/${module.name}`;
  const fragment = document.createDocumentFragment();
  const modal = push(fragment, "dialog", { class: "modal" });

  const nav = push(modal, "nav");
  push(
    nav,
    "button",
    { class: "close", onclick: () => modal.remove() },
    "Close",
  );
  push(nav, "a", { href: url, target: "_blank" }, "Open in new window");

  const header = push(modal, "header", { class: "package" });

  push(header, "h2", { class: "package-name" }, `${pkg.name}/${module.name}`);
  push(header, "span", { class: "package-author" }, `by ${pkg.author.name}`);
  push(
    header,
    "p",
    { class: "package-description" },
    convertUrlsToLinks(pkg.description),
  );
  push(
    header,
    "p",
    { class: "package-module-description" },
    convertUrlsToLinks(module.description),
  );

  let html = await (await fetch(url)).text();
  html += `<style hidden>
    style:not([hidden]) {
    display: block;
    white-space: pre;
    font-family: monospace;
    font-size: 16px;
    padding: 8px;
    border: solid 1px #dcded3;
    border-radius: 6px;
    background: #f1f2ed;
    margin: 2em;
    color: #353633;
    overflow-x: auto;
  }
  </style>
  <script>
    document.querySelectorAll("style:not([hidden])").forEach((style) => {
      style.contentEditable = true;
      style.spellcheck = false;
    });
  </script>`;

  push(modal, "iframe", { srcdoc: html });

  document.body.append(fragment);
  modal.showModal();
}

/** Create a new DOM element */
function dom(tag, attrs, ...children) {
  const el = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs ?? {})) {
    if (k.startsWith("on")) {
      el.addEventListener(k.slice(2), v);
      continue;
    }

    if (k === "data") {
      for (const [name, value] of Object.entries(v)) {
        el.dataset[name] = value;
      }
      continue;
    }

    if (v !== undefined) {
      if (Array.isArray(v)) {
        el.setAttribute(k, v.filter((v) => v).join(" "));
        continue;
      }

      el.setAttribute(k, v);
    }
  }

  for (const child of children) {
    if (child === null || child === undefined) {
      continue;
    }

    if (typeof child === "string") {
      if (child.includes("</")) {
        el.append(
          ...new DOMParser().parseFromString(child, "text/html").body
            .childNodes,
        );
        continue;
      }
      el.append(document.createTextNode(child));
    } else {
      el.append(child);
    }
  }
  return el;
}

function convertUrlsToLinks(text) {
  return text.replaceAll(/(https?:\/\/[^\s]+)/g, "<a href='$1'>$1</a>");
}
