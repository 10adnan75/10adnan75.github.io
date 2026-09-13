export const profile = {
  name: "Adnan Mazharuddin Shaikh",
  email: "adnanmazharuddinshaikh@gmail.com",
  github: "https://github.com/10adnan75/",
  linkedin: "https://www.linkedin.com/in/10adnan75/",
  whatsapp: "https://api.whatsapp.com/send?phone=+917517511075",
  stackoverflow: "https://stackoverflow.com/users/11985126/adnan-shaikh/",
  leetcode: "https://leetcode.com/u/10adnan75/",
  resume: "/adnanmaz@usc.edu.pdf",
  projectArchive: "https://10adnan75.github.io/projects/",
  researchArchive: "https://10adnan75.github.io/research/",
};
export const projects = [
  {
    name: "Java Shell",
    repo: "shell",
    category: "Systems",
    stack: "Java, POSIX",
    description:
      "Pipelines, history, tab completion. Yes, I made my own shell.",
  },
  {
    name: "Polynomial Learned Index",
    repo: "poly-learned-index",
    category: "Research",
    stack: "C++, DuckDB, ML",
    description:
      "Teaching a database to find things. Polynomial regression meets DuckDB.",
  },
  {
    name: "HTTP Server",
    repo: "http-server",
    category: "Systems",
    stack: "Java, TCP, HTTP",
    description:
      "TCP to HTTP, from scratch. GET, POST, files, and concurrent chaos.",
  },
  {
    name: "Bug Tracker",
    repo: "bug-tracker-10adnan75",
    category: "Web",
    stack: "MongoDB, Express, React, Node.js",
    description: "MERN issue tracker. Giving bugs a home before evicting them.",
  },
  {
    name: "DNS Server",
    repo: "dns-server",
    category: "Systems",
    stack: "Java, UDP, DNS",
    description: "Names into IPs. UDP packets doing the internet’s errands.",
  },
  {
    name: "Sorting Visualizer",
    repo: "sorting-visualizer",
    category: "Web",
    stack: "JavaScript, Algorithms",
    description: "Sorting algorithms, but you can watch them suffer.",
  },
  {
    name: "Fake Review Detection",
    repo: "undergraduate-thesis",
    category: "Research",
    stack: "Python, Machine learning",
    description: "ML for fake Amazon reviews. Five stars. Zero trust.",
  },
  {
    name: "Speed Typing Test",
    repo: "speed-typing-test",
    category: "Web",
    stack: "JavaScript",
    description: "A WPM test. Keyboard warrior credentials, pending.",
  },
];
export const commandNames = [
  "help",
  "about",
  "projects",
  "research",
  "skills",
  "contact",
  "resume",
  "socials",
  "clear",
  "home",
  "ls",
  "whoami",
  "history",
  "theme",
  "football",
];
export const routes = [
  "home",
  "about",
  "projects",
  "research",
  "skills",
  "contact",
  "resume",
];
export function parseCommand(raw) {
  const parts = raw.trim().split(/\s+/);
  let name = parts.shift().toLowerCase();
  if (name === "cd" || name === "open")
    name = (parts.shift() || "home").toLowerCase();
  name = name.replace(/^\//, "").replace(/\/$/, "");
  if (name === "~" || name === ".." || name === "") name = "home";
  if (name === "whoami") name = "about";
  if (name === "cat") {
    name = (parts.shift() || "help").replace(/\.(md|txt|sh)$/, "");
  }
  return { name, args: parts };
}
export function escapeHtml(value) {
  return String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
}
