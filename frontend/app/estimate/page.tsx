"use client";

import Link from "next/link";
import { useState } from "react";

type Step = { title: string; hint: string; key: string; items: string[]; multi?: boolean; contact?: boolean };

const steps: Step[] = [
  { title: "어떤 도움이 필요하세요?", hint: "필요한 항목을 모두 골라주세요.", key: "필요한 서비스", multi: true, items: ["주거공간 인테리어", "부분 리모델링", "설비 · 방수 · 누수", "아직 잘 모르겠어요"] },
  { title: "어떤 공간인가요?", hint: "공사할 공간과 가장 가까운 항목을 골라주세요.", key: "공간 유형", items: ["아파트", "빌라 · 오피스텔", "단독 · 전원주택", "상업공간", "기타"] },
  { title: "공사는 언제 생각하고 계세요?", hint: "정확하지 않아도 괜찮아요.", key: "희망 시기", items: ["1개월 이내", "1~3개월 내", "3개월 이후", "아직 미정"] },
  { title: "상담받을 방법을 알려주세요.", hint: "연락 가능한 번호를 함께 입력해 주세요.", key: "상담 방법", contact: true, items: ["전화 상담", "카카오톡 상담", "방문 상담"] },
];

const descriptions = ["아파트 · 빌라 · 주택", "주방 · 욕실 · 현관 · 방", "배관 · 방수 · 누수 점검", "상담부터 받아볼게요"];
const icons = ["⌂", "▦", "◌", "…"];

export default function EstimatePage() {
  const [active, setActive] = useState(0);
  const [answers, setAnswers] = useState<(number[] | number | null)[]>([[], null, null, null]);
  const [phone, setPhone] = useState("");
  const [finished, setFinished] = useState(false);
  const step = steps[active];

  const isSelected = (index: number) => step.multi ? (answers[active] as number[]).includes(index) : answers[active] === index;
  const select = (index: number) => {
    const next = [...answers];
    if (step.multi) {
      const current = answers[active] as number[];
      next[active] = current.includes(index) ? current.filter((item) => item !== index) : [...current, index];
    } else next[active] = index;
    setAnswers(next);
  };
  const valid = step.multi ? (answers[active] as number[]).length > 0 : answers[active] !== null && (!step.contact || phone.replace(/\D/g, "").length >= 9);
  const next = () => { if (!valid) return; if (active < steps.length - 1) setActive(active + 1); else { setFinished(true); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const restart = () => { setActive(0); setAnswers([[], null, null, null]); setPhone(""); setFinished(false); };
  const value = (index: number) => steps[index].items[answers[index] as number];
  const services = (answers[0] as number[]).map((index) => steps[0].items[index]).join(", ");

  return (
    <div className="estimate-page">
      <a className="skip-link" href="#estimate-content">본문으로 바로가기</a>
      <div className="estimate-shell">
        <div className="estimate-notice">내 공간에 맞춘 <b>간편 상담 준비</b> · 약 1분</div>
        <header className="estimate-header"><Link className="estimate-logo" href="/"><span>j.</span>조은 디자인</Link><Link className="portfolio-link" href="/">포트폴리오 보기</Link></header>
        <main className="estimate-main" id="estimate-content">
          {!finished ? <section>
            <div className="estimate-intro"><div><p className="estimate-eyebrow">MY SPACE, MY WAY</p><h1>내 공간에 맞는<br /><em>상담을 준비</em>할게요.</h1><p>몇 가지만 알려주시면, 상담 전에 필요한 내용을 정리해드려요.</p></div><img src="/images/06.jpeg" alt="인테리어 공사가 진행 중인 공간" /></div>
            <div className="estimate-progress" aria-label={`상담 준비 ${active + 1}단계, 전체 4단계`}>{steps.map((_, index) => <span key={index} className={index <= active ? "active" : ""} />)}<b>{active + 1} / 4</b></div>
            <h2 className="question-title">{active + 1}. {step.title} <small>*</small></h2>
            <p className="question-hint">{step.hint}</p>
            <div className={step.multi ? "service-choices" : "option-choices"}>
              {step.items.map((item, index) => <button className={`estimate-choice ${isSelected(index) ? "selected" : ""}`} type="button" key={item} onClick={() => select(index)} aria-pressed={isSelected(index)}>{step.multi && <span className="choice-icon">{icons[index]}</span>}<span className="choice-copy"><strong>{item}</strong>{step.multi && <small>{descriptions[index]}</small>}</span><span className="choice-check">✓</span></button>)}
            </div>
            {step.contact && <div className="phone-field"><label htmlFor="phone">연락처 <span>*</span></label><input id="phone" inputMode="tel" autoComplete="tel" placeholder="010 0000 0000" value={phone} onChange={(event) => setPhone(event.target.value)} /></div>}
            {active === 0 && <div className="estimate-help"><span>i</span><div><b>여러 개를 골라도 괜찮아요</b><p>현재 가장 필요한 도움을 기준으로 골라주세요.</p></div></div>}
          </section> : <section className="estimate-result"><div className="result-mark">✓</div><p className="estimate-eyebrow">READY FOR CONSULTATION</p><h1>상담 준비가 끝났어요.</h1><p>아래 내용을 확인한 뒤 전화로 편하게 상담해 주세요.</p><div className="answer-summary"><h2>상담 준비 내용</h2>{[["필요한 서비스",services],["공간 유형",value(1)],["희망 시기",value(2)],["상담 방법",value(3)],["연락처",phone]].map(([label,answer]) => <div key={label}><span>{label}</span><b>{answer}</b></div>)}</div><div className="estimate-help"><span>✦</span><div><b>사진이 있으면 상담이 더 빨라져요</b><p>공간 전체와 고민되는 부분을 찍어 준비해 주세요.</p></div></div><a className="result-call" href="tel:01032008272">010 3200 8272로 전화하기</a><button className="restart" type="button" onClick={restart}>처음부터 다시 선택하기</button></section>}
        </main>
        {!finished && <div className="estimate-bottom"><div><button className="estimate-back" type="button" onClick={() => setActive(Math.max(0, active - 1))} aria-label="이전 단계" style={{ visibility: active === 0 ? "hidden" : "visible" }}>←</button><button className="estimate-next" type="button" disabled={!valid} onClick={next}>{active === 3 ? "상담 내용 확인하기" : "다음"}</button></div></div>}
      </div>
    </div>
  );
}
