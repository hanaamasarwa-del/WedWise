// Countdown Page Logic

const form = document.getElementById('countdown-form');
const weddingDateInput = document.getElementById('wedding-date');
const coupleNamesInput = document.getElementById('couple-names');
const customTitleInput = document.getElementById('custom-title');

const resultContainer = document.getElementById('result-container');
const noResult = document.getElementById('no-result');
const errorMessage = document.getElementById('error-message');
const countdownCard = document.getElementById('countdown-card');

const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');
const copyMessage = document.getElementById('copy-message');
const generateAiBtn = document.getElementById('generate-ai-btn');
const downloadGeneratedBtn = document.getElementById('download-generated-btn');
let uploadedImageFile = null;
let uploadedImageDataUrl = null;

function setReportPrefillNotice(message) {
  const existing = document.querySelector('.countdown-prefill-note');
  if (existing) existing.remove();

  if (!message || !form) return;

  const note = document.createElement('div');
  note.className = 'countdown-prefill-note';
  note.textContent = message;
  form.prepend(note);
}

// Calculate months and days between today and a target date
function calculateCountdown(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  // If date is today
  if (today.getTime() === target.getTime()) {
    return { isToday: true };
  }

  // If date is in the past
  if (target < today) {
    return { isPast: true };
  }

  // Calculate months and days
  let months = 0;
  let days = 0;

  // Start from today and add months until we reach or exceed the target
  let current = new Date(today);

  while (true) {
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());

    if (nextMonth > target) {
      break;
    }

    current = nextMonth;
    months++;
  }

  // Calculate remaining days
  const remainingMs = target.getTime() - current.getTime();
  days = Math.floor(remainingMs / (1000 * 60 * 60 * 24));

  return { months, days, isToday: false, isPast: false };
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.hidden = false;
  resultContainer.hidden = true;
  noResult.hidden = true;
}

// Hide error message
function hideError() {
  errorMessage.hidden = true;
}

// Render the countdown result
function renderCountdown(targetDate, coupleNames, customTitle) {
  const countdown = calculateCountdown(targetDate);

  hideError();

  if (countdown.isToday) {
    showError('היום הגדול הגיע! 🎉');
    return;
  }

  if (countdown.isPast) {
    showError('בחרו תאריך בעתיד.');
    return;
  }

  // Update countdown display
  document.getElementById('months-display').textContent = countdown.months;
  document.getElementById('days-display').textContent = countdown.days;

  // Update optional fields
  const cardTitle = document.getElementById('card-title');
  const cardCouple = document.getElementById('card-couple');
  const cardFooter = document.getElementById('card-footer');

  if (customTitle && customTitle.trim()) {
    cardTitle.textContent = customTitle.trim();
    cardTitle.style.display = 'block';
  } else {
    cardTitle.style.display = 'none';
  }

  if (coupleNames && coupleNames.trim()) {
    cardCouple.textContent = coupleNames.trim();
    cardCouple.style.display = 'block';
  } else {
    cardCouple.style.display = 'none';
  }

  // Add a default footer message if no custom title
  if (!customTitle || !customTitle.trim()) {
    cardFooter.textContent = 'עד ליום הגדול';
    cardFooter.style.display = 'block';
  } else {
    cardFooter.style.display = 'none';
  }

  // Apply background image if uploaded
  if (uploadedImageDataUrl) {
    countdownCard.style.backgroundImage = `url('${uploadedImageDataUrl}')`;
    countdownCard.style.backgroundSize = 'cover';
    countdownCard.style.backgroundPosition = 'center';
  } else {
    countdownCard.style.backgroundImage = 'none';
  }

  // Show result
  resultContainer.hidden = false;
  noResult.hidden = true;
}

// Download the countdown card as an image
async function downloadCard() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'מעדכן...';

    const canvas = await html2canvas(countdownCard, {
      scale: 2,
      backgroundColor: '#FDFBF7',
      logging: false,
      useCORS: true,
    });

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'wedding-countdown.png';
    link.click();

    downloadBtn.disabled = false;
    downloadBtn.textContent = 'הורדת התמונה';
  } catch (error) {
    console.error('Error downloading image:', error);
    alert('לא הצלחנו להוריד את התמונה. אנא נסו שנית.');
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'הורדת התמונה';
  }
}

// Copy countdown to clipboard
async function copyToClipboard() {
  try {
    const months = document.getElementById('months-display').textContent;
    const days = document.getElementById('days-display').textContent;
    const coupleNames = coupleNamesInput.value.trim();

    let text = `${months} : ${days}`;

    if (coupleNames) {
      text = `${coupleNames}\n${text}`;
    }

    text += '\n\nחודשים : ימים';

    await navigator.clipboard.writeText(text);

    // Show success message
    copyMessage.style.display = 'block';
    setTimeout(() => {
      copyMessage.style.display = 'none';
    }, 2000);
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    alert('לא הצלחנו להעתיק. אנא נסו שנית.');
  }
}

// Form submission handler
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const weddingDate = weddingDateInput.value;
  const coupleNames = coupleNamesInput.value;
  const customTitle = customTitleInput.value;

  if (!weddingDate) {
    showError('בחרו תאריך לחתונה.');
    return;
  }

  renderCountdown(weddingDate, coupleNames, customTitle);
});

// Event listeners for buttons
downloadBtn.addEventListener('click', downloadCard);
copyBtn.addEventListener('click', copyToClipboard);

// Form reset handler
form.addEventListener('reset', () => {
  resultContainer.hidden = true;
  noResult.hidden = false;
  hideError();
  uploadedImageDataUrl = null;
  uploadedImageFile = null;
  countdownCard.style.backgroundImage = 'none';
  document.getElementById('image-preview').style.display = 'none';
  document.getElementById('inspiration-image').value = '';
  generateAiBtn.style.display = 'none';
});

// Image preview
function previewImage(input) {
  if (input.files && input.files[0]) {
    uploadedImageFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageDataUrl = e.target.result;
      document.getElementById('preview-img').src = e.target.result;
      document.getElementById('image-preview').style.display = 'block';
      generateAiBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Generate AI image
async function generateAiImage() {
  if (!uploadedImageFile) {
    alert('אנא בחרו תמונת השראה');
    return;
  }

  generateAiBtn.disabled = true;
  generateAiBtn.textContent = 'יוצרים עיצוב...';

  try {
    const formData = new FormData();
    formData.append('image', uploadedImageFile);
    formData.append('coupleNames', coupleNamesInput.value);
    formData.append('customTitle', customTitleInput.value);
    formData.append('months', document.getElementById('months-display').textContent);
    formData.append('days', document.getElementById('days-display').textContent);

    const response = await fetch('/api/generate-countdown-design', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to generate image');

    const data = await response.json();
    const generatedImg = document.getElementById('generated-image');
    generatedImg.src = 'data:image/png;base64,' + data.image;
    document.getElementById('generated-image-container').style.display = 'block';
  } catch (error) {
    console.error('Error generating image:', error);
    alert('לא הצלחנו ליצור את העיצוב. אנא נסו שוב.');
  } finally {
    generateAiBtn.disabled = false;
    generateAiBtn.textContent = 'יצירת עיצוב AI';
  }
}

// Download generated image
downloadGeneratedBtn.addEventListener('click', () => {
  const img = document.getElementById('generated-image');
  const link = document.createElement('a');
  link.href = img.src;
  link.download = 'countdown-design-ai.png';
  link.click();
});

generateAiBtn.addEventListener('click', generateAiImage);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  noResult.hidden = false;
  resultContainer.hidden = true;
  errorMessage.hidden = true;

  try {
    const raw = localStorage.getItem('wedwise_countdown');
    if (!raw) return;

    const saved = JSON.parse(raw);
    if (saved.coupleNames && coupleNamesInput) coupleNamesInput.value = saved.coupleNames;
    if (saved.customTitle && customTitleInput) customTitleInput.value = saved.customTitle;
    if (saved.weddingDate && weddingDateInput) weddingDateInput.value = saved.weddingDate;

    if (saved.weddingDate) {
      renderCountdown(saved.weddingDate, coupleNamesInput.value, customTitleInput.value);
      setReportPrefillNotice('הפרטים מהדוח נטענו לספירה לאחור.');
    } else {
      setReportPrefillNotice('הפרטים מהדוח נטענו. בחרו תאריך חתונה כדי ליצור את הספירה.');
      noResult.innerHTML = '<p>הפרטים מהדוח כבר מולאו. בחרו תאריך חתונה ולחצו על "יצירת ספירה".</p>';
    }
  } catch {
    setReportPrefillNotice('');
  }
});
