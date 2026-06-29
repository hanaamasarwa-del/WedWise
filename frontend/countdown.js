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
const downloadDesignedBtn = document.getElementById('download-designed-btn');
const designStyleGroup = document.getElementById('design-style-group');

let uploadedImageFile = null;
let uploadedImageDataUrl = null;
let currentCountdown = null;

// Calculate years and months between today and a target date
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

  // Calculate years and months
  let years = 0;
  let months = 0;

  // Start from today and add years until we reach or exceed the target
  let current = new Date(today);

  while (true) {
    const nextYear = new Date(current.getFullYear() + 1, current.getMonth(), current.getDate());

    if (nextYear > target) {
      break;
    }

    current = nextYear;
    years++;
  }

  // Calculate remaining months
  while (true) {
    const nextMonth = new Date(current.getFullYear(), current.getMonth() + 1, current.getDate());

    if (nextMonth > target) {
      break;
    }

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
  currentCountdown = countdown;

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

  // Add a default footer message if no custom title
  if (!customTitle || !customTitle.trim()) {
    cardFooter.textContent = 'עד ליום הגדול';
    cardFooter.style.display = 'block';
  } else {
    cardFooter.style.display = 'none';
  }

  // Show result and design options if image uploaded
  resultContainer.hidden = false;
  noResult.hidden = true;

  if (uploadedImageDataUrl) {
    designStyleGroup.style.display = 'block';
    generateDesignedCard();
  }
}

// Generate designed card with uploaded photo
async function generateDesignedCard() {
  if (!uploadedImageDataUrl || !currentCountdown) return;

  const designStyle = document.querySelector('input[name="design-style"]:checked')?.value || 'full-photo-text';
  const coupleNames = coupleNamesInput.value.trim();
  const customTitle = customTitleInput.value.trim();
  const { years, months } = currentCountdown;

  try {
    // Create card HTML based on selected design style
    let cardHTML = '';

    if (designStyle === 'full-photo-text') {
      cardHTML = `
        <div style="
          width: 1024px;
          height: 1280px;
          position: relative;
          background-image: url('${uploadedImageDataUrl}');
          background-size: cover;
          background-position: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.35);
          "></div>
          <div style="position: relative; z-index: 1; color: white;">
            ${coupleNames ? `<div style="font-size: 48px; font-weight: 700; margin-bottom: 30px; letter-spacing: 2px;">${coupleNames}</div>` : ''}
            <div style="font-size: 120px; font-weight: 800; line-height: 1; margin: 20px 0; letter-spacing: -3px;">${years}<span style="font-size: 90px; margin: 0 20px;">|</span>${months}</div>
            <div style="font-size: 32px; font-weight: 500; margin-top: 20px; letter-spacing: 1px;">שנים | חודשים</div>
            <div style="font-size: 24px; font-weight: 400; margin-top: 40px; opacity: 0.95;">${customTitle || 'עד ליום הגדול'}</div>
          </div>
        </div>
      `;
    } else if (designStyle === 'blurred-with-card') {
      cardHTML = `
        <div style="
          width: 1024px;
          height: 1280px;
          position: relative;
          background-image: url('${uploadedImageDataUrl}');
          background-size: cover;
          background-position: center;
          filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          overflow: hidden;
        ">
        </div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 700px;
          padding: 60px;
          background: rgba(255, 255, 255, 0.98);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
          text-align: center;
          font-family: 'Heebo', sans-serif;
          direction: rtl;
        ">
          ${coupleNames ? `<div style="font-size: 40px; font-weight: 700; margin-bottom: 30px; color: #A57857; letter-spacing: 1px;">${coupleNames}</div>` : ''}
          <div style="font-size: 110px; font-weight: 800; line-height: 1; margin: 20px 0; color: #A57857; letter-spacing: -3px;">${years}<span style="font-size: 80px; margin: 0 20px;">|</span>${months}</div>
          <div style="font-size: 28px; font-weight: 500; margin-top: 20px; color: #666; letter-spacing: 1px;">שנים | חודשים</div>
          <div style="font-size: 20px; font-weight: 400; margin-top: 30px; color: #999;">${customTitle || 'עד ליום הגדול'}</div>
        </div>
        <div style="
          width: 1024px;
          height: 1280px;
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url('${uploadedImageDataUrl}');
          background-size: cover;
          background-position: center;
          filter: blur(10px);
        "></div>
      `;
    } else if (designStyle === 'photo-top-countdown-bottom') {
      cardHTML = `
        <div style="
          width: 1024px;
          height: 1280px;
          display: flex;
          flex-direction: column;
          font-family: 'Heebo', sans-serif;
          direction: rtl;
          overflow: hidden;
          background: #f5f5f5;
        ">
          <div style="
            flex: 1;
            background-image: url('${uploadedImageDataUrl}');
            background-size: cover;
            background-position: center;
          "></div>
          <div style="
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px;
            text-align: center;
            background: linear-gradient(180deg, rgba(165, 120, 87, 0.05) 0%, rgba(165, 120, 87, 0.1) 100%);
          ">
            ${coupleNames ? `<div style="font-size: 40px; font-weight: 700; margin-bottom: 20px; color: #A57857; letter-spacing: 1px;">${coupleNames}</div>` : ''}
            <div style="font-size: 90px; font-weight: 800; line-height: 1; margin: 10px 0; color: #A57857; letter-spacing: -2px;">${years}<span style="font-size: 70px; margin: 0 15px;">|</span>${months}</div>
            <div style="font-size: 24px; font-weight: 500; margin-top: 15px; color: #666; letter-spacing: 1px;">שנים | חודשים</div>
            <div style="font-size: 18px; font-weight: 400; margin-top: 20px; color: #999;">${customTitle || 'עד ליום הגדול'}</div>
          </div>
        </div>
      `;
    }

    // Create temporary container
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = cardHTML;
    tempContainer.style.display = 'none';
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    // Wait for image to load
    await new Promise(resolve => setTimeout(resolve, 500));

    // Capture with html2canvas
    const cardElement = tempContainer.querySelector('div');
    const canvas = await html2canvas(cardElement, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: null,
    });

    // Display preview
    const previewContainer = document.getElementById('designed-card-preview');
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
    document.getElementById('designed-card-container').style.display = 'block';

    // Store canvas for download
    window.designedCardCanvas = canvas;

    // Clean up
    document.body.removeChild(tempContainer);
  } catch (error) {
    console.error('Error generating designed card:', error);
  }
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

// Download designed card
async function downloadDesignedCard() {
  if (!window.designedCardCanvas) {
    alert('אנא צרו כרטיס מעוצב תחילה.');
    return;
  }

  try {
    downloadDesignedBtn.disabled = true;
    downloadDesignedBtn.textContent = 'מוריד...';

    const link = document.createElement('a');
    link.href = window.designedCardCanvas.toDataURL('image/png');
    link.download = 'wedding-card.png';
    link.click();

    downloadDesignedBtn.disabled = false;
    downloadDesignedBtn.textContent = 'הורדת הכרטיס';
  } catch (error) {
    console.error('Error downloading card:', error);
    alert('לא הצלחנו להוריד את הכרטיס. אנא נסו שנית.');
    downloadDesignedBtn.disabled = false;
    downloadDesignedBtn.textContent = 'הורדת הכרטיס';
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
downloadDesignedBtn.addEventListener('click', downloadDesignedCard);

// Design style change handler
document.querySelectorAll('input[name="design-style"]').forEach(radio => {
  radio.addEventListener('change', generateDesignedCard);
});

// Form reset handler
form.addEventListener('reset', () => {
  resultContainer.hidden = true;
  noResult.hidden = false;
  designStyleGroup.style.display = 'none';
  document.getElementById('designed-card-container').style.display = 'none';
  hideError();
  uploadedImageFile = null;
  uploadedImageDataUrl = null;
  currentCountdown = null;
});

// Image preview
function previewImage(input) {
  if (input.files && input.files[0]) {
    uploadedImageFile = input.files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedImageDataUrl = e.target.result;
      document.getElementById('preview-img').src = uploadedImageDataUrl;
      document.getElementById('image-preview').style.display = 'block';

      // Generate designed card if countdown already exists
      if (currentCountdown) {
        designStyleGroup.style.display = 'block';
        generateDesignedCard();
      }
    };
    reader.readAsDataURL(input.files[0]);
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  noResult.hidden = false;
  resultContainer.hidden = true;
  errorMessage.hidden = true;
  designStyleGroup.style.display = 'none';
});
