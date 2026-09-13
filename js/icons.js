import {
  siGithub,
  siLinkedin,
  siWhatsapp,
  siStackoverflow,
  siLeetcode,
} from "simple-icons";
const brands = {
  github: siGithub,
  linkedin: siLinkedin,
  whatsapp: siWhatsapp,
  stackoverflow: siStackoverflow,
  leetcode: siLeetcode,
};
export function icon(name) {
  const brand = brands[name];
  return brand
    ? `<svg class="social-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="${brand.path}"/></svg>`
    : "";
}
export function brandForUrl(url) {
  return Object.keys(brands).find((name) => url.includes(name + ".com")) || "";
}
