const materials = {
  wall: {
    number: "01",
    group: "WALL FINISH",
    name: "웜 그레이지 대형 포세린 타일",
    summary: "잔잔한 돌결을 넓게 이어 욕실이 작아 보이지 않게 만드는 기본 마감입니다.",
    combination: "무광 600×1200급 · 웜 그레이 줄눈",
    reason: "무늬 반복과 줄눈을 줄여 차분하고 정돈된 인상을 만듭니다.",
    check: "실물 샘플의 바탕색, 무늬 연결, 모서리 마감 방식을 먼저 확인합니다.",
    palette: ["#a89478", "#d9d1c4", "#6f6254"]
  },
  floor: {
    number: "02",
    group: "FLOOR FINISH",
    name: "딥 토프 논슬립 포세린 타일",
    summary: "벽보다 한 톤 진한 바닥으로 공간의 무게를 잡고 오염이 도드라지지 않게 합니다.",
    combination: "무광 논슬립 표면 · 동일 계열 줄눈 · 사각 배수구",
    reason: "벽과 바닥의 명도 차가 경계를 만들면서도 색 계열은 이어져 넓어 보입니다.",
    check: "젖은 상태의 미끄럼 성능과 물매, 배수구 주변 절단 계획을 함께 확인합니다.",
    palette: ["#6f665c", "#918577", "#bab0a3"]
  },
  faucet: {
    number: "03",
    group: "METAL & BASIN",
    name: "폴리시드 크롬 수전 + 백색 도기",
    summary: "색을 더하기보다 선명한 크롬 반사와 백색 도기로 작은 공간에 깨끗한 초점을 둡니다.",
    combination: "슬림 싱글레버 수전 · 직선형 벽부 세면기",
    reason: "크롬은 구하기 쉽고 관리가 익숙하며, 따뜻한 타일과 대비되어 답답함을 줄입니다.",
    check: "수전 출수 길이와 세면기 깊이, 하부 배관 노출 여부를 도면에서 맞춥니다.",
    palette: ["#e5e4df", "#aaa8a2", "#f7f5ef"]
  },
  mirror: {
    number: "04",
    group: "STORAGE",
    name: "프레임리스 와이드 거울장",
    summary: "거울의 면을 넓게 이어 시야를 확장하고 일상 용품은 문 뒤에 숨기는 수납입니다.",
    combination: "얇은 거울 도어 · 내부 선반 · 하부 간접등",
    reason: "장식 선을 줄이면서 수납과 조명, 공간 확장 효과를 한 면에 모을 수 있습니다.",
    check: "문 열림 간섭, 콘센트 위치, 습기에 강한 몸통과 가장자리 마감 품질을 확인합니다.",
    palette: ["#bbb8b0", "#dedbd2", "#5f5d58"]
  },
  lighting: {
    number: "05",
    group: "LIGHTING",
    name: "3000K 선형 간접조명",
    summary: "한 점을 밝히기보다 벽면을 부드럽게 씻어 내려 타일의 결을 자연스럽게 보여줍니다.",
    combination: "천장 코브 + 거울장 하부 · 같은 색온도",
    reason: "눈부심을 줄이고 피부색과 웜 그레이지 마감이 편안하게 보이도록 합니다.",
    check: "등기구가 직접 보이지 않는 깊이, 방습 사양, 점검과 교체가 가능한 구조를 확인합니다.",
    palette: ["#d6b17a", "#f1d9ad", "#9d8060"]
  }
};

const fields = {
  number: document.querySelector("#material-number"),
  group: document.querySelector("#material-group"),
  name: document.querySelector("#material-name"),
  summary: document.querySelector("#material-summary"),
  combination: document.querySelector("#material-combination"),
  reason: document.querySelector("#material-reason"),
  check: document.querySelector("#material-check"),
  palette: document.querySelector("#material-palette")
};

const figure = document.querySelector(".concept-figure");
const roomImage = figure.querySelector("img");
const materialPicker = document.querySelector(".material-picker");
const bathroom = {
  key: "bathroom", label: "욕실", en: "BATHROOM · A CUT",
  title: "차분한 돌결과 따뜻한 빛",
  formula: "웜 그레이지 타일 + 백색 도기 + 크롬 + 간접조명",
  prompt: document.querySelector("#promptText").textContent,
  points: Object.values(materials).map((material, index) => ({
    ...material, x: [80, 43, 37, 48, 29][index], y: [28, 92, 48, 25, 40][index]
  }))
};
// This classic-script data file also works when the owner opens the HTML directly.
const rooms = [...window.conceptRooms, bathroom];
let selectedRoom = rooms[0];

function selectMaterial(index) {
  const material = selectedRoom.points[index];
  const sourceLink = document.querySelector("#material-source");
  sourceLink.hidden = !material.source;
  if (material.source) sourceLink.href = material.source;
  else sourceLink.removeAttribute("href");
  document.querySelector("#material-status").textContent = material.code ? "공식 품번 확인 · AI 적용 예시" : "좋은디자인 제안 사양";
  document.querySelectorAll("[data-point]").forEach((button) => {
    const active = Number(button.dataset.point) === index;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  Object.entries(fields).forEach(([key, element]) => {
    if (key !== "palette") element.textContent = key === "name" && material.code ? material.name + " · " + material.code : material[key];
  });
  fields.palette.replaceChildren(...material.palette.map((color) => {
    const swatch = document.createElement("span");
    swatch.style.setProperty("--swatch", color);
    swatch.setAttribute("aria-hidden", "true");
    return swatch;
  }));
}

function selectRoom(key) {
  selectedRoom = rooms.find((room) => room.key === key);
  roomImage.src = selectedRoom.image || ("projects-assets/concepts/concept-" + key + "-greige-01." + (key === "bathroom" ? "jpg" : "webp"));
  roomImage.alt = "AI 컨셉 · " + selectedRoom.label + " · 실제 시공 사진 아님";
  document.querySelector("#concept-title").textContent = selectedRoom.title;
  document.querySelector("#room-eyebrow").textContent = selectedRoom.en;
  document.querySelector("#room-formula").textContent = selectedRoom.formula;
  document.querySelector("#promptText").textContent = selectedRoom.prompt;
  document.querySelector("#prompt-title").textContent = selectedRoom.label + " · 실사 제작 프롬프트";
  document.querySelectorAll("[data-room]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.room === key));
  });
  figure.querySelectorAll(".hotspot").forEach((button) => button.remove());
  materialPicker.replaceChildren();
  selectedRoom.points.forEach((material, index) => {
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "hotspot";
    hotspot.style.setProperty("--x", material.x + "%");
    hotspot.style.setProperty("--y", material.y + "%");
    hotspot.textContent = String(index + 1);
    hotspot.setAttribute("aria-label", (index + 1) + "번 " + material.name + " 자재 보기");
    const listButton = document.createElement("button");
    listButton.type = "button";
    listButton.textContent = (index + 1) + " · " + material.group;
    [hotspot, listButton].forEach((button) => {
      button.dataset.point = String(index);
      button.setAttribute("aria-controls", "material-detail");
      button.addEventListener("click", () => selectMaterial(index));
    });
    figure.append(hotspot);
    materialPicker.append(listButton);
  });
  selectMaterial(0);
}
document.querySelectorAll("[data-room]").forEach((button) => {
  button.addEventListener("click", () => selectRoom(button.dataset.room));
});
selectRoom("kitchen");

const copyButton = document.querySelector("#copyPrompt");
const promptText = document.querySelector("#promptText");

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(promptText.textContent.trim());
    copyButton.textContent = "복사됨";
    copyButton.classList.add("is-copied");
    window.setTimeout(() => {
      copyButton.textContent = "프롬프트 복사";
      copyButton.classList.remove("is-copied");
    }, 1600);
  } catch {
    copyButton.textContent = "직접 선택해 복사해주세요";
  }
});
