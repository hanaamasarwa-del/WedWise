/**
 * WedWise – Frontend v1
 * Multi-step questionnaire with mock report generation.
 * Payload shape aligns with wedding_requests + lead_submissions schema.
 */

const TOTAL_STEPS = 6;
const i18n = window.WedWiseI18n;
const isEnglish = () => i18n?.isEnglish?.() === true;
const tx = (heText, enText) => (isEnglish() ? enText : heText);
const currentLocale = () => (isEnglish() ? 'en-US' : 'he-IL');

const REGION_NAMES = {
  '1': 'ירושלים והסביבה',
  '2': 'המרכז',
  '3': 'הצפון',
  '4': 'הדרום',
};

const REGION_NAMES_EN = {
  '1': 'Jerusalem area',
  '2': 'Central Israel',
  '3': 'Northern Israel',
  '4': 'Southern Israel',
};

const VALUE_LABELS_EN = {
  'ירושלים והסביבה': 'Jerusalem area',
  'המרכז': 'Central Israel',
  'הצפון': 'Northern Israel',
  'הדרום': 'Southern Israel',
  'רומנטי': 'Romantic',
  'אלגנטי': 'Elegant',
  'כפרי': 'Rustic',
  'מודרני': 'Modern',
  'בוהו': 'Boho',
  'מינימליסטי': 'Minimalist',
  'אורבני': 'Urban',
  'מסורתי': 'Traditional',
  'ורדים': 'Roses',
  'אנמונים': 'Anemones',
  'אביביים': 'Spring flowers',
  'סוקולנטים': 'Succulents',
  'סחלבים': 'Orchids',
  'פרחי שדה': 'Wildflowers',
  'נרות': 'Candles',
  'תאורה רכה': 'Soft lighting',
  'בדים ווילונות': 'Fabrics and drapes',
  'עץ וטבע': 'Wood and nature',
  'זהב ומתכת': 'Gold and metal',
  'אולם / גן אירועים': 'Venue / event garden',
  'די־ג׳יי': 'DJ',
  'צילום': 'Photography',
  'עיצוב ופרחים': 'Design and flowers',
  'קייטרינג': 'Catering',
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

const SUPPLIER_RECOMMENDATION_LABELS_EN = {
  'די־ג׳יי': 'Show DJ recommendations',
  'צילום': 'Show photography recommendations',
  'עיצוב ופרחים': 'Show design recommendations',
  'קייטרינג': 'Show catering recommendations',
};

function formatNumberInput(input) {
  input.value = input.value.replace(/[^\d]/g, '');
  const num = parseInt(input.value, 10);
  if (!isNaN(num)) {
    input.value = num.toLocaleString(currentLocale());
  }
}

function displayValue(value) {
  return isEnglish() ? (VALUE_LABELS_EN[value] || value) : value;
}

function englishValue(value) {
  return VALUE_LABELS_EN[value] || value;
}

function displayList(values) {
  return values.map(displayValue).join(', ');
}

function englishList(values) {
  return values.map(englishValue).join(', ');
}

function getTodayIsoDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentIsoMonth() {
  return getTodayIsoDate().slice(0, 7);
}

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

function getDaysInMonth(year, month) {
  return new Date(Number(year), Number(month), 0).getDate();
}

function getMonthName(monthIndex) {
  return new Date(2026, monthIndex - 1, 1).toLocaleDateString(currentLocale(), {
    month: 'long',
  });
}

function formatIsoDateForDisplay(value) {
  if (!value) return '';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return value;
  return new Date(year, month - 1, day).toLocaleDateString(currentLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatMonthForDisplay(value) {
  if (!value) return '';
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return value;
  return new Date(year, month - 1, 1).toLocaleDateString(currentLocale(), {
    year: 'numeric',
    month: 'long',
  });
}

function buildWeddingDateLabel(state) {
  if (state.wedding_date_mode === 'range') {
    const from = formatMonthForDisplay(state.wedding_month_from);
    const to = formatMonthForDisplay(state.wedding_month_to);
    return from && to ? `${from} - ${to}` : '';
  }
  return formatIsoDateForDisplay(state.wedding_date_exact);
}

function setSelectOptions(select, options, placeholder) {
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = '';

  const placeholderOption = document.createElement('option');
  placeholderOption.value = '';
  placeholderOption.textContent = placeholder;
  select.appendChild(placeholderOption);

  options.forEach((option) => {
    const el = document.createElement('option');
    el.value = option.value;
    el.textContent = option.label;
    el.disabled = Boolean(option.disabled);
    select.appendChild(el);
  });

  if (currentValue && Array.from(select.options).some((option) => option.value === currentValue && !option.disabled)) {
    select.value = currentValue;
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
  syncExactWeddingDateValue();
  syncWeddingRangeValue();
  const styleInput = form.querySelector('input[name="preferred_style"]:checked');

  const state = {
    estimated_budget_ils: parseInt(form.estimated_budget_ils.value.replace(/[^\d]/g, ''), 10) || 0,
    guest_count: parseInt(form.guest_count.value.replace(/[^\d]/g, ''), 10) || 0,
    region_id: form.region_id.value,
    region_name: REGION_NAMES[form.region_id.value] || '',
    region_display_name: isEnglish()
      ? (REGION_NAMES_EN[form.region_id.value] || '')
      : (REGION_NAMES[form.region_id.value] || ''),
    wedding_date_mode: form.wedding_date_mode?.value || 'exact',
    wedding_date_exact: form.wedding_date_exact?.value || '',
    wedding_month_from: form.wedding_month_from?.value || '',
    wedding_month_to: form.wedding_month_to?.value || '',
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
  state.wedding_date_label = buildWeddingDateLabel(state);
  return state;
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
      wedding_date_mode: state.wedding_date_mode,
      wedding_date_exact: state.wedding_date_exact || null,
      wedding_month_from: state.wedding_month_from || null,
      wedding_month_to: state.wedding_month_to || null,
      wedding_date_label: state.wedding_date_label,
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
        showError(tx('נא להזין תקציב משוער גדול מאפס.', 'Please enter an estimated budget greater than zero.'));
        return false;
      }
      if (!state.guest_count || state.guest_count < 20) {
        showError(tx('נא להזין מספר אורחים של לפחות 20.', 'Please enter at least 20 guests.'));
        return false;
      }
      if (state.wedding_date_mode === 'range') {
        if (!state.wedding_month_from || !state.wedding_month_to) {
          showError(tx('נא לבחור טווח חודשים ושנים לחתונה.', 'Please choose a month and year range for the wedding.'));
          return false;
        }
        if (state.wedding_month_from < getCurrentIsoMonth() || state.wedding_month_to < getCurrentIsoMonth()) {
          showError(tx('לא ניתן לבחור חודש שכבר עבר.', 'You cannot choose a month that has already passed.'));
          return false;
        }
        if (state.wedding_month_from > state.wedding_month_to) {
          showError(tx('טווח החתונה לא תקין. חודש ההתחלה חייב להיות לפני חודש הסיום.', 'The wedding range is invalid. The start month must be before the end month.'));
          return false;
        }
      } else if (!state.wedding_date_exact) {
        showError(tx('נא לבחור תאריך חתונה מדויק או לעבור לטווח משוער.', 'Please choose an exact wedding date or switch to an estimated range.'));
        return false;
      } else if (state.wedding_date_exact < getTodayIsoDate()) {
        showError(tx('לא ניתן לבחור תאריך שכבר עבר.', 'You cannot choose a date that has already passed.'));
        return false;
      }
      return true;

    case 2:
      if (!state.region_id) {
        showError(tx('נא לבחור אזור בארץ.', 'Please choose a region in Israel.'));
        return false;
      }
      if (!state.preferred_style) {
        showError(tx('נא לבחור סגנון חתונה.', 'Please choose a wedding style.'));
        return false;
      }
      return true;

    case 3:
      if (!state.preferred_colors) {
        showError(tx('נא להזין צבעים מועדפים.', 'Please enter preferred colors.'));
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
        showError(tx(
          'נא להזין קישור תקין (לדוגמה: https://www.pinterest.com/...) או לרוקן את השדה ולדלג.',
          'Please enter a valid link (for example: https://www.pinterest.com/...) or clear the field and skip it.'
        ));
        return false;
      }
    }

    case 6: {
      if (!state.full_name) {
        showError(tx('נא להזין שם מלא.', 'Please enter a full name.'));
        return false;
      }
      if (!state.phone || state.phone.length < 9) {
        showError(tx('נא להזין מספר טלפון תקין.', 'Please enter a valid phone number.'));
        return false;
      }
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!state.email || !emailPattern.test(state.email)) {
        showError(tx('נא להזין כתובת אימייל תקינה.', 'Please enter a valid email address.'));
        return false;
      }
      return true;
    }

    default:
      return true;
  }
}

function updateProgress(step) {
  progressLabel.textContent = tx(`שלב ${step} מתוך ${TOTAL_STEPS}`, `Step ${step} of ${TOTAL_STEPS}`);
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
  btnNext.textContent = step === TOTAL_STEPS
    ? tx('שליחה וקבלת דוח', 'Submit and get report')
    : tx('הבא', 'Next');
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

function updateWeddingDateMode() {
  const mode = form.wedding_date_mode?.value || 'exact';
  form.querySelectorAll('[data-date-mode-panel]').forEach((panel) => {
    const isActive = panel.dataset.dateModePanel === mode;
    panel.hidden = !isActive;
    panel.querySelectorAll('input, select').forEach((field) => {
      field.disabled = !isActive;
    });
  });
}

function populateExactWeddingDateControls() {
  const yearSelect = form.wedding_year_exact;
  const monthSelect = form.wedding_month_exact;
  const daySelect = form.wedding_day_exact;
  if (!yearSelect || !monthSelect || !daySelect) return;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();
  const selectedYear = Number(yearSelect.value) || currentYear;
  const selectedMonth = Number(monthSelect.value) || currentMonth;

  const yearOptions = Array.from({ length: 16 }, (_, index) => {
    const year = currentYear + index;
    return { value: String(year), label: String(year) };
  });
  setSelectOptions(yearSelect, yearOptions, tx('בחרו שנה', 'Choose year'));

  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      value: padDatePart(month),
      label: getMonthName(month),
      disabled: selectedYear === currentYear && month < currentMonth,
    };
  });
  setSelectOptions(monthSelect, monthOptions, tx('בחרו חודש', 'Choose month'));

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const dayOptions = Array.from({ length: daysInMonth }, (_, index) => {
    const day = index + 1;
    return {
      value: padDatePart(day),
      label: String(day),
      disabled: selectedYear === currentYear && selectedMonth === currentMonth && day < currentDay,
    };
  });
  setSelectOptions(daySelect, dayOptions, tx('בחרו יום', 'Choose day'));
}

function syncExactWeddingDateValue() {
  const year = form.wedding_year_exact?.value || '';
  const month = form.wedding_month_exact?.value || '';
  const day = form.wedding_day_exact?.value || '';
  if (!form.wedding_date_exact) return;
  form.wedding_date_exact.value = year && month && day ? `${year}-${month}-${day}` : '';
}

function refreshExactWeddingDateControls() {
  populateExactWeddingDateControls();
  syncExactWeddingDateValue();
}

function populateWeddingRangeControls() {
  const fromYearSelect = form.wedding_range_from_year;
  const fromMonthSelect = form.wedding_range_from_month;
  const toYearSelect = form.wedding_range_to_year;
  const toMonthSelect = form.wedding_range_to_month;
  if (!fromYearSelect || !fromMonthSelect || !toYearSelect || !toMonthSelect) return;

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const selectedFromYear = Number(fromYearSelect.value) || currentYear;
  const selectedToYear = Number(toYearSelect.value) || selectedFromYear;

  const yearOptions = Array.from({ length: 16 }, (_, index) => {
    const year = currentYear + index;
    return { value: String(year), label: String(year) };
  });
  setSelectOptions(fromYearSelect, yearOptions, tx('בחרו שנה', 'Choose year'));
  setSelectOptions(toYearSelect, yearOptions, tx('בחרו שנה', 'Choose year'));

  const buildMonthOptions = (selectedYear) => Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    return {
      value: padDatePart(month),
      label: getMonthName(month),
      disabled: selectedYear === currentYear && month < currentMonth,
    };
  });

  setSelectOptions(fromMonthSelect, buildMonthOptions(selectedFromYear), tx('בחרו חודש', 'Choose month'));
  setSelectOptions(toMonthSelect, buildMonthOptions(selectedToYear), tx('בחרו חודש', 'Choose month'));
}

function syncWeddingRangeValue() {
  const fromYear = form.wedding_range_from_year?.value || '';
  const fromMonth = form.wedding_range_from_month?.value || '';
  const toYear = form.wedding_range_to_year?.value || '';
  const toMonth = form.wedding_range_to_month?.value || '';

  if (form.wedding_month_from) {
    form.wedding_month_from.value = fromYear && fromMonth ? `${fromYear}-${fromMonth}` : '';
  }
  if (form.wedding_month_to) {
    form.wedding_month_to.value = toYear && toMonth ? `${toYear}-${toMonth}` : '';
  }
}

function refreshWeddingRangeControls() {
  populateWeddingRangeControls();
  syncWeddingRangeValue();
}

function formatCurrency(amount) {
  return amount.toLocaleString(currentLocale()) + ' ₪';
}

function generateMockReport(payload) {
  const wr = payload.wedding_request;
  const lead = payload.lead;
  const budget = wr.estimated_budget_ils;
  const guests = wr.guest_count;
  const perGuest = Math.round(budget / guests);
  const style = JSON.parse(wr.preferred_styles_json)[0];
  const styleLabel = displayValue(style);
  const region = isEnglish()
    ? (REGION_NAMES_EN[String(wr.region_id)] || '')
    : (REGION_NAMES[String(wr.region_id)] || '');
  const weddingDateLabel = wr.wedding_date_label || tx('לא צוין', 'Not specified');

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
      .map((t) => `<span class="rpt-chip">${displayValue(t.trim())}</span>`).join('');

  const flowerChips = chips(fdParts['פרחים']);
  const decorChips  = chips(fdParts['קישוטים']);

  const flowersSection = (flowerChips || decorChips) ? `
    <div class="rpt-design-row">
      ${flowerChips ? `<div class="rpt-design-item"><span class="rpt-design-label">${tx('פרחים', 'Flowers')}</span><div class="rpt-chips">${flowerChips}</div></div>` : ''}
      ${decorChips  ? `<div class="rpt-design-item"><span class="rpt-design-label">${tx('קישוטים', 'Decorations')}</span><div class="rpt-chips">${decorChips}</div></div>`  : ''}
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
        ${tx('הצג המלצות אולמות', 'Show venue recommendations')}
      </button>` : '';
    const supplierBtn = supplierButtonLabel ? `
      <button type="button" class="rpt-venue-btn rpt-supplier-btn" data-supplier-recommend
        data-category="${escapeHtml(cat)}" data-region-id="${wr.region_id}"
        data-region="${escapeHtml(region)}" data-budget="${budget}"
        data-guests="${guests}" data-style="${escapeHtml(style)}">
        ${isEnglish() ? (SUPPLIER_RECOMMENDATION_LABELS_EN[cat] || supplierButtonLabel) : supplierButtonLabel}
      </button>` : '';
    return `
    <div class="rpt-supplier-card${isVenue ? ' rpt-supplier-card--venue' : supplierButtonLabel ? ' rpt-supplier-card--recommendable' : ''}">
      <span class="rpt-supplier-name">${displayValue(cat)}</span>
      ${venueBtn || supplierBtn}
    </div>`;
  }).join('');

  const reportDate = new Date().toLocaleDateString(currentLocale());
  const reportId = `#WW-${String(Date.now()).slice(-6)}`;

  // Optional inspiration link block — only rendered when a URL was provided
  const inspirationBlock = wr.inspiration_url ? `
    <section class="rpt-section">
      <div class="rpt-section-heading">
        <span class="rpt-mark" aria-hidden="true">↗</span>
        <h3>${tx('השראה לחתונה', 'Wedding inspiration')}</h3>
      </div>
      <a href="${wr.inspiration_url}" target="_blank" rel="noopener noreferrer" class="rpt-inspiration-link">
        <span aria-hidden="true">↗</span>
        ${wr.inspiration_url}
      </a>
    </section>` : '';

  return `
    <article class="rpt-document" aria-label="${tx('דוח תכנון חתונה', 'Wedding planning report')}">
      <div class="rpt-floral rpt-floral-top" aria-hidden="true"></div>
      <div class="rpt-floral rpt-floral-bottom" aria-hidden="true"></div>

      <header class="rpt-doc-header">
        <div class="rpt-brand-block">
          <h2>WedWise</h2>
        </div>
        <div class="rpt-doc-meta">
          <span>${tx('מספר דוח:', 'Report ID:')} ${reportId}</span>
          <span>${tx('תאריך הפקה:', 'Generated:')} ${reportDate}</span>
        </div>
      </header>

      <div class="rpt-report-title">
        <h3>${tx('סיכום תכנון אסטרטגי', 'Strategic planning summary')}</h3>
        <p>${tx('שלום', 'Hello')} <strong>${lead.full_name}</strong>, ${tx('הנה תמונת המצב הראשונית שלכם לפי התשובות בשאלון.', 'here is your initial planning picture based on the questionnaire answers.')}</p>
      </div>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">♥</span>
          <h3>${tx('סקירת חתונה', 'Wedding overview')}</h3>
        </div>
        <div class="rpt-overview-grid">
          <div>
            <span>${tx('איש קשר', 'Contact person')}</span>
            <strong>${lead.full_name}</strong>
          </div>
          <div>
            <span>${tx('כמות מוזמנים', 'Guest count')}</span>
            <strong>${guests.toLocaleString(currentLocale())} ${tx('אורחים', 'guests')}</strong>
          </div>
          <div>
            <span>${tx('מיקום מועדף', 'Preferred location')}</span>
            <strong>${region}</strong>
          </div>
          <div>
            <span>${tx('תאריך החתונה', 'Wedding date')}</span>
            <strong>${weddingDateLabel}</strong>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">§</span>
          <h3>${tx('פרטי תכנון מהשאלון', 'Planning details from the questionnaire')}</h3>
        </div>
        <div class="rpt-details-grid">
          <div class="rpt-detail-row">
            <span>${tx('תקציב יעד', 'Target budget')}</span>
            <strong>${formatCurrency(budget)}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>${tx('עלות משוערת לאורח', 'Estimated cost per guest')}</span>
            <strong>${formatCurrency(perGuest)}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>${tx('תאריך או טווח חתונה', 'Wedding date or range')}</span>
            <strong>${weddingDateLabel}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>${tx('סגנון עיצובי', 'Design style')}</span>
            <strong>${styleLabel}</strong>
          </div>
          <div class="rpt-detail-row">
            <span>${tx('צבעים מועדפים', 'Preferred colors')}</span>
            <strong>${wr.preferred_colors || tx('לא צוין', 'Not specified')}</strong>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">✦</span>
          <h3>${tx('כיוון עיצובי', 'Design direction')}</h3>
        </div>
        <div class="rpt-design-summary">
          <div>
            <span class="rpt-design-label">${tx('סגנון', 'Style')}</span>
            <span class="rpt-style-badge">${styleLabel}</span>
          </div>
          <div>
            <span class="rpt-design-label">${tx('צבעים', 'Colors')}</span>
            <div class="rpt-chips">${colorTags || `<span class="rpt-chip">${tx('לא צוין', 'Not specified')}</span>`}</div>
          </div>
          ${flowersSection}
        </div>
        ${freeTextBlock}
      </section>

      ${inspirationBlock}

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">◇</span>
          <h3>${tx('סדר פעולות מומלץ', 'Recommended action plan')}</h3>
        </div>
        <div class="rpt-timeline-grid">
          <div>
            <span>${tx('שלב פתיחה', 'Opening stage')}</span>
            <p>${tx('בחירת מקום, בדיקת צילום, די־ג׳יי וקייטרינג לפי דחיפות האירוע.', 'Choose a venue and check photography, DJ, and catering according to event urgency.')}</p>
          </div>
          <div>
            <span>${tx('שלב המשך', 'Next stage')}</span>
            <p>${tx('גיבוש עיצוב, פרחים, לוח השראה וסגירת ספקים מרכזיים לפי לוח הזמנים שלכם.', 'Refine design, flowers, mood board, and key suppliers according to your timeline.')}</p>
          </div>
        </div>
      </section>

      <section class="rpt-section rpt-budget-analysis">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">₪</span>
          <h3>${tx('ניתוח תקציבי מקצועי', 'Professional budget analysis')}</h3>
        </div>
        <div class="rpt-budget-layout">
          <div class="rpt-budget-bars">
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>${tx('אולם / גן אירועים', 'Venue / event garden')}</span><strong>${formatCurrency(venueBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:45%"></div></div><span class="rpt-bar-pct">45%</span></div>
            </div>
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>${tx('קייטרינג', 'Catering')}</span><strong>${formatCurrency(cateringBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:30%"></div></div><span class="rpt-bar-pct">30%</span></div>
            </div>
            <div class="rpt-budget-row">
              <div class="rpt-budget-meta"><span>${tx('עיצוב, צילום ודי־ג׳יי', 'Design, photography, and DJ')}</span><strong>${formatCurrency(servicesBudget)}</strong></div>
              <div class="rpt-bar-wrap"><div class="rpt-bar-track"><div class="rpt-bar-fill" style="width:25%"></div></div><span class="rpt-bar-pct">25%</span></div>
            </div>
          </div>
          <div class="rpt-budget-summary">
            <div>
              <span>${tx('תקציב יעד', 'Target budget')}</span>
              <strong>${formatCurrency(budget)}</strong>
            </div>
            <div>
              <span>${tx('רמת היתכנות', 'Feasibility level')}</span>
              <strong>${tx('ראשונית', 'Initial')}</strong>
            </div>
            <div class="rpt-budget-deviation">
              <span>${tx('אפשרות סטייה מהתקציב', 'Possible budget deviation')}</span>
              <strong>± ${formatCurrency(budgetDeviation)} ${tx('(עד 8%)', '(up to 8%)')}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">✓</span>
          <h3>${tx('קטגוריות ספקים לבדיקה', 'Supplier categories to check')}</h3>
        </div>
        <p class="rpt-block-sub">${tx('ההתאמות כאן מבוססות על האזור, הסגנון והתקציב שציינתם בשאלון.', 'These matches are based on the region, style, and budget you entered in the questionnaire.')}</p>
        <div class="rpt-suppliers">
          ${supplierCards}
        </div>
      </section>

      <section class="rpt-section">
        <div class="rpt-section-heading">
          <span class="rpt-mark" aria-hidden="true">•</span>
          <h3>${tx('צעדים הבאים', 'Next steps')}</h3>
        </div>
        <ul class="rpt-next-list">
          <li>${tx('תיאום בדיקה עם 3 ספקים מובילים באזור', 'Schedule checks with 3 leading suppliers in')} ${region}.</li>
          <li>${tx('איסוף השראה עיצובית נוספת לפי סגנון', 'Collect additional design inspiration for the')} ${styleLabel} ${tx('סגנון.', 'style.')}</li>
          <li>${tx('עדכון רשימת מוזמנים ראשונית לפני פגישת המשך.', 'Update the initial guest list before the follow-up meeting.')}</li>
        </ul>
      </section>

      <footer class="rpt-doc-footer">
        <div class="rpt-footer-notes">
          <p>${tx('* דוח זה הופק באופן אוטומטי על ידי מערכת WedWise.', '* This report was generated automatically by WedWise.')}</p>
          <p>${tx('הנתונים הם הערכה ראשונית ואינם מהווים הצעת מחיר או אישור ספק.', 'The data is an initial estimate and does not constitute a price quote or supplier approval.')}</p>
        </div>
        <div class="rpt-seal" aria-label="${tx('חותמת אימות WedWise', 'WedWise verification seal')}">
          <span aria-hidden="true">✓</span>
          <strong>${tx('מאומת', 'Verified')}<br>${tx('על ידי', 'by')}<br>WedWise</strong>
        </div>
      </footer>
    </article>
  `;
}



function renderReport(html) {
  reportContent.innerHTML = html;
  i18n?.translateTree?.(reportContent, i18n.getLang());
  latestReportText = reportContent.innerText.replace(/\s+/g, ' ').trim();
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = tx('אישור הדוח', 'Confirm report');
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = tx('צרו הדמיית חתונה', 'Create wedding visualization');
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
    regionDisplayName: state.region_display_name,
    weddingDateMode: state.wedding_date_mode,
    weddingDateExact: state.wedding_date_exact,
    weddingMonthFrom: state.wedding_month_from,
    weddingMonthTo: state.wedding_month_to,
    weddingDateLabel: state.wedding_date_label,
    style: state.preferred_style,
    styleDisplay: displayValue(state.preferred_style),
    colors: state.preferred_colors,
    flowers: displayList(state.flowers),
    decorations: displayList(state.decorations),
    freeText: state.free_text,
    inspirationUrl: state.inspiration_url,
  };
}

function buildImageGenerationQuestionnaire() {
  const wr = latestPayload?.wedding_request;
  if (!wr) return latestQuestionnaire;

  const style = (() => {
    try {
      return JSON.parse(wr.preferred_styles_json || '[]')[0] || '';
    } catch {
      return '';
    }
  })();

  return {
    budget: wr.estimated_budget_ils,
    guestCount: wr.guest_count,
    regionName: REGION_NAMES_EN[String(wr.region_id)] || wr.region_name || '',
    regionDisplayName: REGION_NAMES_EN[String(wr.region_id)] || wr.region_name || '',
    weddingDateMode: wr.wedding_date_mode,
    weddingDateExact: wr.wedding_date_exact,
    weddingMonthFrom: wr.wedding_month_from,
    weddingMonthTo: wr.wedding_month_to,
    weddingDateLabel: wr.wedding_date_label,
    style: englishValue(style),
    styleDisplay: englishValue(style),
    colors: wr.preferred_colors,
    flowers: englishList(Array.isArray(wr.flowers) ? wr.flowers : []),
    decorations: englishList(Array.isArray(wr.decorations) ? wr.decorations : []),
    freeText: wr.free_text,
    inspirationUrl: wr.inspiration_url,
  };
}

function buildImageGenerationReportText() {
  const wr = latestPayload?.wedding_request;
  const lead = latestPayload?.lead;
  if (!wr) return latestReportText;

  const questionnaire = buildImageGenerationQuestionnaire();
  const lines = [
    'WedWise wedding planning report for image generation.',
    lead?.full_name ? `Couple/contact name: ${lead.full_name}` : '',
    `Budget: ${questionnaire.budget || 0} ILS`,
    `Guest count: ${questionnaire.guestCount || 0}`,
    questionnaire.weddingDateLabel ? `Wedding date or range: ${questionnaire.weddingDateLabel}` : '',
    questionnaire.regionName ? `Region in Israel: ${questionnaire.regionName}` : '',
    questionnaire.style ? `Wedding style: ${questionnaire.style}` : '',
    questionnaire.colors ? `Preferred colors: ${questionnaire.colors}` : '',
    questionnaire.flowers ? `Flowers: ${questionnaire.flowers}` : '',
    questionnaire.decorations ? `Decor: ${questionnaire.decorations}` : '',
    questionnaire.freeText ? `Couple notes: ${questionnaire.freeText}` : '',
    questionnaire.inspirationUrl ? `Inspiration link: ${questionnaire.inspirationUrl}` : '',
    '',
    'Create a realistic wedding visualization only. Do not include readable text, UI, logos, watermarks, documents, or invitation-card layout.',
  ].filter(Boolean);

  return lines.join('\n');
}

function setWeddingImageStatus(type, html) {
  if (!weddingImageResult) return;
  weddingImageResult.hidden = false;
  weddingImageResult.className = `wedding-image-result ${type ? `is-${type}` : ''}`;
  weddingImageResult.innerHTML = html;
  i18n?.translateTree?.(weddingImageResult, i18n.getLang());
}

function setWeddingImageModal(type, html) {
  if (!weddingImageModal || !weddingImageModalContent) {
    setWeddingImageStatus(type, html);
    return;
  }

  weddingImageModalContent.className = `wedding-image-modal-content ${type ? `is-${type}` : ''}`;
  weddingImageModalContent.innerHTML = html;
  i18n?.translateTree?.(weddingImageModalContent, i18n.getLang());
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
  i18n?.translateTree?.(content, i18n.getLang());
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
    ? `₪${v.priceMin.toLocaleString(currentLocale())}${v.priceMax && v.priceMax !== v.priceMin ? `–${v.priceMax.toLocaleString(currentLocale())}` : ''} ${tx('לאורח', 'per guest')}`
    : tx('מחיר לפי בקשה', 'Price on request');
  const capacity = (v.capacityMin != null && v.capacityMax != null)
    ? `${v.capacityMin.toLocaleString(currentLocale())}–${v.capacityMax.toLocaleString(currentLocale())} ${tx('אורחים', 'guests')}`
    : '';
  const place = v.city || v.region || '';
  const genericNote = v.imageIsGeneric ? `<span class="venue-card-photo-note">${tx('תמונה להמחשה', 'Illustration image')}</span>` : '';
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
           title="${tx('צפייה בדירוג ובמיקום בגוגל מפות', 'View rating and location on Google Maps')}">
          <span class="venue-stars" aria-hidden="true">★★★★★</span>
          <span class="venue-rating-label">${tx('דירוג ומיקום בגוגל מפות ↗', 'Rating and location on Google Maps ↗')}</span>
        </a>
      </div>
    </article>`;
}

function renderVenueRecommendations(data) {
  const intro = data.perGuestBudget > 0
    ? tx(
      `לפי תקציב של כ־₪${data.perGuestBudget.toLocaleString('he-IL')} לאורח לאולם, הנה שלוש המלצות מובילות עבורכם.`,
      `Based on a venue budget of about ₪${data.perGuestBudget.toLocaleString(currentLocale())} per guest, here are three leading recommendations for you.`
    )
    : tx('הנה שלוש המלצות אולמות מובילות עבורכם.', 'Here are three leading venue recommendations for you.');
  openVenueModal(`
    <div class="venue-modal-head">
      <h2 id="venue-modal-title">${tx('אולמות מומלצים עבורכם', 'Recommended venues for you')}</h2>
      <p>${intro}</p>
    </div>
    <div class="venue-card-grid">
      ${data.venues.map(venueCardHtml).join('')}
    </div>
    <p class="venue-modal-foot">${tx('לחיצה על הכוכבים תפתח את הדירוג והמיקום של האולם בגוגל מפות בחלון חדש.', 'Clicking the stars opens the venue rating and location on Google Maps in a new window.')}</p>
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
      <h2>${tx('מחפשים אולמות מתאימים…', 'Finding suitable venues...')}</h2>
      <p>${tx('בודקים התאמה לפי אזור, תקציב ומספר אורחים.', 'Checking fit by region, budget, and guest count.')}</p>
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
        <h2>${tx('לא הצלחנו לטעון המלצות כרגע', 'We could not load recommendations right now')}</h2>
        <p>${tx('אפשר לנסות שוב בעוד רגע. אנחנו כאן כדי לעזור לכם למצוא את האולם המושלם.', 'Please try again in a moment. We are here to help you find the perfect venue.')}</p>
        <button type="button" class="btn btn-secondary" data-close-venue-modal>${tx('סגירה', 'Close')}</button>
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
  i18n?.translateTree?.(content, i18n.getLang());
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
  if (supplier.priceMin == null) return tx('מחיר לפי בדיקה', 'Price after review');
  const min = Number(supplier.priceMin).toLocaleString(currentLocale());
  const max = supplier.priceMax != null && supplier.priceMax !== supplier.priceMin
    ? `–${Number(supplier.priceMax).toLocaleString(currentLocale())}`
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
        <span class="supplier-match-label">${escapeHtml(displayValue(supplier.category))}</span>
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
    ? tx(
      `לפי אזור ${escapeHtml(data.region || '')}, סגנון האירוע ומסגרת של כ־${budget}, אלו ההתאמות הראשוניות שמצאנו.`,
      `Based on ${escapeHtml(displayValue(data.region || ''))}, the event style, and a frame of about ${budget}, these are the initial matches we found.`
    )
    : tx(
      `לפי אזור ${escapeHtml(data.region || '')} וסגנון האירוע, אלו ההתאמות הראשוניות שמצאנו.`,
      `Based on ${escapeHtml(displayValue(data.region || ''))} and the event style, these are the initial matches we found.`
    );

  openSupplierModal(`
    <div class="venue-modal-head">
      <h2 id="supplier-modal-title">${tx('המלצות', 'Recommended')} ${escapeHtml(displayValue(data.category))}</h2>
      <p>${intro}</p>
    </div>
    <div class="venue-card-grid">
      ${data.suppliers.map(supplierCardHtml).join('')}
    </div>
    <p class="venue-modal-foot">${tx('ההתאמות הן הצעה ראשונית מתוך מאגר הספקים. מחירים, זמינות ופרטים סופיים חייבים בדיקה מול הספק.', 'These matches are an initial suggestion from the supplier database. Prices, availability, and final details must be checked with the supplier.')}</p>
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
      <h2>${tx('מחפשים', 'Finding')} ${escapeHtml(displayValue(payload.category))} ${tx('שמתאימים לכם...', 'that fit you...')}</h2>
      <p>${tx('בודקים התאמה לפי אזור, תקציב, סגנון וכמות אורחים.', 'Checking fit by region, budget, style, and guest count.')}</p>
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
        <h2>${tx('לא הצלחנו לטעון המלצות כרגע', 'We could not load recommendations right now')}</h2>
        <p>${tx('אפשר לנסות שוב בעוד רגע. אם התקלה חוזרת, נציג שלנו יוכל לבדוק עבורכם ספקים מתאימים ידנית.', 'Please try again in a moment. If the issue continues, our representative can manually check suitable suppliers for you.')}</p>
        <button type="button" class="btn btn-secondary" data-close-supplier-modal>${tx('סגירה', 'Close')}</button>
      </div>`);
  }
}

function getFinalDecisionText(decision) {
  if (decision === 'continue') {
    return tx('רוצה להמשיך לארגן את החתונה עם WedWise', 'Wants to continue planning the wedding with WedWise');
  }
  return tx('רוצה לשמור את הדוח ולחשוב על זה', 'Wants to save the report and think about it');
}

function editAnswersFromReport() {
  isReportConfirmed = false;
  if (btnConfirmReport) {
    btnConfirmReport.hidden = false;
    btnConfirmReport.disabled = false;
    btnConfirmReport.textContent = tx('אישור הדוח', 'Confirm report');
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = tx('צרו הדמיית חתונה', 'Create wedding visualization');
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
    setWeddingImageStatus('error', `<p>${tx('לא מצאנו דוח מוכן ליצירת תמונה. נסו למלא את השאלון מחדש.', 'We could not find a ready report for image creation. Please fill out the questionnaire again.')}</p>`);
    return;
  }

  if (!isReportConfirmed) {
    setWeddingImageStatus('error', `<p>${tx('לפני יצירת תמונה צריך לאשר שהדוח נראה נכון.', 'Before creating an image, please confirm that the report looks correct.')}</p>`);
    return;
  }

  btnGenerateImage.disabled = true;
  btnGenerateImage.textContent = tx('יוצרים תמונה...', 'Creating image...');
  setWeddingImageModal('loading', `
    <div class="wedding-image-loading wedding-image-modal-loading" role="status">
      <span aria-hidden="true"></span>
      <h2 id="wedding-image-modal-title">${tx('רק כמה רגעים', 'Just a few moments')}</h2>
      <p>${tx('אנחנו מכינים עבורכם דוגמה לתמונה מהחתונה שלכם לפי הדוח שאישרתם.', 'We are preparing a sample wedding image based on the report you approved.')}</p>
    </div>
  `);

  try {
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportText: buildImageGenerationReportText(),
        questionnaire: buildImageGenerationQuestionnaire(),
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.imageUrl) {
      throw new Error(data.message || data.error || 'Image generation failed');
    }

    setWeddingImageModal('ready', `
      <figure class="wedding-image-card">
        <img src="${data.imageUrl}" alt="${tx('הדמיית חתונה שנוצרה לפי הדוח', 'Wedding visualization generated from the report')}">
        <figcaption>${tx('הדמיית חתונה ראשונית לפי הדוח המאושר.', 'Initial wedding visualization based on the approved report.')}</figcaption>
      </figure>
      <div class="wedding-image-download-row wedding-image-modal-actions">
        <a href="${data.imageUrl}" download="wedwise-wedding-visualization.png" class="btn btn-primary">
          ${tx('שמירת התמונה', 'Save image')}
        </a>
        <button type="button" class="btn btn-primary" data-follow-up-decision="continue">
          ${tx('להמשיך לארגן את החתונה איתנו', 'Continue planning the wedding with us')}
        </button>
        <button type="button" class="btn btn-secondary" data-follow-up-decision="thinking">
          ${tx('תודה, זה נראה מעולה, אבל עוד אחשוב על זה', 'Thanks, this looks great, but I will think about it')}
        </button>
      </div>
    `);
    latestImageGenerated = true;
  } catch (error) {
    console.error('WedWise: wedding image generation failed:', error);
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">${tx('לא הצלחנו ליצור תמונה כרגע', 'We could not create an image right now')}</h2>
        <p>${tx('בדקו שה־OpenAI API key מוגדר בשרת ונסו שוב.', 'Check that the OpenAI API key is configured on the server and try again.')}</p>
        <p class="wedding-image-error-detail">${escapeHtml(error.message || 'Image generation failed')}</p>
        <div class="modal-error-actions">
          <button type="button" class="btn btn-primary" data-go-to-invitation>${tx('💌 המשיכו ליצירת ההזמנה', 'Continue to invitation creation')}</button>
          <button type="button" class="btn btn-secondary" data-close-image-modal>${tx('סגירה וחזרה לדוח', 'Close and return to report')}</button>
        </div>
      </div>
    `);
  } finally {
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = tx('צרו הדמיית חתונה', 'Create wedding visualization');
  }
}

async function submitWeddingFollowUp(decision) {
  if (!latestPayload || !latestQuestionnaire) {
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">${tx('לא מצאנו את פרטי השאלון', 'We could not find the questionnaire details')}</h2>
        <p>${tx('כדי לשלוח את הבחירה, מלאו את השאלון מחדש.', 'To send your choice, please fill out the questionnaire again.')}</p>
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
      <h2 id="wedding-image-modal-title">${tx('שולחים את הבחירה שלכם', 'Sending your choice')}</h2>
      <p>${tx('אנחנו שומרים את הפרטים ומעדכנים את הצוות.', 'We are saving the details and updating the team.')}</p>
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
      ? tx('תודה, הפרטים נשלחו לצוות שלנו', 'Thank you, the details were sent to our team')
      : tx('תודה, הבחירה שלכם נשמרה', 'Thank you, your choice was saved');
    const message = decision === 'continue'
      ? tx('הנתונים שלכם כבר נשלחו לנציג/ה שלנו. ביום העבודה הקרוב ניצור איתכם קשר.', 'Your details were sent to our representative. We will contact you on the next business day.')
      : tx('שמרנו את הבחירה שלכם. תוכלו לחזור לדוח, ליצור הזמנה או ספירה לאחור, ואם תרצו להמשיך איתנו בהמשך נשמח לעזור.', 'We saved your choice. You can return to the report, create an invitation or countdown, and if you want to continue with us later we will be happy to help.');

    setWeddingImageModal('ready', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">${title}</h2>
        <p>${message}</p>
        <p class="wedding-image-decision-note">${tx('בחירה שנשלחה:', 'Choice sent:')} ${getFinalDecisionText(decision)}</p>
        <button type="button" class="btn btn-primary" data-close-image-modal>${tx('סגירה', 'Close')}</button>
      </div>
    `);
  } catch (error) {
    console.error('WedWise: wedding follow-up failed:', error);
    setWeddingImageModal('error', `
      <div class="wedding-image-modal-message">
        <h2 id="wedding-image-modal-title">${tx('לא הצלחנו לשלוח את הבחירה', 'We could not send the choice')}</h2>
        <p>${tx('הפרטים לא נשמרו כרגע. נסו שוב בעוד רגע.', 'The details were not saved right now. Please try again in a moment.')}</p>
        <button type="button" class="btn btn-secondary" data-close-image-modal>${tx('סגירה', 'Close')}</button>
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
    `📅 *תאריך חתונה:* ${wr.wedding_date_label || '—'}`,
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
      weddingDateMode: wr.wedding_date_mode,
      weddingDateExact: wr.wedding_date_exact,
      weddingMonthFrom: wr.wedding_month_from,
      weddingMonthTo: wr.wedding_month_to,
      weddingDateLabel: wr.wedding_date_label,
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
  refreshExactWeddingDateControls();
  refreshWeddingRangeControls();
  updateWeddingDateMode();
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
    btnConfirmReport.textContent = tx('אישור הדוח', 'Confirm report');
  }
  if (btnGenerateImage) {
    btnGenerateImage.hidden = true;
    btnGenerateImage.disabled = false;
    btnGenerateImage.textContent = tx('צרו הדמיית חתונה', 'Create wedding visualization');
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
  btnNext.textContent = tx('מייצרים את הדוח...', 'Generating the report...');

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
    setWeddingImageStatus('confirmed', `<p>${tx('הדוח אושר. אפשר לבחור כלי המשך מתחת לדוח, או לעדכן אותנו אם תרצו שנמשיך איתכם מכאן.', 'The report is confirmed. You can choose a follow-up tool below the report or let us know if you want us to continue with you from here.')}</p>`);
    closeWeddingImageModal();
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
    const title = isEnglish()
      ? (style ? `Wedding countdown in ${displayValue(style)} style` : 'Wedding countdown')
      : (style ? `ספירה לאחור לחתונה בסגנון ${style}` : 'ספירה לאחור לחתונה');

    localStorage.setItem('wedwise_countdown', JSON.stringify({
      coupleNames: latestPayload?.lead?.full_name || '',
      customTitle: title,
      weddingDate: latestQuestionnaire?.weddingDateExact || '',
      weddingDateLabel: latestQuestionnaire?.weddingDateLabel || '',
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

form.querySelectorAll('input[name="wedding_date_mode"]').forEach((input) => {
  input.addEventListener('change', updateWeddingDateMode);
});

['wedding_year_exact', 'wedding_month_exact', 'wedding_day_exact'].forEach((fieldName) => {
  const field = form[fieldName];
  if (!field) return;
  field.addEventListener('change', refreshExactWeddingDateControls);
});

['wedding_range_from_year', 'wedding_range_from_month', 'wedding_range_to_year', 'wedding_range_to_month'].forEach((fieldName) => {
  const field = form[fieldName];
  if (!field) return;
  field.addEventListener('change', refreshWeddingRangeControls);
});

refreshExactWeddingDateControls();
refreshWeddingRangeControls();
updateWeddingDateMode();
goToStep(1, { focusFirstInput: false });
updateActiveNavLink();

window.addEventListener('load', () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  updateActiveNavLink();
});
window.addEventListener('wedwise:languagechange', refreshExactWeddingDateControls);
window.addEventListener('wedwise:languagechange', refreshWeddingRangeControls);
window.addEventListener('scroll', updateActiveNavLink, { passive: true });
window.addEventListener('resize', updateActiveNavLink);
window.addEventListener('hashchange', updateActiveNavLink);
