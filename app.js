let currentFilter = 'all';
let currentMode = 'spread';
let activeSlotIndex = 0;
let placedCards4 = [null, null, null, null];
let placedCardsTree = new Array(10).fill(null);
let placedCardsRelation = new Array(12).fill(null);
let placedCardsCeltic = new Array(10).fill(null);
let placedCardsHexa = new Array(7).fill(null);
let placedCardsZodiac = new Array(12).fill(null);

document.addEventListener('DOMContentLoaded', () => {
    setupGrid(tarotDataKo);
    switchMode('spread'); // Star-Birth with Spread
});

function setupGrid(cards) {
    const grid = document.getElementById('cards-grid');
    grid.innerHTML = '';

    cards.forEach(card => {
        const [korName, engName] = card.name.split(' (');
        const cardEl = document.createElement('div');
        cardEl.className = 'grid-card';
        if (card.image) cardEl.style.backgroundImage = `url('${card.image}')`;
        cardEl.innerHTML = `<div class="name">${korName}</div>`;

        cardEl.onclick = () => {
            if (currentMode === 'search') {
                showInterpretation(card);
            } else {
                placeCardInSlot(card);
            }
        };
        grid.appendChild(cardEl);
    });
}

function switchMode(mode) {
    currentMode = mode;
    document.getElementById('spread-board').classList.toggle('hidden', mode !== 'spread');
    document.getElementById('tree-board').classList.toggle('hidden', mode !== 'tree');
    document.getElementById('relation-board').classList.toggle('hidden', mode !== 'relation');
    document.getElementById('celtic-board').classList.toggle('hidden', mode !== 'celtic');
    document.getElementById('hexa-board').classList.toggle('hidden', mode !== 'hexa');
    document.getElementById('zodiac-board').classList.toggle('hidden', mode !== 'zodiac');

    updateSpreadGuide(mode);

    // UI Tab Sync (Check for null to prevent errors)
    const btns = ['view-spread', 'view-relation', 'view-tree', 'view-celtic', 'view-hexa', 'view-zodiac'];
    const modes = ['spread', 'relation', 'tree', 'celtic', 'hexa', 'zodiac'];

    btns.forEach((id, i) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', mode === modes[i]);
    });

    if (modes.includes(mode)) {
        // Just set the active index and highlight, don't trigger search
        activeSlotIndex = 0;
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => slot.classList.remove('active'));
        let prefix = 'slot';
        if (mode === 'tree') prefix = 'tslot';
        if (mode === 'relation') prefix = 'rslot';
        if (mode === 'celtic') prefix = 'cslot';
        if (mode === 'hexa') prefix = 'hslot';
        if (mode === 'zodiac') prefix = 'zslot';
        const target = document.getElementById(`${prefix}-0`);
        if (target) target.classList.add('active');
    }
}

function activateSlot(index, mode = currentMode) {
    activeSlotIndex = index;
    let prefix = 'slot';
    if (mode === 'tree') prefix = 'tslot';
    if (mode === 'relation') prefix = 'rslot';
    if (mode === 'celtic') prefix = 'cslot';
    if (mode === 'hexa') prefix = 'hslot';
    if (mode === 'zodiac') prefix = 'zslot';

    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => slot.classList.remove('active'));

    const target = document.getElementById(`${prefix}-${index}`);
    if (target) {
        target.classList.add('active');

        // CONTEXTUAL QUICK SEARCH POSITIONING
        const rect = target.getBoundingClientRect();
        const qsOverlay = document.getElementById('quick-search-overlay');
        const qsModal = qsOverlay.querySelector('.qs-modal');

        qsOverlay.classList.remove('hidden');

        // Center modal relative to slot
        const modalWidth = 400; // Updated for compact look
        const leftPos = Math.min(window.innerWidth - modalWidth - 20, Math.max(20, rect.left + rect.width / 2 - modalWidth / 2));
        const topPos = Math.min(window.innerHeight - 450, Math.max(20, rect.top - 100)); // Up slightly

        qsModal.style.position = 'fixed';
        qsModal.style.left = `${leftPos}px`;
        qsModal.style.top = `${topPos}px`;
        qsModal.style.width = `${modalWidth}px`;

        const qsInput = document.getElementById('qs-input');
        qsInput.value = '';
        qsInput.focus();
        filterQuickSearch('');
    }
}

function closeQuickSearch() {
    document.getElementById('quick-search-overlay').classList.add('hidden');
}

function filterQuickSearch(forcedQuery) {
    const query = (typeof forcedQuery === 'string' ? forcedQuery : document.getElementById('qs-input').value).toLowerCase();
    const resultsArea = document.getElementById('qs-results');

    if (query.length < 1 && forcedQuery === undefined) {
        // Show all cards initially or clear? Let's show common ones or all.
        // For better UX, let's show ALL sorted by name initially or keep empty.
        // User wants to "find", so maybe empty until they type.
        resultsArea.innerHTML = '<div class="qs-empty">찾고 싶은 카드 이름을 입력하세요...</div>';
        return;
    }

    const filtered = tarotDataKo.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.keywords.some(k => k.toLowerCase().includes(query))
    ).sort((a, b) => a.name.localeCompare(b.name));

    if (filtered.length === 0) {
        resultsArea.innerHTML = '<div class="qs-empty">일치하는 카드가 없습니다.</div>';
        return;
    }

    resultsArea.innerHTML = filtered.map(card => {
        const [korName] = card.name.split(' (');
        return `
            <div class="qs-item" onclick="selectQuickCard('${card.name.replace(/'/g, "\\'")}')">
                <span class="qs-icon">${getSuitIcon(card.suit)}</span>
                <span class="qs-name">${korName}</span>
                <span class="qs-suit">${card.suit}</span>
            </div>
        `;
    }).join('');
}

function selectQuickCard(cardName) {
    const card = tarotDataKo.find(c => c.name === cardName);
    if (card) {
        placeCardInSlot(card);
        closeQuickSearch();
    }
}

function placeCardInSlot(card) {
    let cards, prefix, max;
    if (currentMode === 'tree') {
        cards = placedCardsTree; prefix = 'tslot'; max = 10;
    } else if (currentMode === 'relation') {
        cards = placedCardsRelation; prefix = 'rslot'; max = 12;
    } else if (currentMode === 'celtic') {
        cards = placedCardsCeltic; prefix = 'cslot'; max = 10;
    } else if (currentMode === 'hexa') {
        cards = placedCardsHexa; prefix = 'hslot'; max = 7;
    } else if (currentMode === 'zodiac') {
        cards = placedCardsZodiac; prefix = 'zslot'; max = 12;
    } else {
        cards = placedCards4; prefix = 'slot'; max = 4;
    }

    cards[activeSlotIndex] = card;
    const slotEl = document.getElementById(`${prefix}-${activeSlotIndex}`);
    const [korName] = card.name.split(' (');

    if (card.image) {
        slotEl.style.backgroundImage = `url('${card.image}')`;
    } else {
        slotEl.style.backgroundImage = 'none';
    }

    slotEl.querySelector('.slot-content').innerHTML = korName;
    const tooltip = slotEl.querySelector('.slot-tooltip');
    if (tooltip) tooltip.innerText = card.description;
    slotEl.setAttribute('data-active', 'true');

    let nextIndex = activeSlotIndex + 1;
    if (nextIndex < max) {
        activateSlot(nextIndex);
    }
}

function analyzeFullSpread(count) {
    let cards, info, allIndices;
    let isTree = false;
    let isRelation = false;
    let isCeltic = false;
    let isZodiac = false;

    if (count === 10 && currentMode === 'tree') {
        cards = placedCardsTree; isTree = true;
        allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        info = [
            { t: '1. 케테르 (Kether)', a: '설계팀', m: '남아있는 영혼, 순수한 설계' },
            { t: '2. 호크마 (Chokmah)', a: '기록팀', m: '닿을 수 있는 영원' },
            { t: '3. 비나 (Binah)', a: '추출팀', m: '굴레를 끊는 관용' },
            { t: '4. 헤세드 (Chesed)', a: '복지팀', m: '믿음에 보답하는 마음' },
            { t: '5. 게부라 (Geburah)', a: '징계팀', m: '굴복하지 않는 용기' },
            { t: '6. 티페레트 (Tiphareth)', a: '중앙본부', m: '존재에 대한 확신' },
            { t: '7. 네짜흐 (Netzach)', a: '안전팀', m: '삶을 이어갈 용기' },
            { t: '8. 호드 (Hod)', a: '교육팀', m: '나아질 수 있는 희망' },
            { t: '9. 예소드 (Yesod)', a: '정보팀', m: '분별할 수 있는 이성' },
            { t: '10. 말쿠트 (Malkuth)', a: '지휘팀', m: '똑바로 설 수 있는 의지' }
        ];
    } else if (count === 12 && currentMode === 'relation') {
        cards = placedCardsRelation; isRelation = true;
        allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        info = [
            { t: '1. 나 (ME)', m: '본인의 현재 상태' },
            { t: '2. 상대 (PARTNER)', m: '상대방의 현재 상태' },
            { t: '3. 만남 (MEETING)', m: '만나게 된 이유나 계기' },
            { t: '4. 기초/과거 (PAST)', m: '관계의 기반 또는 과거' },
            { t: '5. 현재 (PRESENT)', m: '현재 관계의 모습' },
            { t: '6. 장애물 (OBSTACLE)', m: '관계를 방해하는 요소' },
            { t: '7. 나의 겉모습', m: '내가 보여주는 이미지' },
            { t: '8. 상대의 겉모습', m: '상대가 보여주는 이미지' },
            { t: '9. 나의 속마음', m: '본인의 진심과 무의식' },
            { t: '10. 상대의 속마음', m: '상대방의 진심과 무의식' },
            { t: '11. 결과 (RESULT)', m: '내려진 결론' },
            { t: '12. 미래 (FUTURE)', m: '관계의 최종 전망' }
        ];
    } else if (count === 10 && currentMode === 'celtic') {
        cards = placedCardsCeltic; isCeltic = true;
        allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        info = [
            { t: '1. 현재 (PRESENT)', m: '현재의 상황과 중심 주제' },
            { t: '2. 장애물 (CHALLENGE)', m: '방해하는 힘 또는 도움' },
            { t: '3. 목표 (GOAL)', m: '최고의 잠재력과 목표' },
            { t: '4. 잠재의식 (BASIS)', m: '기반과 무의식적인 힘' },
            { t: '5. 최근 과거 (PAST)', m: '지나온 최근의 영향력' },
            { t: '6. 가까운 미래 (FUTURE)', m: '앞으로 올 즉각적인 운의 흐름' },
            { t: '7. 본인의 태도 (SELF)', m: '상황을 보는 스스로의 시각' },
            { t: '8. 외부 환경 (ENV)', m: '주변 사람과 환경의 영향' },
            { t: '9. 희망/공포 (H/F)', m: '지닌 미련이나 두려움' },
            { t: '10. 결과 (OUTCOME)', m: '상황의 마지막 결론' }
        ];
    } else if (count === 7 && currentMode === 'hexa') {
        cards = placedCardsHexa;
        allIndices = [0, 1, 2, 3, 4, 5, 6];
        info = [
            { t: '1. 과거 (PAST)', m: '과거의 영향과 원인' },
            { t: '2. 현재 (PRESENT)', m: '인지하는 현재 상황' },
            { t: '3. 미래 (FUTURE)', m: '나타날 가시적 결과' },
            { t: '4. 무의식 (HIDDEN)', m: '숨겨진 욕망과 기반' },
            { t: '5. 환경 (ENV)', m: '주변의 영향과 타인' },
            { t: '6. 조언 (ADVICE)', m: '문제 해결을 위한 지침' },
            { t: '7. 최종 결과 (OUTCOME)', m: '흐름의 최종 결론' }
        ];
    } else if (count === 12 && currentMode === 'zodiac') {
        cards = placedCardsZodiac; isZodiac = true;
        allIndices = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
        info = [
            { t: '1궁 백양 (Aries)', m: '자아, 기본 성향, 육체적 에너지' },
            { t: '2궁 황소 (Taurus)', m: '재물, 소유, 나의 가치관' },
            { t: '3궁 쌍아 (Gemini)', m: '소통, 학습, 형제나 이웃' },
            { t: '4궁 거해 (Cancer)', m: '가정, 안식처, 감정의 기반' },
            { t: '5궁 사자 (Leo)', m: '창조성, 연애, 오락, 자기표현' },
            { t: '6궁 처녀 (Virgo)', m: '일상의 일, 의무, 건강과 봉사' },
            { t: '7궁 천칭 (Libra)', m: '파트너십, 결혼, 대면 관계' },
            { t: '8궁 천갈 (Scorpio)', m: '변화, 남의 자산, 깊은 무의식' },
            { t: '9궁 인마 (Sagittarius)', m: '철학, 장거리 여행, 고등 학문' },
            { t: '10궁 마갈 (Capricorn)', m: '사회적 성취, 직업, 명예' },
            { t: '11궁 보병 (Aquarius)', m: '희망, 친구, 공동체, 이상' },
            { t: '12궁 쌍어 (Pisces)', m: '영적 세계, 고립, 내면의 비밀' }
        ];
    } else {
        cards = placedCards4;
        allIndices = [0, 1, 2, 3];
        info = [
            { t: '과거 (PAST)', m: '가까운 과거의 에너지' },
            { t: '현재 (PRESENT)', m: '지금 에너지가 집중되는 곳' },
            { t: '미래 (FUTURE)', m: '잠재적인 미래' },
            { t: '해결책 (SOLUTION)', m: '어려움을 극복할 조언' }
        ];
    }

    if (allIndices.some(i => cards[i] === null)) {
        alert('모든 주요 슬롯을 채워주세요!');
        return;
    }

    const resultsContainer = document.getElementById('analysis-results');
    resultsContainer.innerHTML = '';

    allIndices.forEach(idx => {
        const card = cards[idx];
        const item = document.createElement('div');
        item.className = 'analysis-item';

        let color = 'var(--accent-gold)';
        if (isTree) color = getSefirotColor(idx);
        if (isRelation) {
            if ([0, 2, 4, 10, 8, 6].includes(idx)) color = '#d4af37'; // ME / Shared
            if ([1, 7, 9].includes(idx)) color = '#e74c3c'; // Partner
            if (idx === 11) color = '#f1c40f'; // Future
        }

        item.style.borderLeft = `8px solid ${color}`;
        let advancedHTML = '';
        if (card.meanings) {
            let contextMeaning = `<span style="color: #ddd;">${card.meanings.upright}</span>`;
            if (isRelation && info[idx].t !== '11. 결과 (RESULT)') {
                // 관계 배열일 때는 기본적으로 연애운 해석을 포함
                contextMeaning = `
                    <div style="margin-bottom:4px;"><strong style="color:var(--accent-gold);">기본:</strong> ${card.meanings.upright}</div>
                    <div><strong style="color:#ff6b6b;">관계:</strong> ${card.meanings.love}</div>
                `;
            } else if (!isTree && !isRelation && idx === 3) {
                // 4카드 중 '해결책' 위치일 땐 조언 해석을 표시
                contextMeaning = `
                    <div style="margin-bottom:4px;"><strong style="color:var(--accent-gold);">기본:</strong> ${card.meanings.upright}</div>
                    <div><strong style="color:#2ecc71;">조언:</strong> ${card.meanings.advice}</div>
                `;
            } else if (isTree || info[idx].t === '11. 결과 (RESULT)') {
                // 트리이거나 관계운 결과일 경우
                contextMeaning = `<div style="margin-bottom:4px;"><strong style="color:var(--accent-gold);">핵심:</strong> ${card.meanings.upright}</div>`;
            } else {
                // 일반 카드 (과거, 현재, 미래)
               contextMeaning = `<div style="margin-bottom:4px;"><strong style="color:var(--accent-gold);">핵심:</strong> ${card.meanings.upright}</div>`;
            }

            advancedHTML = `
                <div class="advanced-spread-meaning" style="margin-top: 1rem; padding: 1rem; background: rgba(0,0,0,0.3); border-left: 3px solid ${color}; font-size: 0.85rem; line-height: 1.5;">
                    ${contextMeaning}
                </div>
            `;
        }

        item.innerHTML = `
            <div class="result-header">
                <span class="idx-badge" style="background:${color};">${info[idx].t}</span>
                <span class="angel-tag" style="color:${color}">${info[idx].a ? `${info[idx].a}` : ''}</span>
            </div>
            <p class="world-meaning" style="font-size:0.75rem; color: #999; margin: 0.5rem 0;">• ${info[idx].m}</p>
            <div class="analysis-card-info">
                <span class="icon">${getSuitIcon(card.suit)}</span>
                <span class="name">${card.name}</span>
            </div>
            <div class="keywords-wrap">
                ${card.keywords.map(k => `<span class="tag-gold">${k}</span>`).join('')}
            </div>
            <p class="desc">${card.description}</p>
            ${advancedHTML}
        `;
        resultsContainer.appendChild(item);
    });

    if (isTree) addWorldAnalysis(resultsContainer, cards);
    if (isRelation) addEmotionalAnalysis(resultsContainer, cards);
    if (isZodiac) addZodiacAnalysis(resultsContainer, cards);

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('interpretation').classList.add('hidden');
    document.getElementById('full-analysis').classList.remove('hidden');
}

function addEmotionalAnalysis(container, cards) {
    const section = document.createElement('div');
    section.className = 'world-summary-container';
    section.innerHTML = '<h2 class="title-lg" style="text-align:left; margin-bottom:2rem;">관계 감정 심화 분석</h2>';

    const innerMe = cards[8];
    const innerYou = cards[9];

    const box = document.createElement('div');
    box.className = 'world-summary-box';
    box.innerHTML = `
        <h3><span class="world-title">심층 심리 대조</span> <small style="color:#666; font-weight:300;">INNER VS INNER</small></h3>
        <p>나의 진심(${innerMe.name.split(' (')[0]})과 상대의 진심(${innerYou.name.split(' (')[0]})이 만나 만드는 에너지 흐름을 분석합니다.</p>
        <div style="margin-top:1rem; font-size:0.85rem; color:var(--accent-gold);">
            <strong>총평:</strong> 이 관계의 잠재된 미래는 ${cards[11].name.split(' (')[0]} 카드의 영향을 받아 결정될 것입니다.
        </div>
    `;
    section.appendChild(box);
    container.appendChild(section);
}

function addWorldAnalysis(container, cards) {
    const section = document.createElement('div');
    section.className = 'world-summary-container';
    
    // Header
    section.innerHTML = `
        <h2 class="title-lg" style="text-align:left; margin-bottom:1rem; color: #d4af37; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.5rem; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);">세피로트 심층(Profound) 분석</h2>
        <p style="color: #aaa; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">생명의 나무에 배열된 10장의 카드는 당신의 근원적인 영혼(케테르)에서 시작하여 물질적인 현실(말쿠트)로 현현하는 우주적 흐름을 보여줍니다.</p>
    `;

    // 1. The 4 Worlds
    const layers = [
        { title: 'ATZILUTH (아칠루트)', dept: '원형과 불의 세계 (영적 근원)', ids: [0, 1, 2], desc: '질문의 가장 본질적인 불씨이자 신성한 의지의 세계입니다.' },
        { title: 'BERIAH (브리아)', dept: '창조와 물의 세계 (지성/감정)', ids: [3, 4, 5], desc: '순수한 의지가 형태를 갖추기 위해 지성과 감정의 힘을 얻는 단계입니다.' },
        { title: 'YETZIRAH (예치라)', dept: '형성과 공기의 세계 (계획/심리)', ids: [6, 7, 8], desc: '현실로 드러나기 직전, 에너지들이 부딪히며 구체적인 계획으로 엮입니다.' },
        { title: 'ASIYAH (아시야)', dept: '활동과 흙의 세계 (물질적 현현)', ids: [9], desc: '모든 에너지가 마침내 도달한 물질적 결과이자 현실적인 행동입니다.' }
    ];

    let worldsHTML = '<h3 style="color: #fff; margin-bottom: 1rem; border-left: 3px solid #d4af37; padding-left: 10px;">I. 4계(Four Worlds)의 에너지 흐름</h3>';
    layers.forEach(l => {
        const filled = l.ids.map(id => cards[id]).filter(card => card !== null);
        if (filled.length === 0) return;
        worldsHTML += `
            <div class="world-summary-box" style="margin-bottom: 1rem;">
                <h4><span class="world-title" style="color: #f1c40f;">${l.title}</span> <small style="color:#aaa; font-weight:300;">- ${l.dept}</small></h4>
                <p style="font-size: 0.85rem; color: #ccc; margin: 0.5rem 0;">${l.desc}</p>
                <div style="font-size:0.9rem; color: #fff; background: rgba(0,0,0,0.4); padding: 0.5rem; border-radius: 5px;">
                    <strong style="color:var(--accent-gold);">관여된 에너지:</strong> ${filled.map(c => c.name.split(' (')[0]).join(', ')}
                </div>
            </div>
        `;
    });

    // 2. The 3 Pillars (우측/자비: 2,4,7 | 좌측/준엄: 3,5,8 | 중앙/균형: 1,6,9,10 => 0-indexed: 1,3,6 | 2,4,7 | 0,5,8,9)
    const pillars = [
        { title: '자비의 기둥 (우측)', ids: [1, 3, 6], desc: '팽창, 남성성, 긍정적이고 활동적인 에너지를 의미합니다.' },
        { title: '준엄의 기둥 (좌측)', ids: [2, 4, 7], desc: '수축, 여성성, 형태를 부여하고 제한하는 이성적 에너지를 의미합니다.' },
        { title: '균형의 기둥 (중앙)', ids: [0, 5, 8, 9], desc: '양극단을 조화시키며 의식이 현실로 내려오는 핵심 축입니다.' }
    ];

    let pillarsHTML = '<h3 style="color: #fff; margin: 2rem 0 1rem 0; border-left: 3px solid #d4af37; padding-left: 10px;">II. 세 기둥(Three Pillars)의 균형점</h3><div style="display: flex; gap: 1rem; flex-wrap: wrap;">';
    pillars.forEach(p => {
        const filled = p.ids.map(id => cards[id]).filter(card => card !== null);
        if (filled.length === 0) return;
        pillarsHTML += `
            <div class="world-summary-box" style="flex: 1; min-width: 200px;">
                <h4 style="color: #f1c40f; margin-bottom: 0.5rem;">${p.title}</h4>
                <p style="font-size: 0.8rem; color: #ccc; margin-bottom: 0.5rem;">${p.desc}</p>
                <div style="font-size:0.85rem; color: #fff;">
                    ${filled.map(c => `<span style="display:inline-block; margin: 2px; padding: 2px 6px; background: rgba(212, 175, 55, 0.15); border: 1px solid rgba(212,175,55,0.4); border-radius: 4px;">${c.name.split(' (')[0]}</span>`).join('')}
                </div>
            </div>
        `;
    });
    pillarsHTML += '</div>';

    // 3. Grand Summary (0: Root, 5: Heart, 9: Result)
    const rootCard = cards[0];
    const heartCard = cards[5];
    const resultCard = cards[9];
    let grandSummaryHTML = '';
    
    if (rootCard && heartCard && resultCard) {
        grandSummaryHTML = `
            <h3 style="color: #fff; margin: 2rem 0 1rem 0; border-left: 3px solid #d4af37; padding-left: 10px;">III. 운명의 직조 (최종 리딩)</h3>
            <div class="world-summary-box" style="border: 1px solid rgba(212, 175, 55, 0.5); background: linear-gradient(135deg, rgba(20,15,25,0.8), rgba(10,5,15,0.9));">
                <p style="line-height: 1.8; color: #eee; font-size: 0.95rem;">
                    당신의 근원적인 의도와 영혼의 뿌리에는 <strong>[${rootCard.name.split(' (')[0]}]</strong>의 강렬한 에너지가 자리잡고 있습니다.<br/>
                    이 보이지 않는 씨앗은 당신의 자아와 심장을 관통하는 <strong>[${heartCard.name.split(' (')[0]}]</strong>의 힘을 거치며 깨달음을 얻고 확신으로 변모합니다.<br/>
                    결국 이 모든 영적/정서적 층위의 소용돌이는, 마침내 현실의 흙바닥에 <strong>[${resultCard.name.split(' (')[0]}]</strong>의 형태로 찬란하게 결실을 맺게 될 것입니다.
                </p>
                <div style="margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); text-align: center; color: #d4af37; font-weight: bold; font-size: 1.1rem; text-shadow: 0 0 10px rgba(212, 175, 55, 0.8);">
                    "우주의 섭리가 당신의 현실로 투영되었습니다."
                </div>
            </div>
        `;
    }

    section.innerHTML += worldsHTML + pillarsHTML + grandSummaryHTML;
    container.appendChild(section);
}

function addZodiacAnalysis(container, cards) {
    const section = document.createElement('div');
    section.className = 'world-summary-container';
    
    // Header
    section.innerHTML = `
        <h2 class="title-lg" style="text-align:left; margin-bottom:1rem; color: #d4af37; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.5rem; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);">조디악 신성(Astrological) 융합 리딩</h2>
        <p style="color: #aaa; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">12궁의 카드는 개별적으로도 의미가 있지만, 우주적 관점에서 서로 연결될 때 진정한 1년의 흐름을 보여줍니다.</p>
    `;

    // 1. The 4 Elements (Triplicities)
    // Fire: 1, 5, 9 (indices 0, 4, 8)
    // Earth: 2, 6, 10 (indices 1, 5, 9)
    // Air: 3, 7, 11 (indices 2, 6, 10)
    // Water: 4, 8, 12 (indices 3, 7, 11)
    const elements = [
        { title: '🔥 불의 삼각 (Fire)', desc: '자아, 창조, 그리고 확장의 에너지', ids: [0, 4, 8], color: '#e74c3c' },
        { title: '🌍 흙의 삼각 (Earth)', desc: '금전, 일상, 그리고 성취의 에너지', ids: [1, 5, 9], color: '#f1c40f' },
        { title: '💨 공기의 삼각 (Air)', desc: '지성, 관계, 그리고 이상의 에너지', ids: [2, 6, 10], color: '#3498db' },
        { title: '💧 물의 삼각 (Water)', desc: '감정, 무의식, 그리고 영혼의 에너지', ids: [3, 7, 11], color: '#9b59b6' }
    ];

    let elementsHTML = '<h3 style="color: #fff; margin-bottom: 1rem; border-left: 3px solid #d4af37; padding-left: 10px;">I. 원소별 생명력의 흐름</h3><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">';
    elements.forEach(e => {
        const filled = e.ids.map(id => cards[id]).filter(card => card !== null);
        if (filled.length === 0) return;
        elementsHTML += `
            <div class="world-summary-box" style="margin-bottom:0.5rem; border-top: 2px solid ${e.color}">
                <h4 style="color: ${e.color}; margin-bottom: 0.5rem;">${e.title}</h4>
                <p style="font-size: 0.8rem; color: #ccc; margin-bottom: 0.5rem;">${e.desc}</p>
                <div style="font-size:0.85rem; color: #fff; background: rgba(0,0,0,0.5); padding: 0.5rem; border-radius: 4px;">
                    ${filled.map(c => c.name.split(' (')[0]).join(' / ')}
                </div>
            </div>
        `;
    });
    elementsHTML += '</div>';

    // 2. The Cross of Matter (Angles)
    // 1(Self), 4(Home), 7(Partner), 10(Career) -> indices 0, 3, 6, 9
    let crossHTML = '';
    const crossIds = [0, 3, 6, 9];
    const filledCross = crossIds.map(id => cards[id]).filter(card => card !== null);
    
    if (filledCross.length === 4) {
        crossHTML = `
            <h3 style="color: #fff; margin: 2rem 0 1rem 0; border-left: 3px solid #d4af37; padding-left: 10px;">II. 운명의 십자가 (The Major Angles)</h3>
            <div class="world-summary-box" style="background: rgba(20, 20, 30, 0.8); border: 1px solid rgba(255, 255, 255, 0.1);">
                <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 1rem;">
                    인생을 지탱하는 네 개의 기둥(나, 가정, 배우자, 직업)에 놓인 카드들입니다. 이 십자가가 올해 운명의 뼈대 역할을 합니다.
                </p>
                <ul style="list-style:none; line-height: 1.8; color: #eee; font-size: 0.95rem; text-align: left; display: inline-block; margin: 0 auto; padding-left: 0;">
                    <li><strong style="color:#d4af37; width: 60px; display:inline-block;">나 (1)</strong> : ${cards[0].name.split(' (')[0]}</li>
                    <li><strong style="color:#d4af37; width: 60px; display:inline-block;">가정 (4)</strong> : ${cards[3].name.split(' (')[0]}</li>
                    <li><strong style="color:#d4af37; width: 60px; display:inline-block;">관계 (7)</strong> : ${cards[6].name.split(' (')[0]}</li>
                    <li><strong style="color:#d4af37; width: 60px; display:inline-block;">사회 (10)</strong>: ${cards[9].name.split(' (')[0]}</li>
                </ul>
            </div>
        `;
    }

    // 3. Cosmic Verdict
    let verdictHTML = `
        <h3 style="color: #fff; margin: 2rem 0 1rem 0; border-left: 3px solid #d4af37; padding-left: 10px;">III. 우주적 총평 (Cosmic Verdict)</h3>
        <div class="world-summary-box" style="text-align:center; background: linear-gradient(135deg, rgba(20,15,25,0.8), rgba(10,5,15,0.9)); border: 1px solid rgba(212,175,55,0.3);">
            <p style="font-size: 1rem; color: #fff; line-height: 1.8; font-weight: 300;">
                가장 큰 변화가 닥칠 영역은 십자가가 가리키는 방향에 있으며,<br>
                당신의 무의식(12궁)에 놓인 <strong>[${cards[11] ? cards[11].name.split(' (')[0] : '미지의 영혼'}]</strong> 카드가 한 해의 숨겨진 테마가 될 것입니다.<br>
                우주가 그리는 큰 그림 안에서 당신의 역할을 찾으십시오.
            </p>
            <div style="margin-top: 1rem; color: #d4af37; font-weight: 700; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);">"THE STARS INCLINE, BUT DO NOT BIND."</div>
        </div>
    `;

    section.innerHTML += elementsHTML + crossHTML + verdictHTML;
    container.appendChild(section);
}

function getSefirotColor(idx) {
    const colors = ['#ffffff', '#999999', '#443322', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22', '#9b59b6', '#f39c12', '#555555'];
    return colors[idx];
}

function clearBoard(count) {
    let cards, prefix, boardId;
    if (count === 12 && currentMode === 'relation') {
        cards = placedCardsRelation; prefix = 'rslot'; boardId = 'relation-board';
    } else if (count === 10 && currentMode === 'tree') {
        cards = placedCardsTree; prefix = 'tslot'; boardId = 'tree-board';
    } else if (count === 10 && currentMode === 'celtic') {
        cards = placedCardsCeltic; prefix = 'cslot'; boardId = 'celtic-board';
    } else if (count === 7 && currentMode === 'hexa') {
        cards = placedCardsHexa; prefix = 'hslot'; boardId = 'hexa-board';
    } else if (count === 12 && currentMode === 'zodiac') {
        cards = placedCardsZodiac; prefix = 'zslot'; boardId = 'zodiac-board';
    } else {
        cards = placedCards4; prefix = 'slot'; boardId = 'spread-board';
    }
    cards.fill(null);
    document.querySelectorAll(`#${boardId} .slot`).forEach(slot => {
        slot.querySelector('.slot-content').innerHTML = '선택';
        slot.style.backgroundImage = 'none';
        slot.removeAttribute('data-active');
    });
    activateSlot(0);
}

function filterCards() {
    const query = document.getElementById('universal-search').value.toLowerCase();
    const filtered = tarotDataKo.filter(card => {
        const matchesQuery = card.name.toLowerCase().includes(query) ||
            card.keywords.some(k => k.toLowerCase().includes(query));
        const matchesSuit = currentFilter === 'all' || card.suit === currentFilter;
        return matchesQuery && matchesSuit;
    });
    setupGrid(filtered);
}

function setFilter(el, suit) {
    currentFilter = suit;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    filterCards();
}

function getSuitIcon(suit) {
    switch (suit) {
        case 'Wands': return '🪄';
        case 'Cups': return '🍷';
        case 'Swords': return '⚔️';
        case 'Pentacles': return '🪙';
        case 'Major Arcana': return '🕯️';
        default: return '✧';
    }
}

function showInterpretation(card) {
    document.getElementById('card-suit-tag').textContent = card.suit === 'Major Arcana' ? '메이저' : card.suit;
    document.getElementById('card-name').textContent = card.name;
    document.getElementById('card-desc').textContent = card.description;
    const keywordsList = document.getElementById('keywords-list');
    keywordsList.innerHTML = '';
    card.keywords.forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        keywordsList.appendChild(tag);
    });

    const advContainer = document.getElementById('card-advanced-meanings');
    if (advContainer) {
        if (card.meanings) {
            advContainer.innerHTML = `
                <div style="margin-bottom: 0.8rem;"><strong style="color:var(--accent-gold);">[정방향]</strong> ${card.meanings.upright}</div>
                <div style="margin-bottom: 0.8rem;"><strong style="color:#aaa;">[역방향]</strong> ${card.meanings.reversed}</div>
                <div style="margin-bottom: 0.8rem;"><strong style="color:#ff6b6b;">[연애/관계]</strong> ${card.meanings.love}</div>
                <div style="margin-bottom: 0.8rem;"><strong style="color:#4da8da;">[직업/성취]</strong> ${card.meanings.career}</div>
                <div><strong style="color:#2ecc71;">[핵심 조언]</strong> ${card.meanings.advice}</div>
            `;
        } else {
            advContainer.innerHTML = '';
        }
    }

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('full-analysis').classList.add('hidden');
    document.getElementById('interpretation').classList.remove('hidden');
}

function closeInterpretation() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeFullAnalysis() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeAllModals() { document.getElementById('modal-overlay').classList.add('hidden'); }

function copyFullAnalysis() {
    const results = document.getElementById('analysis-results').innerText;
    // Fallback for non-https/localhost
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(results).then(() => {
            alert('분석 결과가 클립보드에 복사되었습니다.');
        }).catch(err => copyFallback(results));
    } else {
        copyFallback(results);
    }
}

function copyFallback(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        alert('분석 결과가 클립보드에 복사되었습니다.');
    } catch (err) {
        alert('복사에 실패했습니다. 수동으로 선택하여 복사해 주세요.');
    }
    document.body.removeChild(textArea);
}

function showInterpretationOnTop(index, mode) {
    let cards;
    if (mode === 'tree') cards = placedCardsTree;
    else if (mode === 'relation') cards = placedCardsRelation;
    else if (mode === 'celtic') cards = placedCardsCeltic;
    else if (mode === 'hexa') cards = placedCardsHexa;
    else if (mode === 'zodiac') cards = placedCardsZodiac;
    else cards = placedCards4;

    const card = cards[index];
    const topBar = document.getElementById('top-interpretation');

    if (card && card.name) {
        topBar.classList.remove('hidden');
        topBar.innerHTML = `
            <div class="top-inter-inner">
                <span class="top-tag">✧ AETHER SYNC ✧</span>
                <span class="top-name">${card.name}</span>
                <span class="top-desc">${card.description}</span>
            </div>
        `;
    } else {
        topBar.classList.add('hidden');
    }
}

function clearTopInterpretation() {
    document.getElementById('top-interpretation').classList.add('hidden');
}

function drawRandom() {
    const randomIndex = Math.floor(Math.random() * tarotDataKo.length);
    showInterpretation(tarotDataKo[randomIndex]);
}

function updateSpreadGuide(mode) {
    const guideBox = document.getElementById('spread-guide-box');
    const titleEl = document.getElementById('spread-guide-title');
    const descEl = document.getElementById('spread-guide-desc');

    if (!guideBox || !titleEl || !descEl) return;

    const guides = {
        'spread': {
            title: "자유로운 탐색 (Free Draw)",
            desc: "오늘의 운세나 정해진 형태 없는 즉흥적인 질문에 대한 답을 구하세요. 카드의 개수는 당신의 직관에 맡깁니다."
        },
        'relation': {
            title: "관계의 컵 (Relationship Cup)",
            desc: "두 사람 사이의 에너지와 흐름, 잠재적인 마찰과 조화의 가능성을 읽어냅니다. 사랑과 협력의 깊이를 탐구하세요."
        },
        'tree': {
            title: "생명의 나무 (Tree of Life)",
            desc: "10개의 세피라를 통해 당신의 영혼이 나아갈 로드맵과 현재 도달한 성취의 단계를 성찰하는 거시적인 스프레드입니다."
        },
        'celtic': {
            title: "켈틱 크로스 (Celtic Cross)",
            desc: "가장 고전적이고 강력한 기법입니다. 문제의 핵심부터 과거의 원인, 미래의 결과까지 당신을 둘러싼 운명을 입체적으로 분석합니다."
        },
        'hexa': {
            title: "헥사그램 (Hexagram)",
            desc: "상반된 에너지 사이의 균형점을 찾습니다. 복잡한 상황에서의 조언과 최종적인 조화의 가능성을 상징합니다."
        },
        'zodiac': {
            title: "조디악 12궁 (Zodiac Spread)",
            desc: "우주가 선사한 12개의 방(House)을 통해 자아, 재물, 소통 등 인생의 모든 영역을 아우르는 거대한 운명의 흐름을 조망합니다."
        }
    };

    if (guides[mode]) {
        guideBox.classList.remove('hidden');
        titleEl.textContent = guides[mode].title;
        descEl.textContent = guides[mode].desc;
        
        // Trigger animation reset
        guideBox.style.animation = 'none';
        guideBox.offsetHeight; // trigger reflow
        guideBox.style.animation = null;
    } else {
        guideBox.classList.add('hidden');
    }
}

// --- STARDUST PARTICLE SYSTEM ---
const canvas = document.getElementById('stardust-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let w, h;

function initCanvas() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

window.addEventListener('resize', initCanvas);
initCanvas();

class Particle {
    constructor() {
        this.reset();
        // Pre-warm the stars so they don't start totally black
        this.opacity = Math.random() * this.maxOpacity;
        this.fadingOut = Math.random() > 0.5;
    }
    reset() {
        // Create a galaxy band effect (diagonal clustering)
        const isBand = Math.random() < 0.6; // 60% of stars in a cluster band
        if (isBand) {
            const t = Math.random();
            const baseX = t * w;
            const baseY = t * h;
            const spread = (Math.random() - 0.5) * (w * 0.4); 
            this.x = baseX - spread + (Math.random() * 200 - 100);
            this.y = (h - baseY) - spread + (Math.random() * 200 - 100);
        } else {
            // Scattered randomly in deep space
            this.x = Math.random() * w;
            this.y = Math.random() * h;
        }

        this.size = Math.random() * 1.5 + 0.1;
        
        // Very slow, uniform cosmic drift
        this.speedX = Math.random() * 0.03 + 0.01;
        this.speedY = Math.random() * 0.03 - 0.015;

        // Twinkling effect setup
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.8 + 0.2;
        this.fadeStep = Math.random() * 0.005 + 0.001; // Slower fade for starlight
        this.fadingOut = false;

        // Cosmic color palette
        const colors = [
            '212, 175, 55',  // Gold
            '255, 255, 255', // Pure white
            '220, 230, 255', // Pale blue
            '230, 210, 255'  // Pale lavender
        ];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Twinkling (Breathing opacity)
        if (this.fadingOut) {
            this.opacity -= this.fadeStep;
            if (this.opacity <= 0) {
                this.opacity = 0;
                this.fadingOut = false;
                // Once entirely faded, give it a chance to relocate for a dynamic galaxy
                if (Math.random() < 0.1) this.reset();
            }
        } else {
            this.opacity += this.fadeStep;
            if (this.opacity >= this.maxOpacity) {
                this.opacity = this.maxOpacity;
                this.fadingOut = true;
            }
        }

        // Loop bounds smoothly
        if (this.x < 0) this.x = w;
        if (this.x > w) this.x = 0;
        if (this.y < 0) this.y = h;
        if (this.y > h) this.y = 0;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.fill();
        
        // Add subtle glow for brighter/larger stars
        if (this.size > 1.0) {
            ctx.shadowBlur = this.size * 4;
            ctx.shadowColor = `rgba(${this.color}, ${this.opacity})`;
        } else {
            ctx.shadowBlur = 0;
        }
    }
}

function createParticles() {
    // Increase density slightly for a richer galaxy (divide by 6000 instead of 10000)
    const count = Math.floor((w * h) / 6000);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

createParticles();
animateParticles();

// Global initialization call
document.addEventListener('DOMContentLoaded', () => {
    updateSpreadGuide(currentMode);
});
