import { themeNames } from "./themes.js";
export function attachSuggestions(input, form, commands, syncCursor) {
  const list = document.createElement("div");
  list.id = "command-suggestions";
  list.className = "command-suggestions";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", "Command suggestions");
  list.hidden = true;
  form.after(list);
  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", "false");
  let matches = [],
    selected = -1;
  const choices = [
    ...commands,
    ...themeNames.map((name) => `theme ${name}`),
    "projects systems",
    "projects web",
    "projects research",
    "cd /about",
    "cd /projects",
    "cd /contact",
  ];
  function hide() {
    list.hidden = true;
    selected = -1;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
  }
  function choose(index) {
    input.value = matches[index];
    hide();
    syncCursor();
    input.focus({ preventScroll: true });
  }
  function highlight() {
    [...list.children].forEach((item, i) =>
      item.setAttribute("aria-selected", String(i === selected)),
    );
    if (selected >= 0)
      input.setAttribute("aria-activedescendant", list.children[selected].id);
  }
  input.addEventListener("input", () => {
    const value = input.value.trim().toLowerCase();
    selected = -1;
    matches = value
      ? choices
          .filter((command) => command.startsWith(value) && command !== value)
          .slice(0, 8)
      : [];
    list.replaceChildren();
    if (!matches.length) {
      hide();
      return;
    }
    matches.forEach((command, i) => {
      const item = document.createElement("div");
      item.id = `suggestion-${i}`;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", "false");
      item.textContent = command;
      item.addEventListener("pointerdown", (event) => event.preventDefault());
      item.addEventListener("click", () => choose(i));
      list.append(item);
    });
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    const scroller = form.parentElement;
    scroller.scrollTop = scroller.scrollHeight;
    const bounds = input.getBoundingClientRect();
    if (bounds.top < 100 || bounds.bottom > innerHeight - 100)
      input.scrollIntoView({ block: "center" });
  });
  input.addEventListener(
    "keydown",
    (event) => {
      if (list.hidden) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        hide();
        return;
      }
      if (
        event.key === "ArrowDown" ||
        (event.key === "ArrowUp" && selected >= 0)
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
        selected =
          (selected + (event.key === "ArrowDown" ? 1 : -1) + matches.length) %
          matches.length;
        highlight();
        return;
      }
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
        choose(Math.max(0, selected));
        return;
      }
      if (event.key === "Enter") {
        if (selected >= 0) choose(selected);
        else hide();
      }
      if (event.key === "ArrowUp") hide();
    },
    true,
  );
  input.addEventListener("blur", hide);
  form.addEventListener("submit", hide);
  return { hide };
}
