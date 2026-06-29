// Blessing Helper - Wedding Blessing Generator with AI

const form = document.getElementById('blessing-form');
const resultContainer = document.getElementById('result-container');
const noResult = document.getElementById('no-result');
const blessingOutput = document.getElementById('blessing-output');
const copyBtn = document.getElementById('copy-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

let lastFormData = null;
let isGenerating = false;

async function generateBlessingWithAI(speaker, brideName, groomName, tone, length, details) {
  isGenerating = true;

  const prompt = `
אתה עוזר AI לכתיבת ברכות חתונה בעברית.
כתוב ברכה/נאום לחתונה של כלה בשם ${brideName} וחתן בשם ${groomName}.

מי מדבר: ${speaker}
סגנון: ${tone}
אורך: ${length === 'קצר-מאוד' ? 'קצר מאוד (עד 3 משפטים)' : length === 'קצר' ? 'קצר (כ-5-7 משפטים)' : 'בינוני (כ-10-12 משפטים)'}
${details ? `פרטים אישיים: ${details}` : ''}

דרישות:
- ברכה טבעית ודפי בעברית
- מתאימה להקשר יהודי/ישראלי
- ללא לחזות דתיות כבדות (אלא אם הבחרת "מסורתי")
- בתון ${tone === 'מרגש' ? 'רגשוני' : tone === 'קליל-וחם' ? 'קליל וחם' : tone === 'אלגנטי' ? 'אלגנטי' : tone === 'מצחיק' ? 'מצחיק בעדינות' : tone === 'קצר-ופשוט' ? 'קצר ופשוט' : tone === 'אישי' ? 'אישי ומשפחתי' : 'מסורתי ועדין'}
- קול של ${speaker === 'אמא' ? 'אם' : speaker === 'אבא' ? 'אב' : speaker === 'אח' ? 'אח' : speaker === 'אחות' ? 'אחות' : speaker === 'חברה-טובה' ? 'חברה טובה' : speaker === 'חבר-טוב' ? 'חבר טוב' : 'אדם'}

כתוב את הברכה בלבד, ללא הוספות או הסברים.`;

  try {
    const response = await fetch('/api/generate-blessing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, length }),
    });

    if (!response.ok) throw new Error('API error');

    const data = await response.json();
    return data.blessing || 'לא הצלחנו לייצר ברכה. אנא נסו שוב.';
  } catch (error) {
    console.error('Error generating blessing:', error);
    return 'לא הצלחנו להתחבר לשירות. אנא בדקו את חיבור האינטרנט וחזרו שנית.';
  } finally {
    isGenerating = false;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const speaker = document.getElementById('speaker').value;
  const brideName = document.getElementById('bride-name').value;
  const groomName = document.getElementById('groom-name').value;
  const tone = document.getElementById('tone').value;
  const length = document.getElementById('length').value;
  const details = document.getElementById('details').value;

  if (!speaker || !brideName || !groomName || !tone || !length) {
    alert('אנא מלאו את כל השדות הדרושים');
    return;
  }

  lastFormData = { speaker, brideName, groomName, tone, length, details };

  // Show loading state
  blessingOutput.textContent = 'יוצרים את הברכה שלכם...';
  resultContainer.hidden = false;
  noResult.hidden = true;

  const blessing = await generateBlessingWithAI(speaker, brideName, groomName, tone, length, details);
  blessingOutput.textContent = blessing;

  // Scroll to result
  setTimeout(() => {
    resultContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
});

copyBtn.addEventListener('click', () => {
  const text = blessingOutput.textContent;
  navigator.clipboard.writeText(text).then(() => {
    const message = document.createElement('div');
    message.className = 'copy-success';
    message.textContent = '✓ ברכה הועתקה להדבקה!';
    copyBtn.parentElement.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }).catch(() => {
    alert('לא הצלחנו להעתיק את הברכה');
  });
});

regenerateBtn.addEventListener('click', async () => {
  if (lastFormData && !isGenerating) {
    blessingOutput.textContent = 'יוצרים ברכה חדשה...';
    const blessing = await generateBlessingWithAI(
      lastFormData.speaker,
      lastFormData.brideName,
      lastFormData.groomName,
      lastFormData.tone,
      lastFormData.length,
      lastFormData.details
    );
    blessingOutput.textContent = blessing;
  }
});

// Show no-result message on load
window.addEventListener('load', () => {
  noResult.hidden = false;
  resultContainer.hidden = true;
});
