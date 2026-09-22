(() => {
  const answers = {};
  let active = 0;
  let photos = [];
  let readingPhotos = false;
  let photoMessage = '';
  const area = document.getElementById('questionArea');
  const next = document.getElementById('next');
  const back = document.getElementById('back');
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const choice = (id, title, items, multi = false, hint = '가장 가까운 항목을 골라주세요.') => ({ id, title, items, multi, hint, type: 'choice' });
  const service = choice('service', '어떤 도움이 필요하세요?', ['전체 리모델링', '부분 리모델링', '설비 · 누수 · 방수', '철거', '아직 잘 모르겠어요'], true, '여러 개를 선택해도 괜찮아요. 필요한 질문만 이어서 보여드려요.');
  function questions() {
    const selected = answers.service || [];
    const remodel = selected.some(s => s.includes('리모델링'));
    const demolition = selected.includes('철거');
    const leak = selected.includes('설비 · 누수 · 방수');
    const list = [service, choice('space', '어떤 공간인가요?', ['아파트', '빌라 · 오피스텔', '단독주택', '상가 · 사무실', '기타'])];
    if (remodel) list.push(choice('rooms', '어느 공간을 바꾸고 싶으세요?', ['집 전체', '거실', '주방', '욕실', '방', '현관', '베란다', '상담 후 결정'], true));
    if (demolition) list.push(choice('demolition', '어떤 철거가 필요하세요?', ['전체 내부 철거', '부분 철거', '상가 원상복구', '건물 전체 철거', '상담 후 결정']), choice('targets', '철거할 부분을 골라주세요.', ['내부 전체', '벽 · 칸막이', '천장', '바닥', '주방 · 싱크대', '욕실', '기타 · 잘 모르겠어요'], true));
    if (remodel || demolition) list.push({id:'size', title:demolition && !remodel ? '철거할 면적은 어느 정도인가요?' : '공사할 면적은 어느 정도인가요?', hint:'집 전체가 아닌 실제 공사할 면적을 알려주세요. 대략적인 평수도 괜찮아요.', type:'number'});
    if (leak) list.push(choice('location', '어디에 문제가 있나요?', ['욕실', '주방', '천장 · 벽', '베란다 · 외벽', '보일러 · 난방 배관', '잘 모르겠어요'], true), choice('symptom', '어떤 증상이 있나요?', ['물이 떨어지거나 고여요', '벽지 얼룩 · 곰팡이가 생겨요', '배관을 교체하고 싶어요', '방수 공사가 필요해요', '점검부터 받고 싶어요'], true), choice('urgent', '지금도 물이 새고 있나요?', ['지금도 새고 있어요', '간헐적으로 새요', '현재는 멈췄어요', '누수는 없어요 · 잘 모르겠어요']));
    if (demolition || selected.includes('전체 리모델링')) list.push(choice('floor', '작업할 공간은 몇 층인가요?', ['지하', '1층', '2~4층', '5층 이상', '건물 전체', '잘 모르겠어요']), choice('lift', '공사에 엘리베이터를 쓸 수 있나요?', ['사용 가능해요', '있지만 사용 여부 확인이 필요해요', '없거나 사용할 수 없어요', '잘 모르겠어요'], false, '자재 운반과 폐기물 반출에 필요한 정보를 확인해요.'));
    if (remodel) list.push(choice('budget', '생각하신 예산이 있나요?', ['1천만 원 미만', '1천만~3천만 원', '3천만~5천만 원', '5천만 원 이상', '상담 후 결정'], false, '희망 예산을 참고해 공사 범위를 상담해요. 확정 견적은 아니에요.'));
    list.push(choice('schedule', '공사는 언제 생각하고 계세요?', ['가능한 빨리', '1개월 이내', '1~3개월 내', '3개월 이후', '일정 미정']), {id:'photos', type:'photos', title:'사진으로 공간을 보여주세요.', hint:'선택 사항이에요. 전체 모습, 문제 부위, 가까이 찍은 사진이 있으면 좋아요.'}, {id:'contact', type:'contact', title:'마지막으로 상담 정보를 알려주세요.', hint:'미리보기 시안입니다. 사진과 연락처는 서버로 전송되지 않아요.'}, {id:'review', type:'review', title:'상담할 내용을 확인해주세요.', hint:'수정할 항목을 눌러 바꿀 수 있어요. 아직 상담이 접수된 상태는 아니에요.'});
    return list;
  }
  function valid(q) {
    if (q.type === 'choice') return q.multi ? Array.isArray(answers[q.id]) && answers[q.id].length > 0 : q.items.includes(answers[q.id]);
    if (q.type === 'number') return answers.size === '잘 모르겠어요' || (Number(answers.size) > 0 && Number(answers.size) <= 10000);
    if (q.type === 'contact') return /^01[016789]\d{7,8}$/.test((answers.phone || '').replace(/[\s-]/g,'')) && !!answers.region?.trim() && !!answers.method;
    return !readingPhotos;
  }
  function summaryValue(q) {
    if (q.type === 'photos') return photos.length ? photos.length + '장' : '사진 없이 상담';
    if (q.type === 'contact') return [answers.name, answers.phone, answers.region, answers.method].filter(Boolean).join(' · ');
    if (q.type === 'number') return answers.size === '잘 모르겠어요' ? answers.size : (answers.size ? answers.size + '평' : '');
    return Array.isArray(answers[q.id]) ? answers[q.id].join(', ') : answers[q.id];
  }
  function field(id, label, placeholder, attributes = '') {
    const value = id === 'size' && answers.size === '잘 모르겠어요' ? '' : answers[id];
    return `<div class="field"><label for="${id}">${label}</label><input id="${id}" data-field="${id}" value="${esc(value)}" placeholder="${placeholder}" ${attributes}></div>`;
  }
  function updateButtons() {
    const qs = questions(), q = qs[active];
    next.disabled = !valid(q);
    next.textContent = q.type === 'review' ? '상담 내용 파일로 저장' : q.type === 'contact' ? '상담 내용 확인하기' : q.type === 'photos' ? (readingPhotos ? '사진 확인 중…' : photos.length ? '상담 정보 입력하기' : '사진 없이 계속하기') : '다음';
    back.hidden = active === 0;
  }
  function render(focus = false) {
    const qs = questions();
    active = Math.min(active, qs.length - 1);
    const q = qs[active];
    document.querySelector('.steps').innerHTML = `<div class="progress-track"><div style="width:${(active+1)/qs.length*100}%"></div></div><span class="step-label">${active+1} / ${qs.length}</span>`;
    document.getElementById('answerTrail').innerHTML = qs.slice(0,active).filter(s => summaryValue(s)).map(s => `<button type="button" data-jump="${s.id}">${esc(summaryValue(s))} <span aria-hidden="true">↗</span></button>`).join('');
    let body = '';
    if (q.type === 'choice') body = `<div class="option-list">${q.items.map((item,i) => {
      const selected = q.multi ? (answers[q.id] || []).includes(item) : answers[q.id] === item;
      return `<button type="button" class="option ${selected?'selected':''}" data-option="${i}" aria-pressed="${selected}">${esc(item)}<span aria-hidden="true">✓</span></button>`;
    }).join('')}</div>`;
    if (q.type === 'number') body = field('size','공사 면적 (평)','예: 24','type="number" inputmode="decimal" min="0.1" max="10000" step="0.1"') + `<button type="button" class="chip unknown ${answers.size==='잘 모르겠어요'?'selected':''}" aria-pressed="${answers.size==='잘 모르겠어요'}" id="unknownSize">잘 모르겠어요</button>`;
    if (q.type === 'photos') body = `<label class="upload-box" for="photoFiles"><b>＋ 현장 사진 추가하기</b><small>JPG · PNG · WebP / 최대 10장 / 한 장당 10MB</small></label><input type="file" id="photoFiles" accept="image/jpeg,image/png,image/webp" multiple ${readingPhotos?'disabled':''}><p class="photo-message" role="status">${esc(photoMessage)}</p><div class="photo-previews">${photos.map((p,i) => `<figure><img src="${p.url}" alt="첨부 사진 ${i+1}"><button type="button" data-remove="${i}" aria-label="첨부 사진 ${i+1} 제거">×</button><figcaption>${esc(p.name)}</figcaption></figure>`).join('')}</div><div class="field"><label for="notes">추가로 알려주실 내용 (선택)</label><textarea id="notes" data-field="notes" maxlength="1500" placeholder="불편한 점이나 원하는 공사 내용을 적어주세요.">${esc(answers.notes)}</textarea></div>`;
    if (q.type === 'contact') body = field('name','이름 (선택)','성함 또는 상호명','autocomplete="name" maxlength="60"') + field('region','현장 지역 *','예: 안산시 단원구','maxlength="100" required') + '<p class="small-note">동·호수와 상세 주소는 적지 않아도 돼요.</p>' + field('phone','휴대폰 번호 *','010-0000-0000','type="tel" inputmode="tel" autocomplete="tel" maxlength="20" required') + '<p class="small-note">휴대폰 번호 10~11자리를 입력해주세요.</p><fieldset class="contact-method"><legend>희망 상담 방법 *</legend>' + ['전화 상담','방문 상담'].map(method=>`<label><input type="radio" name="method" value="${method}" ${answers.method===method?'checked':''}> ${method}</label>`).join('') + '</fieldset><div class="help-card"><div><b>입력 내용은 이 화면에서만 사용돼요</b><p>실제 접수 기능 연결 전입니다. 새로고침하면 입력한 내용이 사라져요.</p></div></div>';
    if (q.type === 'review') body = `<div class="review-list">${qs.filter(s=>s.type!=='review').map(s=>`<button type="button" data-jump="${s.id}"><span>${esc(s.title)}</span><strong>${esc(summaryValue(s))}</strong><small>수정 ↗</small></button>`).join('')}</div>${answers.notes?`<div class="help-card"><p>${esc(answers.notes)}</p></div>`:''}<div class="photo-previews">${photos.map((p,i)=>`<figure><img src="${p.url}" alt="상담 첨부 사진 ${i+1}"></figure>`).join('')}</div><div class="help-card"><div><b>현재는 상담 준비용 미리보기예요</b><p>입력 내용은 텍스트 파일로 저장할 수 있어요. 사진은 파일에 포함되지 않으며, 실제 상담 접수는 전화로 문의해주세요.</p><a class="call-link" href="tel:01032008272">010-3200-8272 · 전화 상담 ↗</a></div></div><p id="saveStatus" role="status"></p>`;
    area.innerHTML = `<h2 class="question" tabindex="-1">${q.title}</h2><p class="hint">${q.hint}</p>${answers.urgent==='지금도 새고 있어요' && q.id==='urgent'?'<div class="help-card"><div><b>지금 누수가 진행 중이라면</b><p>온라인 입력보다 전화로 먼저 현장 상황을 알려주세요.</p><a class="call-link" href="tel:01032008272">바로 전화 상담 ↗</a></div></div>':''}${body}`;
    area.querySelectorAll('[data-option]').forEach(button=>button.addEventListener('click',()=>{
      const item=q.items[Number(button.dataset.option)];
      if (q.multi) {
        let values=answers[q.id] || [];
        values=values.includes(item)?values.filter(v=>v!==item):[...values,item];
        if(q.id==='service') values=item==='아직 잘 모르겠어요'?[item]:values.filter(v=>v!=='아직 잘 모르겠어요');
        answers[q.id]=values;
      } else answers[q.id]=item;
      render(); area.querySelector(`[data-option="${button.dataset.option}"]`)?.focus({preventScroll:true});
    }));
    document.querySelectorAll('[data-jump]').forEach(button=>button.addEventListener('click',()=>{active=questions().findIndex(s=>s.id===button.dataset.jump);render(true);}));
    area.querySelectorAll('[data-field]').forEach(input=>input.addEventListener('input',()=>{answers[input.dataset.field]=input.value;if(input.id==='size'){document.getElementById('unknownSize').classList.remove('selected');document.getElementById('unknownSize').setAttribute('aria-pressed','false');}updateButtons();}));
    area.querySelectorAll('[name="method"]').forEach(input=>input.addEventListener('change',()=>{answers.method=input.value;updateButtons();}));
    document.getElementById('unknownSize')?.addEventListener('click',()=>{answers.size='잘 모르겠어요';render();});
    document.getElementById('photoFiles')?.addEventListener('change',addPhotos);
    area.querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>{const i=Number(button.dataset.remove);URL.revokeObjectURL(photos[i].url);photos.splice(i,1);render();}));
    updateButtons();
    if(focus) {area.querySelector('h2').focus({preventScroll:true});document.querySelector('.steps').scrollIntoView({block:'start',behavior:'instant'});}
  }
  async function addPhotos(event) {
    readingPhotos=true; updateButtons(); const errors=[];
    for(const file of Array.from(event.target.files)) {
      if(photos.length>=10){errors.push('사진은 최대 10장까지 추가할 수 있어요.');break;}
      if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024){errors.push('JPG·PNG·WebP 형식의 10MB 이하 사진을 선택해주세요.');continue;}
      const url=URL.createObjectURL(file);const img=new Image();img.src=url;
      try {await img.decode();if(!img.naturalWidth)throw Error();photos.push({url,name:file.name});}
      catch {URL.revokeObjectURL(url);errors.push('읽을 수 없는 사진이 있어요. 다른 사진을 선택해주세요.');}
    }
    readingPhotos=false;photoMessage=[...new Set(errors)].join(' ') || `${photos.length}장 선택했어요. 사진은 서버에 전송되지 않아요.`;render();
  }
  next.addEventListener('click',()=>{
    const qs=questions();if(!valid(qs[active]))return;
    if(qs[active].type==='review') {
      const text='조은 디자인 상담 준비 내용\n(미접수 · 사진은 별도 전달)\n\n'+qs.filter(q=>q.type!=='review').map(q=>q.title+'\n'+summaryValue(q)).join('\n\n')+'\n\n추가 요청: '+(answers.notes||'없음');
      const url=URL.createObjectURL(new Blob(['\uFEFF'+text],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='조은디자인-상담준비.txt';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);document.getElementById('saveStatus').textContent='상담 내용 파일을 저장했어요. 실제 상담은 전화로 문의해주세요.';return;
    }
    if(qs[active+1].type==='review') {const missing=qs.findIndex(q=>q.type!=='review'&&!valid(q));if(missing!==-1){active=missing;render(true);return;}}
    active++;render(true);
  });
  back.addEventListener('click',()=>{if(active>0){active--;render(true);}});
  render();
})();
