let currentFilter = 'all';
let currentMode = 'search';
let activeSlotIndex = 0;
let placedCards4 = [null, null, null, null];
let placedCardsTree = new Array(11).fill(null);

document.addEventListener('DOMContentLoaded', () => {
    setupGrid(tarotDataKo);
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
    
    document.getElementById('view-search').classList.toggle('active', mode === 'search');
    document.getElementById('view-spread').classList.toggle('active', mode === 'spread');
    document.getElementById('view-tree').classList.toggle('active', mode === 'tree');
    
    if (mode === 'spread' || mode === 'tree') {
        activateSlot(0, mode);
    }
    filterCards();
}

function activateSlot(index, mode = currentMode) {
    activeSlotIndex = index;
    const prefix = mode === 'tree' ? 'tslot' : 'slot';
    const slots = document.querySelectorAll('.slot');
    slots.forEach(slot => slot.classList.remove('active'));
    
    const target = document.getElementById(`${prefix}-${index}`);
    if (target) target.classList.add('active');
}

function placeCardInSlot(card) {
    const isTree = currentMode === 'tree';
    const cards = isTree ? placedCardsTree : placedCards4;
    const prefix = isTree ? 'tslot' : 'slot';
    
    cards[activeSlotIndex] = card;
    const slotEl = document.getElementById(`${prefix}-${activeSlotIndex}`);
    const [korName] = card.name.split(' (');
    
    slotEl.querySelector('.slot-content').innerHTML = `
        <div class="placed-card-inner">
            <div class="icon">${getSuitIcon(card.suit)}</div>
            <div class="title">${korName}</div>
        </div>
    `;
    
    let nextIndex = activeSlotIndex + 1;
    const max = isTree ? 11 : 4;
    
    if (nextIndex < max) {
        activateSlot(nextIndex);
    }
}

function analyzeFullSpread(count) {
    const isTree = count >= 10;
    const cards = isTree ? placedCardsTree : placedCards4;
    
    const requiredIndices = isTree ? [0,1,2,3,4,5,6,7,8,9] : [0,1,2,3];
    if (requiredIndices.some(i => cards[i] === null)) {
        alert(`${isTree ? '상위 10개' : '4개'}의 주요 슬롯을 모두 채워주세요!`);
        return;
    }
    
    const resultsContainer = document.getElementById('analysis-results');
    resultsContainer.innerHTML = '';
    
    let info = [];
    if (isTree) {
        info = [
            {t: '1. 케테르 (Kether)', a: '설계팀 / Architecture', m: '남아있는 영혼, 순수한 설계'},
            {t: '2. 호크마 (Chokmah)', a: '기록팀 / Records', m: '닿을 수 있는 영원, 과거의 지혜'},
            {t: '3. 비나 (Binah)', a: '추출팀 / Extraction', m: '굴레를 끊어낼 수 있는 관용, 심연에서의 추출'},
            {t: '4. 헤세드 (Chesed)', a: '복지팀 / Welfare', m: '믿음에 보답하는 마음, 자비와 보상'},
            {t: '5. 게부라 (Geburah)', a: '징계팀 / Disciplinary', m: '두려움에 굴복하지 않는 용기, 정당한 처분'},
            {t: '6. 티페레트 (Tiphareth)', a: '중앙본부 / Central', m: '존재에 대한 확신, 비극을 극복하는 빛'},
            {t: '7. 네짜흐 (Netzach)', a: '안전팀 / Safety', m: '삶을 이어갈 용기, 감정의 인내'},
            {t: '8. 호드 (Hod)', a: '교육팀 / Training', m: '더 나은 존재가 될 수 있다는 희망, 학습'},
            {t: '9. 예소드 (Yesod)', a: '정보팀 / Information', m: '분별할 수 있는 이성, 진실의 분리'},
            {t: '10. 말쿠트 (Malkuth)', a: '지휘팀 / Control', m: '똑바로 설 수 있는 의지, 도약의 발판'},
            {t: '지식 (Da\'ath)', a: '심연 / Abyss', m: '숨겨진 지혜, 건너야 할 심연'}
        ];
    } else {
        info = [
            {t: '과거 (PAST)', m: '이미 일어난 일들과 현재의 기반'},
            {t: '현재 (PRESENT)', m: '지금 에너지가 집중되는 곳'},
            {t: '미래 (FUTURE)', m: '잠재적인 결과와 나아갈 방향'},
            {t: '해결책 (KEY)', m: '문제를 돌파하기 위한 핵심 열쇠'}
        ];
    }
    
    const allIndices = isTree ? [0, 1, 2, 10, 4, 3, 5, 7, 6, 8, 9] : [0, 1, 2, 3];
    
    allIndices.forEach(idx => {
        const card = cards[idx];
        if (!card) return;

        const item = document.createElement('div');
        item.className = 'analysis-item';
        const color = isTree ? getSefirotColor(idx) : 'var(--accent-gold)';
        item.style.borderLeft = `8px solid ${color}`;
        
        const isKether = idx === 0 && isTree;
        if (isKether) item.classList.add('kether-item');

        const badgeStyle = `background:${color}; color:${isKether ? '#000' : '#fff'};`;

        item.innerHTML = `
            <div class="result-header">
                <span class="idx-badge" style="${badgeStyle}">${info[idx].t}</span>
                <span class="angel-tag" style="color:${color}">${info[idx].a ? `${info[idx].a}` : ''}</span>
            </div>
            <p class="world-meaning" style="font-size:0.75rem; color: #999; margin: 0.5rem 0;">• ${info[idx].m}</p>
            <div class="analysis-card-info">
                <span class="icon" style="color:${isKether ? '#000' : '#fff'}">${getSuitIcon(card.suit)}</span>
                <span class="name">${card.name}</span>
            </div>
            <div class="keywords-wrap">
                ${card.keywords.map(k => `<span class="tag-gold">${k}</span>`).join('')}
            </div>
            <p class="desc">${card.description}</p>
        `;
        resultsContainer.appendChild(item);
    });
    
    if (isTree) {
        addWorldAnalysis(resultsContainer, cards);
    }
    
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('interpretation').classList.add('hidden');
    document.getElementById('full-analysis').classList.remove('hidden');
}

function addWorldAnalysis(container, cards) {
    const section = document.createElement('div');
    section.className = 'world-summary-container';
    section.innerHTML = '<h2 class="title-lg" style="text-align:left; margin-bottom:2rem;">세피로트 층위(World) 분석</h2>';
    
    const layers = [
        {title: 'ATZILUTH (원형의 세계)', dept: '하층 (Extraction, Records, Architecture)', ids: [0, 1, 2], desc: '근원적인 아이디어와 의신의 세계입니다. 질문에 대한 본질적인 설계와 영혼의 방향성을 나타냅니다.'},
        {title: 'BERIAH (창조의 세계)', dept: '중층 (Welfare, Disciplinary, Central)', ids: [3, 4, 5], desc: '감정과 실질적인 창조의 세계입니다. 설계된 의지가 구체적인 열망과 감정의 힘을 얻는 단계입니다.'},
        {title: 'YETZIRAH (형성의 세계)', dept: '상층 (Safety, Training, Information)', ids: [6, 7, 8], desc: '구조와 정보의 세계입니다. 현실로 드러나기 직전의 구체적인 계획과 데이터가 형성되는 시기입니다.'},
        {title: 'ASIYAH (활동의 세계)', dept: '지휘팀 (Control)', ids: [9], desc: '물질과 현실의 세계입니다. 앞선 모든 과정이 굳어져 나타난 최종적인 결과와 현실적인 행동을 의미합니다.'}
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
                <strong>현재 에너지 상태:</strong> ${filled.map(c => c.name.split(' (')[0]).join(', ')}
            </div>
        `;
        section.appendChild(box);
    });
    
    container.appendChild(section);
}

function getSefirotColor(idx) {
    const colors = [
        '#ffffff', // 1. Architecture (White)
        '#999999', // 2. Records (Grey/Dark Blue)
        '#443322', // 3. Extraction (Bronze/Dark)
        '#3498db', // 4. Welfare (Light Blue)
        '#e74c3c', // 5. Disciplinary (Red)
        '#f1c40f', // 6. Central (Yellow/Amber)
        '#2ecc71', // 7. Safety (Green)
        '#e67e22', // 8. Training (Orange)
        '#9b59b6', // 9. Information (Purple)
        '#f39c12', // 10. Control (Amber/Gold)
        '#555555'  // Da'ath
    ];
    return colors[idx];
}

function clearBoard(count) {
    if (count >= 10) {
        placedCardsTree.fill(null);
        document.querySelectorAll('#tree-board .slot .slot-content').forEach(el => el.innerHTML = '선택');
        activateSlot(0, 'tree');
    } else {
        placedCards4.fill(null);
        document.querySelectorAll('#spread-board .slot .slot-content').forEach(el => el.innerHTML = '선택');
        activateSlot(0, 'spread');
    }
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

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('full-analysis').classList.add('hidden');
    document.getElementById('interpretation').classList.remove('hidden');
}

function closeInterpretation() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function closeFullAnalysis() {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById('full-analysis').classList.add('hidden');
}

function closeAllModals() {
    document.getElementById('modal-overlay').classList.add('hidden');
}

function drawRandom() {
    const randomIndex = Math.floor(Math.random() * tarotDataKo.length);
    showInterpretation(tarotDataKo[randomIndex]);
}
