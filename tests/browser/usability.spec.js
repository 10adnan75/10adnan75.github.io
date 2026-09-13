import { test, expect } from "@playwright/test";

async function command(page, text) {
  const input = page.getByRole("combobox", { name: "Terminal command" });
  await input.fill(text);
  await input.press("Enter");
}

test("desktop: native typing, focus, window controls, navigation and power", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.locator("#boot-loader")).toBeVisible();
  await expect(page.locator("#boot-loader")).toBeHidden();
  await expect(page.locator("#computer-scene canvas")).toBeVisible();
  await expect(page.locator("#terminal")).toHaveAttribute(
    "data-reflections",
    "on",
  );
  await page.screenshot({ path: "test-results/desktop-home.png" });
  await page.getByRole("button", { name: "Boot me up" }).click();
  const input = page.getByRole("combobox", { name: "Terminal command" });
  await expect(input).toBeFocused();
  await command(page, "projects");
  await expect(page).toHaveURL(/\/projects\/$/);
  await expect(page.locator(".project-card")).toHaveCount(8);
  await expect(input).toBeInViewport({ ratio: 0.99 });
  await page.getByRole("button", { name: "Systems", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(3);
  await command(page, "help");
  await expect(page.locator("#terminal-output")).toContainText("Command menu");
  await expect(input).toBeInViewport({ ratio: 0.99 });
  await input.fill("proj");
  await input.press("Tab");
  await expect(input).toHaveValue("projects");
  await input.press("ArrowUp");
  await expect(input).toHaveValue("help");
  await input.press("ArrowDown");
  await expect(input).toHaveValue("projects");
  await input.press("Enter");
  await page.screenshot({ path: "test-results/desktop-terminal.png" });
  const original = await page
    .locator("#screen-display")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  await command(page, "theme pearl");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "pearl");
  expect(
    await page
      .locator("#screen-display")
      .evaluate((el) => getComputedStyle(el).backgroundColor),
  ).not.toBe(original);
  await command(page, "theme platinum");
  await input.fill("draft");
  await page.getByRole("button", { name: "Minimize Terminal" }).click();
  await expect(page.locator("#terminal-window")).toBeHidden();
  await page
    .getByRole("button", { name: "Restore Terminal", exact: true })
    .click();
  await expect(input).toHaveValue("draft");
  await expect(input).toBeFocused();
  await page
    .getByRole("button", { name: "Maximize Terminal", exact: true })
    .click();
  await expect(page.locator("#terminal")).toHaveAttribute(
    "data-window-state",
    "maximized",
  );
  const bounds = await page.locator("#terminal").boundingBox();
  expect(bounds.width).toBeGreaterThan(1300);
  expect(bounds.y).toBeGreaterThanOrEqual(74);
  await page.screenshot({ path: "test-results/maximized.png" });
  await input.press("Escape");
  await expect(page.locator("#terminal")).toHaveAttribute(
    "data-window-state",
    "normal",
  );
  await page.getByRole("button", { name: "Turn screen off" }).click();
  await expect(page.locator("#terminal")).toHaveAttribute(
    "data-reflections",
    "off",
  );
  await expect(page.locator("#command-input")).toBeDisabled();
  await expect(page.locator(".screen-off")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
  await expect(page.locator("#screen-display")).toHaveCSS("opacity", "0");
  await expect(page.locator(".screen-off")).toHaveCSS("opacity", "1");
  await page.screenshot({ path: "test-results/desktop-off.png" });
  await page.getByRole("button", { name: "Turn screen on" }).click();
  await expect(input).toBeFocused();
  await expect(input).toHaveValue("draft");
  await command(page, "contact");
  await page.getByRole("button", { name: "Copy email", exact: true }).click();
  await expect(page.locator(".copy-email").last()).toHaveText(
    /Email copied|Select the email/,
  );
  await page.getByRole("button", { name: "Close Terminal" }).click();
  await expect(page.locator("#terminal-window")).toBeHidden();
  await page
    .getByRole("button", { name: "Open Terminal", exact: true })
    .click();
  await expect(input).toHaveValue("");
  await expect(page.locator("#terminal-output")).toContainText(
    "Slide into my inbox",
  );
  await page
    .getByRole("navigation")
    .getByRole("link", { name: /^\/?home$/ })
    .click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: "Boot me up" }).click();
  await page.locator(".welcome-copy").click();
  await expect(input).toBeFocused();
  await page.getByRole("button", { name: "about", exact: true }).click();
  await expect(input).toBeFocused();
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  expect(errors).toEqual([]);
});

test("mobile: all pages, direct reload, controls and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const route of [
    "about",
    "projects",
    "research",
    "skills",
    "contact",
    "resume",
  ]) {
    await page.goto(`/${route}/`);
    await expect(page.locator("#terminal-output h2").first()).toBeVisible();
    await page
      .getByRole("combobox", { name: "Terminal command" })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole("combobox", { name: "Terminal command" }),
    ).toBeInViewport({ ratio: 0.99 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    expect(overflow, route).toBe(false);
  }
  await page.goto("/projects/");
  await page.screenshot({
    path: "test-results/mobile-projects.png",
    fullPage: true,
  });
  await command(page, "about");
  await expect(page).toHaveURL(/\/about\/$/);
  await page.getByRole("button", { name: "Minimize Terminal" }).click();
  await page
    .getByRole("button", { name: "Restore Terminal", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Terminal command" }),
  ).toBeFocused();
  // Responsive remounts must not disable or orphan the real input.
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("#computer-scene canvas")).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await command(page, "contact");
  await expect(page).toHaveURL(/\/contact\/$/);
  expect(errors).toEqual([]);
});

test("WebGL unavailable: normal navigation and keyboard still work", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      return type.includes("webgl")
        ? null
        : getContext.call(this, type, ...args);
    };
  });
  await page.goto("/");
  await expect(page.locator("body")).toHaveClass(/simple-mode/);
  await page.getByRole("button", { name: "Boot me up" }).click();
  await command(page, "projects");
  await expect(page.locator(".project-card")).toHaveCount(8);
});

test("scrollback, theme persistence and maximized power controls", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Boot me up" }).click();
  await command(page, "sudo");
  await command(page, "football");
  await expect(page.locator("#terminal-output")).toContainText(
    "My trust issues have root access.",
  );
  const geometry = await page.evaluate(() => ({
    output: document.querySelector("#terminal-output").getBoundingClientRect()
      .bottom,
    prompt: document.querySelector("#command-form").getBoundingClientRect().top,
  }));
  expect(geometry.prompt - geometry.output).toBeLessThan(30);
  await expect(page.locator("#command-form")).toHaveCSS(
    "background-color",
    "rgba(0, 0, 0, 0)",
  );
  await command(page, "theme graphite");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "graphite");
  await command(page, "theme pearl");
  await expect(page.locator("#screen-display")).toHaveCSS(
    "background-color",
    "rgb(248, 249, 252)",
  );
  await page
    .getByRole("button", { name: "Maximize Terminal", exact: true })
    .click();
  await page.getByRole("button", { name: "Turn screen off" }).click();
  await expect(page.locator(".screen-off")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Turn screen on" }).click();
  await expect(page.locator("#command-input")).toBeFocused();
  await page.getByRole("button", { name: "Restore window size" }).click();
  await expect(page.locator("body")).not.toHaveClass(/workspace-maximized/);
});

test("case studies and command suggestions work by keyboard and touch", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/projects/");
  const story = page.locator(".project-story").first();
  await story.locator("summary").click();
  await expect(story).toHaveAttribute("open", "");
  await expect(story).toContainText("pipes and redirects");
  await expect(story.locator("a")).toHaveAttribute(
    "href",
    "https://github.com/10adnan75/shell#readme",
  );
  const input = page.getByRole("combobox", { name: "Terminal command" });
  await input.fill("theme ");
  await expect(page.getByRole("option")).toHaveCount(7);
  await expect(input).toBeInViewport({ ratio: 0.99 });
  await input.press("ArrowDown");
  await input.press("ArrowDown");
  await input.press("Enter");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "graphite");
  await input.fill("pro");
  await input.press("Escape");
  await expect(page.locator("#command-suggestions")).toBeHidden();
  await input.fill("cont");
  await page.getByRole("option", { name: "contact", exact: true }).click();
  await expect(input).toHaveValue("contact");
  await expect(input).toBeFocused();
  await input.press("Enter");
  await expect(page).toHaveURL(/contact/);
  await expect(page.locator("body")).not.toContainText("—");
});

test("project snapshots and currently building stay useful", async ({
  page,
}) => {
  await page.goto("/projects/");
  await expect(page.locator(".now-building")).toContainText(
    "Polynomial Learned Index",
  );
  await expect(page.locator(".project-shot")).toHaveCount(4);
  await page.locator(".now-building button").click();
  await expect(page).toHaveURL(/research/);
  await page.goto("/projects/");
  await page.locator(".project-shot[data-preview]").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("project search works with category filters", async ({ page }) => {
  await page.goto("/projects/");
  const search = page.locator("[data-project-search]");
  await search.fill("server");
  await expect(page.locator(".project-card")).toHaveCount(2);
  await page.getByRole("button", { name: "Systems", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  await search.fill("typing");
  await expect(page.locator(".project-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Web", exact: true }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
});

test("new theme palettes apply, persist and work from the picker", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/contact/");
  const colors = new Set();
  for (const name of ["matrix", "midnight", "orchid", "ember"]) {
    await command(page, `theme ${name}`);
    await expect(page.locator("html")).toHaveAttribute("data-theme", name);
    colors.add(
      await page
        .locator("#screen-display")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    );
  }
  expect(colors.size).toBe(4);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "ember");
  await command(page, "theme");
  await expect(page.locator(".theme-choice")).toHaveCount(7);
  await page.locator(".theme-matrix").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "matrix");
  await expect(page.locator(".theme-matrix")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("desktop view preserves terminal session and shares navigation, themes and previews", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Boot me up" }).click();
  await command(page, "football");
  const input = page.locator("#command-input");
  await input.fill("unfinished");
  const saved = await page.locator("#terminal-output").innerHTML();
  await page.getByRole("button", { name: "Switch to desktop view" }).click();
  await expect(page.locator("#desktop-view")).toBeVisible();
  await expect(input).toBeHidden();
  expect(
    await page
      .locator("#desktop-scroll")
      .evaluate((el) => el.scrollWidth > el.clientWidth),
  ).toBe(false);
  await page.locator('.desktop-launchers [data-route="projects"]').click();
  await expect(page).toHaveURL(/projects/);
  await expect(page.locator("#desktop-content .project-card")).toHaveCount(8);
  await page
    .locator("#desktop-content")
    .getByRole("button", { name: "Web", exact: true })
    .click();
  await expect(page.locator("#desktop-content .project-card")).toHaveCount(3);
  await page.locator("#desktop-theme").selectOption("matrix");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "matrix");
  await page.route("https://10adnan75.github.io/sorting-visualizer/", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<button onclick=\"this.textContent='Running'\">Sort</button>",
    }),
  );
  await page
    .locator('#desktop-content [data-preview="sorting-visualizer"]')
    .first()
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page
    .frameLocator("#preview-frame iframe")
    .getByRole("button", { name: "Sort" })
    .click();
  await expect(
    page.frameLocator("#preview-frame iframe").getByRole("button"),
  ).toHaveText("Running");
  await page.getByRole("button", { name: "Close project preview" }).click();
  await expect(page.locator("#preview-frame iframe")).toHaveCount(0);
  await page.getByRole("button", { name: "Switch to terminal view" }).click();
  await expect(input).toHaveValue("unfinished");
  await expect(input).toBeFocused();
  expect(await page.locator("#terminal-output").innerHTML()).toBe(saved);
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole("button", { name: "Switch to desktop view" }).click();
  await page.getByRole("button", { name: "Turn screen off" }).click();
  await expect(page.locator("#screen-display")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  await page.getByRole("button", { name: "Turn screen on" }).click();
  await expect(page.locator("#desktop-view")).toBeVisible();
  await page
    .getByRole("button", { name: "Maximize Terminal", exact: true })
    .click();
  await expect(page.locator("#desktop-view")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  ).toBe(false);
});

test("responsive audit: every page fits both views at narrow, tablet and landscape sizes", async ({
  page,
}) => {
  test.setTimeout(90000);
  for (const [width, height] of [
    [320, 640],
    [390, 844],
    [600, 800],
    [768, 1024],
    [900, 700],
    [1024, 768],
    [1024, 600],
    [1024, 390],
    [844, 390],
  ]) {
    await page.setViewportSize({ width, height });
    for (const route of [
      "home",
      "about",
      "projects",
      "research",
      "skills",
      "contact",
      "resume",
    ]) {
      await page.goto(route === "home" ? "/" : `/${route}/`);
      const header = await page.locator(".site-header").evaluate((el) =>
        [...el.children].map((child) => ({
          left: child.getBoundingClientRect().left,
          right: child.getBoundingClientRect().right,
        })),
      );
      expect(
        header.every((bounds) => bounds.left >= 0 && bounds.right <= width),
        `${width} header`,
      ).toBe(true);
      expect(
        await page
          .locator("#terminal-scroll")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
        `${width} ${route} terminal`,
      ).toBe(false);
      await page
        .getByRole("button", { name: "Switch to desktop view" })
        .click();
      expect(
        await page
          .locator("#desktop-scroll")
          .evaluate((el) => el.scrollWidth > el.clientWidth + 1),
        `${width} ${route} desktop`,
      ).toBe(false);
      if (route === "home")
        await expect(page.locator(".desktop-launchers")).toContainText(
          "8 projects",
        );
      if (width <= 600) {
        await expect(page.locator("#desktop-page")).toBeVisible();
        await expect(page.locator("#desktop-page")).toHaveValue(route);
      }
    }
  }
});
