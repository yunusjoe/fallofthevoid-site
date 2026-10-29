/**
 * ============================================================================
 * Fall of the Void - Ana JavaScript Yöneticisi (main.js)
 * Mimari: Saf JS (Vanilla), Veri Odaklı (Data-Driven), Sıfır innerHTML Güvenliği
 * ============================================================================
 */

// Uygulama Durumu (State)
const AppState = {
    currentLang: 'tr',
    siteData: null,
    langData: null,
    patchesData: null,
    charactersData: null
};

// Yerel Depolama (localStorage) Anahtarı
const STORAGE_LANG_KEY = 'fotv_selected_language';

/**
 * Sayfa yüklendiğinde çalışacak ana başlatıcı fonksiyon
 */
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

/**
 * Tüm veri akışını ve olay dinleyicilerini başlatan fonksiyon
 */
async function initApp() {
    try {
        // 1. Kullanıcının daha önceki dil tercihini yükle (yoksa varsayılan TR)
        loadSavedLanguage();

        // 2. Tüm JSON veri dosyalarını eşzamanlı olarak çek (Fetch)
        await loadAllData();

        // 3. Etkileşim dinleyicilerini kur (Dil butonu, mobil menü vb.)
        setupEventListeners();

        // 4. Arayüzü verilerle doldur
        renderInterface();
    } catch (error) {
        console.error('Uygulama başlatılırken bir hata oluştu:', error);
    }
}

/**
 * localStorage üzerinden kaydedilmiş dili okur
 */
function loadSavedLanguage() {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang === 'tr' || savedLang === 'en') {
        AppState.currentLang = savedLang;
    } else {
        AppState.currentLang = 'tr';
    }
}

/**
 * data/ dizini altındaki tüm JSON dosyalarını asenkron olarak yükler
 */
async function loadAllData() {
    // Tüm istekleri paralel olarak başlatıyoruz (performans kazanımı)
    const [siteRes, langRes, patchesRes, charactersRes] = await Promise.all([
        fetch('data/site.json'),
        fetch('data/lang.json'),
        fetch('data/patches.json'),
        fetch('data/characters.json')
    ]);

    // Yanıt durumlarını kontrol et
    if (!siteRes.ok || !langRes.ok || !patchesRes.ok || !charactersRes.ok) {
        throw new Error('JSON veri dosyalarından biri veya birkaçı yüklenemedi.');
    }

    AppState.siteData = await siteRes.json();
    AppState.langData = await langRes.json();
    AppState.patchesData = await patchesRes.json();
    AppState.charactersData = await charactersRes.json();
}

/**
 * Buton tıklamaları ve mobil menü etkileşimlerini ayarlar
 */
function setupEventListeners() {
    // Dil değiştirme butonu
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Mobil menü açma/kapama butonu
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const siteNav = document.getElementById('site-nav');

    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            siteNav.classList.toggle('active');
        });

        // Menüdeki bir bağlantıya tıklandığında mobil menüyü otomatik kapat
        const navLinks = siteNav.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                siteNav.classList.remove('active');
            });
        });
    }
}

/**
 * Dil değişimini tetikler (TR <-> EN)
 */
function toggleLanguage() {
    AppState.currentLang = AppState.currentLang === 'tr' ? 'en' : 'tr';
    localStorage.setItem(STORAGE_LANG_KEY, AppState.currentLang);
    renderInterface();
}

/**
 * Tüm sayfayı güncel veriler ve seçili dil doğrultusunda yeniden çizer
 */
function renderInterface() {
    updateLanguageButton();
    renderStaticI18nTexts();
    renderSiteMetadata();
    renderCharacters();
    renderPatches();
    renderSocialLinks();
}

/**
 * Dil butonunun üzerinde bir sonraki dili gösterecek şekilde metni günceller
 */
function updateLanguageButton() {
    const langBtn = document.getElementById('lang-btn');
    if (!langBtn) return;
    // Kullanıcıya geçebileceği diğer dili gösteriyoruz (TR seçiliyse "EN", EN seçiliyse "TR")
    langBtn.textContent = AppState.currentLang === 'tr' ? 'EN' : 'TR';
}

/**
 * data-i18n niteliği taşıyan tüm statik arayüz metinlerini güvenli şekilde günceller
 */
function renderStaticI18nTexts() {
    const { langData, currentLang } = AppState;
    if (!langData) return;

    // Sayfa başlığını (Title) güncelle
    if (langData.site_title && langData.site_title[currentLang]) {
        document.title = langData.site_title[currentLang];
    }

    // HTML içinde data-i18n etiketi olan her alanı textContent ile güncelle
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (langData[key] && langData[key][currentLang]) {
            element.textContent = langData[key][currentLang];
        }
    });
}

/**
 * site.json dosyasından gelen genel oyun bilgilerini ekrana basar
 */
function renderSiteMetadata() {
    const { siteData } = AppState;
    if (!siteData) return;

    // Logo ve Hero başlığı
    const siteLogo = document.getElementById('site-logo');
    if (siteLogo) siteLogo.textContent = siteData.gameTitle;

    const heroGameTitle = document.getElementById('hero-game-title');
    if (heroGameTitle) heroGameTitle.textContent = siteData.gameTitle;

    // İletişim e-posta adresi
    const contactEmail = document.getElementById('contact-email');
    if (contactEmail && siteData.contactEmail) {
        contactEmail.textContent = siteData.contactEmail;
        contactEmail.href = `mailto:${siteData.contactEmail}`;
    }

    // Alt bilgi (Footer) telif metni
    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright) {
        const currentYear = new Date().getFullYear();
        footerCopyright.textContent = `© ${currentYear} ${siteData.gameTitle} (${siteData.domain})`;
    }
}

/**
 * Karakterleri characters.json üzerinden tamamen güvenli DOM metodlarıyla oluşturur (innerHTML YOKTUR)
 */
function renderCharacters() {
    const container = document.getElementById('characters-container');
    if (!container || !AppState.charactersData) return;

    // Konteyneri temizle
    clearElement(container);

    const maxStat = (AppState.siteData && AppState.siteData.settings && AppState.siteData.settings.maxStatValue) || 100;
    const { currentLang, langData } = AppState;

    AppState.charactersData.forEach(character => {
        // Karakter Ana Kartı
        const card = document.createElement('article');
        card.className = 'character-card';

        // Kart Başlığı (İsim ve Rol)
        const header = document.createElement('div');
        header.className = 'character-header';

        const nameEl = document.createElement('h3');
        nameEl.className = 'character-name';
        nameEl.textContent = character.name;

        const roleEl = document.createElement('span');
        roleEl.className = 'character-role';
        roleEl.textContent = character.role[currentLang] || '';

        header.appendChild(nameEl);
        header.appendChild(roleEl);
        card.appendChild(header);

        // Karakter Biyografisi / Hikayesi
        const bioEl = document.createElement('p');
        bioEl.className = 'character-bio';
        bioEl.textContent = character.bio[currentLang] || '';
        card.appendChild(bioEl);

        // Stat Çubukları Bölümü
        if (Array.isArray(character.stats)) {
            const statsContainer = document.createElement('div');
            statsContainer.className = 'character-stats';

            character.stats.forEach(stat => {
                const statItem = document.createElement('div');
                statItem.className = 'stat-item';

                // Stat Başlığı (Etiket ve Sayısal Değer)
                const statHeader = document.createElement('div');
                statHeader.className = 'stat-header';

                const labelEl = document.createElement('span');
                labelEl.className = 'stat-label';
                const labelText = (langData[stat.key] && langData[stat.key][currentLang]) || stat.key;
                labelEl.textContent = labelText;

                const valueEl = document.createElement('span');
                valueEl.className = 'stat-value';
                valueEl.textContent = String(stat.value);

                statHeader.appendChild(labelEl);
                statHeader.appendChild(valueEl);
                statItem.appendChild(statHeader);

                // Stat İlerleme Çubuğu (Bar Track & Fill)
                const barTrack = document.createElement('div');
                barTrack.className = 'stat-bar-track';

                const barFill = document.createElement('div');
                barFill.className = 'stat-bar-fill';
                const percentage = Math.min(100, Math.max(0, (stat.value / maxStat) * 100));
                barFill.style.width = `${percentage}%`;

                barTrack.appendChild(barFill);
                statItem.appendChild(barTrack);

                statsContainer.appendChild(statItem);
            });

            card.appendChild(statsContainer);
        }

        container.appendChild(card);
    });
}

/**
 * Yama notlarını patches.json üzerinden textContent ve güvenli DOM ile ekrana basar
 */
function renderPatches() {
    const container = document.getElementById('patches-container');
    if (!container || !AppState.patchesData) return;

    clearElement(container);

    const { currentLang, langData } = AppState;

    AppState.patchesData.forEach(patch => {
        const patchCard = document.createElement('article');
        patchCard.className = 'patch-card';

        // Yama Başlık Alanı (Sürüm, Ad ve Tarih)
        const patchHeader = document.createElement('div');
        patchHeader.className = 'patch-header';

        const titleArea = document.createElement('div');
        titleArea.className = 'patch-title-area';

        const versionEl = document.createElement('span');
        versionEl.className = 'patch-version';
        versionEl.textContent = patch.version;

        const nameEl = document.createElement('span');
        nameEl.className = 'patch-name';
        nameEl.textContent = patch.name[currentLang] || '';

        titleArea.appendChild(versionEl);
        titleArea.appendChild(nameEl);
        patchHeader.appendChild(titleArea);

        const dateEl = document.createElement('time');
        dateEl.className = 'patch-date';
        dateEl.textContent = patch.date;
        patchHeader.appendChild(dateEl);

        patchCard.appendChild(patchHeader);

        // Değişiklik Maddeleri Listesi
        if (Array.isArray(patch.changes)) {
            const listEl = document.createElement('ul');
            listEl.className = 'patch-notes-list';

            patch.changes.forEach(change => {
                const itemEl = document.createElement('li');
                itemEl.className = 'patch-note-item';

                // Değişiklik Türü Etiketi (Yeni, Düzeltme, Denge)
                const tagEl = document.createElement('span');
                tagEl.className = `patch-tag patch-tag-${change.type}`;
                const tagKey = `tag_${change.type}`;
                tagEl.textContent = (langData[tagKey] && langData[tagKey][currentLang]) || change.type;

                // Değişiklik Açıklaması
                const textEl = document.createElement('span');
                textEl.className = 'patch-note-text';
                textEl.textContent = change.text[currentLang] || '';

                itemEl.appendChild(tagEl);
                itemEl.appendChild(textEl);
                listEl.appendChild(itemEl);
            });

            patchCard.appendChild(listEl);
        }

        container.appendChild(patchCard);
    });
}

/**
 * site.json içindeki sosyal bağlantıları ekrana basar
 */
function renderSocialLinks() {
    const container = document.getElementById('social-links-container');
    if (!container || !AppState.siteData || !Array.isArray(AppState.siteData.socialLinks)) return;

    clearElement(container);

    AppState.siteData.socialLinks.forEach(link => {
        const linkBtn = document.createElement('a');
        linkBtn.className = 'social-btn';
        linkBtn.href = link.url;
        linkBtn.target = '_blank';
        linkBtn.rel = 'noopener noreferrer';
        linkBtn.textContent = link.name;

        container.appendChild(linkBtn);
    });
}

/**
 * Bir elementin içindeki tüm alt düğümleri güvenli bir şekilde siler
 * @param {HTMLElement} element 
 */
function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}
