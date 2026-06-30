/**
 * WedWise – Frontend v1
 * Multi-step questionnaire with mock report generation.
 * Payload shape aligns with wedding_requests + lead_submissions schema.
 */

const TOTAL_STEPS = 6;

const REGION_NAMES = {
  '1': 'ירושלים והסביבה',
  '2': 'המרכז',
  '3': 'הצפון',
  '4': 'הדרום',
};

const SUPPLIER_CATEGORIES = [
  'אולם / גן אירועים',
  'די־ג׳יי',
  'צילום',
  'עיצוב ופרחים',
  'קייטרינג',
];

const VENUE_CATEGORY = 'אולם / גן אירועים';

const SUPPLIER_RECOMMENDATION_LABELS = {
  'די־ג׳יי': 'הצג המלצות די־ג׳יי',
  'צילום': 'הצג המלצות צילום',
  'עיצוב ופרחים': 'הצג המלצות עיצוב',
  'קייטרינג': 'הצג המלצות קייטרינג',
};

function formatNumberInput(input) {
  input.value = input.value.replace(/[^\d]/g, '');
  const num = parseInt(input.value, 10);
  if (!isNaN(num)) {
    input.value = num.toLocaleString('he-IL');
  }
}

let currentStep = 1;
let latestReportText = '';
let latestQuestionnaire = null;
let latestPayload = null;
let latestSubmissionId = null;
let latestLeadId = null;
let latestImageGenerated = false;
let isReportConfirmed = false;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

const form = document.getElementById('wedding-form');
const formError = document.getElementById('form-error');
const progressLabel = document.getElementById('progress-label');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.querySelector('.progress-bar');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const btnRestart = document.getElementById('btn-restart');
const btnConfirmReport = document.getElementById('btn-confirm-report');
const btnGenerateImage = document.getElementById('btn-generate-image');
const btnEditAnswers = document.getElementById('btn-edit-answers');
const questionnaireSection = document.getElementById('questionnaire');
const reportSection = document.getElementById('report-section');
const reportContent = document.getElementById('report-content');
const weddingImageResult = document.getElementById('wedding-image-result');
const weddingImageModal = document.getElementById('wedding-image-modal');
const weddingImageModalContent = document.getElementById('wedding-image-modal-content');
// Venue modal is created lazily by ensureVenueModal() so the feature does not depend
// on the popup markup being present in the (possibly cached) page HTML.
const invitationCta = document.getElementById('invitation-cta');
const btnOpenInvitationGenerator = document.getElementById('btn-open-invitation-generator');
const btnOpenCountdownGenerator = document.getElementById('btn-open-countdown-generator');
const navSectionLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const navSections = navSectionLinks
  .map((link) => ({
    link,
    section: document.querySelector(link.getAttribute('href')),
  }))
  .filter((item) => item.section);

function updateActiveNavLink() {
  const headerOffset = document.querySelector('.site-header')?.offsetHeight || 0;
  const scrollPosition = window.scrollY + headerOffset + 80;
  let activeLink = null;

  navSections.forEach(({ link, section }) => {
    if (scrollPosition >= section.offsetTop) {
      activeLink = link;
    }
  });

  navSectionLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle('active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function getFormState() {
  const styleInput = form.querySelector('input[name="preferred_style"]:checked');

  return {
    estimated_budget_ils: parseInt(form.estimated_budget_ils.value.replace(/[^\d]/g, ''), 10) || 0,
    guest_count: parseInt(form.guest_count.value.replace(/[^\d]/g, ''), 10) || 0,
    region_id: form.region_id.value,
    region_name: REGION_NAMES[form.region_id.value] || '',
    preferred_style: styleInput ? styleInput.value : '',
    preferred_colors: form.preferred_colors.value.trim(),
    flowers: getCheckedValues('flowers'),
    decorations: getCheckedValues('decorations'),
    free_text: form.free_text.value.trim(),
    full_name: form.full_name.value.trim(),
    phone: form.phone.value.trim(),
    email: form.email.value.trim(),
    inspiration_url: form.inspiration_url.value.trim(),
  };
}

function buildWeddingRequestPayload(state) {
  const flowersPart = state.flowers.length ? `פרחים: ${state.flowers.join(', ')}` : '';
  const decorPart = state.decorations.length ? `קישוטים: ${state.decorations.join(', ')}` : '';
  const flowersAndDecor = [flowersPart, decorPart].filter(Boolean).join(' | ');

  return {
    wedding_request: {
      estimated_budget_ils: state.estimated_budget_ils,
      guest_count: state.guest_count,
      region_id: parseInt(state.region_id, 10),
      region_name: state.region_name,
      preferred_styles_json: JSON.stringify([state.preferred_style]),
      preferred_colors: state.preferred_colors,
      flowers: state.flowers,
      decorations: state.decorations,
      flowers_and_decor: flowersAndDecor,
      free_text: state.free_text,
      inspiration_url: state.inspiration_url || null,
    },
    lead: {
      full_name: state.full_name,
      phone: state.phone,
      email: state.email,
      consent_to_contact: 1,
    },
  };
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
  formError.classList.remove('error-shake');
  void formError.offsetWidth; // force reflow to restart the animation
  formError.classList.add('error-shake');
}

function clearError() {
  formError.textContent = '';
  formError.hidden = true;
}

function validateStep(stepIndex) {
  clearError();
  const state = getFormState();

  switch (stepIndex) {
    case 1:
      if (!state.estimated_budget_ils || state.estimated_budget_ils <= 0) {
        showError('נא להזין תקציב משוער גדול מאפס.');
        return false;
      }
      if (!state.guest_count || state.guest_count < 20) {
        showError('נא להזין מספר אורחים של לפחות 20.');
        return false;
      }
      return true;

    case 2:
      if (!state.region_id) {
        showError('נא לבחור אזור בארץ.');
        return false;
      }
      if (!state.preferred_style) {
        showError('נא לבחור סגנון חתונה.');
        return false;
      }
      return true;

    case 3:
      if (!state.preferred_colors) {
        showError('נא להזין צבעים מועדפים.');
        return false;
      }
      return true;

    case 4:
      return true;

    case 5: {
      const url = state.inspiration_url;
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch {
        showError('נא להזין קישור תקין (לדוגמה: https://www.pinterest.com/...) או לרוקן את השדה ולדלג.');
        return false;
      }
    }

    case 6: {
      if (!state.full_name) {
        showError('נא להזין שם מלא.');
        return false;
      }
      if (!state.phone || state.phone.length < 9) {
        showError('נא להזין מספר טלפון תקין.');
        return false;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!state.email || !emailPattern.test(state.email)) {
        showError('נא להזין כתובת אימייל תקינה.');
        return false;
      }
      return true;
    }

    default:
      return true;
  }
}

function updateProgress(step) {
  progressLabel.textContent = `שלב ${step} מתוך ${TOTAL_STEPS}`;
  progressFill.style.width = `${(step / TOTAL_STEPS) * 100}%`;
  progressBar.setAttribute('aria-valuenow', String(step));

  document.querySelectorAll('.step-pip').forEach((pip) => {
    const pipStep = parseInt(pip.dataset.step, 10);
    pip.classList.toggle('completed', pipStep < step);
    pip.classList.toggle('active', pipStep === step);
  });
}

function updateNavButtons(step) {
  btnBack.hidden = step === 1;
  btnNext.textContent = step === TOTAL_STEPS ? 'שליחה וקבלת דוח' : 'הבא';
}

function goToStep(step, options = {}) {
  const { focusFirstInput = true } = options;

  currentStep = step;

  form.querySelectorAll('.form-step').forEach((fieldset) => {
    const stepNum = parseInt(fieldset.dataset.step, 10);
    fieldset.classList.toggle('active', stepNum === step);
  });

  updateProgress(step);
  updateNavButtons(step);
  clearError();

  if (focusFirstInput) {
    const activeFieldset = form.querySelector(`.form-step[data-step="${step}"]`);
    const firstInput = activeFieldset.querySelector('input, select, textarea');
    if (firstInput) {
      firstInput.focus({ preventScroll: true });
    }
  }
}

function formatCurrency(amount) {
  return amount.toLocaleString('he-IL') + ' ₪';
}

function generateMockReport(payload) {
  const wr = payload.wedding_request;
  const lead = payload.lead;
  const budget = wr.estimated_budget_ils;
  const guests = wr.guest_count;
  const perGuest = Math.round(budget / guests);
  const style = JSON.parse(wr.preferred_styles_json)[0];
  const region = REGION_NAMES[String(wr.region_id)] || '';

  const venueBudget    = Math.round(budget * 0.45);
  const cateringBudget = Math.round(budget * 0.30);
  const servicesBudget = Math.round(budget * 0.25);
  const budgetDeviation = Math.round(budget * 0.08);

  // Parse "פרחים: x, y | קישוטים: a, b" into separate groups
  const fdParts = Object.fromEntries(
    (wr.flowers_and_decor || '').split(' | ')
      .map((p) => p.split(': '))
      .filter((a) => a.length === 2)
  );

  // Color chips from comma-separated text
  const colorTags = (wr.preferred_colors || '')
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => `<span class="rpt-color-tag">${c}</span>`)
    .join('');

  // Generic chip builder
  const chips = (text) =>
    (text || '').split(', ').filter(Boolean)
      .map((t) => `<span class="rpt-chip">${t.trim()}</span>`).join('');

  const flowerChips = chips(fdParts['פרחים']);
  const decorChips  = chips(fdParts['קישוטים']);

  const flowersSection = (flowerChips || decorChips) ? `
    <div class="rpt-design-row">
      ${flowerChips ? `<div class="rpt-design-item"><span class="rpt-design-label">פרחים</span><div class="rpt-chips">${flowerChips}</div></div>` : ''}
      ${decorChips  ? `<div class="rpt-design-item"><span class="rpt-design-label">קישוטים</span><div class="rpt-chips">${decorChips}</div></div>`  : ''}
    </div>` : '';

  // Free text as a styled quote
  const freeTextBlock = wr.free_text
    ? `<blockquote class="rpt-quote"><p>״${wr.free_text}״</p></blockquote>`
    : '';

  const supplierCards = SUPPLIER_CATEGORIES.map((cat) => {
    const isVenue = cat === VENUE_CATEGORY;
    const supplierButtonLabel = SUPPLIER_RECOMMENDATION_LABELS[cat];
    const venueBtn = isVenue ? `
      <button type="button" class="rpt-venue-btn" data-venue-recommend
        data-region-id="${wr.region_id}" data-budget="${budget}" data-guests="${guests}">
        הצג המלצות אולמות
      </button>` : '';
    const supplierBtn = supplierButtonLabel ? `
      <button type="button" class="rpt-venue-btn rpt-supplier-btn" data-supplier-recommend
        data-category="${escapeHtml(cat)}" data-region-id="${wr.region_id}"
        data-region="${escapeHtml(region)}" data-budget="${budget}"
        data-guests="${guests}" data-style="${escapeHtml(style)}">
        ${supplierButtonLabel}
      </button>` : '';
    return `
    <div class="rpt-supplier-card${isVenue ? ' rpt-supplier-card--venue' : supplierButtonLabel ? ' rpt-supplier-card--recommendable' : ''}">
      <span class="rpt-supplier-name">${cat}</span>
      ${venueBtn || supplierBtn}
    </div>`;
  }).join('');

  const reportDate = new Date().toLocaleDateString('he-IL');
  const reportId = `#WW-${String(Date.now()).slice(-6)}`;

  // Optional inspiration link block — only rendered when a URL was provided
  const inspirationBlock = wr.inspiration_url ? `
    <section class="rpt-section">
      <div class="rpt-section-heading">
        <span class="rpt-mark" aria-hidden="true">↗</span>
        <h3>השראה לחתונה</h3>
      </div>
      <a href="${wr.inspiration_url}" target="_blank" rel="noopener noreferrer" class="rpt-inspiration-link">
        <span aria-hidden="true">↗</span>
        ${wr.inspiration_url}
      </a>
    </section>` : '';

  return `
    <article class="rpt-document" aria-label="דוח תכנון חתונה">
      <div class="rpt-floral rpt-floral-top" aria-hidden="true"></div>
      <div class="rpt-floral rpt-floral-bottom" aria-hidden="true"></div>

      <header class="rpt-doc-header">
        <div class="rpt-brand-block">
          <h2>WedWise</h2>
        </div>
        <div class="rpt-doc-meta">
          <span>מספר דוח: ${reportId}</span>
          <span>תאריך הפקה: ${reportDate}</span>
        </div>
      </header>

      <div class="rpt-report-title">
        <h3>סיכום תכנון אסטרטגי</h3>
        <p>שלום <strong>${lead.full_name}</strong>, הנה תמונת המצב הראשונית שלכם לפי התשובות בשאלון.</p>
      </div>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">♥</span>
          <h3>סקירת חתונה</h3>
        </div>
        <div class="rpt-overview-grid">
          <div>
            <span>איש קשר</span>
            <strong>${lead.full_name}</strong>
          </div>
          <div>
            <span>כמות מוזמנים</span>
            <strong>${guests.toLocaleString('he-IL')} אורחים</strong>
          </div>
          <div>
            <span>מיקום מועדף</span>
            <strong>${region}</strong>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">§</span>
          <h3>פרטי תכנון מהשאלון</h3>
        </div>
        <div class="rpt-details-grid">
          <div class="rpt-detail-row">
            <span>תקציב יעד</span>
            <strong>${formatCurrency(budget)}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>עלות משוערת לאורח</span>
            <strong>${formatCurrency(perGuest)}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>סגנון עיצובי</span>
            <strong>${style}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>צבעים מועדפים</span>
            <strong>${wr.preferred_colors || 'לא צוין'}</strong>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">✦</span>
          <h3>כיוון עיצובי</h3>
        </div>
        <div class="rpt-design-summary">
          <div>
            <span class="rpt-design-label">סגנון</span>
            <span class="rpt-style-badge">${style}</span>
          </div>
          <div>
            <span class="rpt-design-label">צבעים</span>
            <div class="rpt-chips">${colorTags || '<span class="rpt-chip">לא צוין</span>'}</div>
          </div>
          ${flowersSection}
        </div>
        ${freeTextBlock}
      </section>

      ${inspirationBlock}

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">◇</span>
          <h3>סדר פעולות מומלץ</h3>
        </div>
        <div class="rpt-timeline-grid">
          <div>
            <span>שלב פתיחה</span>
            <p>בחירת מקום, בדיקת צילום, די־ג׳יי וקייטרינג לפי דחיפות האירוע.</p>
          </div>
          <div>
            <span>שלב המשך</span>
            <p>גיבוש עיצוב, פרחים, לוח השראה וסגירת ספקים מרכזיים לפי לוח הזמנים שלכם.</p>
          </div>
        </div>
      </section>

      <section class="rpt-section rpt-budget-analysis">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">₪</span>
          <h3>ניתוח תקציבי מקצועי</h3>
        </div>
        <div class="rpt-budget-layout">
          <div class="rpt-budget-bars">
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>אולם / גן אירועים</span><strong>${formatCurrency(venueBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:45%"></div></div><span class="rpt-bar-pct">45%</span></div>
            </div>
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>קייטרינג</span><strong>${formatCurrency(cateringBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:30%"></div></div><span class="rpt-bar-pct">30%</span></div>
            </div>
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>עיצוב, צילום ודי־ג׳יי</span><strong>${formatCurrency(servicesBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:25%"></div></div><span class="rpt-bar-pct">25%</span></div>
            </div>
          </div>
          <div class="rpt-budget-summary">
            <div>
              <span>תקציב יעד</span>
              <strong>${formatCurrency(budget)}</strong>
            </div>
            <div>
              <span>רמת היתכנות</span>
              <strong>ראשונית</strong>
            </div>
            <div class="rpt-budget-deviation">
              <span>אפשרות סטייה מהתקציב</span>
              <strong>± ${formatCurrency(budgetDeviation)} (עד 8%)</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">✓</span>
          <h3>קטגוריות ספקים לבדיקה</h3>
        </div>
        <p class="rpt-block-sub">ההתאמות כאן מבוססות על האזור, הסגנון והתקציב שציינתם בשאלון.</p>
        <div class="rpt-suppliers">
          ${supplierCards}
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">•</span>
          <h3>צעדים הבאים</h3>
        </div>
        <ul class="rpt-next-list">
          <li>תיאום בדיקה עם 3 ספקים מובילים באזור ${region}.</li>
          <li>איסוף השראה עיצובית נוספת לפי סגנון ${style}.</li>
          <li>עדכון רשימת מוזמנים ראשונית לפני פגישת המשך.</li>
        </ul>
      </section>

      <footer class="rpt-doc-footer">
        <div class="rpt-footer-notes">
          <p>* דוח זה הופק באופן אוטומטי על ידי מערכת WedWise.</p>
          <p>הנתונים הם הערכה ראשונית ואינם מהווים הצעת מחיר או אישור ספק.</p>
        </div>
        <div class="rpt-seal" aria-label="חותמת אימות WedWise">
          <span aria-hidden="true">✓</span>
          <strong>מאומת<br>על ידי<br>WedWise</strong>
        </div>
      </footer>
    </article>
  `;
}



function renderReport(html) {
  reportContent.innerHTML = html;
  latestReportText = reportContent.innerText.replace(/\s+/g, ' ').trim();
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = 'אישור הדוח';
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'צרו הדמיית חתונה';
  }
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.className = 'wedding-image-result';
    weddingImageResult.innerHTML = '';
  }
  if (invitationCta) invitationCta.hidden = true;
  questionnaireSection.hidden = true;
  reportSection.hidden = false;
  reportSection.scrollIntoView({ behavior: 'smooth' });
}

function buildImageQuestionnaire(state) {
  return {
    budget: state.estimated_budget_ils,
    guestCount: state.guest_count,
    regionName: state.region_name,
    style: state.preferred_style,
    colors: state.preferred_colors,
    flowers: state.flowers.join(', '),
    decorations: state.decorations.join(', '),
    freeText: state.free_text,
    inspirationUrl: state.inspiration_url,
  };
}

function setWeddingImageStatus(type, html) {
  if (!weddingImageResult) return;
  weddingImageResult.hidden = false;
  weddingImageResult.className = `wedding-image-result ${type ? `is-${type}` : ''}`;
  weddingImageResult.innerHTML = html;
}

function setWeddingImageModal(type, html) {
  if (!weddingImageModal || !weddingImageModalContent) {
    setWeddingImageStatus(type, html);
    return;
  }

  weddingImageModalContent.className = `wedding-image-modal-content ${type ? `is-${type}` : ''}`;
  weddingImageModalContent.innerHTML = html;
  weddingImageModal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeWeddingImageModal() {
  if (!weddingImageModal) return;
  weddingImageModal.hidden = true;
  document.body.classList.remove('modal-open');
}

// ── Venue recommendations ──────────────────────────────────────────────

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));
}

function ensureVenueModal() {
  let modal = document.getElementById('venue-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'venue-modal';
    modal.className = 'wedding-image-modal venue-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="wedding-image-modal-backdrop" data-close-venue-modal></div>
      <div class="wedding-image-modal-window venue-modal-window" role="dialog" aria-modal="true" aria-labelledby="venue-modal-title">
        <button type="button" class="wedding-image-modal-close" data-close-venue-modal aria-label="סגירת חלון">×</button>
        <div id="venue-modal-content"></div>
      </div>`;
    document.body.appendChild(modal);
  }
  return { modal, content: modal.querySelector('#venue-modal-content') };
}

function openVenueModal(html) {
  const { modal, content } = ensureVenueModal();
  content.innerHTML = html;
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeVenueModal() {
  const modal = document.getElementById('venue-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function venueCardHtml(v) {
  const price = v.priceMin != null
    ? `₪${v.priceMin.toLocaleString('he-IL')}${v.priceMax && v.priceMax !== v.priceMin ? `–${v.priceMax.toLocaleString('he-IL')}` : ''} לאורח`
    : 'מחיר לפי בקשה';
  const capacity = (v.capacityMin != null && v.capacityMax != null)
    ? `${v.capacityMin.toLocaleString('he-IL')}–${v.capacityMax.toLocaleString('he-IL')} אורחים`
    : '';
  const place = v.city || v.region || '';
  const genericNote = v.imageIsGeneric ? '<span class="venue-card-photo-note">תמונה להמחשה</span>' : '';
  return `
    <article class="venue-card">
      <div class="venue-card-photo">
        <img src="${escapeHtml(v.imageUrl)}" alt="${escapeHtml(v.name)}" loading="lazy">
        ${genericNote}
      </div>
      <div class="venue-card-body">
        <h4 class="venue-card-name">${escapeHtml(v.name)}</h4>
        ${place ? `<p class="venue-card-city">${escapeHtml(place)}</p>` : ''}
        <ul class="venue-card-meta">
          <li>${price}</li>
          ${capacity ? `<li>${capacity}</li>` : ''}
        </ul>
        ${v.reason ? `<p class="venue-card-reason">${escapeHtml(v.reason)}</p>` : ''}
        <a class="venue-card-rating" href="${escapeHtml(v.mapsUrl)}" target="_blank" rel="noopener"
           title="צפייה בדירוג ובמיקום בגוגל מפות">
          <span class="venue-stars" aria-hidden="true">★★★★★</span>
          <span class="venue-rating-label">דירוג ומיקום בגוגל מפות ↗</span>
        </a>
      </div>
    </article>`;
}

function renderVenueRecommendations(data) {
  const intro = data.perGuestBudget > 0
    ? `לפי תקציב של כ־₪${data.perGuestBudget.toLocaleString('he-IL')} לאורח לאולם, הנה שלוש המלצות מובילות עבורכם.`
    : 'הנה שלוש המלצות אולמות מובילות עבורכם.';
  openVenueModal(`
    <div class="venue-modal-head">
      <h2 id="venue-modal-title">אולמות מומלצים עבורכם</h2>
      <p>${intro}</p>
    </div>
    <div class="venue-card-grid">
      ${data.venues.map(venueCardHtml).join('')}
    </div>
    <p class="venue-modal-foot">לחיצה על הכוכבים תפתח את הדירוג והמיקום של האולם בגוגל מפות בחלון חדש.</p>
  `);
}

async function showVenueRecommendations(btn) {
  const payload = {
    region_id: Number(btn.dataset.regionId),
    budget: Number(btn.dataset.budget),
    guests: Number(btn.dataset.guests),
  };
  openVenueModal(`
    <div class="venue-modal-loading">
      <h2>מחפשים אולמות מתאימים…</h2>
      <p>בודקים התאמה לפי אזור, תקציב ומספר אורחים.</p>
    </div>`);
  try {
    const res = await fetch('/api/venues/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.venues || !data.venues.length) {
      throw new Error(data.error || 'no venues');
    }
    renderVenueRecommendations(data);
  } catch (err) {
    openVenueModal(`
      <div class="venue-modal-message">
        <h2>לא הצלחנו לטעון המלצות כרגע</h2>
        <p>אפשר לנסות שוב בעוד רגע. אנחנו כאן כדי לעזור לכם למצוא את האולם המושלם.</p>
        <button type="button" class="btn btn-secondary" data-close-venue-modal>סגירה</button>
      </div>`);
  }
}

function ensureSupplierModal() {
  let modal = document.getElementById('supplier-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'supplier-modal';
    modal.className = 'wedding-image-modal venue-modal supplier-modal';
    modal.hidden = true;
    modal.innerHTML = `
      <div class="wedding-image-modal-backdrop" data-close-supplier-modal></div>
      <div class="wedding-image-modal-window venue-modal-window" role="dialog" aria-modal="true" aria-labelledby="supplier-modal-title">
        <button type="button" class="wedding-image-modal-close" data-close-supplier-modal aria-label="סגירת חלון">×</button>
        <div id="supplier-modal-content"></div>
      </div>`;
    document.body.appendChild(modal);
  }
  return { modal, content: modal.querySelector('#supplier-modal-content') };
}

function openSupplierModal(html) {
  const { modal, content } = ensureSupplierModal();
  content.innerHTML = html;
  modal.hidden = false;
  document.body.classList.add('modal-open');
}

function closeSupplierModal() {
  const modal = document.getElementById('supplier-modal');
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove('modal-open');
}

function supplierPriceText(supplier) {
  if (supplier.priceMin == null) return 'מחיר לפי בדיקה';
  const min = Number(supplier.priceMin).toLocaleString('he-IL');
  const max = supplier.priceMax != null && supplier.priceMax !== supplier.priceMin
    ? `–${Number(supplier.priceMax).toLocaleString('he-IL')}`
    : '';
  const unit = supplier.priceUnit ? ` ${escapeHtml(supplier.priceUnit)}` : '';
  return `${min}${max} ₪${unit}`;
}

function supplierCardHtml(supplier) {
  const place = [supplier.city, supplier.region].filter(Boolean).join(' · ');
  const styleText = Array.isArray(supplier.styles) && supplier.styles.length
    ? supplier.styles.slice(0, 3).join(', ')
    : '';

  return `
    <article class="venue-card supplier-match-card">
      <div class="venue-card-body">
        <span class="supplier-match-label">${escapeHtml(supplier.category)}</span>
        <h4 class="venue-card-name">${escapeHtml(supplier.name)}</h4>
        ${place ? `<p class="venue-card-city">${escapeHtml(place)}</p>` : ''}
        <ul class="venue-card-meta">
          <li>${supplierPriceText(supplier)}</li>
          ${styleText ? `<li>${escapeHtml(styleText)}</li>` : ''}
        </ul>
        ${supplier.description ? `<p class="supplier-card-description">${escapeHtml(supplier.description)}</p>` : ''}
        ${supplier.reason ? `<p class="venue-card-reason">${escapeHtml(supplier.reason)}</p>` : ''}
      </div>
    </article>`;
}

function renderSupplierRecommendations(data) {
  const budget = data.targetBudget?.amount
    ? `${formatCurrency(Number(data.targetBudget.amount))} ${escapeHtml(data.targetBudget.unit || '')}`.trim()
    : '';
  const intro = budget
    ? `לפי אזור ${escapeHtml(data.region || '')}, סגנון האירוע ומסגרת של כ־${budget}, אלו ההתאמות הראשוניות שמצאנו.`
    : `לפי אזור ${escapeHtml(data.region || '')} וסגנון האירוע, אלו ההתאמות הראשוניות שמצאנו.`;

  openSupplierModal(`
    <div class="venue-modal-head">
      <h2 id="supplier-modal-title">המלצות ${escapeHtml(data.category)}</h2>
      <p>${intro}</p>
    </div>
    <div class="venue-card-grid">
      ${data.suppliers.map(supplierCardHtml).join('')}
    </div>
    <p class="venue-modal-foot">ההתאמות הן הצעה ראשונית מתוך מאגר הספקים. מחירים, זמינות ופרטים סופיים חייבים בדיקה מול הספק.</p>
  `);
}

async function showSupplierRecommendations(btn) {
  const payload = {
    category: btn.dataset.category,
    region_id: Number(btn.dataset.regionId),
    region: btn.dataset.region,
    budget: Number(btn.dataset.budget),
    guests: Number(btn.dataset.guests),
    style: btn.dataset.style,
  };

  openSupplierModal(`
    <div class="venue-modal-loading">
      <h2>מחפשים ${escapeHtml(payload.category)} שמתאימים לכם...</h2>
      <p>בודקים התאמה לפי אזור, תקציב, סגנון וכמות אורחים.</p>
    </div>`);

  try {
    const res = await fetch('/api/suppliers/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.suppliers || !data.suppliers.length) {
      throw new Error(data.error || 'no suppliers');
    }
    renderSupplierRecommendations(data);
  } catch (err) {
    openSupplierModal(`
      <div class="venue-modal-message">
        <h2>לא הצלחנו לטעון המלצות כרגע</h2>
        <p>אפשר לנסות שוב בעוד רגע. אם התקלה חוזרת, נציג שלנו יוכל לבדוק עבורכם ספקים מתאימים ידנית.</p>
        <button type="button" class="btn btn-secondary" data-close-supplier-modal>סגירה</button>
      </div>`);
  }
}

function getFinalDecisionText(decision) {
  return decision === 'continue'
    ? 'רוצה להמשיך לארגן את החתונה עם WedWise'
    : 'רוצה לשמור את הדוח ולחשוב על זה';
}

function editAnswersFromReport() {
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = 'אישור הדוח';
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'צרו הדמיית חתונה';
  }
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.innerHTML = '';
  }
  if (invitationCta) invitationCta.hidden = true;
  closeWeddingImageModal();
  reportSection.hidden = true;
  questionnaireSection.hidden = false;
  goToStep(1, { focusFirstInput: false });
  questionnaireSection.scrollIntoView({ behavior: 'smooth' });
}

async function generateWeddingImageFromReport() {
  if (!latestReportText || !latestQuestionnaire) {
    setWeddingImageStatus('error', '<p>לא מצאנו דוח מוכן ליצירת תמונה. נסו למלא את השאלון מחדש.</p>');
    return;
  }

  if (!isReportConfirmed) {
    setWeddingImageStatus('error', '<p>לפני יצירת תמונה צריך לאשר שהדוח נראה נכון.</p>');
    return;
  }

  btnGenerateImage.disabled = true;
  btnGenerateImage.textContent = 'יוצרים תמונה...';
  setWeddingImageModal('loading', `
    <div class="wedding-image-loading wedding-image-modal-loading" role="status">
      <span aria-hidden="true"></span>
      <h2 id="wedding-image-modal-title">רק כמה רגעים</h2>
      <p>אנחנו מכינים עבורכם דוגמה לתמונה מהחתונה שלכם לפי הדוח שאישרתם.</p>
    </div>
  `);

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: latestReportText,
        questionnaire: latestQuestionnaire,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.imageUrl) {
      throw new Error(data.message || data.error || 'Image generation failed');
    }

    setWeddingImageModal('ready', `
      <figure class="wedding-image-card">
        <img src="${data.imageUrl}" alt="הדמיית חתונה שנוצרה לפי הדוח">
        <figcaption>הדמיית חתונה ראשונית לפי הדוח המאושר.</figcaption>
      </figure>
      <div class="wedding-image-download-row wedding-image-modal-actions">
        <a href="${data.imageUrl}" download="wedwise-wedding-visualization.png" class="btn btn-primary">
          שמירת התמונה
        </a>
        <button type="button" class="btn btn-primary" data-follow-up-decision="continue">
          להמשיך לארגן את החתונה איתנו
        </button>
        <button type="button" class="btn btn-secondary" data-follow-up-decision="thinking">
          תודה, זה נראה מעולה, אבל עוד אחשוב על זה
        </button>
      </div>
    `);
    latestImageGenerated = true;
  } catch (error) {
    console.error('WedWise: wedding image generation failed:', error);
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">לא הצלחנו ליצור תמונה כרגע</h2>
        <p>בדקו שה־OpenAI API key מוגדר בשרת ונסו שוב.</p>
        <div class="modal-error-actions">
          <button type="button" class="btn btn-primary" data-go-to-invitation>💌 המשיכו ליצירת ההזמנה</button>
          <button type="button" class="btn btn-secondary" data-close-image-modal>סגירה וחזרה לדוח</button>
        </div>
      </div>
    `);
  } finally {
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'צרו הדמיית חתונה';
  }
}

async function submitWeddingFollowUp(decision) {
  if (!latestPayload || !latestQuestionnaire) {
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">לא מצאנו את פרטי השאלון</h2>
        <p>כדי לשלוח את הבחירה, מלאו את השאלון מחדש.</p>
      </div>
    `);
    return;
  }

  const buttons = Array.from(document.querySelectorAll('[data-follow-up-decision]'));
  buttons.forEach((button) => {
    button.disabled = true;
  });

  setWeddingImageModal('loading', `
    <div class="wedding-image-loading wedding-image-modal-loading" role="status">
      <span aria-hidden="true"></span>
      <h2 id="wedding-image-modal-title">שולחים את הבחירה שלכם</h2>
      <p>אנחנו שומרים את הפרטים ומעדכנים את הצוות.</p>
    </div>
  `);

  try {
    const response = await fetch('/api/wedding-follow-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        submissionId: latestSubmissionId,
        leadId: latestLeadId,
        lead: {
          fullName: latestPayload.lead.full_name,
          phone: latestPayload.lead.phone,
          email: latestPayload.lead.email,
        },
        questionnaire: latestQuestionnaire,
        reportText: latestReportText,
        imageGenerated: latestImageGenerated,
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || data.error || 'Follow-up save failed');
    }

    if (data.submissionId) latestSubmissionId = data.submissionId;
    if (data.leadId) latestLeadId = data.leadId;

    const title = decision === 'continue'
      ? 'תודה, הפרטים נשלחו לצוות שלנו'
      : 'תודה, הבחירה שלכם נשמרה';
    const message = decision === 'continue'
      ? 'הנתונים שלכם כבר נשלחו לנציג/ה שלנו. ביום העבודה הקרוב ניצור איתכם קשר.'
      : 'שמרנו את הבחירה שלכם. תוכלו לחזור לדוח, ליצור הזמנה או ספירה לאחור, ואם תרצו להמשיך איתנו בהמשך נשמח לעזור.';

    setWeddingImageModal('ready', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">${title}</h2>
        <p>${message}</p>
        <p class="wedding-image-decision-note">בחירה שנשלחה: ${getFinalDecisionText(decision)}</p>
        <button type="button" class="btn btn-primary" data-close-image-modal>סגירה</button>
      </div>
    `);
  } catch (error) {
    console.error('WedWise: wedding follow-up failed:', error);
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">לא הצלחנו לשלוח את הבחירה</h2>
        <p>הפרטים לא נשמרו כרגע. נסו שוב בעוד רגע.</p>
        <button type="button" class="btn btn-secondary" data-close-image-modal>סגירה</button>
      </div>
    `);
  }
}

function formatTelegramMessage(payload) {
  const wr = payload.wedding_request;
  const lead = payload.lead;
  const style = (() => { try { return JSON.parse(wr.preferred_styles_json || '[]')[0] || '—'; } catch { return '—'; } })();

  const lines = [
    '🌿 *ליד חדש — WedWise*',
    '',
    `👤 *שם:* ${lead.full_name}`,
    `📞 *טלפון:* ${lead.phone}`,
    `📧 *אימייל:* ${lead.email || '—'}`,
    '',
    `💰 *תקציב:* ₪${wr.estimated_budget_ils.toLocaleString('he-IL')}`,
    `👥 *אורחים:* ${wr.guest_count}`,
    `📍 *אזור:* ${REGION_NAMES[String(wr.region_id)] || '—'}`,
    `🎨 *סגנון:* ${style}`,
    `🌸 *פרחים / עיצוב:* ${wr.flowers_and_decor || '—'}`,
    `🖊 *חזון אישי:* ${wr.free_text || '—'}`,
  ];

  if (wr.inspiration_url) {
    lines.push('', `🔗 *השראה:* ${wr.inspiration_url}`);
  }

  return lines.join('\n');
}

async function sendTelegramNotification(payload) {
  try {
    const response = await fetch('/api/telegram-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || `Telegram endpoint failed with status ${response.status}`);
    }
  } catch {
    // Non-blocking — Telegram failure must never prevent the report from showing
  }
}

async function submitQuestionnaire(payload, state) {
  latestPayload = payload;
  latestSubmissionId = null;
  latestLeadId = null;
  latestImageGenerated = false;

  // Telegram notification — fires in background, does not block report rendering
  sendTelegramNotification(payload);

  // Save to Supabase — non-blocking, failure does not prevent report from showing
  try {
    const wr = payload.wedding_request;
    const lead = payload.lead;

    const submissionBody = {
      budget: wr.estimated_budget_ils,
      guests: wr.guest_count,
      region: REGION_NAMES[String(wr.region_id)] || String(wr.region_id),
      weddingStyle: JSON.parse(wr.preferred_styles_json)[0] || '',
      colors: (wr.preferred_colors || '').split(',').map((c) => c.trim()).filter(Boolean),
      flowers: state.flowers,
      decorations: state.decorations,
      personalText: wr.free_text,
      inspirationUrl: wr.inspiration_url,
    };

    const subRes = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionBody),
    });

    if (subRes.ok) {
      const { submissionId } = await subRes.json();
      latestSubmissionId = submissionId;
      const leadRes = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          fullName: lead.full_name,
          phone: lead.phone,
          email: lead.email,
          suppressTelegram: true,
        }),
      });

      if (leadRes.ok) {
        const { leadId } = await leadRes.json();
        latestLeadId = leadId;
      }
    }
  } catch (err) {
    console.warn('WedWise: Supabase save failed (non-blocking):', err.message);
  }

  return generateMockReport(payload);
}

function resetForm() {
  form.reset();
  currentStep = 1;
  latestReportText = '';
  latestQuestionnaire = null;
  latestPayload = null;
  latestSubmissionId = null;
  latestLeadId = null;
  latestImageGenerated = false;
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = 'אישור הדוח';
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'צרו הדמיית חתונה';
  }
  goToStep(1);
  reportSection.hidden = true;
  questionnaireSection.hidden = false;
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.innerHTML = '';
  }
  if (invitationCta) invitationCta.hidden = true;
  closeWeddingImageModal();
  clearError();
  questionnaireSection.scrollIntoView({ behavior: 'smooth' });
}

btnNext.addEventListener('click', () => {
  if (currentStep < TOTAL_STEPS) {
    if (validateStep(currentStep)) {
      goToStep(currentStep + 1);
    }
  } else {
    form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  }
});

btnBack.addEventListener('click', () => {
  if (currentStep > 1) {
    goToStep(currentStep - 1);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  const state = getFormState();
  const payload = buildWeddingRequestPayload(state);
  latestQuestionnaire = buildImageQuestionnaire(state);

  btnNext.disabled = true;
  btnNext.textContent = 'מייצרים את הדוח...';

  try {
    const reportHtml = await submitQuestionnaire(payload, state);
    renderReport(reportHtml);
  } finally {
    btnNext.disabled = false;
    updateNavButtons(currentStep);
  }
});

btnRestart.addEventListener('click', resetForm);

if (btnEditAnswers) {
  btnEditAnswers.addEventListener('click', editAnswersFromReport);
}

if (btnConfirmReport) {
  btnConfirmReport.addEventListener('click', () => {
    isReportConfirmed = true;
    btnConfirmReport.hidden = true;
    if (btnGenerateImage) {
      btnGenerateImage.hidden = false;
      btnGenerateImage.disabled = false;
    }
    if (invitationCta) invitationCta.hidden = false;
    setWeddingImageStatus('confirmed', '<p>הדוח אושר. אפשר לבחור כלי המשך מתחת לדוח, או לעדכן אותנו אם תרצו שנמשיך איתכם מכאן.</p>');
    setWeddingImageModal('ready', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">הדוח נראה לכם נכון?</h2>
        <p>אפשר להמשיך עם WedWise מהנקודה הזאת, או לשמור את הדוח ולחשוב על זה בנחת.</p>
        <div class="wedding-image-download-row wedding-image-modal-actions">
          <button type="button" class="btn btn-primary" data-follow-up-decision="continue">
            להמשיך לארגן את החתונה איתנו
          </button>
          <button type="button" class="btn btn-secondary" data-follow-up-decision="thinking">
            תודה, אשמור את הדוח ואחשוב על זה
          </button>
        </div>
      </div>
    `);
  });
}

if (btnGenerateImage) {
  btnGenerateImage.addEventListener('click', generateWeddingImageFromReport);
}

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-image-modal]')) closeWeddingImageModal();
});

document.addEventListener('click', (event) => {
  const venueBtn = event.target.closest('[data-venue-recommend]');
  if (venueBtn) showVenueRecommendations(venueBtn);
});

document.addEventListener('click', (event) => {
  const supplierBtn = event.target.closest('[data-supplier-recommend]');
  if (supplierBtn) showSupplierRecommendations(supplierBtn);
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-venue-modal]')) closeVenueModal();
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-close-supplier-modal]')) closeSupplierModal();
});

document.addEventListener('click', (event) => {
  if (event.target.closest('[data-go-to-invitation]')) {
    closeWeddingImageModal();
    saveInvitationData();
    window.location.href = 'invitation.html';
  }
});

document.addEventListener('click', (event) => {
  const decisionButton = event.target.closest('[data-follow-up-decision]');
  if (!decisionButton) return;
  submitWeddingFollowUp(decisionButton.dataset.followUpDecision);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeWeddingImageModal();
    closeVenueModal();
  }
});

function saveInvitationData() {
  try {
    localStorage.setItem('wedwise_inv', JSON.stringify({
      name1:   latestPayload?.lead?.full_name || '',
      region:  latestQuestionnaire?.regionName || '',
      style:   latestQuestionnaire?.style || '',
      colors:  latestQuestionnaire?.colors || '',
      flowers: latestQuestionnaire?.flowers || '',
    }));
  } catch {
    // storage quota — navigate anyway
  }
}

function saveCountdownData() {
  try {
    const style = latestQuestionnaire?.style || '';
    const title = style ? `ספירה לאחור לחתונה בסגנון ${style}` : 'ספירה לאחור לחתונה';

    localStorage.setItem('wedwise_countdown', JSON.stringify({
      coupleNames: latestPayload?.lead?.full_name || '',
      customTitle: title,
      region: latestQuestionnaire?.regionName || '',
      style,
      colors: latestQuestionnaire?.colors || '',
      flowers: latestQuestionnaire?.flowers || '',
      decorations: latestQuestionnaire?.decorations || '',
      reportText: latestReportText || '',
      savedAt: new Date().toISOString(),
    }));
  } catch {
    // storage quota — navigate anyway
  }
}

if (btnOpenInvitationGenerator) {
  btnOpenInvitationGenerator.addEventListener('click', (event) => {
    event.preventDefault();
    saveInvitationData();
    window.location.href = 'invitation.html';
  });
}

if (btnOpenCountdownGenerator) {
  btnOpenCountdownGenerator.addEventListener('click', (event) => {
    event.preventDefault();
    saveCountdownData();
    window.location.href = 'countdown.html?from=report';
  });
}

form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'textarea') return;

  e.preventDefault();
  btnNext.click();
});

document.getElementById('estimated_budget_ils').addEventListener('input', function() {
  formatNumberInput(this);
});

document.getElementById('guest_count').addEventListener('input', function() {
  formatNumberInput(this);
});

goToStep(1, { focusFirstInput: false });
updateActiveNavLink();

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updateActiveNavLink();
});
window.addEventListener('scroll', updateActiveNavLink, { passive: true });
window.addEventListener('resize', updateActiveNavLink);
window.addEventListener('hashchange', updateActiveNavLink);
