// ============================================================
// SUPABASE AUTH & OBS PERSONAL STREAM KEY SYSTEM
// ============================================================
const SUPABASE_URL = 'https://aqgbwzayefinqxjoalzc.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PG8molq9mMczlAxzP3rELw_ndrwY7sF';
const supabaseClient = (typeof window !== 'undefined' && window.supabase && window.supabase.createClient)
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
    : null;

const GOOGLE_CLIENT_ID = '803800683773-is6iet2nejlpah86ntb6i281f3ppoo3k.apps.googleusercontent.com';
const MASTER_EMAIL = 'whtjss1230@gmail.com';
let currentUser = null;
let currentOBSKey = localStorage.getItem('obs_user_key') || 'default';
let currentDeck = 'classic'; // 'classic' or 'samla'
let currentModalTab = 'all'; // for samla interpretation modal
let currentModalCard = null;

let currentInterpretationMode = 'all'; // 'all', 'love', 'career', 'advice'
let currentMode = 'spread';
let activeSlotIndex = 0;
let placedCards1 = Array(1).fill(null);
let placedCards3 = Array(3).fill(null);
let placedCards4 = Array(4).fill(null);
let placedCardsChoice = Array(5).fill(null);
let placedCardsTree = Array(10).fill(null);
let placedCardsRelation = Array(12).fill(null);
let placedCardsCeltic = Array(10).fill(null);
let placedCardsHexa = Array(7).fill(null);
let placedCardsZodiac = Array(12).fill(null);
let currentFilter = 'all';

function generateRandomStreamKey() {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let res = 'obs_';
    for (let i = 0; i < 16; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
}

// Supabase Cloud Realtime Channel for OBS Broadcast
let personalRealtimeChannel = null;
let defaultRealtimeChannel = null;
let currentSubscribedKey = null;

function setupSupabaseOBSChannel(key) {
    if (!supabaseClient) return;
    const roomKey = key || currentOBSKey || 'default';

    // 1. 개인 고유키 채널 (roomKey) 설정
    if (!personalRealtimeChannel || currentSubscribedKey !== roomKey) {
        if (personalRealtimeChannel) {
            try { supabaseClient.removeChannel(personalRealtimeChannel); } catch (e) {}
            personalRealtimeChannel = null;
        }
        currentSubscribedKey = roomKey;
        personalRealtimeChannel = supabaseClient.channel('obs_room_' + roomKey, {
            config: { broadcast: { self: false } }
        });
        personalRealtimeChannel
            .on('broadcast', { event: 'request_sync' }, () => {
                console.log('[Supabase Realtime] Sync requested from OBS on personal room:', roomKey);
                broadcastState();
            })
            .subscribe((status) => {
                console.log(`[Supabase Realtime] Personal room obs_room_${roomKey} status:`, status);
                if (status === 'SUBSCRIBED') {
                    broadcastState();
                }
            });
    }

    // 2. 기본(default) 채널 항상 동시 연결 (OBS에서 ?key 없이 접속해도 100% 동기화 보장)
    if (!defaultRealtimeChannel) {
        defaultRealtimeChannel = supabaseClient.channel('obs_room_default', {
            config: { broadcast: { self: false } }
        });
        defaultRealtimeChannel
            .on('broadcast', { event: 'request_sync' }, () => {
                console.log('[Supabase Realtime] Sync requested from OBS on default room');
                broadcastState();
            })
            .subscribe((status) => {
                console.log('[Supabase Realtime] Default room obs_room_default status:', status);
                if (status === 'SUBSCRIBED') {
                    broadcastState();
                }
            });
    }
}

function sendSupabaseRealtime(payload) {
    if (!supabaseClient) return;
    const roomKey = payload.key || currentOBSKey || 'default';
    if (!personalRealtimeChannel || currentSubscribedKey !== roomKey) {
        setupSupabaseOBSChannel(roomKey);
    }

    try {
        if (personalRealtimeChannel) {
            personalRealtimeChannel.send({
                type: 'broadcast',
                event: 'update_spread',
                payload: payload
            }).catch(err => {
                console.warn('[Supabase Realtime] Send failed on room:', roomKey, err);
            });
        }

        // 고유키 방송 시, default 룸에도 항상 동시 브로드캐스트하여 OBS 설정 키 불일치 방지
        if (roomKey !== 'default' && defaultRealtimeChannel) {
            defaultRealtimeChannel.send({
                type: 'broadcast',
                event: 'update_spread',
                payload: payload
            }).catch(() => {});
        }
    } catch (e) {
        console.warn('[Supabase Realtime] Exception sending broadcast:', e);
    }
}

// Initial Realtime setup
if (typeof window !== 'undefined') {
    setupSupabaseOBSChannel(currentOBSKey);
    // OBS 화면이 나중에 켜져도 언제든 자동 복원되도록 3초 주기 자동 동기화
    setInterval(() => {
        if (personalRealtimeChannel || defaultRealtimeChannel) {
            broadcastState();
        }
    }, 3000);
}

async function initAuthSession() {
    if (!supabaseClient) return;
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        updateAuthUI(session ? session.user : null);

        // OAuth 로그인 리다이렉트 후 URL의 access_token 등 해시 정리
        if (window.location.hash && (window.location.hash.includes('access_token') || window.location.hash.includes('error'))) {
            setTimeout(() => {
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            }, 400);
        }

        supabaseClient.auth.onAuthStateChange(async (event, session) => {
            updateAuthUI(session ? session.user : null);
        });
    } catch (e) {
        console.error("Auth session error:", e);
    }
}

async function updateAuthUI(user) {
    currentUser = user;
    const loggedOutEl = document.getElementById('auth-logged-out');
    const loggedInEl = document.getElementById('auth-logged-in');
    const emailDisplay = document.getElementById('user-email-display');
    const samlaBanner = document.getElementById('samla-hidden-badge-wrap');

    const panelLoggedOut = document.getElementById('auth-panel-logged-out');
    const panelLoggedIn = document.getElementById('auth-panel-logged-in');
    const panelEmail = document.getElementById('user-email-display-panel');
    const panelKey = document.getElementById('user-key-display-panel');

    if (user) {
        if (loggedOutEl) loggedOutEl.classList.add('hidden');
        if (loggedInEl) loggedInEl.classList.remove('hidden');
        if (emailDisplay) emailDisplay.textContent = user.email.split('@')[0];

        if (panelLoggedOut) panelLoggedOut.classList.add('hidden');
        if (panelLoggedIn) panelLoggedIn.classList.remove('hidden');
        if (panelEmail) panelEmail.textContent = user.email;

        // 유저 메타데이터에 obs_key가 없으면 자동 생성 및 저장
        let userKey = user.user_metadata?.obs_key;
        if (!userKey) {
            userKey = generateRandomStreamKey();
            await supabaseClient.auth.updateUser({ data: { obs_key: userKey } });
        }
        currentOBSKey = userKey;
        localStorage.setItem('obs_user_key', userKey);
        setupSupabaseOBSChannel(userKey);
        if (panelKey) panelKey.textContent = userKey;

        // whtjss1230@gmail.com 계정일 때만 삼라만상 히든 배너 노출!
        if (user.email.toLowerCase() === MASTER_EMAIL.toLowerCase()) {
            if (samlaBanner) samlaBanner.classList.remove('hidden');
        } else {
            if (samlaBanner) samlaBanner.classList.add('hidden');
            if (currentDeck === 'samla') setDeckMode('classic');
        }
    } else {
        if (loggedOutEl) loggedOutEl.classList.remove('hidden');
        if (loggedInEl) loggedInEl.classList.add('hidden');
        if (samlaBanner) samlaBanner.classList.add('hidden');

        if (panelLoggedOut) panelLoggedOut.classList.remove('hidden');
        if (panelLoggedIn) panelLoggedIn.classList.add('hidden');
        if (panelKey) panelKey.textContent = 'default';

        currentOBSKey = 'default';
        localStorage.removeItem('obs_user_key');
        setupSupabaseOBSChannel('default');
        if (currentDeck === 'samla') setDeckMode('classic');
    }
    broadcastState();
}

let authCurrentTab = 'login';
function openAuthModal(tab = 'login') {
    authCurrentTab = tab;
    switchAuthTab(tab);
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.classList.remove('hidden');
        overlay.style.display = 'flex';
    }
    clearAuthMessages();
    setTimeout(() => {
        const inp = document.getElementById('auth-email');
        if (inp) inp.focus();
    }, 120);
}

function closeAuthModal() {
    const overlay = document.getElementById('auth-modal-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
        overlay.style.display = 'none';
    }
    clearAuthMessages();
}

function switchAuthTab(tab) {
    authCurrentTab = tab;
    const tabLogin = document.getElementById('auth-tab-login');
    const tabSignup = document.getElementById('auth-tab-signup');
    const submitBtn = document.getElementById('btn-auth-submit');
    if (tabLogin) tabLogin.classList.toggle('active', tab === 'login');
    if (tabSignup) tabSignup.classList.toggle('active', tab === 'signup');
    if (submitBtn) submitBtn.textContent = tab === 'login' ? '로그인' : '회원가입';
    clearAuthMessages();
}

function clearAuthMessages() {
    const err = document.getElementById('auth-error-msg');
    const succ = document.getElementById('auth-success-msg');
    if (err) { err.textContent = ''; err.classList.add('hidden'); }
    if (succ) { succ.textContent = ''; succ.classList.add('hidden'); }
}

async function submitAuthForm() {
    if (!supabaseClient) {
        alert("Supabase 클라이언트가 초기화되지 않았습니다.");
        return;
    }
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const errEl = document.getElementById('auth-error-msg');
    const succEl = document.getElementById('auth-success-msg');
    clearAuthMessages();

    if (!email || !password) {
        if (errEl) { errEl.textContent = "이메일과 비밀번호를 모두 입력해 주세요."; errEl.classList.remove('hidden'); }
        return;
    }

    const submitBtn = document.getElementById('btn-auth-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "처리 중..."; }

    try {
        if (authCurrentTab === 'login') {
            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
            if (error) throw error;
            closeAuthModal();
        } else {
            const initKey = generateRandomStreamKey();
            const { data, error } = await supabaseClient.auth.signUp({
                email,
                password,
                options: { data: { obs_key: initKey } }
            });
            if (error) throw error;
            if (succEl) {
                succEl.textContent = "회원가입이 완료되었습니다! 로그인 상태로 자동 전환됩니다.";
                succEl.classList.remove('hidden');
            }
            setTimeout(() => { closeAuthModal(); }, 1200);
        }
    } catch (err) {
        if (errEl) {
            let msg = err.message || "오류가 발생했습니다.";
            if (msg.includes("Invalid login credentials")) {
                msg = "이메일 또는 비밀번호가 일치하지 않거나 아직 등록되지 않은 계정입니다. 계정이 없다면 위의 [회원가입] 탭을 눌러 가입해 주세요!";
            } else if (msg.includes("already registered") || msg.includes("User already registered")) {
                msg = "이미 가입된 이메일 주소입니다. [로그인] 탭에서 로그인해 주세요.";
            } else if (msg.includes("Password should be at least")) {
                msg = "비밀번호는 최소 6자리 이상이어야 합니다.";
            }
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
        }
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = authCurrentTab === 'login' ? '로그인' : '회원가입';
        }
    }
}

function initGoogleAuth() {
    if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
        return;
    }
    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            ux_mode: 'popup'
        });
    } catch (e) {
        console.warn("Google GIS init warn:", e);
    }
}

window.handleGoogleCredentialResponse = async function(response) {
    if (!response || !response.credential) return;

    try {
        const { data, error } = await supabaseClient.auth.signInWithIdToken({
            provider: 'google',
            token: response.credential
        });
        if (error) throw error;

        closeAuthModal();
        const { data: { session } } = await supabaseClient.auth.getSession();
        updateAuthUI(session ? session.user : null);
    } catch (err) {
        console.error("Google signInWithIdToken error:", err);
        fallbackGoogleOAuth();
    }
};

async function signInWithGoogle() {
    if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
        initGoogleAuth();
        google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                fallbackGoogleOAuth();
            }
        });
    } else {
        fallbackGoogleOAuth();
    }
}

async function fallbackGoogleOAuth() {
    if (!supabaseClient) {
        alert("Supabase 인증 클라이언트가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
        return;
    }

    const googleBtnModal = document.getElementById('btn-google-login');
    if (googleBtnModal) {
        googleBtnModal.disabled = true;
        googleBtnModal.style.opacity = '0.7';
    }

    let redirectUrl = window.location.origin + '/';

    try {
        const { data, error } = await supabaseClient.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUrl,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        });
        if (error) throw error;
    } catch (err) {
        console.error("Google sign in fallback error:", err);
        const errEl = document.getElementById('auth-error-msg');
        let msg = err.message || "구글 로그인 중 오류가 발생했습니다.";
        if (msg.includes("provider is not enabled") || msg.includes("Unsupported provider")) {
            msg = "Supabase 대시보드(Authentication -> Providers)에서 Google 로그인을 활성화해 주세요.";
        }
        if (errEl) {
            errEl.textContent = msg;
            errEl.classList.remove('hidden');
        } else {
            alert(msg);
        }
    } finally {
        if (googleBtnModal) {
            googleBtnModal.disabled = false;
            googleBtnModal.style.opacity = '1';
        }
    }
}

async function handleLogout() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
    updateAuthUI(null);
}

function copyUserOBSUrl() {
    const key = currentOBSKey || 'default';
    const origin = window.location.origin + '/';
    const obsUrl = `${origin}obs.html?key=${encodeURIComponent(key)}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(obsUrl).then(() => {
            alert(`내 방송 전용 OBS 주소가 복사되었습니다!\n\nOBS 브라우저 소스 URL에 붙여넣으세요:\n${obsUrl}`);
        }).catch(() => prompt("아래 주소를 복사하세요:", obsUrl));
    } else {
        prompt("아래 주소를 복사하세요:", obsUrl);
    }
}

async function regenerateUserOBSKey() {
    if (!currentUser || !supabaseClient) {
        alert("로그인 후 이용할 수 있습니다.");
        return;
    }
    if (!confirm("OBS 송출키를 새로 발급하시겠습니까?\n발급 후 OBS 브라우저 소스의 URL 주소도 변경하셔야 합니다.")) return;

    const newKey = generateRandomStreamKey();
    const { error } = await supabaseClient.auth.updateUser({ data: { obs_key: newKey } });
    if (error) {
        alert("키 재발급 실패: " + error.message);
        return;
    }
    currentOBSKey = newKey;
    localStorage.setItem('obs_user_key', newKey);
    setupSupabaseOBSChannel(newKey);
    copyUserOBSUrl();
}

// ============================================================
// DECK MANAGEMENT (CLASSIC ⟷ SAMLA NACRE TAROT)
// ============================================================
function getActiveDeckCards() {
    if (currentDeck === 'samla' && typeof tarotDataSamla !== 'undefined') {
        return tarotDataSamla;
    }
    return tarotDataKo;
}

function toggleDeckMode() {
    if (!currentUser || currentUser.email.toLowerCase() !== MASTER_EMAIL.toLowerCase()) {
        alert("삼라만상 백자개 타로는 마스터 전용 비밀 서고 기능입니다.");
        return;
    }
    setDeckMode(currentDeck === 'classic' ? 'samla' : 'classic');
}

function setDeckMode(mode) {
    currentDeck = mode;
    const btnText = document.getElementById('deck-toggle-text');
    const btnIcon = document.getElementById('deck-toggle-icon');
    const modalTabContainer = document.getElementById('modal-tab-container');
    const quoteBox = document.getElementById('card-quote-box');
    const copyLLMBtn = document.getElementById('btn-copy-llm');

    if (mode === 'samla') {
        if (btnText) btnText.textContent = "🌙 기본 타로로 복귀";
        if (btnIcon) btnIcon.textContent = "🌙";
        if (modalTabContainer) modalTabContainer.style.display = 'flex';
        if (quoteBox) quoteBox.style.display = 'block';
        if (copyLLMBtn) copyLLMBtn.style.display = 'inline-block';
        document.body.classList.add('samla-theme');
    } else {
        if (btnText) btnText.textContent = "🪷 삼라만상 백자개 타로로 전환";
        if (btnIcon) btnIcon.textContent = "🪷";
        if (modalTabContainer) modalTabContainer.style.display = 'none';
        if (quoteBox) quoteBox.style.display = 'none';
        if (copyLLMBtn) copyLLMBtn.style.display = 'none';
        document.body.classList.remove('samla-theme');
    }

    setupGrid(getActiveDeckCards());
    broadcastState();
    requestAnimationFrame(syncAllLines);
}

document.addEventListener('DOMContentLoaded', () => {
    initAuthSession();
    initGoogleAuth();
    setTimeout(initGoogleAuth, 800);
    setupGrid(getActiveDeckCards());
    switchMode('spread');
    updateSpreadGuide(currentMode);
    requestAnimationFrame(syncAllLines);

    const emailInp = document.getElementById('auth-email');
    const passInp = document.getElementById('auth-password');
    [emailInp, passInp].forEach(inp => {
        if (inp) {
            inp.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') submitAuthForm();
            });
        }
    });
});

let isSpreadCardAreaOpen = false;

function toggleSpreadCardsGrid() {
    isSpreadCardAreaOpen = !isSpreadCardAreaOpen;
    const cardArea = document.getElementById('card-selection-area');
    const toggleBtn = document.getElementById('btn-toggle-spread-cards');
    const toggleText = document.getElementById('toggle-cards-text');
    const toggleIcon = document.getElementById('toggle-cards-icon');

    if (cardArea) {
        cardArea.classList.toggle('hidden', !isSpreadCardAreaOpen);
    }
    if (toggleBtn) {
        toggleBtn.classList.toggle('active', isSpreadCardAreaOpen);
        if (toggleText) {
            toggleText.textContent = isSpreadCardAreaOpen ? '카드 목록 접기' : '스프레드에 배치할 카드 목록 펼쳐보기';
        }
        if (toggleIcon) {
            toggleIcon.textContent = isSpreadCardAreaOpen ? '🔼' : '🃏';
        }
    }
    if (isSpreadCardAreaOpen) {
        filterCards();
    }
}

function setupGrid(cards) {
    const grid = document.getElementById('cards-grid');
    if (!grid) return;
    grid.innerHTML = '';

    cards.forEach(card => {
        let korName = card.name;
        let engName = '';
        if (card.name && card.name.includes(' (')) {
            const parts = card.name.split(' (');
            korName = parts[0];
            engName = parts[1].replace(')', '');
        }

        const cardEl = document.createElement('div');
        cardEl.className = 'grid-card';
        if (card.image) {
            cardEl.style.backgroundImage = `url('${card.image}')`;
        }

        cardEl.innerHTML = `
            <div class="name">
                <span class="kor">${korName}</span>
                ${engName ? `<span class="eng">${engName}</span>` : ''}
            </div>
        `;

        cardEl.onclick = () => {
            if (currentMode === 'search') {
                showInterpretation(card);
            } else {
                initiateCardPlacement(card);
            }
        };
        grid.appendChild(cardEl);
    });
}

function switchMode(mode) {
    currentMode = mode;
    const isSearch = (mode === 'search');

    const boardSpread1 = document.getElementById('spread1-board');
    const boardChoice = document.getElementById('choice-board');
    if (boardSpread1) boardSpread1.classList.toggle('hidden', mode !== 'spread1');
    if (boardChoice) boardChoice.classList.toggle('hidden', mode !== 'choice');
    document.getElementById('spread-board').classList.toggle('hidden', mode !== 'spread');
    document.getElementById('spread3-board').classList.toggle('hidden', mode !== 'spread3');
    document.getElementById('tree-board').classList.toggle('hidden', mode !== 'tree');
    document.getElementById('relation-board').classList.toggle('hidden', mode !== 'relation');
    document.getElementById('celtic-board').classList.toggle('hidden', mode !== 'celtic');
    document.getElementById('hexa-board').classList.toggle('hidden', mode !== 'hexa');
    document.getElementById('zodiac-board').classList.toggle('hidden', mode !== 'zodiac');

    // 카드 도감(검색) 영역 및 펼치기 바 상태 제어
    const cardArea = document.getElementById('card-selection-area');
    const pickerBar = document.getElementById('spread-card-picker-bar');

    if (isSearch) {
        // [카드 도감] 모드: 카드 목록 항상 전체 노출! 펼치기 바는 숨김
        if (cardArea) cardArea.classList.remove('hidden');
        if (pickerBar) pickerBar.classList.add('hidden');
        filterCards();
    } else {
        // [스프레드] 모드: 카드 목록은 기본 숨김(펼쳐보기 버튼 눌렀을 때만 노출)
        if (cardArea) cardArea.classList.toggle('hidden', !isSpreadCardAreaOpen);
        if (pickerBar) pickerBar.classList.remove('hidden');
    }

    updateSpreadGuide(mode);

    // UI Tab Sync
    const btns = ['view-spread1', 'view-spread3', 'view-spread', 'view-choice', 'view-relation', 'view-tree', 'view-celtic', 'view-hexa', 'view-zodiac', 'view-search'];
    const modes = ['spread1', 'spread3', 'spread', 'choice', 'relation', 'tree', 'celtic', 'hexa', 'zodiac', 'search'];

    btns.forEach((id, i) => {
        const btn = document.getElementById(id);
        if (btn) btn.classList.toggle('active', mode === modes[i]);
    });

    if (modes.includes(mode) && mode !== 'search') {
        activeSlotIndex = 0;
        const slots = document.querySelectorAll('.slot');
        slots.forEach(slot => slot.classList.remove('active'));
        let prefix = 'slot';
        if (mode === 'spread1') prefix = 's1slot';
        else if (mode === 'choice') prefix = 'chslot';
        else if (mode === 'spread3') prefix = 's3slot';
        else if (mode === 'tree') prefix = 'tslot';
        else if (mode === 'relation') prefix = 'rslot';
        else if (mode === 'celtic') prefix = 'cslot';
        else if (mode === 'hexa') prefix = 'hslot';
        else if (mode === 'zodiac') prefix = 'zslot';
        const target = document.getElementById(`${prefix}-0`);
        if (target) target.classList.add('active');
    }
    
    // Ensure SVG lines are synced after mode switch
    requestAnimationFrame(() => {
        if (typeof syncAllLines === 'function') syncAllLines();
    });
    setTimeout(() => {
        if (typeof syncAllLines === 'function') syncAllLines();
    }, 60);

    // OBS 화면 송출 동기화 (단, 카드 도감 열람 모드일 때는 OBS 화면을 덮어쓰지 않음)
    if (mode !== 'search') {
        broadcastState();
    }
}

function setInterpretationMode(mode) {
    currentInterpretationMode = mode;
    // UI 업데이트: 모든 .inter-mode-btn에서 active 클래스 제거 후 클릭된 것에 추가
    document.querySelectorAll('.inter-mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === mode);
    });
}

function activateSlot(index, mode = currentMode) {
    activeSlotIndex = index;
    let prefix = 'slot';
    if (mode === 'spread1') prefix = 's1slot';
    else if (mode === 'choice') prefix = 'chslot';
    else if (mode === 'spread3') prefix = 's3slot';
    else if (mode === 'tree') prefix = 'tslot';
    else if (mode === 'relation') prefix = 'rslot';
    else if (mode === 'celtic') prefix = 'cslot';
    else if (mode === 'hexa') prefix = 'hslot';
    else if (mode === 'zodiac') prefix = 'zslot';

    const boards = {
        'spread1': placedCards1,
        'choice': placedCardsChoice,
        'spread': placedCards4,
        'spread3': placedCards3,
        'tree': placedCardsTree,
        'relation': placedCardsRelation,
        'celtic': placedCardsCeltic,
        'hexa': placedCardsHexa,
        'zodiac': placedCardsZodiac
    };
    
    const cards = boards[mode];
    
    // 만약 이미 카드가 놓여있다면 해석 모달을 띄웁니다.
    if (cards && cards[index]) {
        showInterpretation(cards[index]);
        return;
    }

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
        const modalWidth = 400; 
        const leftPos = Math.min(window.innerWidth - modalWidth - 20, Math.max(20, rect.left + rect.width / 2 - modalWidth / 2));
        const topPos = Math.min(window.innerHeight - 450, Math.max(20, rect.top - 100));

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

    const filtered = getActiveDeckCards().filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.keywords && c.keywords.some(k => k.toLowerCase().includes(query)))
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
    const card = getActiveDeckCards().find(c => c.name === cardName);
    if (card) {
        initiateCardPlacement(card);
        closeQuickSearch();
    }
}

let pendingPlaceCard = null;

function initiateCardPlacement(card) {
    pendingPlaceCard = card;
    
    // Destroy previous instance to guarantee freshness
    let oldOverlay = document.getElementById('direction-select-overlay-js');
    if (oldOverlay) oldOverlay.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'direction-select-overlay-js';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.zIndex = '99999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    
    const korName = card.name.split(' (')[0];
    
    overlay.innerHTML = `
        <div style="background: rgba(10, 10, 15, 0.95); border: 2px solid #d4af37; border-radius: 12px; padding: 3rem 2rem; text-align: center; max-width: 400px; width: 90%; box-shadow: 0 0 50px rgba(0,0,0,1);">
            <h3 style="color: #d4af37; margin-bottom: 0.5rem; font-size: 1.4rem;">${korName}</h3>
            <p style="color: #bbb; margin-bottom: 2.5rem;">어느 방향으로 뽑으시겠습니까?</p>
            <div style="display: flex; gap: 1rem;">
                <button id="btn-upright" style="flex: 1; padding: 1.5rem 1rem; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer; border-radius: 8px;">
                    <div style="color: #d4af37; font-size: 1.8rem; margin-bottom: 0.5rem;">▲</div>
                    <strong style="font-size: 1.1rem;">정방향</strong>
                </button>
                <button id="btn-reversed" style="flex: 1; padding: 1.5rem 1rem; background: transparent; border: 1px solid rgba(255,255,255,0.3); color: #fff; cursor: pointer; border-radius: 8px;">
                    <div style="color: #e74c3c; font-size: 1.8rem; margin-bottom: 0.5rem; transform: rotate(180deg);">▲</div>
                    <strong style="font-size: 1.1rem;">역방향</strong>
                </button>
            </div>
            <button id="btn-cancel-dir" style="margin-top: 1.5rem; width: 100%; border: none; background: transparent; color: #888; cursor: pointer; padding: 1rem; border-radius: 8px;">취소 (선택 취소)</button>
        </div>
    `;
    document.body.appendChild(overlay);
    
    // 배경(어두운 부분) 클릭 시 취소(Escape) 상호작용
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            overlay.remove();
            pendingPlaceCard = null;
        }
    };
    
    document.getElementById('btn-upright').onclick = () => {
        overlay.remove();
        confirmDirection(false);
    };
    document.getElementById('btn-reversed').onclick = () => {
        overlay.remove();
        confirmDirection(true);
    };
    document.getElementById('btn-cancel-dir').onclick = () => {
        overlay.remove();
        pendingPlaceCard = null;
    };
}

function confirmDirection(isReversed) {
    if (pendingPlaceCard) {
        placeCardInSlot(pendingPlaceCard, isReversed);
        pendingPlaceCard = null;
    }
}

function placeCardInSlot(baseCard, isReversed) {
    let cards, prefix, max;
    if (currentMode === 'spread1') {
        cards = placedCards1; prefix = 's1slot'; max = 1;
    } else if (currentMode === 'choice') {
        cards = placedCardsChoice; prefix = 'chslot'; max = 5;
    } else if (currentMode === 'spread3') {
        cards = placedCards3; prefix = 's3slot'; max = 3;
    } else if (currentMode === 'tree') {
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

    const card = { ...baseCard, isReversed: isReversed };

    cards[activeSlotIndex] = card;
    const slotEl = document.getElementById(`${prefix}-${activeSlotIndex}`);
    const korNameOrigin = card.name.split(' (')[0];
    const displayKorName = isReversed ? `${korNameOrigin} [역]` : korNameOrigin;

    // Remove plain background image assigned previously
    if (slotEl) {
        slotEl.style.backgroundImage = 'none';

        // Implement proper background layer for rotation without rotating the inner UI
        let bgLayer = slotEl.querySelector('.slot-bg-layer');
        if (!bgLayer) {
            bgLayer = document.createElement('div');
            bgLayer.className = 'slot-bg-layer';
            slotEl.insertBefore(bgLayer, slotEl.firstChild);
        }
        
        const finalImg = card.image || `images/tarot_${card.id}.webp`;
        bgLayer.style.backgroundImage = `url('${finalImg}')`;
        bgLayer.style.transform = isReversed ? 'rotate(180deg)' : 'none';
        bgLayer.style.opacity = '1';

        const contentEl = slotEl.querySelector('.slot-content');
        if (contentEl) contentEl.innerHTML = displayKorName;
        const tooltip = slotEl.querySelector('.slot-tooltip');
        
        // Switch meaning on tooltip based on orientation
        let tipText = card.description || '';
        if (card.meanings) {
            const mSet = isReversed ? (card.meanings.reversed || card.meanings) : (card.meanings.upright || card.meanings);
            const meaningText = mSet.general || (isReversed ? card.meanings.reversed : card.meanings.upright);
            tipText += `\n\n[해석] ${meaningText}`;
        }
        if (tooltip) tooltip.innerText = tipText;

        slotEl.setAttribute('data-active', 'true');
    }

    let nextIndex = activeSlotIndex + 1;
    if (nextIndex < max) {
        activeSlotIndex = nextIndex;
        const slots = document.querySelectorAll('.slot');
        slots.forEach(s => s.classList.remove('active'));
        const nextTarget = document.getElementById(`${prefix}-${nextIndex}`);
        if (nextTarget) nextTarget.classList.add('active');
    } else {
        const slots = document.querySelectorAll('.slot');
        slots.forEach(s => s.classList.remove('active'));
    }

    broadcastState();
}

function analyzeFullSpread(count) {
    let cards, info, allIndices;
    let isTree = false;
    let isRelation = false;
    let isCeltic = false;
    let isZodiac = false;

    if (count === 1 && currentMode === 'spread1') {
        cards = placedCards1;
        allIndices = [0];
        info = [
            { t: '핵심 에너지 (CORE)', m: '현재 질문의 본질이자 우주의 명확한 한 줄기 해답' }
        ];
    } else if (count === 5 && currentMode === 'choice') {
        cards = placedCardsChoice;
        allIndices = [0, 1, 2, 3, 4];
        info = [
            { t: '현재 상황 (CURRENT)', m: '현재 놓인 기로와 고민' },
            { t: '선택 A 흐름 (PATH A)', m: 'A를 택했을 때의 전개 과정' },
            { t: '선택 A 결과 (OUTCOME A)', m: 'A 선택의 최종 결과' },
            { t: '선택 B 흐름 (PATH B)', m: 'B를 택했을 때의 전개 과정' },
            { t: '선택 B 결과 (OUTCOME B)', m: 'B 선택의 최종 결과' }
        ];
    } else if (count === 3 && currentMode === 'spread3') {
        cards = placedCards3;
        allIndices = [0, 1, 2];
        info = [
            { t: '과거 (PAST)', m: '원인과 발단' },
            { t: '현재 (PRESENT)', m: '진행 상황과 에너지' },
            { t: '미래 (FUTURE)', m: '예상되는 결과' }
        ];
    } else if (count === 10 && currentMode === 'tree') {
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
            const isRev = card.isReversed || false;
            const m = card.meanings;
            // Get the correct set based on orientation (already standardized to objects)
            const mSet = isRev ? (m.reversed || m) : (m.upright || m);
            
            const dirLabel = isRev ? '<strong style="color:#e74c3c;">[역방향]</strong>' : '<strong style="color:var(--accent-gold);">[정방향]</strong>';
            const baseMeaning = mSet.general || (isRev ? m.reversed : m.upright);
            let contextMeaning = '';

            if (currentInterpretationMode === 'all') {
                contextMeaning = `<div style="margin-bottom:8px;">${dirLabel} ${baseMeaning}</div>`;
                contextMeaning += `<div><strong style="color:#ff6b6b;">[연애/관계]</strong> ${mSet.love || '정보 없음'}</div>`;
                contextMeaning += `<div><strong style="color:#4da8da;">[직업/성취]</strong> ${mSet.career || '정보 없음'}</div>`;
                contextMeaning += `<div><strong style="color:#f1c40f;">[금전/재물]</strong> ${mSet.wealth || mSet.career || '정보 없음'}</div>`;
                contextMeaning += `<div><strong style="color:#2ecc71;">[건강/활력]</strong> ${mSet.health || '정보 없음'}</div>`;
                contextMeaning += `<div style="margin-top:4px;"><strong style="color:#2ecc71;">[신성 조언]</strong> ${mSet.advice || getMysticalAdvice(card)}</div>`;
            } else {
                let catLabel = '';
                let catColor = '';
                let catText = '';
                
                if (currentInterpretationMode === 'love') { catLabel = '연애운'; catColor = '#ff6b6b'; catText = mSet.love; }
                else if (currentInterpretationMode === 'career') { catLabel = '직업/성공'; catColor = '#4da8da'; catText = mSet.career; }
                else if (currentInterpretationMode === 'wealth') { catLabel = '금전/재물'; catColor = '#f1c40f'; catText = mSet.wealth || mSet.career; }
                else if (currentInterpretationMode === 'health') { catLabel = '건강/활력'; catColor = '#2ecc71'; catText = mSet.health || "활기찬 에너지가 가득합니다."; }
                else if (currentInterpretationMode === 'advice') { catLabel = '신성 조언'; catColor = '#2ecc71'; catText = mSet.advice || getMysticalAdvice(card); }
                
                contextMeaning = `<div style="margin-bottom:4px;">${dirLabel} <strong style="color:${catColor};">${catLabel}:</strong> ${catText || '정보 없음'}</div>`;
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
    if (isCeltic) addCelticAnalysis(resultsContainer, cards);

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

function addCelticAnalysis(container, cards) {
    const section = document.createElement('div');
    section.className = 'world-summary-container';
    
    // Header
    section.innerHTML = `
        <h2 class="title-lg" style="text-align:left; margin-bottom:1rem; color: #d4af37; border-bottom: 1px solid rgba(212, 175, 55, 0.3); padding-bottom: 0.5rem; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);">켈틱 크로스(Celtic Cross) 예언적 통찰</h2>
        <p style="color: #aaa; margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.6;">단편적인 대답을 넘어, 하나의 질문을 둘러싼 '원인-상황-결과'의 거대한 운명적 굴레를 3개의 축으로 조망합니다.</p>
    `;

    // 1. The Core (1 & 2)
    let coreHTML = `
        <h3 style="color: #fff; margin-bottom: 1rem; border-left: 3px solid #d4af37; padding-left: 10px;">I. 운명의 수레바퀴 축 (The Core)</h3>
        <div class="world-summary-box" style="margin-bottom: 1.5rem; border: 1px solid rgba(212, 175, 55, 0.2); background: rgba(15, 10, 20, 0.7);">
            <p style="font-size: 0.9rem; color: #ccc; margin-bottom: 1rem;">현재 당신을 사로잡고 있는 가장 강력한 중심 에너지와 그것을 막아서는(혹은 교차하는) 도전 과제입니다.</p>
            <div style="font-size: 0.95rem; color: #fff; line-height: 1.8;">
                <strong style="color:var(--accent-gold);">현재 상황:</strong> [${cards[0].name.split(' (')[0]}]의 기운이 지배하고 있습니다.<br>
                <strong style="color:#e74c3c;">도전/교차:</strong> 그 위로 [${cards[1].name.split(' (')[0]}]의 힘이 덮어쓰여 갈등이나 역동을 일으킵니다.
            </div>
        </div>
    `;

    // 2. The Horizontal/Vertical Axes (3,4,5,6)
    let axisHTML = `
        <h3 style="color: #fff; margin-bottom: 1rem; border-left: 3px solid #d4af37; padding-left: 10px;">II. 시간과 무의식의 십자가</h3>
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
            <div class="world-summary-box" style="flex: 1; min-width: 250px; background: rgba(0,0,0,0.5);">
                <h4 style="color: #3498db; margin-bottom: 0.5rem;">무의식에서 의식으로 (수직)</h4>
                <p style="font-size: 0.85rem; color: #ccc; line-height: 1.6;">
                    당신의 근원적인 <strong>무의식([${cards[3].name.split(' (')[0]}])</strong>이 
                    어떻게 표면적인 <strong>목표/의식([${cards[2].name.split(' (')[0]}])</strong>으로 자라나고 있는지를 보여줍니다. 이상과 현실의 간극을 의미합니다.
                </p>
            </div>
            <div class="world-summary-box" style="flex: 1; min-width: 250px; background: rgba(0,0,0,0.5);">
                <h4 style="color: #f1c40f; margin-bottom: 0.5rem;">과거에서 미래로 (수평)</h4>
                <p style="font-size: 0.85rem; color: #ccc; line-height: 1.6;">
                    당신 등 뒤로 흩어지는 <strong>과거([${cards[4].name.split(' (')[0]}])</strong>의 여운이 
                    곧 다가올 <strong>미래([${cards[5].name.split(' (')[0]}])</strong>의 흐름에 어떤 방향성을 제시하고 있는지 보여줍니다.
                </p>
            </div>
        </div>
    `;

    // 3. The Staff (7,8,9,10)
    let staffHTML = `
        <h3 style="color: #fff; margin-bottom: 1rem; border-left: 3px solid #d4af37; padding-left: 10px;">III. 운명의 지팡이 (The Staff)</h3>
        <div class="world-summary-box" style="background: linear-gradient(135deg, rgba(20,15,25,0.8), rgba(10,5,15,0.9)); border: 1px solid rgba(212,175,55,0.3);">
            <p style="line-height: 1.8; color: #eee; font-size: 0.95rem;">
                당신의 질문은 스스로의 <strong>[${cards[6].name.split(' (')[0]}]</strong> 같은 태도와 
                주변 환경 <strong>[${cards[7].name.split(' (')[0]}]</strong>의 영향 사이에서 진동합니다.<br><br>
                당신이 깊이 품은 두려움 혹은 희망인 <strong>[${cards[8].name.split(' (')[0]}]</strong>을 넘어설 때, 
                마침내 우주가 제시하는 최종 결과 <strong>[${cards[9].name.split(' (')[0]}]</strong>의 문이 열릴 것입니다.
            </p>
            <div style="margin-top: 1.5rem; color: #d4af37; font-weight: 700; text-shadow: 0 0 10px rgba(212, 175, 55, 0.5); text-align: center;">
                "수레바퀴는 돌고, 십자가는 지시하며, 지팡이는 길을 엽니다."
            </div>
        </div>
    `;

    section.innerHTML += coreHTML + axisHTML + staffHTML;
    container.appendChild(section);
}

function getSefirotColor(idx) {
    const colors = ['#ffffff', '#999999', '#443322', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#e67e22', '#9b59b6', '#f39c12', '#555555'];
    return colors[idx];
}




function clearBoard(count) {
    let cards, prefix, boardId;
    if (count === 1 && currentMode === 'spread1') {
        cards = placedCards1; prefix = 's1slot'; boardId = 'spread1-board';
    } else if (count === 5 && currentMode === 'choice') {
        cards = placedCardsChoice; prefix = 'chslot'; boardId = 'choice-board';
    } else if (count === 3 && currentMode === 'spread3') {
        cards = placedCards3; prefix = 's3slot'; boardId = 'spread3-board';
    } else if (count === 12 && currentMode === 'relation') {
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
        let bgLayer = slot.querySelector('.slot-bg-layer');
        if (bgLayer) {
            bgLayer.style.backgroundImage = 'none';
            bgLayer.style.transform = 'none';
            bgLayer.style.opacity = '0';
        }
        slot.style.backgroundImage = 'none';
        
        slot.querySelector('.slot-content').innerHTML = '선택';
        slot.removeAttribute('data-active');
    });
    activateSlot(0);
    broadcastState();
}

function clearCurrentBoard() {
    if (currentMode === 'spread1') clearBoard(1);
    else if (currentMode === 'choice') clearBoard(5);
    else if (currentMode === 'spread3') clearBoard(3);
    else if (currentMode === 'tree') clearBoard(10);
    else if (currentMode === 'relation') clearBoard(12);
    else if (currentMode === 'celtic') clearBoard(10);
    else if (currentMode === 'hexa') clearBoard(7);
    else if (currentMode === 'zodiac') clearBoard(12);
    else clearBoard(4);
}

function filterCards() {
    const query = document.getElementById('universal-search').value.toLowerCase();
    const allCards = getActiveDeckCards();
    const filtered = allCards.filter(card => {
        const matchesQuery = card.name.toLowerCase().includes(query) ||
            (card.keywords && card.keywords.some(k => k.toLowerCase().includes(query)));
        const matchesSuit = currentFilter === 'all' || card.suit === currentFilter;
        return matchesQuery && matchesSuit;
    });
    setupGrid(filtered);
}

function setFilter(el, suit) {
    currentFilter = suit;
    document.querySelectorAll('#search-filters .suit-filter').forEach(btn => btn.classList.remove('active'));
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

function getMysticalAdvice(card) {
    if (!card.meanings) return "그대의 직관을 믿고 나아가십시오.";
    
    const isRev = card.isReversed || false;
    const mSet = isRev ? (card.meanings.reversed || card.meanings) : (card.meanings.upright || card.meanings);
    const rawAdvice = mSet.advice || "그대의 직관을 믿고 나아가십시오.";
    
    const intros = [
        "운명의 실타래가 당신에게 조용히 속삭입니다: ",
        "별들의 길을 가리키는 지혜의 등불은 이렇게 말합니다. ",
        "그대의 영혼이 간직한 신성한 계시를 경청하십시오. ",
        "심연에서 울려 퍼지는 지혜의 목소리가 들리나요? ",
        "우주의 섭리는 지금 이 순간 당신에게 일러줍니다. "
    ];
    const outros = [
        " 이 길의 끝에서 당신의 진정한 빛을 발견하게 될 것입니다.",
        " 그대의 직관이 가리키는 그곳으로 용기 있게 발을 내디디세요.",
        " 하늘은 스스로 돕는 자를 결코 외면하지 않습니다.",
        " 당신의 내면에는 이미 모든 해답이 깃들어 있습니다.",
        " 별들은 당신의 선택을 축복하고 있습니다."
    ];

    const pick = (arr) => arr[card.id % arr.length]; // Deterministic based on card ID for consistency
    const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];
    
    // For Major Arcana, make it even more grand
    if (card.suit === 'Major Arcana') {
        return `✦ ${pick(intros)} <strong>"${rawAdvice}"</strong> ${pickRandom(outros)} ✦`;
    }
    
    return `✧ ${rawAdvice} ${pickRandom(outros)} ✧`;
}

function changeModalTab(tab) {
    currentModalTab = tab;
    document.querySelectorAll('.modal-tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
    });
    if (currentModalCard && currentDeck === 'samla') {
        renderSamlaModalContent(currentModalCard, tab);
    }
}

function renderSamlaModalContent(card, tab) {
    const advContainer = document.getElementById('card-advanced-meanings');
    if (!advContainer) return;

    let html = '';
    
    // 1. 속성 뱃지들 (상시 표시)
    if (card.attributes) {
        const a = card.attributes;
        html += `
            <div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:1rem; padding:8px 12px; background:rgba(212,175,55,0.08); border-radius:8px; border:1px solid rgba(212,175,55,0.2); font-size:0.8rem;">
                <span style="color:#d4af37;">✦ 판정: <strong>${a.yes_no || '미상'}</strong></span>
                <span style="color:#aaa;">|</span>
                <span style="color:#e0e0e0;">속도: <strong>${a.speed || '보통'}</strong></span>
                <span style="color:#aaa;">|</span>
                <span style="color:#e0e0e0;">성향: <strong>${a.active_passive || '중립'}</strong></span>
                <span style="color:#aaa;">|</span>
                <span style="color:#e0e0e0;">오행: <strong>${a.element || '조화'}</strong></span>
            </div>
        `;
    }

    const formatSection = (title, icon, content, color = '#d4af37') => {
        if (!content) return '';
        return `
            <div style="margin-bottom:1.2rem; background:rgba(255,255,255,0.03); border-left:3px solid ${color}; padding:10px 14px; border-radius:4px;">
                <h4 style="color:${color}; margin:0 0 6px 0; font-size:0.95rem;">${icon} ${title}</h4>
                <div style="color:#ccc; font-size:0.88rem; line-height:1.7; white-space:pre-line;">${content}</div>
            </div>
        `;
    };

    if (tab === 'all') {
        if (card.character_desc) html += formatSection(`인물 해설 & MBTI (${card.mbti || ''})`, '🎭', card.character_desc, '#64b5f6');
        if (card.fandom_reading) html += formatSection('덕질 & 관계 해석', '💖', card.fandom_reading, '#f06292');
        if (card.real_reading) html += formatSection('현생운 (직장·학업·연애·금전)', '🌿', card.real_reading, '#81c784');
        if (card.gold_foil_point) html += formatSection('백자개 & 박 포인트 상징', '✨', card.gold_foil_point, '#ffd54f');
        if (card.meanings?.upright?.advice) html += formatSection('삼라만상 신성 조언', '🔮', card.meanings.upright.advice, '#ba68c8');
    } else if (tab === 'character') {
        if (card.character_desc) html += formatSection(`인물 해설 & MBTI (${card.mbti || ''})`, '🎭', card.character_desc, '#64b5f6');
        else html += `<p style="color:#888;">해당 카드의 인물 상세 정보가 없습니다.</p>`;
    } else if (tab === 'fandom') {
        if (card.fandom_reading) html += formatSection('덕질 & 관계 해석', '💖', card.fandom_reading, '#f06292');
        else html += `<p style="color:#888;">해당 카드의 덕질 해석 정보가 없습니다.</p>`;
    } else if (tab === 'real') {
        if (card.real_reading) html += formatSection('현생운 (직장·학업·연애·금전)', '🌿', card.real_reading, '#81c784');
        else html += `<p style="color:#888;">해당 카드의 현생운 정보가 없습니다.</p>`;
    } else if (tab === 'advice') {
        if (card.gold_foil_point) html += formatSection('백자개 & 박 포인트 상징', '✨', card.gold_foil_point, '#ffd54f');
        if (card.meanings?.upright?.advice) html += formatSection('삼라만상 신성 조언', '🔮', card.meanings.upright.advice, '#ba68c8');
    }

    advContainer.innerHTML = html;
}

function copyCardForLLM() {
    if (!currentModalCard) return;
    const c = currentModalCard;
    let text = `[타로 카드: ${c.name}]\n`;
    if (c.quote) text += `전언/명대사: "${c.quote}"\n`;
    if (c.keywords) text += `키워드: ${c.keywords.join(', ')}\n`;
    if (c.attributes) text += `속성: 판정(${c.attributes.yes_no}), 속도(${c.attributes.speed}), 성향(${c.attributes.active_passive}), 오행(${c.attributes.element})\n`;
    if (c.mbti) text += `MBTI: ${c.mbti}\n`;
    if (c.character_desc) text += `\n[인물 성향]\n${c.character_desc}\n`;
    if (c.fandom_reading) text += `\n[덕질/관계 리딩]\n${c.fandom_reading}\n`;
    if (c.real_reading) text += `\n[현생운 리딩]\n${c.real_reading}\n`;
    if (c.gold_foil_point) text += `\n[상징 및 박 포인트]\n${c.gold_foil_point}\n`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            alert(`"${c.name}" 카드의 상세 정보가 LLM 프롬프트용 텍스트로 클립보드에 복사되었습니다!`);
        }).catch(() => prompt("아래 텍스트를 복사하세요:", text));
    } else {
        prompt("아래 텍스트를 복사하세요:", text);
    }
}

function showInterpretation(card) {
    currentModalCard = card;
    const isRev = card.isReversed || false;
    const finalImg = card.image || `images/tarot_${card.id}.webp`;
    const imgEl = document.getElementById('modal-card-img');
    if (imgEl) {
        imgEl.style.backgroundImage = `url('${finalImg}')`;
        imgEl.style.transform = isRev ? 'rotate(180deg)' : 'none';
    }

    document.getElementById('card-suit-tag').textContent = card.suit === 'Major Arcana' ? '메이저' : card.suit;
    document.getElementById('card-name').textContent = card.name;
    document.getElementById('card-desc').textContent = card.description || '';

    const quoteBox = document.getElementById('card-quote-box');
    const modalTabContainer = document.getElementById('modal-tab-container');
    const copyLLMBtn = document.getElementById('btn-copy-llm');

    const keywordsList = document.getElementById('keywords-list');
    keywordsList.innerHTML = '';
    (card.keywords || []).forEach(keyword => {
        const tag = document.createElement('span');
        tag.className = 'keyword-tag';
        tag.textContent = keyword;
        keywordsList.appendChild(tag);
    });

    if (currentDeck === 'samla') {
        if (quoteBox) {
            quoteBox.textContent = card.quote ? `"${card.quote}"` : '';
            quoteBox.style.display = card.quote ? 'block' : 'none';
        }
        if (modalTabContainer) modalTabContainer.style.display = 'flex';
        if (copyLLMBtn) copyLLMBtn.style.display = 'inline-block';
        renderSamlaModalContent(card, currentModalTab);
    } else {
        if (quoteBox) quoteBox.style.display = 'none';
        if (modalTabContainer) modalTabContainer.style.display = 'none';
        if (copyLLMBtn) copyLLMBtn.style.display = 'none';

        const advContainer = document.getElementById('card-advanced-meanings');
        if (advContainer) {
            if (card.meanings) {
                const isRev = card.isReversed || false;
                const m = card.meanings;
                const mSet = isRev ? (m.reversed || m) : (m.upright || m);
                const mode = currentInterpretationMode;
                const refinedAdvice = getMysticalAdvice(card);
                
                let html = '';
                const wrap = (title, content, color, active) => `
                    <div style="margin-bottom: 0.8rem; padding: 0.5rem; border-radius: 6px; ${active ? `background:rgba(${color}, 0.15); border:1px solid rgba(${color}, 0.3);` : 'opacity: 0.6;'}">
                        <strong style="color:rgb(${color});">[${title}]</strong> ${content || '정보가 없습니다.'}
                    </div>`;

                if (mode === 'all' || mode === 'love') html += wrap('연애/관계', mSet.love, '255, 107, 107', mode === 'love');
                if (mode === 'all' || mode === 'career') html += wrap('직업/성취', mSet.career, '77, 168, 218', mode === 'career');
                if (mode === 'all' || mode === 'wealth') html += wrap('금전/재물', mSet.wealth || mSet.career, '241, 196, 15', mode === 'wealth');
                if (mode === 'all' || mode === 'health') html += wrap('건강/활력', mSet.health, '46, 204, 113', mode === 'health');
                
                if (mode === 'all' || mode === 'advice') {
                    html += `
                        <div style="background: rgba(46, 204, 113, ${mode === 'advice' ? '0.2' : '0.05'}); padding: 1rem; border-left: 4px solid #2ecc71; margin-top: 1rem; ${mode !== 'all' && mode !== 'advice' ? 'display:none;' : ''}">
                            <strong style="color:#2ecc71; display: block; margin-bottom: 0.4rem;">🔮 신성한 조언 (Oracle)</strong> 
                            <span style="color: #eee; line-height: 1.6;">${refinedAdvice}</span>
                        </div>
                    `;
                }
                
                advContainer.innerHTML = `
                    <div style="font-size: 0.95rem; margin-bottom: 1.5rem; color: #fff; background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2); padding: 1rem; border-radius: 8px;">
                        <div style="color: ${isRev ? '#e74c3c' : '#d4af37'}; font-weight: 800; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.5rem;">
                            ${isRev ? '역방향 (REVERSED)' : '정방향 (UPRIGHT)'} 상세 해석
                        </div>
                        <div style="line-height: 1.6;">${mSet.general || (isRev ? m.reversed : m.upright)}</div>
                    </div>
                    ${html}
                `;
            } else {
                advContainer.innerHTML = '';
            }
        }
    }

    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('full-analysis').classList.add('hidden');
    document.getElementById('interpretation').classList.remove('hidden');
}

function closeInterpretation() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeFullAnalysis() { document.getElementById('modal-overlay').classList.add('hidden'); }
function closeAllModals() { document.getElementById('modal-overlay').classList.add('hidden'); }

function showOBSGuide() {
    document.getElementById('obs-guide-modal').classList.remove('hidden');
}
function closeOBSGuide() {
    document.getElementById('obs-guide-modal').classList.add('hidden');
}

function copyOBSUrl() {
    const rawKey = (typeof currentOBSKey !== 'undefined' && currentOBSKey) ? currentOBSKey : (document.getElementById('obs-secret') ? document.getElementById('obs-secret').value.trim() : 'default');
    const secretKey = rawKey !== '' ? rawKey : 'default';
    
    const origin = window.location.origin + '/';
    const obsUrl = `${origin}obs.html?key=${encodeURIComponent(secretKey)}`;
    
    navigator.clipboard.writeText(obsUrl).then(() => {
        alert("OBS 브라우저 소스용 URL이 복사되었습니다!\nOBS에 붙여넣기 하세요.\n\n복사된 주소:\n" + obsUrl);
    }).catch(err => {
        alert("클립보드 복사에 실패했습니다. 권한을 확인해주세요.");
    });
}

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
    if (mode === 'spread1') cards = placedCards1;
    else if (mode === 'choice') cards = placedCardsChoice;
    else if (mode === 'tree') cards = placedCardsTree;
    else if (mode === 'relation') cards = placedCardsRelation;
    else if (mode === 'celtic') cards = placedCardsCeltic;
    else if (mode === 'hexa') cards = placedCardsHexa;
    else if (mode === 'zodiac') cards = placedCardsZodiac;
    else if (mode === 'spread3') cards = placedCards3;
    else cards = placedCards4;

    const card = cards ? cards[index] : null;
    const topBar = document.getElementById('top-interpretation');

    if (card && card.name) {
        topBar.classList.remove('hidden');
        topBar.innerHTML = `
            <div class="top-inter-inner">
                <span class="top-tag">✧ AETHER SYNC ✧</span>
                <span class="top-name">${card.name}</span>
                <span class="top-desc">${card.description || ''}</span>
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
    const allCards = getActiveDeckCards();
    const randomIndex = Math.floor(Math.random() * allCards.length);
    showInterpretation(allCards[randomIndex]);
}

function fillSpreadRandomly() {
    let cards, max;
    if (currentMode === 'spread1') {
        cards = placedCards1; max = 1;
    } else if (currentMode === 'choice') {
        cards = placedCardsChoice; max = 5;
    } else if (currentMode === 'spread3') {
        cards = placedCards3; max = 3;
    } else if (currentMode === 'tree') {
        cards = placedCardsTree; max = 10;
    } else if (currentMode === 'relation') {
        cards = placedCardsRelation; max = 12;
    } else if (currentMode === 'celtic') {
        cards = placedCardsCeltic; max = 10;
    } else if (currentMode === 'hexa') {
        cards = placedCardsHexa; max = 7;
    } else if (currentMode === 'zodiac') {
        cards = placedCardsZodiac; max = 12;
    } else {
        cards = placedCards4; max = 4;
    }

    let placedIds = cards.filter(c => c).map(c => c.id);

    const isReversedAllowed = document.getElementById('toggle-reversed')?.checked || false;
    const isMinorAllowed = document.getElementById('toggle-minor')?.checked !== false;
    const allCards = getActiveDeckCards();

    for (let i = 0; i < max; i++) {
        if (!cards[i]) {
            let availableCards = allCards.filter(c => {
                // 이미 뽑힌 카드 제외
                if (placedIds.includes(c.id)) return false;
                // 마이너 제외 옵션 체크
                if (!isMinorAllowed && c.suit !== "Major Arcana") return false;
                return true;
            });

            if (availableCards.length === 0) break;

            const randomIndex = Math.floor(Math.random() * availableCards.length);
            const card = availableCards[randomIndex];
            placedIds.push(card.id);

            activeSlotIndex = i;
            // 50% chance for reverse only if allowed
            const isReversed = isReversedAllowed ? (Math.random() < 0.5) : false;
            placeCardInSlot(card, isReversed);
        }
    }
}

function updateSpreadGuide(mode) {
    const guideBox = document.getElementById('spread-guide-box');
    const titleEl = document.getElementById('spread-guide-title');
    const descEl = document.getElementById('spread-guide-desc');

    if (!guideBox || !titleEl || !descEl) return;

    const guides = {
        'spread1': {
            title: "원 카드 (One Card)",
            desc: "직관적이고 명쾌한 단 한 장의 메시지. 하루의 운세나 긴급한 질문의 본질을 즉시 파악합니다."
        },
        'choice': {
            title: "양자택일 (Two Choices)",
            desc: "두 가지 선택지 사이에서 갈등할 때, A와 B 각각의 흐름과 최종 결말을 비교 분석합니다."
        },
        'spread': {
            title: "포 카드 (Four Card)",
            desc: "과거, 현재, 미래, 그리고 문제를 해결할 조언까지 입체적으로 파악합니다."
        },
        'spread3': {
            title: "쓰리 카드 (Three Card)",
            desc: "과거, 현재, 미래의 흐름을 군더더기 없이 명확하게 꿰뚫어 봅니다."
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
        },
        'search': {
            title: "타로 카드 도감 (전체 카드 보기)",
            desc: "78장의 타로 카드 일러스트와 상징 체계, 정·역방향 해설을 열람합니다. 카드를 클릭하면 상세 해설 모달이 열립니다."
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
const ctx = canvas ? canvas.getContext('2d') : null;
let particles = [];
let w = window.innerWidth, h = window.innerHeight;

function initCanvas() {
    if (!canvas) return;
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
}

if (canvas) {
    window.addEventListener('resize', initCanvas);
    initCanvas();
}

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
        if (!ctx) return;
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
    if (!canvas || !ctx) return;
    // Increase density slightly for a richer galaxy (divide by 6000 instead of 10000)
    const count = Math.floor((w * h) / 6000);
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    if (!canvas || !ctx) return;
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
    requestAnimationFrame(syncAllLines);
});

// --- DYNAMIC SVG LINE SYSTEM ---
function syncAllLines() {
    if (currentMode === 'spread1') drawOneCardLines();
    else if (currentMode === 'tree') drawTreeLines();
    else if (currentMode === 'relation') drawRelationLines();
    else if (currentMode === 'spread') drawFourCardLines();
    else if (currentMode === 'spread3') drawThreeCardLines();
    else if (currentMode === 'choice') drawChoiceLines();
    else if (currentMode === 'zodiac') drawZodiacLines();
    else if (currentMode === 'celtic') drawCelticLines();
}

function getSlotCenter(id, mode) {
    const slot = document.getElementById(id);
    if (!slot) return null;
    
    let svgContainer;
    if (mode === 'spread1') svgContainer = document.querySelector('#spread1-board .spread1-bg-overlay svg');
    else if (mode === 'tree') svgContainer = document.querySelector('#tree-board .tree-bg-overlay svg');
    else if (mode === 'relation') svgContainer = document.querySelector('#relation-board .relation-bg-overlay svg');
    else if (mode === 'choice') svgContainer = document.querySelector('#choice-board .choice-bg-overlay svg');
    else if (mode === 'spread') svgContainer = document.querySelector('#spread-board .spread-bg-overlay svg');
    else if (mode === 'spread3') svgContainer = document.querySelector('#spread3-board .spread3-bg-overlay svg');
    else if (mode === 'zodiac') svgContainer = document.querySelector('#zodiac-board .zodiac-bg-overlay svg');
    else if (mode === 'celtic') svgContainer = document.querySelector('#celtic-board .celtic-bg-overlay svg');
    
    if (!svgContainer) return null;

    const rect = slot.getBoundingClientRect();
    const svgRect = svgContainer.getBoundingClientRect();
    if (!svgRect.width || !svgRect.height) return null;
    
    const x = (rect.left + rect.width / 2) - svgRect.left;
    const y = (rect.top + rect.height / 2) - svgRect.top;

    const viewBox = svgContainer.viewBox.baseVal;
    if (viewBox.width > 0 && viewBox.height > 0) {
        return {
            x: x * (viewBox.width / svgRect.width),
            y: y * (viewBox.height / svgRect.height)
        };
    }
    return { x, y };
}

function drawOneCardLines() {
    const container = document.querySelector('#spread1-board .spread1-bg-overlay svg');
    if (!container) return;
    const p = getSlotCenter('s1slot-0', 'spread1') || { x: 300, y: 200 };
    let html = `<defs>
        <filter id="spread1-star-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
    </defs>
    <!-- Celestial Oracle Compass -->
    <circle cx="${p.x}" cy="${p.y}" r="170" fill="none" stroke="rgba(212,175,55,0.2)" stroke-width="1.2" stroke-dasharray="6,4" />
    <circle cx="${p.x}" cy="${p.y}" r="130" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1.2" />
    <circle cx="${p.x}" cy="${p.y}" r="75" fill="none" stroke="rgba(212,175,55,0.4)" stroke-width="1.5" stroke-dasharray="4,4" filter="url(#spread1-star-glow)" />
    <!-- Crosshairs & Cardinal Rays -->
    <line x1="${p.x - 190}" y1="${p.y}" x2="${p.x + 190}" y2="${p.y}" stroke="rgba(212,175,55,0.25)" stroke-width="1" />
    <line x1="${p.x}" y1="${p.y - 180}" x2="${p.x}" y2="${p.y + 180}" stroke="rgba(212,175,55,0.25)" stroke-width="1" />
    <circle cx="${p.x}" cy="${p.y}" r="6" fill="#f1c40f" filter="url(#spread1-star-glow)" />
    <circle cx="${p.x - 130}" cy="${p.y}" r="3" fill="#d4af37" filter="url(#spread1-star-glow)" />
    <circle cx="${p.x + 130}" cy="${p.y}" r="3" fill="#d4af37" filter="url(#spread1-star-glow)" />
    <circle cx="${p.x}" cy="${p.y - 130}" r="3" fill="#d4af37" filter="url(#spread1-star-glow)" />
    <circle cx="${p.x}" cy="${p.y + 130}" r="3" fill="#d4af37" filter="url(#spread1-star-glow)" />`;
    container.innerHTML = html;
}

function drawChoiceLines() {
    const container = document.querySelector('#choice-board .choice-bg-overlay svg');
    if (!container) return;
    const connections = [[0, 1], [1, 2], [0, 3], [3, 4]];
    let html = `<defs><filter id="choice-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    
    // Balance arcs between Path A and Path B
    const p1 = getSlotCenter('chslot-1', 'choice');
    const p3 = getSlotCenter('chslot-3', 'choice');
    if (p1 && p3) {
        html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p3.x}" y2="${p3.y}" stroke="rgba(212,175,55,0.25)" stroke-width="1.2" stroke-dasharray="4,4" />`;
    }
    const p2 = getSlotCenter('chslot-2', 'choice');
    const p4 = getSlotCenter('chslot-4', 'choice');
    if (p2 && p4) {
        html += `<line x1="${p2.x}" y1="${p2.y}" x2="${p4.x}" y2="${p4.y}" stroke="rgba(212,175,55,0.25)" stroke-width="1.2" stroke-dasharray="4,4" />`;
    }

    connections.forEach(([s, e]) => {
        const pt1 = getSlotCenter(`chslot-${s}`, 'choice');
        const pt2 = getSlotCenter(`chslot-${e}`, 'choice');
        if (pt1 && pt2) html += `<line x1="${pt1.x}" y1="${pt1.y}" x2="${pt2.x}" y2="${pt2.y}" stroke="rgba(212,175,55,0.85)" stroke-width="1.8" />`;
    });
    for(let i=0; i<5; i++) {
        const p = getSlotCenter(`chslot-${i}`, 'choice');
        if (p) {
            html += `<circle cx="${p.x}" cy="${p.y}" r="26" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#choice-star-glow)" />`;
        }
    }
    container.innerHTML = html;
}

function drawTreeLines() {
    const container = document.querySelector('#tree-board .tree-bg-overlay svg');
    if (!container) return;
    const connections = [[0, 1], [0, 2], [1, 2], [1, 3], [1, 5], [2, 4], [2, 5], [3, 4], [3, 5], [3, 6], [4, 5], [4, 7], [5, 6], [5, 7], [5, 8], [6, 7], [6, 8], [7, 8], [8, 9], [0, 5], [5, 9]];
    let html = `<defs><filter id="tree-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    connections.forEach(([s, e]) => {
        const p1 = getSlotCenter(`tslot-${s}`, 'tree');
        const p2 = getSlotCenter(`tslot-${e}`, 'tree');
        if (p1 && p2) html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(212,175,55,0.85)" stroke-width="1.8" />`;
    });
    for(let i=0; i<10; i++) {
        const p = getSlotCenter(`tslot-${i}`, 'tree');
        if (p) {
            html += `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#tree-star-glow)" />`;
        }
    }
    container.innerHTML = html;
}

function drawRelationLines() {
    const container = document.querySelector('#relation-board .relation-bg-overlay svg');
    if (!container) return;
    
    const connections = [
        [0, 2], [1, 2],                            // Base to Reason (1, 2 -> 3)
        [2, 3], [3, 5], [5, 4], [4, 10], [10, 11], // Spine: 3-4-6-5-11-12
        [4, 6], [4, 7],                            // Hearts: 5 to 7, 8
        [10, 6], [10, 7], [10, 8], [10, 9],        // Result: 11 to 7, 8, 9, 10
        [6, 8], [7, 9]                             // Flow: 7-9, 8-10
    ];

    let html = `<defs><filter id="star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    connections.forEach(([s, e]) => {
        const p1 = getSlotCenter(`rslot-${s}`, 'relation');
        const p2 = getSlotCenter(`rslot-${e}`, 'relation');
        if (p1 && p2) html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(212,175,55,0.85)" stroke-width="1.8" />`;
    });
    for(let i=0; i<12; i++) {
        const p = getSlotCenter(`rslot-${i}`, 'relation');
        if (p) {
            html += `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#star-glow)" />`;
        }
    }
    container.innerHTML = html;
}

function drawFourCardLines() {
    const container = document.querySelector('#spread-board .spread-bg-overlay svg');
    if (!container) return;
    let html = `<defs><filter id="standard-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    let centers = [];
    for(let i=0; i<4; i++) {
        const p = getSlotCenter(`slot-${i}`, 'spread');
        if (p) {
            centers.push(p);
            html += `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#standard-star-glow)" />`;
        }
    }
    if (centers.length >= 4) {
        // Continuous timeline connecting line
        for (let i = 0; i < centers.length - 1; i++) {
            html += `<line x1="${centers[i].x}" y1="${centers[i].y}" x2="${centers[i+1].x}" y2="${centers[i+1].y}" stroke="rgba(212,175,55,0.85)" stroke-width="1.8" />`;
        }
    }
    container.innerHTML = html;
}

function drawThreeCardLines() {
    const container = document.querySelector('#spread3-board .spread3-bg-overlay svg');
    if (!container) return;
    let html = `<defs><filter id="spread3-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    let centers = [];
    for(let i=0; i<3; i++) {
        const p = getSlotCenter(`s3slot-${i}`, 'spread3');
        if (p) {
            centers.push(p);
            html += `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#spread3-star-glow)" />`;
        }
    }
    if (centers.length >= 3) {
        for (let i = 0; i < centers.length - 1; i++) {
            html += `<line x1="${centers[i].x}" y1="${centers[i].y}" x2="${centers[i+1].x}" y2="${centers[i+1].y}" stroke="rgba(212,175,55,0.85)" stroke-width="1.8" />`;
        }
    }
    container.innerHTML = html;
}

function drawZodiacLines() {
    const container = document.querySelector('#zodiac-board .zodiac-bg-overlay svg');
    if (!container) return;
    let html = `<defs><filter id="zodiac-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    
    // Circle connections
    for(let i=0; i<12; i++) {
        const p1 = getSlotCenter(`zslot-${i}`, 'zodiac');
        const p2 = getSlotCenter(`zslot-${(i+1)%12}`, 'zodiac');
        if (p1 && p2) html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(212,175,55,0.4)" stroke-width="1.2" />`;
    }
    
    // Spokes to Center (500, 500)
    for(let i=0; i<12; i++) {
        const p = getSlotCenter(`zslot-${i}`, 'zodiac');
        if (p) html += `<line x1="500" y1="500" x2="${p.x}" y2="${p.y}" stroke="rgba(212,175,55,0.2)" stroke-width="1" />`;
    }
    
    // Center glow
    html += `<circle cx="500" cy="500" r="10" fill="#d4af37" filter="url(#zodiac-star-glow)" opacity="1" />`;
    html += `<circle cx="500" cy="500" r="4" fill="#d4af37" filter="url(#zodiac-star-glow)" />`;

    for(let i=0; i<12; i++) {
        const p = getSlotCenter(`zslot-${i}`, 'zodiac');
        if (p) {
            html += `<circle cx="${p.x}" cy="${p.y}" r="22" fill="none" stroke="rgba(212,175,55,0.25)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#zodiac-star-glow)" />`;
        }
    }
    container.innerHTML = html;
}

function drawCelticLines() {
    const container = document.querySelector('#celtic-board .celtic-bg-overlay svg');
    if (!container) return;
    
    // Connections: IDs cover 0-9 for 10 cards
    const connections = [
        [2, 0], [0, 3], [4, 0], [0, 5], // Main Cross: Goal-Present-Basis and Past-Present-Future
        [6, 7], [7, 8], [8, 9]         // Staff Vertical: Self-Env-Hopes-Outcome
    ];
    
    let html = `<defs><filter id="celtic-star-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" result="blur" /><feComposite in="SourceGraphic" in2="blur" operator="over" /></filter></defs>`;
    
    // Sacred Celtic concentric circle at center cross
    const pCenter = getSlotCenter('cslot-0', 'celtic');
    if (pCenter) {
        html += `<circle cx="${pCenter.x}" cy="${pCenter.y}" r="160" fill="none" stroke="rgba(212,175,55,0.35)" stroke-width="1.5" stroke-dasharray="6,4" />`;
        html += `<circle cx="${pCenter.x}" cy="${pCenter.y}" r="110" fill="none" stroke="rgba(212,175,55,0.25)" stroke-width="1.2" />`;
    }

    connections.forEach(([s, e]) => {
        const p1 = getSlotCenter(`cslot-${s}`, 'celtic');
        const p2 = getSlotCenter(`cslot-${e}`, 'celtic');
        if (p1 && p2) html += `<line x1="${p1.x}" y1="${p1.y}" x2="${p2.x}" y2="${p2.y}" stroke="rgba(212,175,55,0.9)" stroke-width="2" />`;
    });
    
    for(let i=0; i<10; i++) {
        const p = getSlotCenter(`cslot-${i}`, 'celtic');
        if(p) {
            html += `<circle cx="${p.x}" cy="${p.y}" r="24" fill="none" stroke="rgba(212,175,55,0.3)" stroke-width="1" stroke-dasharray="3,3" />`;
            html += `<circle cx="${p.x}" cy="${p.y}" r="4.5" fill="#f1c40f" filter="url(#celtic-star-glow)" />`;
        }
    }
    
    container.innerHTML = html;
}

// Dynamic Sync on Window Resize
window.addEventListener('resize', syncAllLines);

// OBS Multi-Broadcast
const obsChannel = new BroadcastChannel('tarot_obs_channel');
function broadcastState(isManual = false) {
    let cards;
    if (currentMode === 'spread1') cards = placedCards1;
    else if (currentMode === 'choice') cards = placedCardsChoice;
    else if (currentMode === 'spread3') cards = placedCards3;
    else if (currentMode === 'tree') cards = placedCardsTree;
    else if (currentMode === 'relation') cards = placedCardsRelation;
    else if (currentMode === 'celtic') cards = placedCardsCeltic;
    else if (currentMode === 'hexa') cards = placedCardsHexa;
    else if (currentMode === 'zodiac') cards = placedCardsZodiac;
    else cards = placedCards4;

    const secretKey = currentOBSKey || (document.getElementById('obs-secret') ? document.getElementById('obs-secret').value : 'default');
    const payload = { type: 'update_spread', mode: currentMode, cards: cards, key: secretKey, deck: currentDeck };
    obsChannel.postMessage(payload);
    sendSupabaseRealtime(payload);
    fetch('/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => {});

    if (isManual) {
        showBroadcastToast("✨ OBS 방송 화면으로 최신 상태가 송출되었습니다!");
    }
}

function showBroadcastToast(msg) {
    let toast = document.getElementById('broadcast-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'broadcast-toast';
        toast.style.cssText = "position:fixed;bottom:25px;right:25px;background:rgba(10,10,15,0.92);border:1px solid #2ecc71;color:#2ecc71;padding:0.7rem 1.2rem;border-radius:10px;font-size:0.9rem;font-weight:700;z-index:99999;box-shadow:0 8px 25px rgba(0,0,0,0.6);transition:all 0.3s ease;pointer-events:none;opacity:0;transform:translateY(10px);";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(10px)';
    }, 2200);
}

function clearOBSBoard() {
    const secretKey = currentOBSKey || (document.getElementById('obs-secret') ? document.getElementById('obs-secret').value : 'default');
    const payload = { type: 'update_spread', mode: currentMode, cards: [], key: secretKey, deck: currentDeck };
    obsChannel.postMessage(payload);
    sendSupabaseRealtime(payload);
    fetch('/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).catch(e => {});
}

// ============================================================
// 📸 고화질 스프레드 이미지 내보내기 & 클립보드 복사
// ============================================================
async function generateSpreadCanvas() {
    if (typeof html2canvas === 'undefined') {
        throw new Error("html2canvas 라이브러리를 불러오지 못했습니다.");
    }

    const activeSection = document.querySelector('main > section:not(.hidden)');
    if (!activeSection) {
        throw new Error("활성화된 스프레드를 찾을 수 없습니다.");
    }

    // 캡처할 타깃: section 내부의 래퍼 또는 section 자체
    const targetEl = activeSection.querySelector('.board-wrapper, .celtic-container, .relation-container, .tree-container, .hexa-container, .zodiac-container, .board-slots-3, .board-slots-4') || activeSection;

    // 캡처 시 하단 버튼바(.board-actions) 일시 숨김
    const actions = activeSection.querySelectorAll('.board-actions');
    const prevActionsDisplay = [];
    actions.forEach(a => {
        prevActionsDisplay.push(a.style.display);
        a.style.display = 'none';
    });

    try {
        const canvas = await html2canvas(targetEl, {
            backgroundColor: '#07070b',
            scale: 2, // 2x 레티나 초고해상도
            useCORS: true,
            logging: false,
            width: targetEl.offsetWidth,
            height: targetEl.offsetHeight
        });
        return canvas;
    } finally {
        // 버튼바 복구
        actions.forEach((a, idx) => {
            a.style.display = prevActionsDisplay[idx] || '';
        });
    }
}

async function saveSpreadAsImage() {
    const btn = document.querySelector('.btn-save-img');
    const originalText = btn ? btn.textContent : '';
    if (btn) {
        btn.textContent = '⏳ 이미지 생성 중...';
        btn.disabled = true;
    }

    try {
        const canvas = await generateSpreadCanvas();
        const link = document.createElement('a');
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
        link.download = `타로_${currentMode}_${dateStr}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        
        if (btn) btn.textContent = '✨ 저장 완료!';
        setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
    } catch (err) {
        console.error("이미지 저장 실패:", err);
        alert("이미지 저장 중 오류가 발생했습니다: " + err.message);
        if (btn) btn.textContent = originalText;
    } finally {
        if (btn) btn.disabled = false;
    }
}

async function copySpreadToClipboard() {
    const btn = document.querySelector('.btn-copy-img');
    const originalText = btn ? btn.textContent : '';
    if (btn) {
        btn.textContent = '⏳ 복사 중...';
        btn.disabled = true;
    }

    try {
        const canvas = await generateSpreadCanvas();
        canvas.toBlob(async (blob) => {
            try {
                if (navigator.clipboard && navigator.clipboard.write) {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    if (btn) btn.textContent = '✨ 복사 완료!';
                    setTimeout(() => { if (btn) btn.textContent = originalText; }, 2000);
                } else {
                    alert("이 브라우저에서는 클립보드 이미지 복사를 지원하지 않습니다. [이미지 저장] 버튼을 이용해 주세요!");
                    if (btn) btn.textContent = originalText;
                }
            } catch (clipErr) {
                console.error("클립보드 쓰기 실패:", clipErr);
                alert("클립보드 복사에 실패했습니다. [이미지 저장] 버튼을 이용해 주세요!");
                if (btn) btn.textContent = originalText;
            } finally {
                if (btn) btn.disabled = false;
            }
        }, 'image/png');
    } catch (err) {
        console.error("이미지 복사 실패:", err);
        alert("이미지 생성 중 오류가 발생했습니다: " + err.message);
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
}

// Global window exposure
window.saveSpreadAsImage = saveSpreadAsImage;
window.copySpreadToClipboard = copySpreadToClipboard;


