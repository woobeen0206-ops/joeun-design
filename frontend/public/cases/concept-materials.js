const tones = window.conceptTones;
const images = {
  "clean-white-kitchen": "projects-assets/concept-tones/clean-white-kitchen.jpg", "clean-white-living": "projects-assets/concept-tones/clean-white-living.jpg", "clean-white-entry": "projects-assets/concept-tones/clean-white-entry.jpg", "clean-white-bathroom": "projects-assets/concept-tones/clean-white-bathroom.jpg",
  "dark-walnut-kitchen": "projects-assets/concept-tones/dark-walnut-kitchen.jpg", "dark-walnut-living": "projects-assets/concept-tones/dark-walnut-living.jpg", "dark-walnut-entry": "projects-assets/concept-tones/dark-walnut-entry.jpg", "dark-walnut-bathroom": "projects-assets/concept-tones/dark-walnut-bathroom.jpg",
  "charcoal-kitchen": "projects-assets/concept-tones/charcoal-kitchen.jpg", "charcoal-living": "projects-assets/concept-tones/charcoal-living.jpg", "charcoal-entry": "projects-assets/concept-tones/charcoal-entry.jpg", "charcoal-bathroom": "projects-assets/concept-tones/charcoal-bathroom.jpg",
  "natural-ivory-kitchen": "projects-assets/concept-tones/natural-ivory-kitchen.jpg", "natural-ivory-living": "projects-assets/concept-tones/natural-ivory-living.jpg", "natural-ivory-entry": "projects-assets/concept-tones/natural-ivory-entry.jpg", "natural-ivory-bathroom": "projects-assets/concept-tones/natural-ivory-bathroom.jpg"
};
const roomLabels = { kitchen: "주방 메인", living: "거실", entry: "현관", bathroom: "욕실" };
const toneButtons = [...document.querySelectorAll("[data-tone]")];
const roomPicker = document.querySelector(".room-picker");
const materialPicker = document.querySelector(".material-picker");
const figure = document.querySelector(".concept-figure");
const image = figure.querySelector("img");
const fields = ["number", "group", "name", "summary", "combination", "reason", "check"].reduce((all, key) => ({ ...all, [key]: document.querySelector(`#material-${key}`) }), {});
let tone = tones[0]; let room = "kitchen";

function points() {
  return tone.parts.map(([group, name], index) => ({ number: String(index + 1).padStart(2, "0"), group, name, x: [27, 56, 78][index], y: [55, 38, 72][index], summary: `${tone.label}의 ${roomLabels[room]}에 어울리는 ${name} 제안입니다.`, combination: `${tone.label} 톤 · 실물 샘플 확인`, reason: "같은 무드를 유지하면서도 실제 생활 공간의 밀도를 고려합니다.", check: "평면, 통로 폭, 조명 아래의 실제 색을 현장에서 확인합니다." }));
}
function selectMaterial(index) {
  const material = points()[index];
  Object.entries(fields).forEach(([key, field]) => field.textContent = material[key]);
  const palette = document.querySelector("#material-palette"); palette.replaceChildren(...tone.palette.map((color) => { const swatch = document.createElement("span"); swatch.style.setProperty("--swatch", color); return swatch; }));
  document.querySelectorAll("[data-point]").forEach((button) => { const active = Number(button.dataset.point) === index; button.classList.toggle("is-active", active); button.setAttribute("aria-pressed", String(active)); });
}
function selectRoom(key) {
  room = key; image.src = images[tone.rooms[room]]; image.alt = `${tone.label} 톤 ${roomLabels[room]} 컨셉 이미지`;
  figure.querySelector("figcaption").textContent = `${tone.label} · ${roomLabels[room]}`;
  figure.querySelectorAll(".hotspot").forEach((node) => node.remove()); materialPicker.replaceChildren();
  points().forEach((item, index) => {
    const hot = document.createElement("button"); hot.type = "button"; hot.className = "hotspot"; hot.dataset.point = index; hot.style.setProperty("--x", `${item.x}%`); hot.style.setProperty("--y", `${item.y}%`); hot.textContent = index + 1; hot.setAttribute("aria-label", `${index + 1}번 ${item.name} 자재 보기`);
    const list = document.createElement("button"); list.type = "button"; list.dataset.point = index; list.textContent = `${index + 1} · ${item.group}`;
    [hot, list].forEach((node) => node.addEventListener("click", () => selectMaterial(index))); figure.append(hot); materialPicker.append(list);
  });
  roomPicker.querySelectorAll("[data-room]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.room === room))); selectMaterial(0);
}
function selectTone(key, move) {
  tone = tones.find((item) => item.key === key);
  toneButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.tone === key)));
  document.querySelector("#tone-summary").textContent = `${tone.label} · ${tone.summary}`;
  document.querySelector("#tone-range").textContent = `현실 적용 기준 · ${tone.range}`;
  roomPicker.replaceChildren(...Object.keys(roomLabels).map((key, index) => { const button = document.createElement("button"); button.type = "button"; button.dataset.room = key; button.setAttribute("aria-pressed", String(index === 0)); const thumb = document.createElement("img"); thumb.src = images[tone.rooms[key]]; thumb.alt = ""; thumb.width = 1280; thumb.height = 853; thumb.loading = "lazy"; const label = document.createElement("span"); label.textContent = `${String(index + 1).padStart(2, "0")} · ${roomLabels[key]}`; button.append(thumb, label); button.addEventListener("click", () => selectRoom(key)); return button; }));
  selectRoom("kitchen"); if (move) document.querySelector(".explorer").scrollIntoView({ behavior: "smooth", block: "start" });
}
toneButtons.forEach((button) => button.addEventListener("click", () => selectTone(button.dataset.tone, true)));
selectTone(tone.key, false);
