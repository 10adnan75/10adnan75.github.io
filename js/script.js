import { themes, themeNames } from "./themes.js";
import { stories } from "./project-stories.js";
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
const compactScreen = matchMedia("(max-width: 900px), (max-height: 500px)");
const terminalHints = [
  "type 'help'. zero judgment.",
  "'about' for the lore.",
  "'projects' for proof.",
  "'research' for rabbit holes.",
  "'skills' to inspect the stack.",
  "'contact' if you have a plot.",
  "'resume' for corporate mode.",
  "'socials' to stalk professionally.",
  "'theme pearl' for flashbang mode.",
  "'football' to touch grass.",
  "'sudo' nice try.",
  "'ls' because muscle memory.",
  "'home' resets the timeline.",
  "'clear' deletes the evidence.",
  "'history' exposes your choices.",
  "'whoami' for an identity crisis.",
  "ctrl+l cleans the evidence.",
];
const routeIntros = {
  home: [
    "ADNAN MAZHARUDDIN SHAIKH",
    "I build stuff.",
    "It mostly works.",
    "Code. Football. Larp.",
  ],
  about: [
    "ABOUT.JSON",
    "Main character.",
    "Patch notes included.",
    "MS CS @ USC. United States of America.",
  ],
  projects: [
    "PROJECTS.JSON",
    "Side quests.",
    "Some actually shipped.",
    "Eight builds. Zero tutorial clones.",
  ],
  research: [
    "RESEARCH.JSON",
    "Rabbit holes.",
    "With citations.",
    "Receipts for the overthinking.",
  ],
  skills: [
    "SKILLS.JSON",
    "Stack check.",
    "No cap.",
    "Tools I trust with production.",
  ],
  contact: [
    "CONTACT.JSON",
    "Ping me.",
    "I reply eventually.",
    "Good ideas get priority.",
  ],
  resume: [
    "RESUME.JSON",
    "The receipts.",
    "Recruiter cut.",
    "Same lore. Fewer jokes.",
  ],
  404: [
    "404.JSON",
    "Wrong timeline.",
    "Nothing spawned here.",
    "Try home before reality crashes.",
  ],
};
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
const jsonOutput = (value) =>
  `<pre class="cli-json">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;

let poweredOn = true;
let windowState = "normal";
let restoreMaximized = false;
const terminalWindow = $("#terminal-window");
function syncWindowIdentity() {
  const app = viewMode === "desktop" ? "Desktop" : "Terminal";
  const hidden = windowState === "closed" || windowState === "minimized";
  $("#desktop-message").textContent = `${app} ${windowState}`;
  $("#restore-terminal").setAttribute(
    "aria-label",
    windowState === "minimized" ? `Restore ${app}` : `Open ${app}`,
  );
  $("#restore-terminal").title = app;
  $("#dock-app-label").textContent = app;
  $("#dock-app-icon").innerHTML =
    app === "Desktop"
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 8h18M8 8v10M10.5 11h7M10.5 14h5"/><path d="M9 21h6"/></svg>'
      : "&gt;_";
  $("#dock-app-icon").classList.toggle("dock-desktop-icon", app === "Desktop");
  $("#window-close").setAttribute("aria-label", `Close ${app}`);
  $("#window-minimize").setAttribute("aria-label", `Minimize ${app}`);
  $("#window-maximize").setAttribute(
    "aria-label",
    windowState === "maximized" ? "Restore window size" : `Maximize ${app}`,
  );
  $("#desktop-hint").hidden = !hidden;
}
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
  syncWindowIdentity();
  $("#window-maximize").setAttribute(
    "aria-pressed",
    String(next === "maximized"),
  );
  $("#window-maximize").title = next === "maximized" ? "Restore" : "Maximize";
  if (hidden && focus) $("#restore-terminal").focus({ preventScroll: true });
  else if (focus) focusPrompt();
  if (previous !== next)
    announce(`${viewMode === "desktop" ? "Desktop" : "Terminal"} ${next}`);
}
function restoreTerminal(focus = true) {
  if (!poweredOn) return;
  if (windowState === "closed") {
    if (viewMode === "desktop") {
      renderDesktop(terminalRoute);
    } else {
      commandHistory = [];
      historyIndex = 0;
      draft = "";
      input.value = "";
      output.innerHTML = terminalContent(
        location.pathname.split("/").filter(Boolean)[0] || "home",
      );
      scroller.scrollTop = 0;
      syncCursor();
    }
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
  terminal.classList.toggle("has-command", Boolean(input.value));
  terminal.style.setProperty("--caret-index", position);
  terminal.style.setProperty("--input-scroll", `${input.scrollLeft}px`);
  $("#typing-cursor").textContent = input.value[position] || "\u00a0";
}
["input", "keyup", "click", "select", "scroll", "focus"].forEach((type) =>
  input.addEventListener(type, syncCursor),
);
input.addEventListener("keydown", () => queueMicrotask(syncCursor));

let hintIndex = 0;
function rotateTerminalHint() {
  if (
    input.value ||
    input.disabled ||
    document.hidden ||
    viewMode !== "terminal" ||
    !poweredOn
  )
    return;

  input.classList.add("hint-swapping");
  window.setTimeout(() => {
    hintIndex = (hintIndex + 1) % terminalHints.length;
    input.placeholder = terminalHints[hintIndex];
    input.classList.remove("hint-swapping");
  }, 140);
}
window.setInterval(rotateTerminalHint, 4200);

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
  syncWindowIdentity();
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
      return `<p class="boot-line">Your desktop. Your rules.</p><h2>Pick a side quest.</h2><p class="muted">Same human. Less typing.</p>`;
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

function terminalContent(route, args = []) {
  const requestedFilter = args.join(" ").toLowerCase();
  const filteredProjects = projects.filter(
    (project) =>
      !requestedFilter || project.category.toLowerCase() === requestedFilter,
  );

  const pages = {
    home: {
      status: "online",
      user: "10adnan75",
      bio: "code, bugs, occasional grass",
      next: ["help", "about", "projects", "research", "contact"],
    },
    about: {
      name: profile.name,
      role: "software developer",
      since: 2016,
      stack: ["Python", "Java", "C++", "C#", "JavaScript", "Linux", "Git"],
      lore: "dating the debugger. it is complicated.",
    },
    projects: {
      count: filteredProjects.length,
      filter: requestedFilter || "all",
      projects: filteredProjects.map(
        ({ name, repo, category, stack, description }) => ({
          name,
          category: category.toLowerCase(),
          stack,
          description,
          source: `${profile.github}${repo}`,
        }),
      ),
    },
    research: {
      count: projects.filter((project) => project.category === "Research")
        .length,
      projects: projects
        .filter((project) => project.category === "Research")
        .map(({ name, repo, stack, description }) => ({
          name,
          stack,
          description,
          source: `${profile.github}${repo}`,
        })),
    },
    skills: {
      languages: ["Java", "Python", "C++", "C#", "JavaScript"],
      tools: ["Linux", "Git", "HTML", "CSS"],
      receipts: ["java.JPG", "linux.JPG", "python.JPG"],
    },
    contact: {
      email: profile.email,
      github: profile.github,
      linkedin: profile.linkedin,
      stackoverflow: profile.stackoverflow,
      leetcode: profile.leetcode,
    },
    resume: {
      file: profile.resume,
      status: "recruiter mode unlocked",
    },
    404: {
      error: "directory_not_found",
      status: 404,
      hint: "try help",
    },
  };

  return jsonOutput(pages[route] || pages[404]);
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
  const [eyebrow, title, accent, copy] = routeIntros[page];
  $("#intro-eyebrow").textContent = eyebrow;
  $("#intro-title").textContent = title;
  $("#intro-accent").textContent = accent;
  $("#intro-copy").textContent = copy;
  $("#enter-terminal").textContent =
    page === "home" ? "Boot me up" : "Open terminal";
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
    output.innerHTML = terminalContent(page, args);
    animateContent();
    scroller.scrollTop = 0;
  }
  announce(`${page} page opened.`);
}
function enterTerminal(focus = true) {
  setPower(true);
  restoreTerminal(false);
  if (
    window.innerWidth <= 600 &&
    !document.body.classList.contains("simple-mode")
  )
    setWindowState("maximized", false);
  else if (document.body.classList.contains("simple-mode"))
    terminal.scrollIntoView({ behavior: "smooth", block: "center" });
  else
    window.scrollTo({
      top: Math.max(0, $(".journey").offsetHeight - innerHeight),
      behavior: "smooth",
    });
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
      `<div class="echo">lurker@10adnan75 ~ ❯ ${escapeHtml(raw)}</div>${terminalContent(page, args)}`,
    );
    announce(`${page} opened.`);
    return;
  }
  let result = "";
  switch (name) {
    case "help":
      result = jsonOutput({
        commands: {
          about: "the lore",
          projects: "projects [systems|web|research]",
          research: "research rabbit holes",
          skills: "skills and receipts",
          contact: "say hey",
          resume: "resume pdf",
          socials: "the links",
          theme: `theme [${themeNames.join("|")}]`,
          history: "command history",
          clear: "clear terminal",
          home: "return home",
          football: "grass lore",
        },
        shortcuts: {
          autocomplete: "tab",
          history: "arrow up or down",
          clear: "ctrl+l",
        },
      });
      break;
    case "ls":
      result = jsonOutput({
        directories: routes.filter((route) => route !== "home"),
      });
      break;
    case "socials":
      result = jsonOutput({
        github: profile.github,
        linkedin: profile.linkedin,
        stackoverflow: profile.stackoverflow,
        leetcode: profile.leetcode,
      });
      break;
    case "clear":
      output.replaceChildren();
      announce("Terminal cleared.");
      return;
    case "history":
      result = jsonOutput({ history: commandHistory });
      break;
    case "theme": {
      const theme = args[0]?.toLowerCase();
      if (themeNames.includes(theme)) {
        applyTheme(theme);
        result = jsonOutput({ theme, status: "applied" });
      } else {
        result = jsonOutput({
          active: terminal.dataset.theme,
          themes: themes.map(({ name, label }) => ({ name, label })),
          usage: "theme <name>",
        });
      }
      break;
    }
    case "football":
      result = jsonOutput({
        grass: "touched",
        runtime: "football",
        bugs: "still chasing",
      });
      break;
    case "sudo":
      result = jsonOutput({
        error: "permission_denied",
        reason: "trust issues have root",
      });
      break;
    default:
      result = jsonOutput({
        error: "command_not_found",
        command: name,
        hint: "type help",
      });
  }
  append(
    `<div class="echo">lurker@10adnan75 ~ ❯ ${escapeHtml(raw)}</div>${result}`,
  );
  announce(
    `${name === "help" ? "Command help displayed" : "Command completed"}.`,
  );
}
$("#command-form").addEventListener("submit", (event) => {
  event.preventDefault();
  run(input.value);
  focusPrompt();
  syncCursor();
});

const completionChoices = [
  ...commandNames,
  ...themeNames.map((theme) => `theme ${theme}`),
  "projects systems",
  "projects web",
  "projects research",
];

function commonPrefix(values) {
  if (!values.length) return "";
  return values.reduce((prefix, value) => {
    let length = 0;
    while (length < prefix.length && prefix[length] === value[length]) length++;
    return prefix.slice(0, length);
  });
}

function completeCommand() {
  const value = input.value.trimStart().toLowerCase();
  const matches = value
    ? completionChoices.filter((command) => command.startsWith(value))
    : commandNames;

  if (!matches.length) {
    append(jsonOutput({ matches: [], hint: "type help" }));
  } else {
    const completion = commonPrefix(matches);
    if (completion.length > value.length) input.value = completion;
    if (matches.length > 1) append(jsonOutput({ matches }));
  }

  input.setSelectionRange(input.value.length, input.value.length);
  syncCursor();
  focusPrompt();
  announce(matches.length ? `Matches: ${matches.join(", ")}` : "No matches.");
}

input.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && !event.shiftKey) {
    event.preventDefault();
    completeCommand();
    return;
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

document.addEventListener("keydown", (event) => {
  if (
    event.defaultPrevented ||
    event.ctrlKey ||
    event.metaKey ||
    event.altKey ||
    event.key.length !== 1 ||
    viewMode !== "terminal" ||
    !poweredOn ||
    windowState === "closed" ||
    windowState === "minimized" ||
    event.target.closest?.(
      "input,textarea,select,button,a,[contenteditable=true]",
    )
  )
    return;

  event.preventDefault();
  focusPrompt();
  const start = input.selectionStart ?? input.value.length;
  const end = input.selectionEnd ?? start;
  input.value = `${input.value.slice(0, start)}${event.key}${input.value.slice(end)}`;
  input.setSelectionRange(start + 1, start + 1);
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
    !compactScreen.matches &&
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
function initializeScene() {
  const restoreFocus = document.activeElement === input;
  if (!window.WebGLRenderingContext) {
    document.body.classList.add("simple-mode");
    $("#terminal-layer").append(terminal);
    return;
  }
  if (!sceneController)
    import("./scene.js")
      .then(({ createScene }) => {
        if (sceneController) return;
        try {
          document.body.classList.remove("simple-mode");
          sceneController = createScene(terminal);
          if (location.pathname !== "/" && !compactScreen.matches)
            requestAnimationFrame(() => enterTerminal(false));
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
initializeScene();
if (
  location.pathname !== "/" &&
  !compactScreen.matches &&
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
    }, 1750);
  },
  { once: true },
);
