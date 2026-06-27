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

let currentStep = 1;
let latestReportText = '';
let latestQuestionnaire = null;
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
    estimated_budget_ils: parseInt(form.estimated_budget_ils.value, 10) || 0,
    guest_count: parseInt(form.guest_count.value, 10) || 0,
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

  const supplierCards = SUPPLIER_CATEGORIES.map((cat) => `
    <div class="rpt-supplier-card">
      <span class="rpt-supplier-name">${cat}</span>
    </div>`).join('');

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
        <p class="rpt-block-sub">בדוח המלא נציג התאמות לפי אזור, סגנון ותקציב.</p>
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
    btnGenerateImage.textContent = 'יצירת תמונת חתונה';
  }
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.className = 'wedding-image-result';
    weddingImageResult.innerHTML = '';
  }
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
    btnGenerateImage.textContent = 'יצירת תמונת חתונה';
  }
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.innerHTML = '';
  }
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
      <div class="wedding-image-download-row">
        <a href="${data.imageUrl}" download="wedwise-wedding-visualization.png" class="btn btn-primary">
          שמירת התמונה
        </a>
      </div>
    `);
  } catch (error) {
    console.error('WedWise: wedding image generation failed:', error);
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">לא הצלחנו ליצור תמונה כרגע</h2>
        <p>בדקו שה־OpenAI API key מוגדר בשרת ונסו שוב.</p>
      </div>
    `);
  } finally {
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'יצירת תמונת חתונה';
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
    };

    const subRes = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submissionBody),
    });

    if (subRes.ok) {
      const { submissionId } = await subRes.json();
      await fetch('/api/leads', {
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
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = 'אישור הדוח';
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = 'יצירת תמונת חתונה';
  }
  goToStep(1);
  reportSection.hidden = true;
  questionnaireSection.hidden = false;
  if (weddingImageResult) {
    weddingImageResult.hidden = true;
    weddingImageResult.innerHTML = '';
  }
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
      btnGenerateImage.focus({ preventScroll: true });
    }
    setWeddingImageStatus('confirmed', '<p>הדוח אושר. עכשיו אפשר ליצור הדמיית חתונה לפי התוכן שלו.</p>');
  });
}

if (btnGenerateImage) {
  btnGenerateImage.addEventListener('click', generateWeddingImageFromReport);
}

document.querySelectorAll('[data-close-image-modal]').forEach((element) => {
  element.addEventListener('click', closeWeddingImageModal);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeWeddingImageModal();
});

form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'textarea') return;

  e.preventDefault();
  btnNext.click();
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
