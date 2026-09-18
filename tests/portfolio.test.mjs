import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { parseCommand, routes } from "../js/content.js";

test("command aliases resolve page paths", () => {
  assert.deepEqual(parseCommand("cd /projects/"), {
    name: "projects",
    args: [],
  });
  assert.deepEqual(parseCommand("projects systems"), {
    name: "projects",
    args: ["systems"],
  });
  assert.equal(parseCommand("cat about.md").name, "about");
  assert.equal(parseCommand("whoami").name, "about");
  assert.equal(parseCommand("cd ~").name, "home");
});

test("terminal navigation, keyboard UX, filtering, and untrusted input", async () => {
  const html = await readFile(
    new URL("../index.html", import.meta.url),
    "utf8",
  );
  const dom = new JSDOM(html, {
    url: "http://localhost/",
    pretendToBeVisual: true,
  });
  const { window } = dom;
  window.matchMedia = (query) => ({
    matches: query.includes("max-width"),
    addEventListener() {},
  });
  window.scrollTo = () => {};
  window.HTMLElement.prototype.scrollIntoView = function () {};
  for (const key of [
    "window",
    "document",
    "history",
    "location",
    "localStorage",
    "navigator",
  ])
    Object.defineProperty(globalThis, key, {
      value: window[key],
      configurable: true,
    });
  globalThis.matchMedia = window.matchMedia;
  globalThis.requestAnimationFrame = (callback) => callback();
  await import("../js/script.js");
  const $ = (selector) => window.document.querySelector(selector);
  const run = (command) => {
    $("#command-input").value = command;
    $("#command-form").dispatchEvent(
      new window.Event("submit", { bubbles: true, cancelable: true }),
    );
  };
  assert.match($("#terminal-output").textContent, /10adnan75/);
  assert.equal(
    $("#command-form .prompt-identity").textContent,
    "lurker@10adnan75",
  );
  run("cd /projects");
  assert.equal(window.location.pathname, "/projects/");
  assert.equal($("#intro-title").textContent, "Side quests.");
  assert.equal($("#intro-accent").textContent, "Some actually shipped.");
  assert.equal(document.querySelectorAll(".project-card").length, 0);
  assert.match($("#terminal-output").textContent, /"count": 8/);
  assert.equal(
    $("#terminal-output .echo .prompt-identity").textContent,
    "lurker@10adnan75",
  );
  assert.match($("#terminal-output").textContent, /"projects":/);
  run("about");
  assert.equal(window.location.pathname, "/about/");
  assert.match($("#terminal-output").textContent, /Mazharuddin/);
  run("contact");
  assert.match(
    $("#terminal-output").textContent,
    /adnanmazharuddinshaikh@gmail.com/,
  );
  run("<img src=x onerror=alert(1)>");
  assert.equal($("#terminal-output img[onerror]"), null);
  assert.match($("#terminal-output").textContent, /command_not_found/);
  run("theme platinum");
  assert.equal($("#terminal").dataset.theme, "platinum");
  run("resume");
  assert.match($("#terminal-output").textContent, /adnanmaz@usc.edu.pdf/);
  assert.doesNotMatch($("#terminal-output").textContent, /ams_cv.pdf/);
  const contentBeforePowerOff = $("#terminal-output").innerHTML;
  $("#monitor-power").click();
  assert.equal($("#monitor-power").getAttribute("aria-pressed"), "false");
  assert.equal($("#command-input").disabled, true);
  assert.equal($("#screen-display").inert, true);
  assert.equal($("#terminal").classList.contains("powered-off"), true);
  run("about");
  assert.equal($("#terminal-output").innerHTML, contentBeforePowerOff);
  $("#monitor-power").click();
  assert.equal($("#command-input").disabled, false);
  assert.equal($("#screen-display").inert, false);
  assert.equal(document.activeElement, $("#command-input"));
  assert.equal($("#terminal-output").innerHTML, contentBeforePowerOff);
  $("#command-input").value = "hello";
  $("#command-input").setSelectionRange(2, 2);
  $("#command-input").dispatchEvent(new window.Event("input"));
  assert.equal($("#terminal").classList.contains("has-command"), true);
  assert.equal($("#command-input").placeholder, "type 'help'. zero judgment.");
  assert.equal($("#typing-cursor").textContent, "l");
  assert.equal($("#terminal").style.getPropertyValue("--caret-index"), "2");
  assert.equal(document.querySelector(".run-command"), null);
  assert.equal($("#command-form").parentElement, $("#terminal-scroll"));
  assert.equal($("#terminal-scroll").contains($("#command-form")), true);
  $("#command-input").blur();
  $("#terminal-scroll").click();
  assert.equal(document.activeElement, $("#command-input"));
  run("resume");
  assert.equal($("#scroll-enter"), null);
  assert.equal(document.querySelectorAll(".window-controls button").length, 3);
  const savedSession = $("#terminal-output").innerHTML;
  $("#command-input").value = "unfinished command";
  $("#window-minimize").click();
  assert.equal($("#terminal").dataset.windowState, "minimized");
  assert.equal($("#terminal-window").inert, true);
  assert.equal($("#command-input").disabled, true);
  assert.equal(document.activeElement, $("#restore-terminal"));
  $("#monitor-power").click();
  $("#monitor-power").click();
  assert.equal($("#terminal").dataset.windowState, "minimized");
  assert.equal($("#command-input").disabled, true);
  $("#restore-terminal").click();
  assert.equal($("#terminal").dataset.windowState, "normal");
  assert.equal($("#command-input").value, "unfinished command");
  assert.equal($("#terminal-output").innerHTML, savedSession);
  $("#window-maximize").click();
  assert.equal($("#terminal").dataset.windowState, "maximized");
  assert.equal($("#window-maximize").getAttribute("aria-pressed"), "true");
  $("#window-minimize").click();
  $("#restore-terminal").click();
  assert.equal($("#terminal").dataset.windowState, "maximized");
  $("#window-maximize").click();
  assert.equal($("#terminal").dataset.windowState, "normal");
  $("#window-maximize").click();
  $("#terminal-window").dispatchEvent(
    new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
  );
  assert.equal($("#terminal").dataset.windowState, "normal");
  $("#window-close").click();
  assert.equal($("#terminal").dataset.windowState, "closed");
  assert.equal($("#terminal-window").inert, true);
  $("#restore-terminal").click();
  assert.equal($("#terminal").dataset.windowState, "normal");
  assert.equal($("#command-input").value, "");
  assert.equal($("#terminal-window").inert, false);
  assert.match($("#terminal-output").textContent, /recruiter mode unlocked/);
  $("#window-close").click();
  $('[data-route="about"]').click();
  assert.equal($("#terminal").dataset.windowState, "normal");
  assert.match($("#terminal-output").textContent, /Mazharuddin/);
  assert.equal($("#motion-toggle"), null);
  assert.equal($("#terminal-expand"), null);
  assert.equal(
    document.querySelector(
      ".window-dots, .status-dot, .orange-dot, .power-led",
    ),
    null,
  );
  assert.equal($("#monitor-power svg") !== null, true);
  assert.equal(document.querySelector(".screen-off").textContent, "");
  assert.equal(
    document.querySelectorAll(".site-footer .social-icon").length,
    2,
  );
  for (const route of routes) {
    run(route);
    assert.doesNotMatch($("#terminal-output").textContent, /[\u2014\u2197]/);
  }
  run("clear");
  run("contact");
  assert.equal(document.querySelectorAll(".contact-links").length, 0);
  run("clear");
  assert.equal($("#terminal-output").textContent, "");
  $("#command-input").value = "proj";
  $("#command-input").dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal($("#command-input").value, "projects");
  $("#command-input").dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "ArrowUp",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal($("#command-input").value, "clear");
  $("#command-input").dispatchEvent(
    new window.KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    }),
  );
  assert.equal($("#command-input").value, "projects");
  run("help");
  assert.match($("#terminal-output").textContent, /"autocomplete": "tab"/);
  $('[data-route="home"]').click();
  assert.equal(window.location.pathname, "/");
  assert.match($("#terminal-output").textContent, /10adnan75/);
  // Preserve regular browser behavior for modified navigation clicks.
  const modified = new window.MouseEvent("click", {
    bubbles: true,
    cancelable: true,
    ctrlKey: true,
  });
  $('[data-route="about"]').dispatchEvent(modified);
  assert.equal(modified.defaultPrevented, false);
  window.close();
});

test("production routes and original assets are included", async () => {
  for (const route of routes.filter((x) => x !== "home")) {
    const html = await readFile(`dist/${route}/index.html`, "utf8");
    assert.match(html, /<script type="module"/);
  }
  for (const asset of [
    "adnanmaz@usc.edu.pdf",
    "img/java.JPG",
    "img/linux.JPG",
    "img/python.JPG",
    "img/adnan.svg",
    "img/sorting-visualizer-preview.png",
    "img/speed-typing-test-preview.png",
    "img/bug-tracker-preview.png",
    "img/fake-review-preview.jpg",
    "404.html",
    ".nojekyll",
  ])
    await access(`dist/${asset}`);
  await assert.rejects(access("dist/ams_cv.pdf"));
  const root = await readFile("dist/index.html", "utf8");
  const script = await readFile("js/script.js", "utf8");
  const assets = await readdir("dist/assets");
  const stylesheet = assets.find(
    (file) => file.startsWith("index-") && file.endsWith(".css"),
  );
  const styles = await readFile(`dist/assets/${stylesheet}`, "utf8");
  assert.match(root, /class="boot-loader-text">booting portfolio/);
  assert.match(styles, /@keyframes boot-type/);
  assert.match(script, /}, 1750\);/);
  assert.doesNotMatch(script, /adnan-booted|is-returning/);
  assert.doesNotMatch(root, /[\u2014\u2197]/);
  assert.match(
    root,
    /property="og:image"\s+content="https:\/\/10adnan75.github.io\/img\/og.png"/,
  );
  assert.match(root, /name="twitter:card" content="summary_large_image"/);
  await access("dist/img/og.png");
  for (const match of root.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g))
    await access(`dist${match[1]}`);
});
