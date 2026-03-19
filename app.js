let currentFilter = 'all';
let currentMode = 'spread';
let activeSlotIndex = 0;
let placedCards4 = [null, null, null, null];
let placedCardsTree = new Array(11).fill(null);
let placedCardsRelation = new Array(12).fill(null);

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
        cardEl.innerHTML = `
            <div class="icon">${getSuitIcon(card.suit)}</div>
            <div class="name">${korName}</div>
            ${engName ? `<p style="font-size: 0.7rem; color: #666; font-weight: 700;">${engName.replace(')', '')}</p>` : ''}
        `;

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

    // UI Tab Sync (Check for null to prevent errors)
    const btns = ['view-spread', 'view-relation', 'view-tree'];
    const modes = ['spread', 'relation', 'tree'];

    btns.forEach((id, i) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', mode === modes[i]);
    });

    if (mode === 'spread' || mode === 'tree' || mode === 'relation') {
        // Just set the active index and highlight, don't trigger search
        activeSlotIndex = 0;
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => slot.classList.remove('active'));
        let prefix = 'slot';
        if (mode === 'tree') prefix = 'tslot';
        if (mode === 'relation') prefix = 'rslot';
        const target = document.getElementById(`${prefix}-0`);
        if (target) target.classList.add('active');
    }
}

function activateSlot(index, mode = currentMode) {
    activeSlotIndex = index;
    let prefix = 'slot';
    if (mode === 'tree') prefix = 'tslot';
    if (mode === 'relation') prefix = 'rslot';

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
        cards = placedCardsTree; prefix = 'tslot'; max = 11;
    } else if (currentMode === 'relation') {
        cards = placedCardsRelation; prefix = 'rslot'; max = 12;
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

    if (count === 11 || count === 10) {
        cards = placedCardsTree; isTree = true;
        allIndices = [0, 1, 2, 10, 4, 3, 5, 7, 6, 8, 9];
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
            { t: '10. 말쿠트 (Malkuth)', a: '지휘팀', m: '똑바로 설 수 있는 의지' },
            { t: '지식 (Da\'ath)', a: '심연', m: '건너야 할 심연' }
        ];
    } else if (count === 12) {
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
    section.innerHTML = '<h2 class="title-lg" style="text-align:left; margin-bottom:2rem;">세피로트 층위(World) 분석</h2>';

    const layers = [
        { title: 'ATZILUTH (원형)', dept: '정신의 근원과 순수한 의지', ids: [0, 1, 2], desc: '질문의 본질적인 설계와 의지의 세계' },
        { title: 'BERIAH (창조)', dept: '감정의 발현과 깊은 열망', ids: [3, 4, 5], desc: '의지가 감정의 힘을 얻어 창조되는 단계' },
        { title: 'YETZIRAH (형성)', dept: '정보의 체계화와 구체적 계획', ids: [6, 7, 8], desc: '현실로 드러나기 직전의 계획과 형성' },
        { title: 'ASIYAH (활동)', dept: '최종적인 결과와 현실적 현현', ids: [9], desc: '물질화된 결과와 현실적인 행동' }
    ];

    layers.forEach(l => {
        const filled = l.ids.map(id => cards[id]).filter(card => card !== null);
        if (filled.length === 0) return;
        const box = document.createElement('div');
        box.className = 'world-summary-box';
        box.innerHTML = `
            <h3><span class="world-title">${l.title}</span> <small style="color:#666; font-weight:300;">${l.dept}</small></h3>
            <p>${l.desc}</p>
            <div style="margin-top:1rem; font-size:0.85rem; color:var(--accent-gold);">
                <strong>에너지:</strong> ${filled.map(c => c.name.split(' (')[0]).join(', ')}
            </div>
        `;
        section.appendChild(box);
    });
    container.appendChild(section);
}

function getSefirotColor(idx) {
    const colors = ['#ffffff', '#999999', '#443322', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22', '#9b59b6', '#f39c12', '#555555'];
    return colors[idx];
}

function clearBoard(count) {
    let cards, prefix, boardId;
    if (count === 12) {
        cards = placedCardsRelation; prefix = 'rslot'; boardId = 'relation-board';
    } else if (count >= 10) {
        cards = placedCardsTree; prefix = 'tslot'; boardId = 'tree-board';
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
