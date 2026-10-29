/**
 * ============================================================================
 * Fall of the Void - Ana JavaScript Yöneticisi (main.js)
 * Mimari: Saf JS (Vanilla), Veri Odaklı (Data-Driven), Sıfır innerHTML Güvenliği
 * ============================================================================
 */

// Uygulama Durumu (State)
const AppState = {
    currentLang: 'tr',
    selectedClassId: null,
    selectedSkillSlot: 'Q',
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
        loadSavedLanguage();
        await loadAllData();
        
        // İlk sınıfı varsayılan seç
        if (AppState.charactersData && AppState.charactersData.length > 0) {
            AppState.selectedClassId = AppState.charactersData[0].id;
        }

        setupEventListeners();
        setupMediaEvents();
        renderInterface();
    } catch (error) {
        console.error('Uygulama başlatılırken bir hata oluştu:', error);
    }
}

function loadSavedLanguage() {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang === 'tr' || savedLang === 'en') {
        AppState.currentLang = savedLang;
    } else {
        AppState.currentLang = 'tr';
    }
}

async function loadAllData() {
    const [siteRes, langRes, patchesRes, charactersRes] = await Promise.all([
        fetch('data/site.json?v=20261030-media', { cache: 'no-cache' }),
        fetch('data/lang.json?v=20261030-media', { cache: 'no-cache' }),
        fetch('data/patches.json', { cache: 'no-cache' }),
        fetch('data/characters.json', { cache: 'no-cache' })
    ]);

    if (!siteRes.ok || !langRes.ok || !patchesRes.ok || !charactersRes.ok) {
        throw new Error('JSON veri dosyalarından biri veya birkaçı yüklenemedi.');
    }

    AppState.siteData = await siteRes.json();
    AppState.langData = await langRes.json();
    AppState.patchesData = await patchesRes.json();
    AppState.charactersData = await charactersRes.json();
}

function setupEventListeners() {
    const langBtn = document.getElementById('lang-btn');
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    const menuToggle = document.getElementById('mobile-menu-toggle');
    const siteNav = document.getElementById('site-nav');

    if (menuToggle && siteNav) {
        menuToggle.addEventListener('click', () => {
            siteNav.classList.toggle('active');
        });

        const navLinks = siteNav.querySelectorAll('.nav-links a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                siteNav.classList.remove('active');
            });
        });
    }
}

function toggleLanguage() {
    AppState.currentLang = AppState.currentLang === 'tr' ? 'en' : 'tr';
    localStorage.setItem(STORAGE_LANG_KEY, AppState.currentLang);
    renderInterface();
}

function renderInterface() {
    document.documentElement.lang = AppState.currentLang;
    updateLanguageButton();
    renderStaticI18nTexts();
    renderSiteMetadata();
    renderMedia();
    renderClasses();
    renderPatches();
    renderSocialLinks();
}

function updateLanguageButton() {
    const langBtn = document.getElementById('lang-btn');
    if (!langBtn) return;
    langBtn.textContent = AppState.currentLang === 'tr' ? 'EN' : 'TR';
}

function renderStaticI18nTexts() {
    const { langData, currentLang } = AppState;
    if (!langData) return;

    if (langData.site_title && langData.site_title[currentLang]) {
        document.title = langData.site_title[currentLang];
    }

    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (langData[key] && langData[key][currentLang]) {
            element.textContent = langData[key][currentLang];
        }
    });
}

function renderSiteMetadata() {
    const { siteData } = AppState;
    if (!siteData) return;

    const siteLogo = document.getElementById('site-logo');
    if (siteLogo) document.getElementById('brand-title').textContent = siteData.gameTitle;

    const heroGameTitle = document.getElementById('hero-game-title');
    if (heroGameTitle) heroGameTitle.textContent = siteData.gameTitle;

    const contactEmail = document.getElementById('contact-email');
    if (contactEmail && siteData.contactEmail) {
        contactEmail.textContent = siteData.contactEmail;
        contactEmail.href = `mailto:${siteData.contactEmail}`;
    }

    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright) {
        const currentYear = new Date().getFullYear();
        footerCopyright.textContent = `© ${currentYear} ${siteData.gameTitle} (${siteData.domain})`;
    }
}

/**
 * Sınıfları ve Yetenek Vitrinini Güvenli DOM ile Çizer (innerHTML YOKTUR)
 */
function renderClasses() {
    const container = document.getElementById('characters-container');
    if (!container || !AppState.charactersData || AppState.charactersData.length === 0) return;

    const previousScroll = container.querySelector('.class-selector-bar')?.scrollLeft || 0;
    clearElement(container);

    const { currentLang, langData, selectedClassId } = AppState;
    const currentClass = AppState.charactersData.find(c => c.id === selectedClassId) || AppState.charactersData[0];

    // 1. Üst Sınıf Seçim Butonları (Grid / Bar)
    const selectorBar = document.createElement('div');
    selectorBar.className = 'class-selector-bar';

    AppState.charactersData.forEach(cls => {
        const tabBtn = document.createElement('button');
        tabBtn.className = `class-tab-btn ${cls.id === currentClass.id ? 'active' : ''}`;
        tabBtn.type = 'button';
        tabBtn.setAttribute('aria-pressed', String(cls.id === currentClass.id));

        if (cls.icon) {
            const iconImg = document.createElement('img');
            iconImg.className = 'class-tab-icon';
            iconImg.src = cls.icon;
            iconImg.alt = cls.name[currentLang] || cls.id;
            tabBtn.appendChild(iconImg);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'class-tab-name';
        nameSpan.textContent = cls.name[currentLang] || cls.id;
        tabBtn.appendChild(nameSpan);

        tabBtn.addEventListener('click', () => {
            AppState.selectedClassId = cls.id;
            AppState.selectedSkillSlot = 'Q';
            renderClasses();
        });

        selectorBar.appendChild(tabBtn);
    });

    container.appendChild(selectorBar);
    selectorBar.scrollLeft = previousScroll;

    // 2. Seçili Sınıfın Sinematik Vitrin Alanı
    const showcase = document.createElement('div');
    showcase.className = 'class-showcase';

    // Sol Panel: Sınıf Genel Özeti & Statlar
    const leftPanel = document.createElement('div');
    leftPanel.className = 'class-info-panel';

    const classHeader = document.createElement('div');
    classHeader.className = 'class-detail-header';

    if (currentClass.icon) {
        const mainIcon = document.createElement('img');
        mainIcon.className = 'class-main-avatar';
        mainIcon.src = currentClass.icon;
        mainIcon.alt = currentClass.name[currentLang];
        classHeader.appendChild(mainIcon);
    }

    const titleWrap = document.createElement('div');
    titleWrap.className = 'class-title-wrap';

    const classNameEl = document.createElement('h3');
    classNameEl.className = 'class-title-text';
    classNameEl.textContent = currentClass.name[currentLang];

    const classBadge = document.createElement('span');
    classBadge.className = 'class-role-badge';
    classBadge.textContent = langData.class_badge[currentLang];

    titleWrap.appendChild(classNameEl);
    titleWrap.appendChild(classBadge);
    classHeader.appendChild(titleWrap);
    leftPanel.appendChild(classHeader);

    // Açıklama
    const descEl = document.createElement('p');
    descEl.className = 'class-detail-desc';
    descEl.textContent = currentClass.description[currentLang] || '';
    leftPanel.appendChild(descEl);

    // Stat Göstergeleri
    const statsContainer = document.createElement('div');
    statsContainer.className = 'class-stat-list';

    const statConfig = AppState.siteData.settings.classStats.map(stat => ({
        key: stat.label,
        val: currentClass.stats[stat.field],
        max: stat.max,
        unit: stat.unit
    }));

    statConfig.forEach(st => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';

        const sHeader = document.createElement('div');
        sHeader.className = 'stat-header';

        const label = document.createElement('span');
        label.className = 'stat-label';
        label.textContent = (langData[st.key] && langData[st.key][currentLang]) || st.key;

        const val = document.createElement('span');
        val.className = 'stat-value';
        val.textContent = `${new Intl.NumberFormat(currentLang).format(st.val)}${st.unit}`;

        sHeader.appendChild(label);
        sHeader.appendChild(val);
        statItem.appendChild(sHeader);

        const track = document.createElement('div');
        track.className = 'stat-bar-track';

        const fill = document.createElement('div');
        fill.className = 'stat-bar-fill';
        const percent = Math.min(100, Math.max(0, (st.val / st.max) * 100));
        fill.style.width = `${percent}%`;

        track.appendChild(fill);
        statItem.appendChild(track);
        statsContainer.appendChild(statItem);
    });

    leftPanel.appendChild(statsContainer);
    const statsNote = document.createElement('p');
    statsNote.className = 'class-data-note';
    statsNote.textContent = langData.class_stats_note[currentLang];
    leftPanel.appendChild(statsNote);
    showcase.appendChild(leftPanel);

    // Sağ Panel: Yetenek Seti (Q, W, E, R & Pasif)
    const rightPanel = document.createElement('div');
    rightPanel.className = 'class-skills-panel';

    const skillsTitle = document.createElement('h4');
    skillsTitle.className = 'skills-section-heading';
    skillsTitle.textContent = (langData.skills_title && langData.skills_title[currentLang]) || 'Yetenek Seti';
    rightPanel.appendChild(skillsTitle);

    // Tüm yetenekleri topla (Pasif + Aktifler)
    const allSkills = [];
    if (currentClass.passive) {
        allSkills.push({
            ...currentClass.passive,
            slot: 'P',
            slotLabel: (langData.passive_label && langData.passive_label[currentLang]) || 'Pasif'
        });
    }
    if (Array.isArray(currentClass.skills)) {
        currentClass.skills.forEach(s => {
            allSkills.push({
                ...s,
                slotLabel: langData.active_skill_label[currentLang]
            });
        });
    }

    // Yetenek Butonları Şeridi
    const skillButtonsBar = document.createElement('div');
    skillButtonsBar.className = 'skills-button-bar';

    let activeSkill = allSkills.find(s => s.slot === AppState.selectedSkillSlot) || allSkills[0];

    allSkills.forEach(skill => {
        const sBtn = document.createElement('button');
        sBtn.className = `skill-select-btn ${skill.slot === activeSkill.slot ? 'active' : ''}`;
        sBtn.type = 'button';
        sBtn.setAttribute('aria-pressed', String(skill.slot === activeSkill.slot));
        sBtn.setAttribute('aria-label', `${skill.slot}: ${skill.name[currentLang]}`);
        sBtn.title = skill.name[currentLang];

        if (skill.icon) {
            const sImg = document.createElement('img');
            sImg.className = 'skill-btn-icon';
            sImg.src = skill.icon;
            sImg.alt = skill.name[currentLang] || skill.slot;
            sBtn.appendChild(sImg);
        }

        const sKeyBadge = document.createElement('span');
        sKeyBadge.className = 'skill-slot-badge';
        sKeyBadge.textContent = skill.slot;
        sBtn.appendChild(sKeyBadge);

        sBtn.addEventListener('click', () => {
            AppState.selectedSkillSlot = skill.slot;
            renderClasses();
        });

        skillButtonsBar.appendChild(sBtn);
    });

    rightPanel.appendChild(skillButtonsBar);

    // Seçili Yetenek Detay Kutusu
    if (activeSkill) {
        const skillDetailBox = document.createElement('div');
        skillDetailBox.className = 'skill-detail-box';

        const sHeader = document.createElement('div');
        sHeader.className = 'skill-box-header';

        if (activeSkill.icon) {
            const bigSkillImg = document.createElement('img');
            bigSkillImg.className = 'skill-big-avatar';
            bigSkillImg.src = activeSkill.icon;
            bigSkillImg.alt = activeSkill.name[currentLang];
            sHeader.appendChild(bigSkillImg);
        }

        const sTextWrap = document.createElement('div');
        sTextWrap.className = 'skill-name-wrap';

        const sName = document.createElement('h5');
        sName.className = 'skill-name-text';
        sName.textContent = activeSkill.name[currentLang] || activeSkill.slot;

        const sSlotName = document.createElement('span');
        sSlotName.className = 'skill-type-pill';
        sSlotName.textContent = `${activeSkill.slot} - ${activeSkill.slotLabel || ''}`;

        sTextWrap.appendChild(sName);
        sTextWrap.appendChild(sSlotName);
        sHeader.appendChild(sTextWrap);
        skillDetailBox.appendChild(sHeader);

        const sDesc = document.createElement('p');
        sDesc.className = 'skill-box-desc';
        sDesc.textContent = activeSkill.description[currentLang];
        skillDetailBox.appendChild(sDesc);

        rightPanel.appendChild(skillDetailBox);
    }

    const scalingNote = document.createElement('p');
    scalingNote.className = 'class-data-note';
    scalingNote.textContent = langData.skill_scaling_note[currentLang];
    rightPanel.appendChild(scalingNote);

    showcase.appendChild(rightPanel);
    container.appendChild(showcase);
}

function renderPatches() {
    const container = document.getElementById('patches-container');
    if (!container || !AppState.patchesData) return;

    clearElement(container);

    const { currentLang, langData } = AppState;

    AppState.patchesData.forEach(patch => {
        const patchCard = document.createElement('article');
        patchCard.className = 'patch-card';

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

        if (Array.isArray(patch.changes)) {
            const listEl = document.createElement('ul');
            listEl.className = 'patch-notes-list';

            patch.changes.forEach(change => {
                const itemEl = document.createElement('li');
                itemEl.className = 'patch-note-item';

                const tagEl = document.createElement('span');
                tagEl.className = `patch-tag patch-tag-${change.type}`;
                const tagKey = `tag_${change.type}`;
                tagEl.textContent = (langData[tagKey] && langData[tagKey][currentLang]) || change.type;

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

function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}


// Oynanış medyası site.json üzerinden yönetilir; açıklamalar güvenli metin olarak yazılır.
let galleryIndex = 0;
function mediaLabel(key) { return AppState.langData[key][AppState.currentLang]; }

function renderMedia() {
    const { siteData, currentLang } = AppState;
    const media = siteData.media;
    document.getElementById('brand-logo').src = siteData.branding.logo;
    document.getElementById('site-favicon').href = siteData.branding.favicon;
    document.getElementById('site-touch-icon').href = siteData.branding.touchIcon;
    document.getElementById('hero-image').src = media.heroImage;
    document.getElementById('trailer-poster').src = media.poster;
    document.getElementById('trailer-duration').textContent = media.duration;
    document.getElementById('steam-wishlist').href = siteData.store.wishlist;
    document.getElementById('steam-demo').href = siteData.store.demo;
    document.getElementById('trailer-trigger').setAttribute('aria-label', mediaLabel('trailer_watch'));
    document.getElementById('media-close').textContent = mediaLabel('media_close');
    document.getElementById('gallery-previous').textContent = mediaLabel('media_previous');
    document.getElementById('gallery-next').textContent = mediaLabel('media_next');
    document.getElementById('mobile-menu-toggle').setAttribute('aria-label', mediaLabel('menu_toggle'));
    document.getElementById('lang-btn').setAttribute('aria-label', mediaLabel('language_toggle'));
    const gallery = document.getElementById('gameplay-gallery');
    clearElement(gallery);
    media.gallery.forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'gallery-card';
        button.setAttribute('aria-label', mediaLabel('media_open') + ': ' + item.caption[currentLang]);
        const image = document.createElement('img');
        image.src = item.thumbnail; image.alt = item.alt[currentLang];
        image.loading = 'lazy'; image.decoding = 'async'; image.width = 960; image.height = 540;
        const caption = document.createElement('span'); caption.textContent = item.caption[currentLang];
        button.append(image, caption);
        button.addEventListener('click', () => openGallery(index));
        gallery.appendChild(button);
    });
}

function openGallery(index) {
    galleryIndex = (index + AppState.siteData.media.gallery.length) % AppState.siteData.media.gallery.length;
    const item = AppState.siteData.media.gallery[galleryIndex];
    const player = document.getElementById('montage-player'); player.pause(); player.hidden = true;
    const image = document.getElementById('gallery-full-image');
    image.src = item.full; image.alt = item.alt[AppState.currentLang]; image.hidden = false;
    document.getElementById('media-dialog-title').textContent = item.caption[AppState.currentLang];
    document.getElementById('gallery-controls').hidden = false;
    document.getElementById('gallery-counter').textContent = `${galleryIndex + 1} / ${AppState.siteData.media.gallery.length}`;
    document.getElementById('media-error').hidden = true;
    showMediaDialog();
}

function showMediaDialog() {
    const dialog = document.getElementById('media-dialog');
    if (!dialog.open) { dialog.showModal(); document.body.classList.add('media-open'); }
}

function setupMediaEvents() {
    const dialog = document.getElementById('media-dialog');
    const player = document.getElementById('montage-player');
    document.getElementById('trailer-trigger').addEventListener('click', () => {
        document.getElementById('gallery-full-image').hidden = true;
        document.getElementById('gallery-controls').hidden = true;
        document.getElementById('media-error').hidden = true;
        document.getElementById('media-dialog-title').textContent = mediaLabel('media_video_title');
        player.hidden = false; player.poster = AppState.siteData.media.poster;
        if (!player.getAttribute('src')) player.src = AppState.siteData.media.video;
        showMediaDialog();
        // Sesli oynatma yalnız ziyaretçinin bu düğmeye basmasıyla başlar.
        player.play().catch(() => { /* Tarayıcı izin vermezse yerel video kontrolleri kullanılabilir. */ });
    });
    player.addEventListener('error', () => { const error = document.getElementById('media-error'); error.textContent = mediaLabel('media_error'); error.hidden = false; });
    document.getElementById('media-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { player.pause(); document.body.classList.remove('media-open'); });
    dialog.addEventListener('click', event => { const bounds = dialog.getBoundingClientRect(); if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close(); });
    document.getElementById('gallery-previous').addEventListener('click', () => openGallery(galleryIndex - 1));
    document.getElementById('gallery-next').addEventListener('click', () => openGallery(galleryIndex + 1));
    dialog.addEventListener('keydown', event => {
        if (document.getElementById('gallery-controls').hidden) return;
        if (event.key === 'ArrowLeft') { event.preventDefault(); openGallery(galleryIndex - 1); }
        if (event.key === 'ArrowRight') { event.preventDefault(); openGallery(galleryIndex + 1); }
    });
}
