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
      `${pkg.name} ${pkg.description} ${module.name}`.toLowerCase(),
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

  const pack = push(modal, "section", { class: "package" });
  const header = push(pack, "header");

  push(header, "h2", { class: "package-name" }, `${pkg.name}/${module.name}`);
  push(header, "span", { class: "package-author" }, `by ${pkg.author.name}`);
  push(
    header,
    "p",
    { class: "package-description" },
    convertUrlsToLinks(pkg.description),
  );
  push(
    pack,
    "p",
    { class: "package-module-description" },
    convertUrlsToLinks(module.description),
  );
  const css = await (await fetch(url + ".css")).text();
  const syntax = Prism.highlight(css, Prism.languages.css, "css");
  const pre = push(pack, "pre", { class: "package-module-css language-css" }, `<code>${syntax}</code>`);
  push(pre, "button", {
    class: "copy",
    onclick() {
      navigator.clipboard.writeText(css);
      this.textContent = "Copied!";

      setTimeout(() => {
        this.textContent = "Copy";
      }, 2000);
    }
  }, "Copy");

  push(modal, "iframe", { src: url });

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
  return text
    .trim()
    .replaceAll("\n", "<br>")
    .replaceAll(/(https?:\/\/[^\s]+)/g, "<a href='$1'>$1</a>");
}
