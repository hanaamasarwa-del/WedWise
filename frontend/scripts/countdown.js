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

let uploadedImageUrl = null;

// Calculate years and months between today and a target date
function calculateCountdown(targetDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(targetDate);
  target.setHours(0, 0, 0, 0);

  if (today.getTime() === target.getTime()) {
    return { isToday: true };
  }

  if (target < today) {
    return { isPast: true };
  }

  let years = 0;
  let months = 0;

  let current = new Date(today);

  while (true) {
    const nextYear = new Date(current.getFullYear() + 1, current.getMonth(), current.getDate());
    if (nextYear > target) break;
    current = nextYear;
    years++;
  }

  while (true) {
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());
    if (nextMonth > target) break;
    current = nextMonth;
    months++;
  }

  return { years, months, isToday: false, isPast: false };
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
  document.getElementById('years-display').textContent = countdown.years;
  document.getElementById('months-display').textContent = countdown.months;

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

  if (!customTitle || !customTitle.trim()) {
    cardFooter.textContent = 'עד ליום הגדול';
    cardFooter.style.display = 'block';
  } else {
    cardFooter.style.display = 'none';
  }

  // Show result
  resultContainer.hidden = false;
  noResult.hidden = true;
}

// Download the countdown card as an image
async function downloadCard() {
  try {
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'מוריד...';

    // Temporarily hide decorative elements
    const decorations = countdownCard.querySelectorAll('.countdown-decoration');
    const originalDisplay = [];
    decorations.forEach((el, idx) => {
      originalDisplay[idx] = el.style.display;
      el.style.display = 'none';
    });

    // Wait for image to load
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture the card
    const canvas = await html2canvas(countdownCard, {
      scale: 3,
      backgroundColor: null,
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 0,
      proxy: null,
    });

    // Restore decorative elements
    decorations.forEach((el, idx) => {
      el.style.display = originalDisplay[idx];
    });

    // Download the image
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'wedding-countdown.png';
    link.click();

    downloadBtn.disabled = false;
    downloadBtn.textContent = 'הורדת הכרטיס';
  } catch (error) {
    console.error('Error downloading image:', error);
    // Restore decorative elements on error
    const decorations = countdownCard.querySelectorAll('.countdown-decoration');
    decorations.forEach((el) => {
      el.style.display = '';
    });
    alert('לא הצלחנו להוריד את הכרטיס. אנא נסו שנית.');
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'הורדת הכרטיס';
  }
}

// Copy countdown to clipboard
async function copyToClipboard() {
  try {
    const years = document.getElementById('years-display').textContent;
    const months = document.getElementById('months-display').textContent;
    const coupleNames = coupleNamesInput.value.trim();

    let text = `${years} : ${months}`;

    if (coupleNames) {
      text = `${coupleNames}\n${text}`;
    }

    text += '\n\nשנים : חודשים';

    await navigator.clipboard.writeText(text);

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

  // Reset countdown card background to default
  countdownCard.style.backgroundImage = 'linear-gradient(135deg, #FFFFFF 0%, #FBF8F4 40%, #F5EDE6 100%)';
  uploadedImageUrl = null;
});

// Image upload handler
function previewImage(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageUrl = e.target.result;

      // Apply background image to countdown card as data URL
      countdownCard.style.backgroundImage = `url('${uploadedImageUrl}')`;
      countdownCard.style.backgroundSize = 'cover';
      countdownCard.style.backgroundPosition = 'center';
      countdownCard.style.backgroundRepeat = 'no-repeat';
      countdownCard.style.backgroundAttachment = 'scroll';
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  noResult.hidden = false;
  resultContainer.hidden = true;
  errorMessage.hidden = true;
});
