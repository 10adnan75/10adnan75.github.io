import { themes, themeNames } from "./themes.js";
import { stories } from "./project-stories.js";
import { attachSuggestions } from "./suggestions.js";
import { icon, brandForUrl } from "./icons.js";
import {
  profile,
  projects,
  commandNames,
  routes,
  parseCommand,
  escapeHtml,
} from "./content.js";

const $ = (selector) => document.querySelector(selector);
const terminal = $("#terminal");
const output = $("#terminal-output");
const input = $("#command-input");
const scroller = $("#terminal-scroll");
let commandHistory = [],
  historyIndex = 0,
  draft = "";
let sceneController;
let viewMode = "terminal",
  terminalRoute = "home";
const desktopContent = $("#desktop-content");
const demos = {
  "sorting-visualizer": {
    url: "https://10adnan75.github.io/sorting-visualizer/",
    image: "/img/sorting-visualizer-preview.png",
  },
  "speed-typing-test": {
    url: "https://10adnan75.github.io/speed-typing-test/",
    image: "/img/speed-typing-test-preview.png",
  },
};
const projectScreens = {
  "bug-tracker-10adnan75": "/img/bug-tracker-preview.png",
  "undergraduate-thesis": "/img/fake-review-preview.jpg",
};
const smallScreen = matchMedia("(max-width: 900px), (max-height: 500px)");
terminal.dataset.theme = "platinum";
try {
  const savedTheme = localStorage.getItem("adnan-theme");
  if (themeNames.includes(savedTheme)) terminal.dataset.theme = savedTheme;
} catch {}
document.documentElement.dataset.theme = terminal.dataset.theme;
const external = (url, label) =>
  `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${icon(brandForUrl(url))}${label}</a>`;
const chips = (commands) =>
  `<div class="command-chips">${commands.map((command) => `<button data-command="${command}">${command}</button>`).join("")}</div>`;

let poweredOn = true;
let windowState = "normal";
let restoreMaximized = false;
const terminalWindow = $("#terminal-window");
function focusPrompt() {
  if (
    viewMode === "desktop" ||
    !input.isConnected ||
    input.disabled ||
    !poweredOn ||
    windowState === "closed" ||
    windowState === "minimized"
  )
    return;
  scroller.scrollTop = scroller.scrollHeight;
  input.focus({ preventScroll: true });
  // Restored windows can reject the first focus call.
  if (document.activeElement !== input)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (
          input.isConnected &&
          !input.disabled &&
          poweredOn &&
          windowState !== "closed" &&
          windowState !== "minimized"
        )
          input.focus({ preventScroll: true });
      }),
    );
}

function setWindowState(next, focus = true) {
  if (!poweredOn) return;
  const previous = windowState;
  windowState = next;
  const hidden = next === "minimized" || next === "closed";
  terminal.dataset.windowState = next;
  document.body.classList.toggle("workspace-maximized", next === "maximized");
  terminalWindow.inert = hidden;
  terminalWindow.setAttribute("aria-hidden", String(hidden));
  input.disabled = hidden;
  $("#desktop-hint").hidden = !hidden;
  $("#desktop-message").textContent =
    next === "closed" ? "Terminal closed" : "Terminal minimized";
  $("#restore-terminal").setAttribute(
    "aria-label",
    next === "minimized" ? "Restore Terminal" : "Open Terminal",
  );
  $("#window-maximize").setAttribute(
    "aria-pressed",
    String(next === "maximized"),
  );
  $("#window-maximize").setAttribute(
    "aria-label",
    next === "maximized" ? "Restore window size" : "Maximize Terminal",
  );
  $("#window-maximize").title = next === "maximized" ? "Restore" : "Maximize";
  if (hidden && focus) $("#restore-terminal").focus({ preventScroll: true });
  else if (focus) focusPrompt();
  if (previous !== next) announce(`Terminal ${next}`);
}
function restoreTerminal(focus = true) {
  if (!poweredOn) return;
  if (windowState === "closed") {
    commandHistory = [];
    historyIndex = 0;
    draft = "";
    input.value = "";
    output.innerHTML = pageContent(
      location.pathname.split("/").filter(Boolean)[0] || "home",
    );
    scroller.scrollTop = 0;
    syncCursor();
  }
  if (windowState === "closed" || windowState === "minimized")
    setWindowState(restoreMaximized ? "maximized" : "normal", focus);
  else if (focus) focusPrompt();
}
function toggleMaximize() {
  setWindowState(windowState === "maximized" ? "normal" : "maximized");
}
$("#window-close").addEventListener("click", () => {
  restoreMaximized = false;
  setWindowState("closed");
});
$("#window-minimize").addEventListener("click", () => {
  restoreMaximized = windowState === "maximized";
  setWindowState("minimized");
});
$("#window-maximize").addEventListener("click", toggleMaximize);
$("#terminal-titlebar").addEventListener("dblclick", (event) => {
  if (!event.target.closest("button")) toggleMaximize();
});
$("#restore-terminal").addEventListener("click", () => restoreTerminal());
terminalWindow.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && windowState === "maximized") {
    event.preventDefault();
    setWindowState("normal", false);
  }
});
terminal.dataset.windowState = "normal";
function setPower(on) {
  poweredOn = on;
  terminal.classList.toggle("powered-off", !on);
  $("#screen-display").inert = !on;
  $("#screen-display").setAttribute("aria-hidden", String(!on));
  input.disabled =
    !on || windowState === "minimized" || windowState === "closed";
  $("#monitor-power").setAttribute("aria-pressed", String(on));
  $("#monitor-power").setAttribute(
    "aria-label",
    on ? "Turn screen off" : "Turn screen on",
  );
  document.dispatchEvent(
    new window.CustomEvent("monitorpower", { detail: { on } }),
  );
}
$("#monitor-power").addEventListener("click", () => {
  setPower(!poweredOn);
  if (poweredOn && !input.disabled) focusPrompt();
  announce(poweredOn ? "Screen on." : "Screen off.");
});
function syncCursor() {
  if (!input.isConnected) return;
  const position = input.selectionStart ?? input.value.length;
  $("#cursor-before").textContent = input.value.slice(0, position);
  $("#block-cursor").textContent = input.value[position] || "\u00a0";
  $("#cursor-after").textContent = input.value.slice(position + 1);
  $("#input-hint").hidden = Boolean(input.value);
  $(".input-mirror").style.transform = `translateX(${-input.scrollLeft}px)`;
}
["input", "keyup", "click", "select", "scroll", "focus"].forEach((type) =>
  input.addEventListener(type, syncCursor),
);
input.addEventListener("keydown", () => queueMicrotask(syncCursor));

function home() {
  return `<h2 class="welcome-title">10adnan75</h2><p class="welcome-copy">I'm Adnan. Code, bugs, occasional grass.</p>${chips(["about", "projects", "research", "contact"])}<p class="muted">Type <span class="accent">help</span>. No sudo required.</p>`;
}
function applyTheme(theme) {
  if (!themeNames.includes(theme)) return;
  terminal.dataset.theme = theme;
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').content = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--bg")
    .trim();
  $("#desktop-theme").value = theme;
  document
    .querySelectorAll(".theme-choice")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.command === `theme ${theme}`),
      ),
    );
  try {
    localStorage.setItem("adnan-theme", theme);
  } catch {}
}
function renderDesktop(route, args = []) {
  desktopContent.innerHTML =
    route === "home"
      ? `<p class="boot-line">Your desktop. Your rules.</p><h2>Pick a side quest.</h2><p class="muted">Same human. Less typing.</p><div class="desktop-launchers">${[
          ["projects", "The builds", `${projects.length} projects`],
          ["about", "The human", "Meet Adnan"],
          [
            "research",
            "The experiments",
            `${projects.filter((project) => project.category === "Research").length} studies`,
          ],
          ["skills", "The toolkit", "Skills & receipts"],
          ["contact", "The inbox", "Say hey"],
          ["resume", "The resume", "Recruiter mode"],
        ]
          .map(
            ([page, title, caption], i) =>
              `<button data-route="${page}"><span class="launcher-number">${String(i + 1).padStart(2, "0")}</span><strong>${title}</strong><small>${caption}</small></button>`,
          )
          .join("")}</div>`
      : pageContent(route, args);
  $("#desktop-page").value = routes.includes(route) ? route : "home";
  $("#desktop-scroll").scrollTop = 0;
  animateContent(desktopContent);
  document.querySelectorAll("#desktop-nav [data-route]").forEach((button) => {
    const active = button.dataset.route === route;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}
function setView(mode) {
  if (!poweredOn) return;
  if (mode === "desktop") {
    terminalRoute = location.pathname.split("/").filter(Boolean)[0] || "home";
    suggestions.hide();
    viewMode = mode;
    renderDesktop(terminalRoute);
  } else {
    viewMode = "terminal";
    setRoute(terminalRoute);
  }
  scroller.hidden = mode === "desktop";
  scroller.inert = mode === "desktop";
  $("#desktop-view").hidden = mode !== "desktop";
  terminal.dataset.view = mode;
  $("#view-switch").textContent = mode === "desktop" ? "Terminal" : "Desktop";
  $("#view-switch").setAttribute(
    "aria-label",
    mode === "desktop" ? "Switch to terminal view" : "Switch to desktop view",
  );
  $("#view-switch").setAttribute("aria-pressed", String(mode === "desktop"));
  $(".shell-name").textContent = mode === "desktop" ? " Finder" : " zsh";
  if (mode === "terminal") focusPrompt();
  else $("#desktop-scroll").focus({ preventScroll: true });
  announce(`${mode} view.`);
}
$("#desktop-nav").innerHTML = routes
  .map((route) => `<button data-route="${route}">${route}</button>`)
  .join("");
$("#desktop-page").innerHTML = routes
  .map((route) => `<option value="${route}">${route}</option>`)
  .join("");
$("#desktop-page").addEventListener("change", (event) =>
  renderPage(event.target.value),
);
$("#desktop-theme").innerHTML = themes
  .map((theme) => `<option value="${theme.name}">${theme.name}</option>`)
  .join("");
$("#desktop-theme").value = terminal.dataset.theme;
$("#desktop-theme").addEventListener("change", (event) =>
  applyTheme(event.target.value),
);
$("#view-switch").addEventListener("click", () =>
  setView(viewMode === "terminal" ? "desktop" : "terminal"),
);
const preview = $("#project-preview");
$("#preview-close").addEventListener("click", () => preview.close());
preview.addEventListener("close", () => $("#preview-frame").replaceChildren());
preview.addEventListener("click", (event) => {
  if (event.target === preview) {
    const bounds = preview.getBoundingClientRect();
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    )
      preview.close();
  }
});
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-preview]");
  if (!button) return;
  const project = projects.find((item) => item.repo === button.dataset.preview),
    demo = demos[button.dataset.preview];
  if (!project || !demo) return;
  $("#preview-title").textContent = project.name;
  $("#preview-external").href = demo.url;
  const frame = document.createElement("iframe");
  frame.src = demo.url;
  frame.title = `${project.name} live demo`;
  frame.referrerPolicy = "no-referrer";
  frame.setAttribute("sandbox", "allow-scripts allow-same-origin allow-forms");
  $("#preview-frame").replaceChildren(frame);
  preview.showModal();
});
function projectStory(project) {
  const story = stories[project.repo];
  if (!story) return "";
  return `<details class="project-story"><summary>The breakdown <span aria-hidden="true">+</span></summary><div class="story-body"><span class="story-label">${story.label}</span><h4>${story.goal}</h4><p>${story.build}</p><div class="story-flow" aria-label="Project flow">${story.flow.map((step, i) => `<span>${step}</span>${i < story.flow.length - 1 ? '<b aria-hidden="true">→</b>' : ""}`).join("")}</div><p class="muted">${story.detail}</p>${external(`${profile.github}${project.repo}#readme`, "Read the docs")}</div></details>`;
}
function projectCards(filter = "All", query = "") {
  const needle = query.trim().toLowerCase();
  const shown = projects.filter(
    (project) =>
      (filter === "All" ||
        project.category.toLowerCase() === filter.toLowerCase()) &&
      (!needle ||
        `${project.name} ${project.category} ${project.stack} ${project.description}`
          .toLowerCase()
          .includes(needle)),
  );
  return `<p class="project-count">${shown.length} ${shown.length === 1 ? "project" : "projects"}${filter === "All" ? "" : ` in ${escapeHtml(filter.toLowerCase())}`}</p><div class="project-grid">${shown
    .map((project) => {
      const demo = demos[project.repo],
        screen = demo?.image || projectScreens[project.repo];
      return `<article class="project-card">${screen ? (demo ? `<button class="project-shot" data-preview="${project.repo}" aria-label="Open ${project.name} live preview">` : '<div class="project-shot project-shot-static">') + `<img src="${screen}" alt="${project.name} preview" loading="lazy"><span>${demo ? "Live preview" : "Project snapshot"}</span>` + (demo ? "</button>" : "</div>") : ""}<div class="project-kind">${project.category}: ${project.stack}</div><h3>${project.name}</h3><p>${project.description}</p><div class="project-actions">${external(`${profile.github}${project.repo}`, "View source")}${demo ? `<button class="preview-button" data-preview="${project.repo}">Try it live</button>` : ""}</div>${projectStory(project)}</article>`;
    })
    .join("")}</div>`;
}
function nowBuilding() {
  const project = projects.find((item) => item.repo === "poly-learned-index");
  return `<section class="now-building" aria-label="Currently building"><span class="now-label">Currently cooking</span><div><h3>${project.name}</h3><p>DuckDB extension. Still shipping.</p></div><button data-command="research">See research</button></section>`;
}
function pageContent(route, args = []) {
  switch (route) {
    case "home":
      return home();
    case "about":
      return `<p class="boot-line">~/about</p><div class="about-grid"><div><h2>Meet the source of the bugs</h2><p>${profile.name}. Developer. Footballer.</p><p>Community college roots. Coding since 2016. Python blogs since 2020.</p><p class="muted">Dating the debugger. It’s complicated.</p></div><img class="avatar" src="/img/avataaars.svg" alt="Adnan's illustrated avatar"></div><div class="tag-list">${["Python", "Java", "C++", "C#", "JavaScript", "Linux", "Git"].map((x) => `<span>${x}</span>`).join("")}</div><p>${external(profile.resume, "Résumé")}</p>${chips(["skills", "projects", "contact"])}`;
    case "projects": {
      const filter =
        ["All", "Systems", "Web", "Research"].find(
          (x) => x.toLowerCase() === args.join(" ").toLowerCase(),
        ) || "All";
      return `<section class="project-view"><p class="boot-line">~/projects</p><h2>Side quests, shipped.</h2><p class="muted">Shipped code. Lost sleep.</p>${nowBuilding()}<div class="project-tools"><label class="sr-only" for="project-search">Search projects</label><input id="project-search" class="project-search" data-project-search type="search" placeholder="Search projects" autocomplete="off"><div class="project-filters" role="group" aria-label="Filter projects">${["All", "Systems", "Web", "Research"].map((x) => `<button class="filter-button ${filter === x ? "active" : ""}" data-filter="${x}" aria-pressed="${filter === x}">${x}</button>`).join("")}</div></div><div class="project-results">${projectCards(filter)}</div><p class="contact-links">${external(profile.github + "?tab=repositories", "All repositories")} ${external("https://github.com/10adnan75/projects", "Project archive source")}</p></section>`;
    }
    case "research":
      return `<p class="boot-line">~/research</p><h2>Trust issues. Now with data.</h2><p class="muted">ML, databases, and sus reviews.</p>${projectCards("Research")}<p class="contact-links">${external(profile.github + "POLY-ALEX", "Explore POLY-ALEX")} ${external("https://github.com/10adnan75/research", "Research archive source")}</p>${chips(["projects", "contact"])}`;
    case "skills":
      return `<p class="boot-line">~/skills</p><h2>Skill issues? Working on it</h2><p class="muted">The usual suspects.</p><div class="tag-list">${["Java", "Python", "C++", "C#", "JavaScript", "HTML & CSS", "Linux", "Git"].map((x) => `<span>${x}</span>`).join("")}</div><h3>Receipts</h3><div class="certificates"><div><a href="/img/java.JPG" target="_blank" rel="noopener"><img src="/img/java.JPG" alt="Java course certificate" loading="lazy">Object Oriented Programming in Java</a><p class="muted">Duke University & UC San Diego.</p></div><div><a href="/img/linux.JPG" target="_blank" rel="noopener"><img src="/img/linux.JPG" alt="Linux course certificate" loading="lazy">Open Source, Linux & Git</a><p class="muted">The Linux Foundation.</p></div><div><a href="/img/python.JPG" target="_blank" rel="noopener"><img src="/img/python.JPG" alt="Python course certificate" loading="lazy">Python programming</a><p class="muted">Programming foundations.</p></div></div>${chips(["projects", "resume"])}`;
    case "contact":
      return `<p class="boot-line">~/contact</p><h2>Slide into my inbox</h2><p>Cool idea? Weird bug? Send it.</p><p class="contact-email"><a href="mailto:${profile.email}">${profile.email}</a></p><button class="copy-email copy-button">Copy email</button><p class="availability"><span>Availability</span> Open to interesting roles and builds.</p><div class="contact-links contact-profiles">${external(profile.whatsapp, "WhatsApp")}${external(profile.linkedin, "LinkedIn")}${external(profile.github, "GitHub")}${external(profile.stackoverflow, "Stack Overflow")}${external(profile.leetcode, "LeetCode")}</div>`;
    case "resume":
      return `<p class="boot-line">~/resume</p><h2>The lore, recruiter edition</h2><p>Same human. Fewer jokes.</p><div class="contact-links">${external(profile.resume, "Open résumé PDF")}</div>${chips(["projects", "contact"])}`;
    default:
      return `<h2>Directory not found</h2><p>404. This page ghosted.</p>${chips(["home", "about", "projects", "contact"])}`;
  }
}
function setRoute(route, push = true) {
  const valid = routes.includes(route);
  const page = valid ? route : "404";
  if (push) history.pushState({}, "", route === "home" ? "/" : `/${route}/`);
  document.title = `${page === "home" ? "Adnan Shaikh" : page[0].toUpperCase() + page.slice(1) + " | Adnan Shaikh"} | Software Developer`;
  $("#current-path").textContent = route === "home" ? "~" : `~/${route}`;
  document.querySelectorAll("[data-route]").forEach((link) => {
    const active = link.dataset.route === route;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  document.body.classList.toggle("is-page", route !== "home");
  return page;
}
function animateContent(container = output) {
  if (typeof container.animate !== "function") return;
  container.animate(
    [
      { opacity: 0.35, transform: "translateY(7px)" },
      { opacity: 1, transform: "translateY(0)" },
    ],
    { duration: 280, easing: "cubic-bezier(.2,.7,.2,1)" },
  );
}
function announce(message) {
  $("#announcement").textContent = message;
}
function renderPage(route, args = [], push = true) {
  const page = setRoute(route, push);
  setPower(true);
  restoreTerminal(false);
  if (viewMode === "desktop") {
    renderDesktop(page, args);
  } else {
    output.innerHTML = pageContent(page, args);
    animateContent();
    scroller.scrollTop = 0;
  }
  announce(`${page} page opened.`);
}
function enterTerminal(focus = true) {
  if (document.body.classList.contains("simple-mode"))
    terminal.scrollIntoView({ behavior: "smooth", block: "center" });
  else
    window.scrollTo({
      top: Math.max(0, $(".journey").offsetHeight - innerHeight),
      behavior: "smooth",
    });
  setPower(true);
  restoreTerminal(false);
  if (focus) focusPrompt();
}
function navigate(route) {
  renderPage(route);
  if (route === "home" && viewMode === "terminal") {
    if (windowState === "maximized") setWindowState("normal", false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else enterTerminal(false);
}
function append(html) {
  const block = document.createElement("div");
  block.className = "output-block";
  block.innerHTML = html;
  output.append(block);
  animateContent(block);
  while (output.children.length > 55) output.firstElementChild.remove();
  scroller.scrollTop = scroller.scrollHeight;
}
function run(raw) {
  if (
    !raw.trim() ||
    !poweredOn ||
    windowState === "closed" ||
    windowState === "minimized"
  )
    return;
  suggestions.hide();
  commandHistory.push(raw);
  if (commandHistory.length > 100) commandHistory.shift();
  historyIndex = commandHistory.length;
  input.value = "";
  draft = "";
  syncCursor();
  const { name, args } = parseCommand(raw);
  if (routes.includes(name)) {
    const page = setRoute(name);
    append(
      `<div class="echo">lurker@10adnan75 ~ ❯ ${escapeHtml(raw)}</div>${pageContent(page, args)}`,
    );
    announce(`${page} opened.`);
    return;
  }
  let result = "";
  switch (name) {
    case "help":
      result = `<h3>Command menu</h3><div class="help-grid"><code>about, whoami</code><span>The lore</span><code>projects [web]</code><span>Filter: systems, web, research</span><code>research</code><span>Research rabbit holes</span><code>skills</code><span>Skills & receipts</span><code>contact</code><span>Say hey</span><code>resume</code><span>The résumé PDF</span><code>ls</code><span>Browse pages</span><code>theme [name]</code><span>Pick your vibe. Type theme.</span><code>history, clear</code><span>Recall or reset</span><code>home</code><span>Return to the start</span><code>football</code><span>Grass-touching lore</span></div><p class="muted">Also try <span class="accent">cd /projects</span> or <span class="accent">cat about.md</span>.<br>Tab completes commands. ↑↓ recalls history. Ctrl+L clears output.</p>`;
      break;
    case "ls":
      result = chips([
        "about",
        "projects",
        "research",
        "skills",
        "contact",
        "resume",
      ]);
      break;
    case "socials":
      result = `<div class="contact-links">${external(profile.github, "GitHub")}${external(profile.linkedin, "LinkedIn")}${external(profile.stackoverflow, "Stack Overflow")}${external(profile.leetcode, "LeetCode")}</div>`;
      break;
    case "clear":
      output.replaceChildren();
      announce("Terminal cleared.");
      return;
    case "history":
      result = commandHistory
        .map(
          (command, i) => `<div>${i + 1} &nbsp; ${escapeHtml(command)}</div>`,
        )
        .join("");
      break;
    case "theme": {
      const theme = args[0]?.toLowerCase();
      if (themeNames.includes(theme)) {
        applyTheme(theme);
        result = `<p>Theme set to ${theme}.</p>`;
      } else
        result = `<p>Pick your vibe.</p><div class="theme-picker">${themes.map((item) => `<button data-command="theme ${item.name}" class="theme-choice theme-${item.name}" aria-pressed="${terminal.dataset.theme === item.name}"><span>${item.name}</span><small>${item.label}</small></button>`).join("")}</div>`;
      break;
    }
    case "football":
      result =
        "<h3>Grass: touched</h3><p>Football is my other runtime. Still chasing bugs. Different pitch.</p>";
      break;
    case "sudo":
      result = "<p>Permission denied. My trust issues have root access.</p>";
      break;
    default:
      result = `<p>Command not found: <span class="accent">${escapeHtml(name)}</span></p><p class="muted">Lost? Type <span class="accent">help</span>.</p>`;
  }
  append(
    `<div class="echo">lurker@10adnan75 ~ ❯ ${escapeHtml(raw)}</div>${result}`,
  );
  announce(
    `${name === "help" ? "Command help displayed" : "Command completed"}.`,
  );
}
const suggestions = attachSuggestions(
  input,
  $("#command-form"),
  commandNames,
  syncCursor,
);
$("#command-form").addEventListener("submit", (event) => {
  event.preventDefault();
  run(input.value);
  focusPrompt();
  syncCursor();
});
input.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && !event.shiftKey && input.value.trim()) {
    const value = input.value.toLowerCase();
    const parts = value.split(" ");
    const partial = parts.pop();
    const matches = commandNames.filter((command) =>
      command.startsWith(partial),
    );
    if (matches.length) {
      event.preventDefault();
      if (matches.length === 1) input.value = [...parts, matches[0]].join(" ");
      else {
        append(`<p class="muted">${matches.join(" &nbsp; ")}.</p>`);
        announce(`Suggestions: ${matches.join(", ")}`);
      }
    }
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    if (historyIndex === commandHistory.length) draft = input.value;
    historyIndex = Math.max(0, historyIndex - 1);
    input.value = commandHistory[historyIndex] || "";
  }
  if (event.key === "ArrowDown") {
    event.preventDefault();
    historyIndex = Math.min(commandHistory.length, historyIndex + 1);
    input.value = commandHistory[historyIndex] ?? draft;
  }
  if (event.ctrlKey && event.key.toLowerCase() === "l") {
    event.preventDefault();
    output.replaceChildren();
  }
  syncCursor();
});
document.addEventListener("click", async (event) => {
  const link = event.target.closest("[data-route]");
  if (
    link &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0
  ) {
    event.preventDefault();
    navigate(link.dataset.route);
  }
  const command = event.target.closest("[data-command]");
  if (command) {
    const parsed = parseCommand(command.dataset.command);
    if (viewMode === "desktop" && routes.includes(parsed.name)) {
      renderPage(parsed.name, parsed.args);
    } else {
      run(command.dataset.command);
      focusPrompt();
    }
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) {
    const view = filter.closest(".project-view");
    const group = view.querySelector(".project-filters");
    const results = view.querySelector(".project-results");
    results.innerHTML = projectCards(
      filter.dataset.filter,
      view.querySelector("[data-project-search]").value,
    );
    animateContent(results);
    group.querySelectorAll("[data-filter]").forEach((button) => {
      const selected = button === filter;
      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    announce(`Showing ${filter.dataset.filter.toLowerCase()} projects.`);
  }
  if (event.target.closest(".copy-email")) {
    const button = event.target.closest(".copy-email");
    try {
      await navigator.clipboard.writeText(profile.email);
      button.textContent = "Email copied";
      announce("Email address copied.");
    } catch {
      button.textContent = "Select the email above to copy";
      announce(
        "Clipboard unavailable. Select and copy the email address above.",
      );
    }
  }
});
document.addEventListener("input", (event) => {
  const search = event.target.closest("[data-project-search]");
  if (!search) return;
  const view = search.closest(".project-view");
  const active =
    view.querySelector("[data-filter].active")?.dataset.filter || "All";
  const results = view.querySelector(".project-results");
  results.innerHTML = projectCards(active, search.value);
  animateContent(results);
  announce(`Showing matching projects.`);
});
document.addEventListener(
  "toggle",
  (event) => {
    const story = event.target;
    if (story.matches?.(".project-story") && story.open) {
      const scrollArea = story.closest(".desktop-scroll,.terminal-scroll");
      const bounds = story.getBoundingClientRect(),
        viewport = scrollArea.getBoundingClientRect();
      if (bounds.bottom > viewport.bottom)
        scrollArea.scrollTop += bounds.top - viewport.top - 16;
    }
  },
  true,
);
// Terminal background clicks return focus to the prompt.
scroller.addEventListener("click", (event) => {
  if (
    event.target.closest("a,button,input,summary,details,[role=option]") ||
    window.getSelection()?.toString() ||
    input.disabled
  )
    return;
  focusPrompt();
  if (
    !smallScreen.matches &&
    window.scrollY < $(".journey").offsetHeight - innerHeight - 20
  )
    enterTerminal();
});
$("#enter-terminal").addEventListener("click", () => enterTerminal());
$(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  enterTerminal();
});
window.addEventListener("popstate", () => {
  const route = location.pathname.split("/").filter(Boolean)[0] || "home";
  renderPage(route, [], false);
  if (route !== "home") enterTerminal(false);
  else window.scrollTo({ top: 0, behavior: "smooth" });
});
function updateMotion() {
  const restoreFocus = document.activeElement === input;
  const simple = smallScreen.matches;
  document.body.classList.toggle("simple-mode", simple);
  if (simple) {
    sceneController?.dispose();
    sceneController = undefined;
    $("#terminal-layer").append(terminal);
    if (restoreFocus && !input.disabled) focusPrompt();
  } else if (!sceneController)
    import("./scene.js")
      .then(({ createScene }) => {
        if (smallScreen.matches || sceneController) return;
        try {
          sceneController = createScene(terminal);
          if (restoreFocus && !input.disabled) focusPrompt();
        } catch (error) {
          console.warn(
            "3D unavailable; using accessible terminal view.",
            error,
          );
          document.body.classList.add("simple-mode");
          $("#terminal-layer").replaceChildren(terminal);
        }
      })
      .catch(() => {
        document.body.classList.add("simple-mode");
      });
}
smallScreen.addEventListener("change", updateMotion);
document
  .querySelectorAll("[data-icon]")
  .forEach((element) => (element.innerHTML = icon(element.dataset.icon)));
$("#year").textContent = new Date().getFullYear();
document
  .querySelectorAll(".shortcut-number")
  .forEach(
    (element, index) =>
      (element.textContent = String(index + 1).padStart(2, "0")),
  );
renderPage(
  location.pathname.split("/").filter(Boolean)[0] || "home",
  [],
  false,
);
syncCursor();
updateMotion();
if (
  location.pathname !== "/" &&
  !document.body.classList.contains("simple-mode")
)
  requestAnimationFrame(() =>
    window.scrollTo({
      top: Math.max(0, $(".journey").offsetHeight - innerHeight),
      behavior: "instant",
    }),
  );
window.addEventListener(
  "load",
  () => {
    const loader = $("#boot-loader");
    setTimeout(() => {
      loader.classList.add("is-done");
      setTimeout(() => loader.remove(), 260);
    }, 360);
  },
  { once: true },
);
