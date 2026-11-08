/**
 * ============================================================================
 * Fall of the Void - Ana JavaScript Yöneticisi (main.js)
 * Mimari: Saf JS (Vanilla), Veri Odaklı (Data-Driven), Sıfır innerHTML Güvenliği
 * ============================================================================
 */

// Uygulama Durumu (State)
const AppState = {
    currentLang: null,
    selectedClassId: null,
    selectedSkillSlot: 'Q',
    triggerSkillCast: false,
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
        await loadAllData();
        loadSavedLanguage();
        
        // İlk sınıfı varsayılan seç
        if (AppState.charactersData && AppState.charactersData.length > 0) {
            AppState.selectedClassId = AppState.charactersData[0].id;
        }

        setupEventListeners();
        setupMediaEvents();
        renderInterface();
        setupVisualEffects();
        setupAnalytics();
    } catch (error) {
        console.error('Uygulama başlatılırken bir hata oluştu:', error);
    }
}

// Yalnızca canlı alan adında çalışır; yerel önizlemeler istatistiğe karışmaz.
// siteToken, Cloudflare'ın herkese açık ölçüm kimliğidir; hesap erişim anahtarı değildir.
function setupAnalytics() {
    const analytics = AppState.siteData.analytics;
    if (!analytics?.enabled || !analytics.hostnames?.includes(window.location.hostname)) return;
    if (document.getElementById('cloudflare-web-analytics')) return;

    const beacon = document.createElement('script');
    beacon.id = 'cloudflare-web-analytics';
    beacon.type = 'module';
    beacon.src = analytics.scriptUrl;
    beacon.dataset.cfBeacon = JSON.stringify({ token: analytics.siteToken });
    document.body.appendChild(beacon);
}

function loadSavedLanguage() {
    const savedLang = localStorage.getItem(STORAGE_LANG_KEY);
    if (savedLang === 'tr' || savedLang === 'en') {
        AppState.currentLang = savedLang;
    } else {
        AppState.currentLang = AppState.siteData.settings.defaultLanguage;
    }
}

async function loadAllData() {
    const [siteRes, langRes, patchesRes, charactersRes] = await Promise.all([
        fetch('data/site.json?v=20261109-crimson3', { cache: 'no-cache' }),
        fetch('data/lang.json?v=20261109-crimson3', { cache: 'no-cache' }),
        fetch('data/patches.json?v=20261109-crimson3', { cache: 'no-cache' }),
        fetch('data/characters.json?v=20261109-crimson3', { cache: 'no-cache' })
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
    renderFeatures();
    renderMedia();
    renderClasses();
    renderRequirements();
    renderPatches();
    renderSocialLinks();
    // Dil değişiminde yeniden çizilen kartlar da giriş animasyonuna dahil edilir.
    if (typeof refreshReveals === 'function') refreshReveals();
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

    // Sınıfa özel vurgu tonu: sıra numarası ve JSON'daki ton ayarlarından üretilir.
    const fx = AppState.siteData.settings.effects;
    if (fx) {
        const classIndex = AppState.charactersData.indexOf(currentClass);
        showcase.style.setProperty('--class-hue', String((fx.classHueStart + classIndex * fx.classHueStep) % 360));
    }

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

    statConfig.forEach((st, idx) => {
        const statItem = document.createElement('div');
        statItem.className = 'stat-item';

        const sHeader = document.createElement('div');
        sHeader.className = 'stat-header';

        const label = document.createElement('span');
        label.className = 'stat-label';
        label.textContent = (langData[st.key] && langData[st.key][currentLang]) || st.key;

        const val = document.createElement('span');
        val.className = 'stat-value';
        val.dataset.targetVal = String(st.val);
        val.dataset.unit = st.unit;
        val.textContent = `0${st.unit}`;

        sHeader.appendChild(label);
        sHeader.appendChild(val);
        statItem.appendChild(sHeader);

        const track = document.createElement('div');
        track.className = 'stat-bar-track';

        const fill = document.createElement('div');
        fill.className = 'stat-bar-fill';
        const percent = Math.min(100, Math.max(0, (st.val / st.max) * 100));
        const staggerMs = (fx && fx.statStaggerMs) ? fx.statStaggerMs : 70;
        fill.style.width = '0%';
        fill.dataset.targetWidth = `${percent}%`;
        fill.dataset.delayMs = String(idx * staggerMs);
        fill.style.setProperty('--stat-delay', `${idx * staggerMs}ms`);
        if (percent <= 0) {
            fill.style.setProperty('--stat-tip-opacity', '0');
        }

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

    // Seçili Yetenek Detay Kutusu Referansları (Q-W-E-R değişiminde tüm sınıfı yeniden çizmemek için)
    const skillDetailBox = document.createElement('div');
    skillDetailBox.className = 'skill-detail-box';

    const sHeader = document.createElement('div');
    sHeader.className = 'skill-box-header';

    const bigSkillImg = document.createElement('img');
    bigSkillImg.className = 'skill-big-avatar';
    sHeader.appendChild(bigSkillImg);

    const sTextWrap = document.createElement('div');
    sTextWrap.className = 'skill-name-wrap';

    const sName = document.createElement('h5');
    sName.className = 'skill-name-text';

    const sSlotName = document.createElement('span');
    sSlotName.className = 'skill-type-pill';

    sTextWrap.appendChild(sName);
    sTextWrap.appendChild(sSlotName);
    sHeader.appendChild(sTextWrap);
    skillDetailBox.appendChild(sHeader);

    const sDesc = document.createElement('p');
    sDesc.className = 'skill-box-desc';
    skillDetailBox.appendChild(sDesc);

    const applySkillToBox = (skillObj, animateCast) => {
        if (!skillObj) return;
        AppState.selectedSkillSlot = skillObj.slot;

        skillButtonsBar.querySelectorAll('.skill-select-btn').forEach(btn => {
            const isMatch = btn.dataset.slot === skillObj.slot;
            btn.classList.toggle('active', isMatch);
            btn.setAttribute('aria-pressed', String(isMatch));
        });

        if (skillObj.icon) {
            bigSkillImg.src = skillObj.icon;
            bigSkillImg.alt = skillObj.name[currentLang] || skillObj.slot;
            bigSkillImg.hidden = false;
        } else {
            bigSkillImg.hidden = true;
        }

        sName.textContent = skillObj.name[currentLang] || skillObj.slot;
        sSlotName.textContent = `${skillObj.slot} — ${skillObj.slotLabel || ''}`;
        sDesc.textContent = skillObj.description[currentLang] || '';

        if (animateCast) {
            skillDetailBox.classList.remove('skill-cast-active');
            void skillDetailBox.offsetWidth;
            skillDetailBox.classList.add('skill-cast-active');
        }
    };

    allSkills.forEach(skill => {
        const sBtn = document.createElement('button');
        sBtn.className = `skill-select-btn ${skill.slot === activeSkill.slot ? 'active' : ''}`;
        sBtn.type = 'button';
        sBtn.dataset.slot = skill.slot;
        sBtn.setAttribute('aria-pressed', String(skill.slot === activeSkill.slot));
        sBtn.setAttribute('aria-label', `${skill.slot}: ${skill.name[currentLang]}`);
        sBtn.title = `${skill.slot} — ${skill.name[currentLang]}`;

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
            applySkillToBox(skill, true);
        });

        skillButtonsBar.appendChild(sBtn);
    });

    rightPanel.appendChild(skillButtonsBar);

    if (activeSkill) {
        applySkillToBox(activeSkill, AppState.triggerSkillCast);
        AppState.triggerSkillCast = false;
        rightPanel.appendChild(skillDetailBox);
    }

    // Klavyeden P / Q / W / E / R basıldığında da aktif sınıfta yetenek geçişi yapılabilsin
    AppState.selectSkillByKey = slotKey => {
        const found = allSkills.find(s => s.slot.toUpperCase() === slotKey.toUpperCase());
        if (found) applySkillToBox(found, true);
    };

    const scalingNote = document.createElement('p');
    scalingNote.className = 'class-data-note';
    scalingNote.textContent = langData.skill_scaling_note[currentLang];
    rightPanel.appendChild(scalingNote);

    showcase.appendChild(rightPanel);
    container.appendChild(showcase);

    // Stat çubuklarını ve sayılarını görünür olduğunda sıfırdan hedefe doldur
    triggerOrObserveClassStats(showcase);
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
    // Aynı oyun görseli sayfa boyunca sabit arka plan olarak da kullanılır (CSS değişkeni).
    document.documentElement.style.setProperty('--page-bg-image', 'url(' + new URL(media.heroImage, document.baseURI).href + ')');
    const trailerPoster = document.getElementById('trailer-poster');
    if (trailerPoster) trailerPoster.src = media.poster;
    const trailerDuration = document.getElementById('trailer-duration');
    if (trailerDuration) trailerDuration.textContent = media.duration;
    document.getElementById('steam-wishlist').href = siteData.store.wishlist;
    const steamDemo = document.getElementById('steam-demo');
    if (steamDemo && siteData.store.demo) steamDemo.href = siteData.store.demo;
    const ctaWishlist = document.getElementById('cta-wishlist');
    if (ctaWishlist) ctaWishlist.href = siteData.store.wishlist;
    const ctaDemo = document.getElementById('cta-demo');
    if (ctaDemo && siteData.store.demo) ctaDemo.href = siteData.store.demo;
    const trailerTrigger = document.getElementById('trailer-trigger');
    if (trailerTrigger) trailerTrigger.setAttribute('aria-label', mediaLabel('trailer_watch'));
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
    const trailerTrigger = document.getElementById('trailer-trigger');
    if (trailerTrigger) {
        trailerTrigger.addEventListener('click', () => {
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
    }
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


/**
 * Steam Temel Özelliklerini (Core Features) Güvenli DOM ile Çizer (innerHTML YOKTUR)
 */
function renderFeatures() {
    const container = document.getElementById('features-container');
    if (!container || !AppState.siteData?.features) return;

    clearElement(container);
    const { currentLang, langData } = AppState;

    AppState.siteData.features.forEach(feat => {
        const card = document.createElement('article');
        card.className = 'feature-card';

        // Video / Poster Alanı
        const mediaWrap = document.createElement('div');
        mediaWrap.className = 'feature-media';

        const video = document.createElement('video');
        video.className = 'feature-video';
        video.autoplay = true;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.preload = 'none';
        video.poster = feat.poster;

        const source = document.createElement('source');
        source.src = feat.video;
        source.type = 'video/mp4';
        video.appendChild(source);

        mediaWrap.appendChild(video);

        // İçerik Alanı
        const content = document.createElement('div');
        content.className = 'feature-content';

        const header = document.createElement('div');
        header.className = 'feature-card-header';

        const iconSpan = document.createElement('span');
        iconSpan.className = 'feature-icon';
        iconSpan.textContent = feat.icon;

        const title = document.createElement('h3');
        title.className = 'feature-title';
        title.textContent = langData[feat.titleKey]?.[currentLang] || '';

        header.append(iconSpan, title);

        const desc = document.createElement('p');
        desc.className = 'feature-desc';
        desc.textContent = langData[feat.descKey]?.[currentLang] || '';

        content.append(header, desc);
        card.append(mediaWrap, content);
        container.appendChild(card);
    });
}

/**
 * Steam Sistem Gereksinimlerini Güvenli DOM ile Çizer (innerHTML YOKTUR)
 */
function renderRequirements() {
    const container = document.getElementById('requirements-container');
    if (!container || !AppState.siteData?.systemRequirements) return;

    clearElement(container);
    const { currentLang, langData } = AppState;
    const reqs = AppState.siteData.systemRequirements;

    const tiers = [
        { key: 'minimum', titleKey: 'req_tab_min', data: reqs.minimum },
        { key: 'recommended', titleKey: 'req_tab_rec', data: reqs.recommended }
    ];

    const fields = [
        { labelKey: 'req_label_os', prop: 'os' },
        { labelKey: 'req_label_processor', prop: 'processor' },
        { labelKey: 'req_label_memory', prop: 'memory' },
        { labelKey: 'req_label_graphics', prop: 'graphics' },
        { labelKey: 'req_label_directx', prop: 'directx' },
        { labelKey: 'req_label_storage', prop: 'storage' },
        { labelKey: 'req_label_notes', prop: 'notesKey', isI18n: true }
    ];

    tiers.forEach(tier => {
        const card = document.createElement('div');
        card.className = `requirements-card req-card-${tier.key}`;

        const cardHeader = document.createElement('div');
        cardHeader.className = 'req-card-header';

        const cardTitle = document.createElement('h3');
        cardTitle.className = 'req-card-title';
        cardTitle.textContent = langData[tier.titleKey]?.[currentLang] || tier.key;

        const badge = document.createElement('span');
        badge.className = `req-badge req-badge-${tier.key}`;
        badge.textContent = tier.key === 'minimum' ? '1080p @ 30 FPS' : '1080p @ 60 FPS+';

        cardHeader.append(cardTitle, badge);
        card.appendChild(cardHeader);

        const list = document.createElement('ul');
        list.className = 'req-list';

        fields.forEach(field => {
            const item = document.createElement('li');
            item.className = 'req-item';

            const label = document.createElement('span');
            label.className = 'req-label';
            label.textContent = langData[field.labelKey]?.[currentLang] || field.labelKey;

            const val = document.createElement('span');
            val.className = 'req-value';
            if (field.isI18n) {
                const noteKey = tier.data[field.prop];
                val.textContent = langData[noteKey]?.[currentLang] || noteKey;
            } else {
                val.textContent = tier.data[field.prop];
            }

            item.append(label, val);
            list.appendChild(item);
        });

        card.appendChild(list);
        container.appendChild(card);
    });
}


/* ==========================================================================
   Görsel Efektler: parçacıklar, parallax, scroll animasyonları, eğilme, nav
   Tüm sayısal ayarlar data/site.json > settings.effects içinden okunur.
   ========================================================================== */
const FxState = {
    revealObserver: null,
    reducedMotion: false,
    tiltEl: null,
    tiltFrame: 0,
    tiltX: 0,
    tiltY: 0,
    scrollFrame: 0,
    scrolled: false,
    heroBackdrop: null,
    heroHeight: 0
};

// Kartlar ve bölüm başlıkları scroll ile görünür olur (selector -> stagger grubu).
const REVEAL_SELECTORS = '.section-header, .media-heading, .feature-card, .gallery-card, .class-selector-bar, .class-showcase, .lore-card, .cta-banner-inner, .requirements-card, .patch-card, .contact-card';
const TILT_SELECTORS = '.feature-card, .gallery-card, .requirements-card';

function setupVisualEffects() {
    const fx = AppState.siteData?.settings?.effects;
    if (!fx) return;

    FxState.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    setupHeaderAndHeroScroll(fx);
    setupActiveNav();
    setupRandomBackground();
    setupVoidCursor(fx);

    if (FxState.reducedMotion) return;

    createVoidParticles(fx);
    setupRevealObserver(fx);
}

// Hero içine, ayarlardaki sayı kadar süzülen void parçacığı üretir (tek seferlik DOM, sonra sadece CSS).
function createVoidParticles(fx) {
    const hero = document.getElementById('hero');
    if (!hero || hero.querySelector('.void-particles')) return;

    const layer = document.createElement('div');
    layer.className = 'void-particles';
    layer.setAttribute('aria-hidden', 'true');

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < fx.particleCount; i++) {
        const p = document.createElement('span');
        p.className = 'void-particle';
        const size = fx.particleMinSize + Math.random() * (fx.particleMaxSize - fx.particleMinSize);
        const duration = fx.particleMinDuration + Math.random() * (fx.particleMaxDuration - fx.particleMinDuration);
        p.style.setProperty('--p-left', `${Math.random() * 100}%`);
        p.style.setProperty('--p-size', `${size}px`);
        p.style.setProperty('--p-duration', `${duration}s`);
        p.style.setProperty('--p-delay', `${-Math.random() * duration}s`);
        p.style.setProperty('--p-drift', `${(Math.random() * 2 - 1) * fx.particleMaxDrift}px`);
        fragment.appendChild(p);
    }
    layer.appendChild(fragment);
    // Hero overlay'in altında, içerik üstünde kalacak şekilde backdrop'tan sonra eklenir.
    hero.insertBefore(layer, hero.querySelector('.hero-overlay'));
}

// Header küçülmesi ve hero parallax tek bir pasif scroll dinleyicisiyle, rAF ile yürür.
function setupHeaderAndHeroScroll(fx) {
    const header = document.querySelector('.site-header');
    FxState.heroBackdrop = document.querySelector('.hero-backdrop');

    const update = () => {
        FxState.scrollFrame = 0;
        const y = window.scrollY;

        const isScrolled = y > fx.headerScrolledOffset;
        if (isScrolled !== FxState.scrolled && header) {
            FxState.scrolled = isScrolled;
            header.classList.toggle('is-scrolled', isScrolled);
        }

        if (!FxState.reducedMotion && FxState.heroBackdrop && y < window.innerHeight) {
            FxState.heroBackdrop.style.setProperty('--hero-shift', `${y * fx.heroParallaxFactor}px`);
        }
    };

    window.addEventListener('scroll', () => {
        if (!FxState.scrollFrame) FxState.scrollFrame = requestAnimationFrame(update);
    }, { passive: true });
    update();
}

// Ekrandaki bölüme karşılık gelen menü bağlantısını vurgular.
function setupActiveNav() {
    const links = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    const linkById = new Map();
    links.forEach(link => linkById.set(link.getAttribute('href').slice(1), link));

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            links.forEach(l => l.classList.remove('is-current'));
            linkById.get(entry.target.id)?.classList.add('is-current');
        });
    }, { rootMargin: '-45% 0px -50% 0px' });

    linkById.forEach((_, id) => {
        const section = document.getElementById(id);
        if (section) observer.observe(section);
    });
}

// Scroll ile görünür olma: .reveal sınıfı gizler, .is-visible gösterir.
function setupRevealObserver(fx) {
    if (!('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js-effects');

    FxState.revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('is-visible');
            FxState.revealObserver.unobserve(entry.target);
        });
    }, { threshold: fx.revealThreshold });

    refreshReveals();
}

// Yeni çizilen (örn. dil değişimi sonrası) elemanları da gözlemler; zaten işaretlenenleri atlar.
function refreshReveals() {
    const fx = AppState.siteData?.settings?.effects;
    if (!FxState.revealObserver || !fx) return;

    document.querySelectorAll(REVEAL_SELECTORS).forEach(el => {
        if (el.classList.contains('reveal')) return;
        const siblings = el.parentElement ? el.parentElement.children : [];
        const index = Array.prototype.indexOf.call(siblings, el);
        const stagger = Math.min(index, fx.revealStaggerMax) * fx.revealStaggerMs;
        el.style.setProperty('--reveal-delay', `${stagger}ms`);
        el.classList.add('reveal');
        FxState.revealObserver.observe(el);
    });
}

// Kartlarda fare konumuna göre hafif 3D eğilme. Olay delegasyonu: kart başına dinleyici yok.
function setupCardTilt(fx) {
    const applyTilt = () => {
        FxState.tiltFrame = 0;
        const el = FxState.tiltEl;
        if (!el) return;
        el.style.setProperty('--tilt-x', `${FxState.tiltX}deg`);
        el.style.setProperty('--tilt-y', `${FxState.tiltY}deg`);
    };

    const resetTilt = el => {
        el.style.setProperty('--tilt-x', '0deg');
        el.style.setProperty('--tilt-y', '0deg');
    };

    document.addEventListener('pointermove', event => {
        const card = event.target.closest?.(TILT_SELECTORS);
        if (FxState.tiltEl && FxState.tiltEl !== card) resetTilt(FxState.tiltEl);
        FxState.tiltEl = card || null;
        if (!card) return;

        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width - 0.5;
        const py = (event.clientY - rect.top) / rect.height - 0.5;
        FxState.tiltX = -py * fx.tiltMaxDeg * 2;
        FxState.tiltY = px * fx.tiltMaxDeg * 2;
        if (!FxState.tiltFrame) FxState.tiltFrame = requestAnimationFrame(applyTilt);
    }, { passive: true });

    document.addEventListener('pointerleave', () => {
        if (FxState.tiltEl) resetTilt(FxState.tiltEl);
        FxState.tiltEl = null;
    });
}


// Arka plan görselleri: hero + galeri görsellerinden havuz kurulur (site.json), kaydırdıkça bölüm değişiminde rastgele görsele çapraz geçiş yapılır.
const BgState = { pool: [], layers: [], activeLayer: 0, currentIndex: -1 };

function setupRandomBackground() {
    const media = AppState.siteData?.media;
    if (!media || document.querySelector('.page-bg')) return;

    // Arka plan havuzuna yalnızca metin/arayüz içermeyen atmosferik sahneleri dahil et
    const pool = [media.heroImage];
    if (Array.isArray(media.gallery)) {
        media.gallery.forEach((item, idx) => {
            if (idx >= 1 && idx <= 3) pool.push(item.full);
        });
    }
    BgState.pool = pool.map(src => new URL(src, document.baseURI).href);
    if (BgState.pool.length < 2) return;

    const wrap = document.createElement('div');
    wrap.className = 'page-bg';
    wrap.setAttribute('aria-hidden', 'true');
    for (let i = 0; i < 2; i++) {
        const layer = document.createElement('div');
        layer.className = 'page-bg-layer';
        wrap.appendChild(layer);
        BgState.layers.push(layer);
    }
    document.body.insertBefore(wrap, document.body.firstChild);

    // İlk görsel hero ile aynı; ilk rastgele geçiş ilk bölüm değişiminde olur.
    showBackground(0);

    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.target.id !== 'hero') showBackground(pickRandomBackground());
        });
    }, { rootMargin: '-50% 0px -50% 0px' });
    document.querySelectorAll('main > section').forEach(section => observer.observe(section));
}

// Aynı görseli art arda seçmeden rastgele indeks döner.
function pickRandomBackground() {
    let next = Math.floor(Math.random() * BgState.pool.length);
    if (next === BgState.currentIndex) next = (next + 1) % BgState.pool.length;
    return next;
}

// Görsel yüklendikten sonra pasif katmana yazılır ve çapraz geçişle gösterilir.
function showBackground(index) {
    if (index === BgState.currentIndex) return;
    BgState.currentIndex = index;
    const nextLayer = BgState.layers[1 - BgState.activeLayer];
    const prevLayer = BgState.layers[BgState.activeLayer];
    const url = BgState.pool[index];

    const loader = new Image();
    loader.onload = () => {
        if (BgState.pool[BgState.currentIndex] !== url) return;
        nextLayer.style.backgroundImage = `url(${url})`;
        nextLayer.classList.add('is-active');
        prevLayer.classList.remove('is-active');
        BgState.activeLayer = 1 - BgState.activeLayer;
    };
    loader.src = url;
}


// Sınıflar bölümü ekrandaysa stat çubuklarını ve sayılarını hemen doldurur; henüz aşağı inilmediyse ilk görünür olduğunda doldurur.
let classStatsObserver = null;
let statCountFrame = 0;

function triggerOrObserveClassStats(showcase) {
    if (!showcase) return;
    if (classStatsObserver) {
        classStatsObserver.disconnect();
        classStatsObserver = null;
    }

    const rect = showcase.getBoundingClientRect();
    const inView = rect.top < window.innerHeight * 0.88 && rect.bottom > 0;

    if (inView || !('IntersectionObserver' in window)) {
        runClassStatsAnimation(showcase);
        return;
    }

    classStatsObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            runClassStatsAnimation(showcase);
            if (classStatsObserver) {
                classStatsObserver.disconnect();
                classStatsObserver = null;
            }
        });
    }, { threshold: 0.25 });

    classStatsObserver.observe(showcase);
}

function runClassStatsAnimation(showcase) {
    if (statCountFrame) {
        cancelAnimationFrame(statCountFrame);
        statCountFrame = 0;
    }

    const fx = AppState.siteData?.settings?.effects;
    const duration = (fx && fx.statFillDurationMs) ? fx.statFillDurationMs : 950;
    const stagger = (fx && fx.statStaggerMs) ? fx.statStaggerMs : 70;
    const formatter = new Intl.NumberFormat(AppState.currentLang || 'tr');

    // Çubukları sıfırdan hedef genişliğe tetikle
    const fills = showcase.querySelectorAll('.stat-bar-fill');
    fills.forEach(f => {
        f.style.transition = 'none';
        f.style.width = '0%';
    });

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            fills.forEach(f => {
                f.style.transition = '';
                if (f.dataset.targetWidth) f.style.width = f.dataset.targetWidth;
            });
        });
    });

    // Sayıları da çubukla eşzamanlı olarak 0'dan hedefe saydır
    const valNodes = showcase.querySelectorAll('.stat-value');
    const startTime = performance.now();

    const step = now => {
        let anyRunning = false;
        for (let i = 0; i < valNodes.length; i++) {
            const el = valNodes[i];
            const target = Number(el.dataset.targetVal || 0);
            const unit = el.dataset.unit || '';
            const delay = i * stagger;
            const elapsed = now - startTime - delay;

            if (elapsed <= 0) {
                el.textContent = `0${unit}`;
                anyRunning = true;
                continue;
            }

            const progress = Math.min(1, elapsed / duration);
            // Cubic ease-out
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.round(target * eased);
            el.textContent = `${formatter.format(current)}${unit}`;

            if (progress < 1) anyRunning = true;
        }

        if (anyRunning) {
            statCountFrame = requestAnimationFrame(step);
        } else {
            statCountFrame = 0;
        }
    };

    statCountFrame = requestAnimationFrame(step);
}

// Klavyeden P, Q, W, E, R tuşlarıyla yetenek değiştirme
let skillHotkeysBound = false;
function setupSkillHotkeys() {
    if (skillHotkeysBound) return;
    skillHotkeysBound = true;

    window.addEventListener('keydown', e => {
        if (e.ctrlKey || e.altKey || e.metaKey) return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        const dialog = document.getElementById('media-dialog');
        if (dialog?.open) return;

        const key = e.key.toUpperCase();
        if (key === 'P' || key === 'Q' || key === 'W' || key === 'E' || key === 'R') {
            const charSection = document.getElementById('characters');
            if (!charSection) return;
            const rect = charSection.getBoundingClientRect();
            if (rect.top < window.innerHeight * 0.85 && rect.bottom > 100) {
                if (typeof AppState.selectSkillByKey === 'function') {
                    AppState.selectSkillByKey(key);
                }
            }
        }
    });
}

// Void Kuyruklu Yıldız & Kıvılcım İmleç İzi (0GC Canvas: önceden ayrılmış nokta ve kıvılcım havuzu)
function setupVoidCursor(fx) {
    setupSkillHotkeys();
    if (FxState.reducedMotion) return;
    if (!window.matchMedia('(pointer: fine) and (hover: hover)').matches) return;

    // Eski tekil div varsa temizle
    document.querySelector('.void-cursor-aura')?.remove();
    if (document.querySelector('.void-cursor-canvas')) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'void-cursor-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0, height = 0;

    const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });

    const rootStyles = getComputedStyle(document.documentElement);
    const colorCore = rootStyles.getPropertyValue('--fx-trail-core').trim() || '#f5d0fe';
    const colorMid = rootStyles.getPropertyValue('--fx-trail-mid').trim() || '#c084fc';
    const colorOuter = rootStyles.getPropertyValue('--fx-trail-outer').trim() || '#7e22ce';
    const colorAlt = rootStyles.getPropertyValue('--fx-spark-alt').trim() || '#38bdf8';

    // 0GC: Kuyruk boğumları önceden ayrılır
    const trailLen = fx.cursorTrailLength || 22;
    const trail = new Array(trailLen);
    for (let i = 0; i < trailLen; i++) {
        trail[i] = { x: -200, y: -200 };
    }

    // 0GC: Kıvılcım havuzu önceden ayrılır
    const sparkCount = fx.cursorSparkPool || 28;
    const sparks = new Array(sparkCount);
    for (let i = 0; i < sparkCount; i++) {
        sparks[i] = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, alt: false };
    }
    let sparkCursor = 0;

    let mouseX = -200, mouseY = -200;
    let prevX = -200, prevY = -200;
    let hasMoved = false;
    let isHovering = false;
    let frameId = 0;
    let idleFrames = 0;

    const spawnSpark = (x, y, speedBoost) => {
        const s = sparks[sparkCursor];
        sparkCursor = (sparkCursor + 1) % sparkCount;
        const angle = Math.random() * Math.PI * 2;
        const speed = (0.4 + Math.random() * 1.4) * speedBoost;
        s.active = true;
        s.x = x + (Math.random() - 0.5) * 6;
        s.y = y + (Math.random() - 0.5) * 6;
        s.vx = Math.cos(angle) * speed;
        s.vy = Math.sin(angle) * speed - 0.35;
        s.life = 0;
        s.maxLife = 18 + Math.random() * 18;
        s.size = 1.4 + Math.random() * 2.4;
        s.alt = Math.random() < 0.22;
    };

    const render = () => {
        frameId = 0;
        ctx.clearRect(0, 0, width, height);

        // Kuyruk noktalarını birbirine doğru yay (spring/lerp zinciri)
        trail[0].x += (mouseX - trail[0].x) * 0.45;
        trail[0].y += (mouseY - trail[0].y) * 0.45;
        for (let i = 1; i < trailLen; i++) {
            trail[i].x += (trail[i - 1].x - trail[i].x) * 0.42;
            trail[i].y += (trail[i - 1].y - trail[i].y) * 0.42;
        }

        // Kuyruklu yıldız şeridi çizimi (ucundan kuyruğa doğru incelen neon eğri)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < trailLen - 1; i++) {
            const p0 = trail[i];
            const p1 = trail[i + 1];
            const ratio = 1 - i / trailLen;
            const lw = (isHovering ? 7.5 : 5.2) * ratio * ratio;
            if (lw < 0.25) continue;

            ctx.beginPath();
            ctx.moveTo(p0.x, p0.y);
            ctx.lineTo(p1.x, p1.y);
            ctx.lineWidth = lw;
            ctx.strokeStyle = i < 4 ? colorCore : (i < 11 ? colorMid : colorOuter);
            ctx.globalAlpha = ratio * 0.78;
            ctx.shadowBlur = isHovering ? 18 : 12;
            ctx.shadowColor = colorMid;
            ctx.stroke();
        }

        // İmleç ucundaki parlak void yıldız çekirdeği
        const head = trail[0];
        const headRadius = isHovering ? 4.2 : 2.8;
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = colorCore;
        ctx.shadowBlur = isHovering ? 22 : 14;
        ctx.shadowColor = colorMid;
        ctx.beginPath();
        ctx.arc(head.x, head.y, headRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Kıvılcımları güncelle ve çiz (elmas/yıldız zerrecikleri)
        let activeSparks = 0;
        ctx.save();
        for (let i = 0; i < sparkCount; i++) {
            const s = sparks[i];
            if (!s.active) continue;
            s.life++;
            if (s.life >= s.maxLife) {
                s.active = false;
                continue;
            }
            activeSparks++;
            s.x += s.vx;
            s.y += s.vy;
            s.vx *= 0.96;
            s.vy *= 0.96;

            const t = 1 - s.life / s.maxLife;
            const r = s.size * t;
            ctx.globalAlpha = t * 0.9;
            ctx.fillStyle = s.alt ? colorAlt : colorCore;
            ctx.shadowBlur = 8;
            ctx.shadowColor = s.alt ? colorAlt : colorMid;

            ctx.beginPath();
            ctx.moveTo(s.x, s.y - r * 1.4);
            ctx.lineTo(s.x + r, s.y);
            ctx.lineTo(s.x, s.y + r * 1.4);
            ctx.lineTo(s.x - r, s.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();

        const tailDist = Math.hypot(mouseX - trail[trailLen - 1].x, mouseY - trail[trailLen - 1].y);
        if (tailDist > 0.4 || activeSparks > 0) {
            idleFrames = 0;
            frameId = requestAnimationFrame(render);
        } else if (idleFrames < 10) {
            idleFrames++;
            frameId = requestAnimationFrame(render);
        } else {
            ctx.clearRect(0, 0, width, height);
        }
    };

    window.addEventListener('pointermove', e => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        if (!hasMoved) {
            hasMoved = true;
            prevX = mouseX;
            prevY = mouseY;
            for (let i = 0; i < trailLen; i++) {
                trail[i].x = mouseX;
                trail[i].y = mouseY;
            }
        }
        const dist = Math.hypot(mouseX - prevX, mouseY - prevY);
        if (dist > 7) {
            spawnSpark(mouseX, mouseY, Math.min(2, dist / 14));
            prevX = mouseX;
            prevY = mouseY;
        }
        if (!frameId) frameId = requestAnimationFrame(render);
    }, { passive: true });

    window.addEventListener('pointerdown', e => {
        for (let i = 0; i < 7; i++) {
            spawnSpark(e.clientX, e.clientY, 1.8);
        }
        if (!frameId) frameId = requestAnimationFrame(render);
    }, { passive: true });

    document.addEventListener('pointerover', e => {
        isHovering = Boolean(e.target.closest('a, button, [role="button"], .class-tab-btn, .skill-select-btn, .gallery-card'));
    }, { passive: true });
}
