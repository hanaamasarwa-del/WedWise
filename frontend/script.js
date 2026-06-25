/**
 * WedWise – Frontend
 * Multi-step questionnaire connected to the WedWise backend.
 */

// Change this URL when the backend is deployed online
const API_URL = 'http://localhost:3000';

const TOTAL_STEPS = 5;

const REGION_NAMES = {
  '1': 'ירושלים והסביבה',
  '2': 'המרכז',
  '3': 'הצפון',
  '4': 'הדרום',
};

// Maps frontend region ID to backend string
const REGION_ID_TO_BACKEND = {
  '1': 'jerusalem',
  '2': 'center',
  '3': 'north',
  '4': 'south',
};

// Maps Hebrew style names to backend English values
const STYLE_HE_TO_BACKEND = {
  'רומנטי':      'romantic',
  'אלגנטי':      'classic',
  'כפרי':        'rustic',
  'מודרני':      'modern',
  'בוהו':        'boho',
  'מינימליסטי':  'minimalist',
  'אורבני':      'modern',
  'מסורתי':      'traditional',
};

const BUDGET_FIT_LABELS = {
  low:    'תקציב חסכוני',
  medium: 'תקציב בינוני',
  high:   'תקציב גדול',
};

let currentStep = 1;

const form                 = document.getElementById('wedding-form');
const formError            = document.getElementById('form-error');
const progressLabel        = document.getElementById('progress-label');
const progressFill         = document.getElementById('progress-fill');
const progressBar          = document.querySelector('.progress-bar');
const btnBack              = document.getElementById('btn-back');
const btnNext              = document.getElementById('btn-next');
const btnSubmit            = document.getElementById('btn-submit');
const btnRestart           = document.getElementById('btn-restart');
const questionnaireSection = document.getElementById('questionnaire');
const reportSection        = document.getElementById('report-section');
const reportContent        = document.getElementById('report-content');

// ─── Helpers ────────────────────────────────────────────────────────────────

function getCheckedValues(name) {
  return Array.from(form.querySelectorAll(`input[name="${name}"]:checked`)).map((el) => el.value);
}

function getFormState() {
  const styleInput = form.querySelector('input[name="preferred_style"]:checked');
  return {
    estimated_budget_ils: parseInt(form.estimated_budget_ils.value, 10) || 0,
    guest_count:          parseInt(form.guest_count.value, 10) || 0,
    region_id:            form.region_id.value,
    region_name:          REGION_NAMES[form.region_id.value] || '',
    preferred_style:      styleInput ? styleInput.value : '',
    preferred_colors:     form.preferred_colors.value.trim(),
    flowers:              getCheckedValues('flowers'),
    decorations:          getCheckedValues('decorations'),
    free_text:            form.free_text.value.trim(),
    full_name:            form.full_name.value.trim(),
    phone:                form.phone.value.trim(),
    email:                form.email.value.trim(),
  };
}

function formatCurrency(amount) {
  return Number(amount).toLocaleString('he-IL') + ' ₪';
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function clearError() {
  formError.textContent = '';
  formError.hidden = true;
}

// ─── Validation ──────────────────────────────────────────────────────────────

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

    case 5:
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

    default:
      return true;
  }
}

// ─── Step navigation ─────────────────────────────────────────────────────────

function updateProgress(step) {
  progressLabel.textContent = `שלב ${step} מתוך ${TOTAL_STEPS}`;
  progressFill.style.width = `${(step / TOTAL_STEPS) * 100}%`;
  progressBar.setAttribute('aria-valuenow', String(step));
}

function updateNavButtons(step) {
  btnBack.hidden   = step === 1;
  btnNext.hidden   = step === TOTAL_STEPS;
  btnSubmit.hidden = step !== TOTAL_STEPS;
}

function goToStep(step) {
  currentStep = step;
  form.querySelectorAll('.form-step').forEach((fieldset) => {
    const stepNum = parseInt(fieldset.dataset.step, 10);
    fieldset.classList.toggle('active', stepNum === step);
  });
  updateProgress(step);
  updateNavButtons(step);
  clearError();
  const firstInput = form.querySelector(`.form-step[data-step="${step}"] input, .form-step[data-step="${step}"] select, .form-step[data-step="${step}"] textarea`);
  if (firstInput) firstInput.focus();
}

// ─── API calls ───────────────────────────────────────────────────────────────

async function apiPost(path, body) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `שגיאה בבקשה ל-${path}`);
  return data;
}

async function apiGet(path) {
  const res = await fetch(`${API_URL}${path}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `שגיאה בבקשה ל-${path}`);
  return data;
}

// ─── Submit flow ─────────────────────────────────────────────────────────────

async function submitQuestionnaire(state) {
  // 1. Save submission
  const submissionPayload = {
    budget:       state.estimated_budget_ils,
    guests:       state.guest_count,
    region:       REGION_ID_TO_BACKEND[state.region_id] || 'center',
    weddingStyle: STYLE_HE_TO_BACKEND[state.preferred_style] || 'romantic',
    colors:       state.preferred_colors.split(',').map((c) => c.trim()).filter(Boolean),
    decorations:  state.decorations,
    flowers:      state.flowers,
    personalText: state.free_text,
  };

  const { submissionId } = await apiPost('/api/submissions', submissionPayload);

  // 2. Generate report + suppliers in parallel
  const [reportData, suppliersData] = await Promise.all([
    apiPost('/api/generate-report', { submissionId }),
    apiGet(`/api/suppliers/recommendations?submissionId=${submissionId}`),
  ]);

  // 3. Generate image
  const imageData = await apiPost('/api/generate-image', {
    submissionId,
    imagePrompt: reportData.imagePrompt,
  });

  // 4. Save lead (contact details)
  await apiPost('/api/leads', {
    submissionId,
    fullName:             state.full_name,
    phone:                state.phone,
    email:                state.email,
    preferredContactTime: 'לא צוין',
  });

  return { submissionId, reportData, suppliersData, imageData, state };
}

// ─── Report rendering ─────────────────────────────────────────────────────────

function buildSupplierCards(suppliers) {
  if (!suppliers || suppliers.length === 0) return '<p>לא נמצאו ספקים מתאימים.</p>';

  const categoryIcons = {
    'אולם / גן אירועים': '🏛️',
    'די־ג׳יי':           '🎵',
    'צילום':             '📷',
    'עיצוב ופרחים':      '💐',
    'קייטרינג':          '🍽️',
  };

  return suppliers.map((s) => {
    const icon = categoryIcons[s.category] || '✨';
    const price = s.priceUnit === 'לאורח'
      ? `${formatCurrency(s.priceMin)}–${formatCurrency(s.priceMax)} לאורח`
      : `${formatCurrency(s.priceMin)}–${formatCurrency(s.priceMax)} לחבילה`;

    return `
      <div class="supplier-card">
        <div class="supplier-card-header">
          <span class="supplier-icon">${icon}</span>
          <div>
            <strong class="supplier-name">${s.name}</strong>
            <span class="supplier-category">${s.category}</span>
          </div>
        </div>
        <p class="supplier-city">📍 ${s.city || s.region}</p>
        <p class="supplier-price">💰 ${price}</p>
        <p class="supplier-desc">${s.description}</p>
        <p class="supplier-reason">✅ ${s.reason}</p>
      </div>
    `;
  }).join('');
}

function renderReport({ reportData, suppliersData, imageData, state }) {
  const budget        = state.estimated_budget_ils;
  const guests        = state.guest_count;
  const perGuest      = Math.round(budget / guests);
  const budgetLabel   = BUDGET_FIT_LABELS[reportData.budgetFit] || '';
  const supplierCards = buildSupplierCards(suppliersData.suppliers);

  reportContent.innerHTML = `
    <h2>${reportData.title}</h2>
    <p class="report-greeting">שלום ${state.full_name}, הנה דוח תכנון החתונה המותאם אישית שלכם</p>

    <div class="report-block">
      <h3>סיכום האירוע</h3>
      <p>${reportData.summary}</p>
      <p>עלות משוערת לאורח: כ-<strong>${formatCurrency(perGuest)}</strong></p>
      <p>מסגרת תקציב: <strong>${budgetLabel}</strong> — ${reportData.budgetNotes}</p>
    </div>

    <div class="report-block">
      <h3>כיוון עיצובי</h3>
      <p>${reportData.designConcept}</p>
      <div class="report-visual-placeholder">
        <img src="${imageData.imageUrl}" alt="המחשה עיצובית לחתונה" style="max-width:100%;border-radius:12px;" />
      </div>
    </div>

    <div class="report-block">
      <h3>ספקים מומלצים לבדיקה</h3>
      <p>בחרנו עבורכם ספקים שמתאימים לאזור, לסגנון ולתקציב שלכם:</p>
      <div class="supplier-cards-grid">
        ${supplierCards}
      </div>
    </div>

    <div class="report-block">
      <h3>צעדים מומלצים להמשך</h3>
      <ul>
        <li>בחירת רשימת מקומות קצרה באזור ${state.region_name}</li>
        <li>קביעת פגישות עם 2–3 ספקים מהרשימה למעלה</li>
        <li>בחירת צלם/ת עם סגנון שמתאים לאווירה שתיארתם</li>
        <li>הגדרת לוח זמנים ל-6–9 חודשים לפני האירוע</li>
      </ul>
      <p class="report-followup">✅ הפרטים שלכם נשמרו — נציג מהסוכנות יחזור אליכם בקרוב!</p>
    </div>
  `;

  questionnaireSection.hidden = true;
  reportSection.hidden = false;
  reportSection.scrollIntoView({ behavior: 'smooth' });
}

// ─── Event listeners ──────────────────────────────────────────────────────────

btnNext.addEventListener('click', () => {
  if (validateStep(currentStep)) goToStep(currentStep + 1);
});

btnBack.addEventListener('click', () => {
  if (currentStep > 1) goToStep(currentStep - 1);
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateStep(currentStep)) return;

  const state = getFormState();

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'שומרים ומייצרים דוח...';
  clearError();

  try {
    const result = await submitQuestionnaire(state);
    renderReport(result);
  } catch (err) {
    console.error('Submit error:', err);
    showError('אירעה שגיאה בעת שליחת הטופס. אנא ודאו שהשרת פועל ונסו שוב.');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'שליחה וקבלת דוח';
  }
});

btnRestart.addEventListener('click', () => {
  form.reset();
  currentStep = 1;
  goToStep(1);
  reportSection.hidden = true;
  questionnaireSection.hidden = false;
  clearError();
  questionnaireSection.scrollIntoView({ behavior: 'smooth' });
});

form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  if (e.target.tagName.toLowerCase() === 'textarea') return;
  e.preventDefault();
  if (currentStep < TOTAL_STEPS) btnNext.click();
  else if (currentStep === TOTAL_STEPS) btnSubmit.click();
});

// ─── Add supplier card styles dynamically ────────────────────────────────────

const supplierStyles = document.createElement('style');
supplierStyles.textContent = `
  .supplier-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
  }
  .supplier-card {
    background: #fff;
    border: 1px solid #e8e0d5;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .supplier-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.25rem;
  }
  .supplier-icon { font-size: 1.5rem; }
  .supplier-name { display: block; font-weight: 600; font-size: 1rem; }
  .supplier-category { display: block; font-size: 0.8rem; color: #888; }
  .supplier-city, .supplier-price { margin: 0; font-size: 0.9rem; }
  .supplier-desc { margin: 0; font-size: 0.85rem; color: #555; }
  .supplier-reason { margin: 0; font-size: 0.82rem; color: #7a9e7e; }
  .report-followup { background: #f0f7f0; border-radius: 8px; padding: 0.75rem 1rem; margin-top: 1rem; font-weight: 500; }
`;
document.head.appendChild(supplierStyles);

// ─── Init ─────────────────────────────────────────────────────────────────────

goToStep(1);
