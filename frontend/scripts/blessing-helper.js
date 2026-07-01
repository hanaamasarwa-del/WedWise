// Blessing Helper - Wedding Blessing Generator with AI

const form = document.getElementById('blessing-form');
const resultContainer = document.getElementById('result-container');
const noResult = document.getElementById('no-result');
const blessingOutput = document.getElementById('blessing-output');
const copyBtn = document.getElementById('copy-btn');
const regenerateBtn = document.getElementById('regenerate-btn');

let lastFormData = null;
let isGenerating = false;
const i18n = window.WedWiseI18n;
const isEnglish = () => i18n?.isEnglish?.() === true;
const tx = (heText, enText) => (isEnglish() ? enText : heText);

const blessingValueLabels = {
  'חברה-טובה': 'close female friend',
  'חבר-טוב': 'close male friend',
  'אחות': 'sister',
  'אח': 'brother',
  'אמא': 'mother',
  'אבא': 'father',
  'בן-משפחה': 'male family member',
  'בת-משפחה': 'female family member',
  'מלווה': 'wedding attendant',
  'אורח': 'guest',
  'מרגש': 'emotional',
  'קליל-וחם': 'light and warm',
  'אלגנטי': 'elegant',
  'מצחיק': 'gently funny',
  'קצר-ופשוט': 'short and simple',
  'אישי': 'personal and family-oriented',
  'מסורתי': 'traditional and gentle',
  'קצר-מאוד': 'very short (up to 3 sentences)',
  'קצר': 'short (about 5-7 sentences)',
  'בינוני': 'medium (about 10-12 sentences)',
};

function labelFor(value) {
  return isEnglish() ? (blessingValueLabels[value] || value) : value;
}

async function generateBlessingWithAI(speaker, brideName, groomName, tone, length, details) {
  isGenerating = true;

  const prompt = isEnglish() ? `
You are an AI assistant that writes natural wedding blessings in English.
Write a wedding blessing/speech for a bride named ${brideName} and a groom named ${groomName}.

Speaker: ${labelFor(speaker)}
Tone: ${labelFor(tone)}
Length: ${labelFor(length)}
${details ? `Personal details: ${details}` : ''}

Requirements:
- Natural, warm English
- Suitable for a wedding setting
- Avoid heavy religious language unless the selected tone is traditional
- Keep the voice appropriate for ${labelFor(speaker)}
- Write only the blessing, without explanations or extra notes.`
  : `
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
    return data.blessing || tx('לא הצלחנו לייצר ברכה. אנא נסו שוב.', 'We could not generate a blessing. Please try again.');
  } catch (error) {
    console.error('Error generating blessing:', error);
    return tx('לא הצלחנו להתחבר לשירות. אנא בדקו את חיבור האינטרנט וחזרו שנית.', 'We could not connect to the service. Please check the connection and try again.');
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
    alert(tx('אנא מלאו את כל השדות הדרושים', 'Please fill in all required fields'));
    return;
  }

  lastFormData = { speaker, brideName, groomName, tone, length, details };

  // Show loading state
  blessingOutput.textContent = tx('יוצרים את הברכה שלכם...', 'Creating your blessing...');
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
    message.textContent = tx('✓ ברכה הועתקה להדבקה!', '✓ Blessing copied!');
    copyBtn.parentElement.appendChild(message);

    setTimeout(() => {
      message.remove();
    }, 2000);
  }).catch(() => {
    alert(tx('לא הצלחנו להעתיק את הברכה', 'We could not copy the blessing'));
  });
});

regenerateBtn.addEventListener('click', async () => {
  if (lastFormData && !isGenerating) {
    blessingOutput.textContent = tx('יוצרים ברכה חדשה...', 'Creating a new blessing...');
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
