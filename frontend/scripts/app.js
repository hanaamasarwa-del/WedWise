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
const questionnaireSection = document.getElementById('questionnaire');
const reportSection = document.getElementById('report-section');
const reportContent = document.getElementById('report-content');
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

  // Supplier cards with icons
  const SUPPLIER_ICONS = {
    'אולם / גן אירועים': 'location_city',
    'די־ג׳יי':           'music_note',
    'צילום':              'photo_camera',
    'עיצוב ופרחים':      'local_florist',
    'קייטרינג':           'restaurant',
  };

  const supplierCards = SUPPLIER_CATEGORIES.map((cat) => `
    <div class="rpt-supplier-card">
      <span class="material-symbols-outlined rpt-supplier-icon" aria-hidden="true">${SUPPLIER_ICONS[cat] || 'storefront'}</span>
      <span class="rpt-supplier-name">${cat}</span>
    </div>`).join('');

  // Optional inspiration link block — only rendered when a URL was provided
  const inspirationBlock = wr.inspiration_url ? `
    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-block">
      <div class="rpt-block-title">
        <span class="material-symbols-outlined" aria-hidden="true">link</span>
        <h3>השראה לחתונה</h3>
      </div>
      <a href="${wr.inspiration_url}" target="_blank" rel="noopener noreferrer" class="rpt-inspiration-link">
        <span class="material-symbols-outlined" aria-hidden="true">open_in_new</span>
        ${wr.inspiration_url}
      </a>
    </div>` : '';

  return `
    <div class="rpt-header">
      <span class="rpt-demo-badge">
        <span class="material-symbols-outlined" aria-hidden="true">science</span>
        דוח לדוגמה — בגרסה הבאה ייווצר באמצעות AI
      </span>
      <div class="rpt-title-row">
        <span class="rpt-ornament" aria-hidden="true">✦</span>
        <h2>דוח תכנון חתונה</h2>
        <span class="rpt-ornament" aria-hidden="true">✦</span>
      </div>
      <p class="rpt-subtitle">שלום <strong>${lead.full_name}</strong>, הנה תמונת המצב הראשונית שלכם</p>
    </div>

    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-stats">
      <div class="rpt-stat">
        <span class="material-symbols-outlined rpt-stat-icon" aria-hidden="true">groups</span>
        <strong class="rpt-stat-value">${guests.toLocaleString('he-IL')}</strong>
        <span class="rpt-stat-label">אורחים</span>
      </div>
      <div class="rpt-stat">
        <span class="material-symbols-outlined rpt-stat-icon" aria-hidden="true">payments</span>
        <strong class="rpt-stat-value">${formatCurrency(budget)}</strong>
        <span class="rpt-stat-label">תקציב כולל</span>
      </div>
      <div class="rpt-stat">
        <span class="material-symbols-outlined rpt-stat-icon" aria-hidden="true">person</span>
        <strong class="rpt-stat-value">${formatCurrency(perGuest)}</strong>
        <span class="rpt-stat-label">עלות לאורח</span>
      </div>
      <div class="rpt-stat">
        <span class="material-symbols-outlined rpt-stat-icon" aria-hidden="true">location_on</span>
        <strong class="rpt-stat-value">${region}</strong>
        <span class="rpt-stat-label">אזור</span>
      </div>
    </div>

    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-block">
      <div class="rpt-block-title">
        <span class="material-symbols-outlined" aria-hidden="true">pie_chart</span>
        <h3>פילוח תקציב מומלץ</h3>
      </div>
      <p class="rpt-block-sub">הערכה ראשונית — יתעדכן בדוח המלא</p>
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
    </div>

    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-block">
      <div class="rpt-block-title">
        <span class="material-symbols-outlined" aria-hidden="true">palette</span>
        <h3>כיוון עיצובי</h3>
      </div>
      <div class="rpt-design-grid">
        <div class="rpt-design-item">
          <span class="rpt-design-label">סגנון</span>
          <span class="rpt-style-badge">${style}</span>
        </div>
        <div class="rpt-design-item">
          <span class="rpt-design-label">צבעים</span>
          <div class="rpt-chips">${colorTags}</div>
        </div>
      </div>
      ${flowersSection}
      ${freeTextBlock}
    </div>

    ${inspirationBlock}

    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-block">
      <div class="rpt-block-title">
        <span class="material-symbols-outlined" aria-hidden="true">checklist</span>
        <h3>צעדים מומלצים להמשך</h3>
      </div>
      <div class="rpt-timeline">
        <div class="rpt-tl-item">
          <div class="rpt-tl-marker" aria-hidden="true">1</div>
          <div class="rpt-tl-body">
            <h4>בחירת אולם / גן אירועים</h4>
            <p>ריכוז 3–5 מקומות באזור ${region} התואמים לתקציב ולסגנון ${style}.</p>
          </div>
        </div>
        <div class="rpt-tl-item">
          <div class="rpt-tl-marker" aria-hidden="true">2</div>
          <div class="rpt-tl-body">
            <h4>פגישות עם ספקי מוזיקה</h4>
            <p>קביעת 2–3 פגישות עם די־ג׳יי בעלי רפרטואר שמתאים לאווירה שתיארתם.</p>
          </div>
        </div>
        <div class="rpt-tl-item">
          <div class="rpt-tl-marker" aria-hidden="true">3</div>
          <div class="rpt-tl-body">
            <h4>בחירת צלם/ת</h4>
            <p>חפשו צלם/ת עם תיק עבודות שמשדר את הסגנון ${style}.</p>
          </div>
        </div>
        <div class="rpt-tl-item">
          <div class="rpt-tl-marker" aria-hidden="true">4</div>
          <div class="rpt-tl-body">
            <h4>פגישת עיצוב ופרחים</h4>
            <p>הציגו לעצב/ת את צבעי הקונספט: ${wr.preferred_colors}.</p>
          </div>
        </div>
        <div class="rpt-tl-item">
          <div class="rpt-tl-marker" aria-hidden="true">5</div>
          <div class="rpt-tl-body">
            <h4>בניית לוח זמנים</h4>
            <p>הגדירו לוח זמנים של 6–9 חודשים לפני האירוע עם נקודות ציון לכל ספק.</p>
          </div>
        </div>
      </div>
    </div>

    <div class="rpt-divider" aria-hidden="true"></div>

    <div class="rpt-block">
      <div class="rpt-block-title">
        <span class="material-symbols-outlined" aria-hidden="true">storefront</span>
        <h3>קטגוריות ספקים לבדיקה</h3>
      </div>
      <p class="rpt-block-sub">בדוח המלא נציג התאמות לפי אזור, סגנון ותקציב</p>
      <div class="rpt-suppliers">
        ${supplierCards}
      </div>
    </div>
  `;
}

function renderReport(html) {
  reportContent.innerHTML = html;
  questionnaireSection.hidden = true;
  reportSection.hidden = false;
  reportSection.scrollIntoView({ behavior: 'smooth' });
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
  goToStep(1);
  reportSection.hidden = true;
  questionnaireSection.hidden = false;
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
