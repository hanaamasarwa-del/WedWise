'use strict';

const INV_DEFAULTS = {
  he: 'בשמחה רבה אנו מזמינים אתכם לחגוג עמנו',
  en: 'With great joy, we invite you to celebrate with us',
  ar: 'بكل سرور ندعوكم للاحتفال معنا',
};

let invitationData = {
  name1: '', name2: '', date: '', venue: '',
  body: INV_DEFAULTS.he, lang: 'he',
  style: 'Elegant', colors: '', flowers: '',
};
const i18n = window.WedWiseI18n;
const isEnglishSite = () => i18n?.isEnglish?.() === true;
const tx = (heText, enText) => (isEnglishSite() ? enText : heText);

const invitationCard  = document.getElementById('invitation-card');
const invName1        = document.getElementById('inv-name1');
const invName2        = document.getElementById('inv-name2');
const invDateInput    = document.getElementById('inv-date');
const invVenueInput   = document.getElementById('inv-venue');
const invBody         = document.getElementById('inv-body');
const invLangInputs   = Array.from(document.querySelectorAll('input[name="inv-lang"]'));
const invStyleInputs  = Array.from(document.querySelectorAll('input[name="inv-style"]'));
const CARD_STYLE_CLASSES = ['elegant', 'luxury', 'modern', 'garden', 'classic'].map(s => `inv-card--${s}`);

function applyCardStyle(styleName) {
  if (!invitationCard) return;
  CARD_STYLE_CLASSES.forEach(cls => invitationCard.classList.remove(cls));
  if (styleName) invitationCard.classList.add(`inv-card--${styleName.toLowerCase()}`);
}
const btnBackToReport = document.getElementById('btn-back-to-report');
const btnDownloadPng  = document.getElementById('btn-download-png');
const btnPrintPdf     = document.getElementById('btn-print-pdf');

function buildInvitationCard() {
  const { name1, name2, date, venue, body, lang } = invitationData;

  const ph = (he, en, ar) => lang === 'en' ? en : lang === 'ar' ? ar : he;
  const name1Text = name1 || ph('שם ראשון',  'First name',  'الاسم الأول');
  const name2Text = name2 || ph('שם שני',    'Second name', 'الاسم الثاني');
  const dateText  = date  || ph('תאריך יקבע בקרוב',  'Date to be announced', 'يُحدَّد التاريخ قريبًا');
  const venueText = venue || ph('מיקום יקבע בהמשך',  'Venue TBC',            'المكان يُحدَّد لاحقًا');
  const bodyText  = body  || INV_DEFAULTS[lang];

  return `
    <div class="inv-ornament" aria-hidden="true">✦</div>
    <p class="inv-invite-line">${bodyText}</p>
    <h2 class="inv-couple-names">
      <span class="inv-name${!name1 ? ' inv-placeholder' : ''}">${name1Text}</span>
      <span class="inv-ampersand" aria-hidden="true">&amp;</span>
      <span class="inv-name${!name2 ? ' inv-placeholder' : ''}">${name2Text}</span>
    </h2>
    <div class="inv-divider" aria-hidden="true"></div>
    <p class="inv-date${!date ? ' inv-placeholder' : ''}">${dateText}</p>
    <p class="inv-venue${!venue ? ' inv-placeholder' : ''}">${venueText}</p>
    <div class="inv-ornament" aria-hidden="true">✦</div>
  `;
}

function renderInvitationCard() {
  if (!invitationCard) return;
  invitationCard.dir = invitationData.lang === 'en' ? 'ltr' : 'rtl';
  invitationCard.innerHTML = buildInvitationCard();
}

if (invName1)    invName1.addEventListener('input',    () => { invitationData.name1  = invName1.value;    renderInvitationCard(); });
if (invName2)    invName2.addEventListener('input',    () => { invitationData.name2  = invName2.value;    renderInvitationCard(); });
if (invDateInput) invDateInput.addEventListener('input', () => { invitationData.date  = invDateInput.value; renderInvitationCard(); });
if (invVenueInput) invVenueInput.addEventListener('input', () => { invitationData.venue = invVenueInput.value; renderInvitationCard(); });
if (invBody)     invBody.addEventListener('input',     () => { invitationData.body   = invBody.value;     renderInvitationCard(); });

invLangInputs.forEach((input) => {
  input.addEventListener('change', () => {
    const prevLang = invitationData.lang;
    invitationData.lang = input.value;
    if (invitationData.body === INV_DEFAULTS[prevLang]) {
      invitationData.body = INV_DEFAULTS[input.value];
      if (invBody) invBody.value = invitationData.body;
    }
    renderInvitationCard();
  });
});

invStyleInputs.forEach((input) => {
  input.addEventListener('change', () => {
    invitationData.style = input.value;
    applyCardStyle(input.value);
  });
});

if (btnBackToReport) {
  btnBackToReport.addEventListener('click', () => history.back());
}

async function downloadAsPng() {
  if (!invitationCard || typeof html2canvas === 'undefined') return;
  if (btnDownloadPng) { btnDownloadPng.disabled = true; btnDownloadPng.textContent = tx('מייצא...', 'Exporting...'); }
  try {
    const canvas = await html2canvas(invitationCard, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
    });
    const link = document.createElement('a');
    link.download = 'wedding-invitation.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } finally {
    if (btnDownloadPng) { btnDownloadPng.disabled = false; btnDownloadPng.textContent = tx('הורדת PNG', 'Download PNG'); }
  }
}

if (btnDownloadPng) btnDownloadPng.addEventListener('click', downloadAsPng);
if (btnPrintPdf)    btnPrintPdf.addEventListener('click', () => window.print());

function loadFromStorage() {
  try {
    const raw = localStorage.getItem('wedwise_inv');
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.name1)   { invitationData.name1   = saved.name1;   if (invName1)      invName1.value      = saved.name1; }
    if (saved.region)  { invitationData.venue   = saved.region;  if (invVenueInput) invVenueInput.value = saved.region; }
    if (saved.style) {
      invitationData.style = saved.style;
      const styleInput = invStyleInputs.find((i) => i.value === saved.style);
      if (styleInput) styleInput.checked = true;
    }
    if (saved.colors)  { invitationData.colors  = saved.colors; }
    if (saved.flowers) { invitationData.flowers = saved.flowers; }
  } catch {
    // corrupted storage — ignore
  }
}

loadFromStorage();
applyCardStyle(invitationData.style);
if (isEnglishSite() && invitationData.lang === 'he' && !invBody?.value) {
  invitationData.lang = 'en';
  invitationData.body = INV_DEFAULTS.en;
  const englishInput = invLangInputs.find((input) => input.value === 'en');
  if (englishInput) englishInput.checked = true;
  if (invBody) invBody.value = INV_DEFAULTS.en;
}
renderInvitationCard();
