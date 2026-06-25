/**
 * WedWise – Frontend v1
 * Multi-step questionnaire with mock report generation.
 * Payload shape aligns with wedding_requests + lead_submissions schema.
 */

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function startPageAtTop() {
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;

  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  root.style.scrollBehavior = previousScrollBehavior;

  if (window.location.hash) {
    history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }
}

startPageAtTop();
window.addEventListener('pageshow', () => {
  startPageAtTop();
  window.setTimeout(startPageAtTop, 0);
});

const TOTAL_STEPS = 5;

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
const siteHeader = document.querySelector('.site-header');
const howItWorksNav = document.querySelector('.nav-links a[href="#how-it-works"]');
const questionnaireNav = document.querySelector('.nav-links a[href="#questionnaire"]');

function setActiveNav(activeLink) {
  [howItWorksNav, questionnaireNav].forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'location');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function updateActiveNav() {
  const headerHeight = siteHeader.offsetHeight;
  const questionnaireStart = questionnaireSection.offsetTop - headerHeight - 80;
  const activeLink = window.scrollY >= questionnaireStart
    ? questionnaireNav
    : howItWorksNav;

  setActiveNav(activeLink);
}

let navUpdateRequested = false;
window.addEventListener('scroll', () => {
  if (navUpdateRequested) return;

  navUpdateRequested = true;
  window.requestAnimationFrame(() => {
    updateActiveNav();
    navUpdateRequested = false;
  });
}, { passive: true });

window.addEventListener('resize', updateActiveNav);
howItWorksNav.addEventListener('click', () => setActiveNav(howItWorksNav));
questionnaireNav.addEventListener('click', () => setActiveNav(questionnaireNav));

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

function updateProgress(step) {
  progressLabel.textContent = `שלב ${step} מתוך ${TOTAL_STEPS}`;
  progressFill.style.width = `${(step / TOTAL_STEPS) * 100}%`;
  progressBar.setAttribute('aria-valuenow', String(step));
}

function updateNavButtons(step) {
  btnBack.hidden = step === 1;
  btnNext.hidden = false;
  btnNext.disabled = false;
  btnNext.textContent = step === TOTAL_STEPS ? 'שליחה וקבלת דוח' : 'הבא';
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

  const activeFieldset = form.querySelector(`.form-step[data-step="${step}"]`);
  const firstInput = activeFieldset.querySelector('input, select, textarea');
  if (firstInput) {
    firstInput.focus();
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

  const venueBudget = Math.round(budget * 0.45);
  const cateringBudget = Math.round(budget * 0.30);
  const servicesBudget = Math.round(budget * 0.25);

  const flowersDecor = wr.flowers_and_decor || 'לא צוין';
  const freeTextBlock = wr.free_text
    ? `<p><strong>במילים שלכם:</strong> "${wr.free_text}"</p>`
    : '';

  const supplierTags = SUPPLIER_CATEGORIES.map(
    (cat) => `<span class="supplier-tag">${cat}</span>`
  ).join('');

  return `
    <div class="report-demo-banner">דוח לדוגמה — בגרסה הבאה הדוח ייווצר באמצעות בינה מלאכותית</div>
    <h2>דוח תכנון חתונה מותאם אישית</h2>
    <p class="report-greeting">שלום ${lead.full_name}, הנה תמונת המצב הראשונית שלכם</p>

    <div class="report-block">
      <h3>סיכום האירוע</h3>
      <p>
        חתונה בסגנון <strong>${style}</strong> באזור <strong>${region}</strong>,
        עם כ-<strong>${guests.toLocaleString('he-IL')}</strong> אורחים
        ותקציב משוער של <strong>${formatCurrency(budget)}</strong>.
      </p>
      <p>עלות משוערת לאורח: כ-<strong>${formatCurrency(perGuest)}</strong></p>
    </div>

    <div class="report-block">
      <h3>פילוח תקציב מומלץ</h3>
      <p>הערכה ראשונית לחלוקת התקציב — יתעדכן בדוח המלא:</p>
      <div class="budget-breakdown">
        <div class="budget-item">
          <strong>${formatCurrency(venueBudget)}</strong>
          <span>אולם / גן (~45%)</span>
        </div>
        <div class="budget-item">
          <strong>${formatCurrency(cateringBudget)}</strong>
          <span>קייטרינג (~30%)</span>
        </div>
        <div class="budget-item">
          <strong>${formatCurrency(servicesBudget)}</strong>
          <span>עיצוב, צילום ודי־ג׳יי (~25%)</span>
        </div>
      </div>
    </div>

    <div class="report-block">
      <h3>כיוון עיצובי</h3>
      <p><strong>צבעים:</strong> ${wr.preferred_colors}</p>
      <p><strong>פרחים וקישוטים:</strong> ${flowersDecor}</p>
      ${freeTextBlock}
      <div class="report-visual-placeholder">
        <span>המחשה עיצובית — בקרוב</span>
      </div>
    </div>

    <div class="report-block">
      <h3>צעדים מומלצים להמשך</h3>
      <ul>
        <li>בחירת רשימת מקומות קצרה באזור ${region}</li>
        <li>קביעת פגישות עם 2–3 די־ג׳יי בסגנון ${style}</li>
        <li>בחירת צלם/ת עם סגנון שמתאים לאווירה שתיארתם</li>
        <li>פגישת עיצוב ופרחים לפי הצבעים: ${wr.preferred_colors}</li>
        <li>הגדרת לוח זמנים ל-6–9 חודשים לפני האירוע</li>
      </ul>
    </div>

    <div class="report-block">
      <h3>קטגוריות ספקים לבדיקה</h3>
      <p>בדוח המלא נציג התאמות מספקי הדמו שלנו — לפי אזור, סגנון ותקציב:</p>
      <div class="supplier-categories">${supplierTags}</div>
    </div>
  `;
}

function renderReport(html) {
  reportContent.innerHTML = html;
  questionnaireSection.hidden = true;
  reportSection.hidden = false;
  reportSection.scrollIntoView({ behavior: 'smooth' });
}

async function submitQuestionnaire(payload) {
  const apiBaseUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';

  try {
    const response = await fetch(`${apiBaseUrl}/api/telegram-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn('Telegram delivery failed, showing local report');
    }
  } catch (error) {
    console.warn('Backend not available, showing local report:', error);
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
  if (!validateStep(currentStep)) return;

  if (currentStep < TOTAL_STEPS) {
    goToStep(currentStep + 1);
  } else if (currentStep === TOTAL_STEPS) {
    form.dispatchEvent(new Event('submit'));
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
    const reportHtml = await submitQuestionnaire(payload);
    renderReport(reportHtml);
  } catch {
    showError('לא הצלחנו לשלוח את הטופס כרגע. אנא נסו שוב בעוד רגע.');
  } finally {
    btnNext.disabled = false;
    btnNext.textContent = 'שליחה וקבלת דוח';
  }
});

btnRestart.addEventListener('click', resetForm);

form.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  const tag = e.target.tagName.toLowerCase();
  if (tag === 'textarea') return;

  e.preventDefault();
  if (currentStep < TOTAL_STEPS) {
    btnNext.click();
  } else if (currentStep === TOTAL_STEPS) {
    btnSubmit.click();
  }
});

goToStep(1);

const chatPanel = document.getElementById('chat-panel');
const chatLauncher = document.getElementById('chat-launcher');
const chatClose = document.getElementById('chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const chatMessages = document.getElementById('chat-messages');
const chatHistory = [];

function setChatOpen(isOpen) {
  chatPanel.hidden = !isOpen;
  chatPanel.setAttribute('aria-hidden', String(!isOpen));
  chatLauncher.setAttribute('aria-expanded', String(isOpen));
  chatLauncher.hidden = isOpen;

  if (isOpen) {
    window.requestAnimationFrame(() => chatInput.focus());
  } else {
    chatLauncher.focus();
  }
}

function addChatMessage(role, text, extraClass = '') {
  const message = document.createElement('div');
  message.className = `chat-message chat-message--${role} ${extraClass}`.trim();
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function setChatLoading(isLoading) {
  chatInput.disabled = isLoading;
  chatSend.disabled = isLoading;
}

async function sendChatMessage(message) {
  chatHistory.push({ role: 'user', content: message });
  addChatMessage('user', message);
  setChatLoading(true);

  const typingMessage = addChatMessage('assistant', 'כותב תשובה…', 'chat-message--typing');

  try {
    const apiBaseUrl = window.location.protocol === 'file:' ? 'http://localhost:3000' : '';
    const response = await fetch(`${apiBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: chatHistory.slice(-10) }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || 'Chat request failed');
    }

    typingMessage.remove();
    chatHistory.push({ role: 'assistant', content: data.reply });
    addChatMessage('assistant', data.reply);
  } catch (error) {
    typingMessage.remove();
    const serverUnavailable = error instanceof TypeError;
    const errorMessage = serverUnavailable
      ? 'השרת של WedWise לא פועל כרגע. יש להפעיל את האתר דרך השרת ולפתוח http://localhost:3000.'
      : 'מצטערים, הצ׳אט לא זמין כרגע. אפשר לנסות שוב בעוד רגע.';

    addChatMessage(
      'assistant',
      errorMessage,
      'chat-message--error'
    );
    console.warn('Chat request failed:', error);
  } finally {
    setChatLoading(false);
    chatInput.focus();
  }
}

chatLauncher.addEventListener('click', () => setChatOpen(true));
chatClose.addEventListener('click', () => setChatOpen(false));

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const message = chatInput.value.trim();
  if (!message || chatInput.disabled) return;

  chatInput.value = '';
  sendChatMessage(message);
});

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !chatPanel.hidden) {
    setChatOpen(false);
  }
});
