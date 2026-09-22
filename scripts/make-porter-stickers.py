"""Generate three editable Porter II cargo-gate sticker drafts.

Dimensions are conservative draft artwork sizes for a 2WD extra-long Super Cab.
Measure the actual flat panels, latches, ribs and seams before production.
"""

from pathlib import Path
from xml.sax.saxutils import escape


OUT = Path(__file__).resolve().parents[1] / "output" / "porter-3-sides"
OUT.mkdir(parents=True, exist_ok=True)

BRAND = "조은 디자인"
PHONE = "010-3371-7644"
SERVICE = "아파트 인테리어 · 리모델링"
SLOGAN = "좋은 공간엔, 이유가 있습니다."

PALETTES = {
    "navy": {
        "label": "1안 · 네이비 + 화이트 + 옐로",
        "bg": "#102A43", "main": "#FFFFFF", "accent": "#FFD43B", "sub": "#DCE4EA",
    },
    "charcoal": {
        "label": "2안 · 차콜 + 화이트 + 오렌지",
        "bg": "#171717", "main": "#FFFFFF", "accent": "#FFB000", "sub": "#D8D8D8",
    },
    "yellow": {
        "label": "3안 · 옐로 + 블랙",
        "bg": "#FFD400", "main": "#111111", "accent": "#111111", "sub": "#292929",
    },
}

NAVY_ACCENTS = {
    "coral": {
        "label": "A안 · 코랄",
        "bg": "#102A43", "main": "#FFFFFF", "accent": "#FF7A6B", "sub": "#DCE4EA",
    },
    "sky": {
        "label": "B안 · 하늘색",
        "bg": "#102A43", "main": "#FFFFFF", "accent": "#64D8FF", "sub": "#DCE4EA",
    },
    "mint": {
        "label": "C안 · 민트",
        "bg": "#102A43", "main": "#FFFFFF", "accent": "#72E0BE", "sub": "#DCE4EA",
    },
}

FINAL_PALETTE = {
    "label": "최종안 · 네이비 + 화이트",
    "bg": "#102A43", "main": "#FFFFFF", "accent": "#FFFFFF", "sub": "#DCE4EA",
}


def svg(width, height, face, palette=None):
    palette = palette or FINAL_PALETTE
    rear = face == "rear"
    mark_x = 38 if rear else 48
    name_x = 128 if rear else 145
    name_y = 79
    name_size = 50 if rear else 58
    phone_size = 50 if rear else 60
    sub_y = 124
    phone_y = 94
    right_pad = 40 if rear else 52
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{width}mm" height="{height}mm" viewBox="0 0 {width} {height}">
  <title>포터Ⅱ 적재함 {escape(face)} 스티커 시안 — {width} × {height} mm</title>
  <rect width="{width}" height="{height}" rx="5" fill="{palette['bg']}"/>
  <rect x="0" width="7" height="{height}" fill="{palette['accent']}"/>
  <g transform="translate({mark_x} 36) scale(.88)" fill="none" stroke="{palette['main']}" stroke-width="6" stroke-linecap="butt" stroke-linejoin="miter">
    <path d="M3 30V3h27"/>
    <path d="M83 56v27H56"/>
    <path d="M47 21v23c0 7-4 10-10 10h-4" stroke-linejoin="round"/>
  </g>
  <circle cx="{mark_x+66}" cy="{36+8}" r="4.4" fill="{palette['accent']}"/>
  <text x="{name_x}" y="{name_y}" fill="{palette['main']}" font-family="'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif" font-size="{name_size}" font-weight="700" letter-spacing="-3">{escape(BRAND)}</text>
  <text x="{name_x}" y="{sub_y}" fill="{palette['sub']}" font-family="'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif" font-size="19" font-weight="600">{escape(SLOGAN)}</text>
  <text x="{width-right_pad}" y="{phone_y}" text-anchor="end" fill="{palette['accent']}" font-family="Arial, sans-serif" font-size="{phone_size}" font-weight="700" letter-spacing="-1">{PHONE}</text>
  <text x="{width-right_pad}" y="{sub_y}" text-anchor="end" fill="{palette['sub']}" font-family="'Noto Sans KR', 'Apple SD Gothic Neo', Arial, sans-serif" font-size="17" font-weight="600">{escape(SERVICE)}</text>
</svg>
'''


# Existing approved production dimensions.
for filename, width, height, face in [
    ("left.svg", 1500, 150, "left"),
    ("right.svg", 1500, 150, "right"),
    ("rear.svg", 1000, 150, "rear"),
]:
    (OUT / filename).write_text(svg(width, height, face), encoding="utf-8")

# Production-size artwork for every proposed color combination.
for palette_name, palette in PALETTES.items():
    for face, width in [("left", 1500), ("right", 1500), ("rear", 1000)]:
        (OUT / f"{face}-{palette_name}.svg").write_text(
            svg(width, 150, face, palette), encoding="utf-8"
        )

for accent_name, palette in NAVY_ACCENTS.items():
    for face, width in [("left", 1500), ("right", 1500), ("rear", 1000)]:
        (OUT / f"{face}-navy-{accent_name}.svg").write_text(
            svg(width, 150, face, palette), encoding="utf-8"
        )

preview = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="800" viewBox="0 0 1400 800">
<title>포터Ⅱ 초장축 슈퍼캡 적재함 3면 스티커 시안</title>
<rect width="1400" height="760" fill="#f3f1eb"/>
<text x="60" y="70" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="34" font-weight="700">포터Ⅱ 초장축 슈퍼캡 · 적재함 3면</text>
<text x="60" y="113" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="18">기존 규격 · 좌우 1,500 × 150 mm   |   후면 1,000 × 150 mm</text>
<text x="60" y="168" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="20" font-weight="700">운전석 쪽</text>
<rect x="60" y="183" width="1300" height="161" rx="5" fill="#fff" stroke="#a9afab" stroke-width="2"/>
<svg x="310" y="226" width="750" height="75" viewBox="0 0 1500 150">{svg(1500,150,'left').split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
<text x="60" y="361" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="20" font-weight="700">조수석 쪽</text>
<rect x="60" y="376" width="1300" height="161" rx="5" fill="#fff" stroke="#a9afab" stroke-width="2"/>
<svg x="310" y="419" width="750" height="75" viewBox="0 0 1500 150">{svg(1500,150,'right').split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
<text x="60" y="554" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="20" font-weight="700">뒤쪽 문</text>
<rect x="60" y="569" width="815" height="161" rx="5" fill="#fff" stroke="#a9afab" stroke-width="2"/>
<svg x="218" y="612" width="500" height="75" viewBox="0 0 1000 150">{svg(1000,150,'rear').split('>',1)[1].rsplit('</svg>',1)[0]}</svg>
<text x="60" y="775" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="16">시안 크기입니다. 실제 평평한 부착 면, 잠금쇠, 굴곡 위치를 실측한 뒤 인쇄하세요.</text>
</svg>'''
(OUT / "preview.svg").write_text(preview, encoding="utf-8")

rows = []
for index, palette in enumerate(PALETTES.values()):
    y = 145 + index * 205
    art = svg(1500, 150, "left", palette).split(">", 1)[1].rsplit("</svg>", 1)[0]
    rows.append(f'''
  <text x="70" y="{y-22}" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="23" font-weight="700">{palette['label']}</text>
  <rect x="70" y="{y}" width="1260" height="151" rx="7" fill="#ffffff" stroke="#b5bbb7" stroke-width="2"/>
  <svg x="325" y="{y+38}" width="750" height="75" viewBox="0 0 1500 150">{art}</svg>''')

color_preview = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="800" viewBox="0 0 1400 800">
  <title>조은 디자인 포터 스티커 색상 비교</title>
  <rect width="1400" height="800" fill="#f3f1eb"/>
  <text x="70" y="66" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="34" font-weight="700">포터Ⅱ 스티커 색상 비교</text>
  <text x="70" y="103" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="18">옆면 1,500 × 150 mm를 흰색 적재함 중앙에 배치한 모습</text>
  {''.join(rows)}
  <text x="70" y="775" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="17">추천: 1안 — 고급스러운 인상과 도로 가독성의 균형이 가장 좋습니다.</text>
</svg>'''
(OUT / "color-options.svg").write_text(color_preview, encoding="utf-8")

accent_rows = []
for index, palette in enumerate(NAVY_ACCENTS.values()):
    y = 145 + index * 205
    art = svg(1500, 150, "left", palette).split(">", 1)[1].rsplit("</svg>", 1)[0]
    accent_rows.append(f'''
  <text x="70" y="{y-22}" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="23" font-weight="700">{palette['label']}</text>
  <rect x="70" y="{y}" width="1260" height="151" rx="7" fill="#ffffff" stroke="#b5bbb7" stroke-width="2"/>
  <svg x="325" y="{y+38}" width="750" height="75" viewBox="0 0 1500 150">{art}</svg>''')

accent_preview = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="800" viewBox="0 0 1400 800">
  <title>네이비 포터 스티커 강조색 비교</title>
  <rect width="1400" height="800" fill="#f3f1eb"/>
  <text x="70" y="66" fill="#263e32" font-family="'Noto Sans KR',Arial,sans-serif" font-size="34" font-weight="700">네이비 시안 · 강조색 비교</text>
  <text x="70" y="103" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="18">전화번호와 로고 포인트 색상만 변경했습니다.</text>
  {''.join(accent_rows)}
  <text x="70" y="775" fill="#647268" font-family="'Noto Sans KR',Arial,sans-serif" font-size="17">추천: A안 코랄 — 눈에 잘 띄면서 인테리어 브랜드의 따뜻한 인상을 줍니다.</text>
</svg>'''
(OUT / "navy-accent-options.svg").write_text(accent_preview, encoding="utf-8")
