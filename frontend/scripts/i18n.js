'use strict';

(() => {
  const STORAGE_KEY = 'wedwise_lang';
  const DEFAULT_LANG = 'he';
  const SUPPORTED = ['he', 'en'];

  const heToEn = {
    'ראשי': 'Home',
    'שאלון תכנון': 'Planning questionnaire',
    'ספירה לאחור': 'Countdown',
    'כתיבת ברכה': 'Blessing writer',
    'טיפים ומדריכים': 'Tips and guides',
    'אודות': 'About',
    'שאלות נפוצות': 'FAQ',
    'כל הזכויות שמורות.': 'All rights reserved.',
    '© 2026 WedWise. כל הזכויות שמורות.': '© 2026 WedWise. All rights reserved.',
    '&copy; 2026 WedWise. כל הזכויות שמורות.': '© 2026 WedWise. All rights reserved.',

    'WedWise – תכנון חתונות חכם ואישי': 'WedWise - Smart, personal wedding planning',
    'תכנון חתונות חכם ואישי': 'Smart, personal wedding planning',
    'WedWise – צור את החתונה הייחודית שלך': 'WedWise - Create Your Unique, Personalized Wedding',
    'WedWise הוא אתר חכם לתכנון חתונות, שעוזר לזוגות להתחיל את התהליך בצורה מסודרת, אישית ומותאמת לתקציב. ממלאים שאלון קצר על החתונה שחולמים עליה — ומקבלים דוח מותאם אישית עם כיוון עיצובי והמלצות ראשוניות.': 'WedWise is a smart wedding-planning site that helps couples start the process in an organized, personal, budget-aware way. Fill out a short questionnaire about the wedding you imagine and receive a personalized report with design direction and initial recommendations.',
    'התחילו את השאלון': 'Start the questionnaire',
    'איך זה עובד?': 'How it works',
    'תהליך תכנון החתונה שלכם בשלוש שלבים פשוטים': 'Your wedding planning process in three simple steps',
    'ממלאים שאלון': 'Fill out a questionnaire',
    'מספרים לנו על התקציב, האורחים, האזור, הסגנון והעדפות העיצוב שלכם. השאלון קצר וקל, ויכול להיעשות בכמה דקות בלבד.': 'Tell us about your budget, guests, region, style, and design preferences. The questionnaire is short, simple, and takes only a few minutes.',
    'מקבלים דוח מותאם': 'Receive a tailored report',
    'המערכת מנתחת את המידע שהזנתם ומייצרת דוח אישי עם המלצות קונקרטיות והכוונה לתכנון החתונה של חלומכם.': 'The system analyzes your answers and creates a personal report with practical recommendations and guidance for planning your dream wedding.',
    'מתקדמים עם הסוכנות': 'Continue with the agency',
    'רוצים להמשיך? נציג שלנו יחזור אליכם ויעזור לסגור אולם, דיג׳יי, עיצוב ושאר השירותים שאתם צריכים.': 'Want to continue? Our representative will contact you and help close the venue, DJ, design, and any other services you need.',
    'עיצוב אישי': 'Personal design',
    'כיוון עיצובי שמרגיש אישי מהרגע הראשון': 'Design direction that feels personal from the first step',
    'העיצוב מייצר חוויה עדינה, נקייה ורומנטית סביב השאלון. המטרה היא לעזור לזוגות לדמיין את האירוע עוד לפני בחירת אולם או ספקים בפועל.': 'The design creates a soft, clean, romantic experience around the questionnaire. The goal is to help couples imagine the event even before choosing an actual venue or suppliers.',
    'התאמה לצבעים, פרחים וסגנון האירוע': 'Matched to your colors, flowers, and event style',
    'תכנון לפי כמות אורחים ותקציב': 'Planned around guest count and budget',
    'מקום לטקסט אישי ולחלום החתונה שלכם': 'Space for personal text and your wedding dream',
    'בונים את תמונת החתונה שלכם': 'Build your wedding picture',
    'ענו על כמה שאלות קצרות כדי לקבל דוח ראשוני מותאם אישית.': 'Answer a few short questions to receive a personalized initial report.',
    'למה לבחור ב־ WedWise?': 'Why choose WedWise?',
    'שאלון חכם': 'Smart questionnaire',
    'שאלות מדוקדקות שעוזרות לנו להבין בדיוק את החזון שלכם.': 'Precise questions that help us understand your vision.',
    'בינה מלאכותית': 'Artificial intelligence',
    'ניתוח מתקדם של ההעדפות שלכם ליצירת המלצות מדויקות.': 'Advanced analysis of your preferences to create accurate recommendations.',
    'התאמה לתקציב': 'Budget fit',
    'כל ההמלצות והספקים מותאמים לדיוק לתקציב שלכם.': 'All recommendations and suppliers are carefully matched to your budget.',
    'שירות אנושי': 'Human service',
    'נציג אישי שיעזור לכם בכל שלב של תהליך התכנון.': 'A personal representative to help you at every planning stage.',
    'חיסכון בזמן': 'Save time',
    'תכנון מסודר ויעיל, ללא התלבטויות וחיפוש סתום.': 'Organized, efficient planning without scattered searching.',
    'חתונה ייחודית': 'A unique wedding',
    'דוח אישי לחלוטין שמשקף את הסגנון והאישיות שלכם.': 'A fully personal report that reflects your style and personality.',

    'שאלון תכנון החתונה – WedWise': 'Wedding planning questionnaire - WedWise',
    'מעצב חתונות AI': 'AI wedding designer',
    'שלום! ספרו לי איך אתם מדמיינים את החתונה שלכם, ואני אעזור להפוך את הפרטים לכיוון תכנון מסודר.': 'Hi! Tell me how you imagine your wedding, and I will help turn the details into a clear planning direction.',
    'שלב 1 מתוך 6': 'Step 1 of 6',
    'תקציב ואורחים': 'Budget and guests',
    'תקציב, אורחים ותאריך': 'Budget, guests, and date',
    'תקציב משוער (₪)': 'Estimated budget (₪)',
    'מספר אורחים משוער': 'Estimated guest count',
    'אזור וסגנון': 'Region and style',
    'תאריך החתונה': 'Wedding date',
    'בחירת סוג תאריך החתונה': 'Choose wedding date type',
    'תאריך מדויק': 'Exact date',
    'טווח משוער': 'Estimated range',
    'בחרו תאריך': 'Choose date',
    'שנה': 'Year',
    'חודש': 'Month',
    'יום': 'Day',
    'בחרו שנה': 'Choose year',
    'בחרו חודש': 'Choose month',
    'בחרו יום': 'Choose day',
    'משנה': 'From year',
    'מחודש': 'From month',
    'עד שנה': 'To year',
    'עד חודש': 'To month',
    'אם עדיין אין תאריך מדויק, בחרו טווח של חודש ושנה.': 'If you do not have an exact date yet, choose a month and year range.',
    'תאריך או טווח חתונה': 'Wedding date or range',
    'אזור בארץ': 'Region in Israel',
    'בחרו אזור': 'Choose a region',
    'ירושלים והסביבה': 'Jerusalem area',
    'המרכז': 'Central Israel',
    'הצפון': 'Northern Israel',
    'הדרום': 'Southern Israel',
    'סגנון חתונה מועדף': 'Preferred wedding style',
    'רומנטי': 'Romantic',
    'אלגנטי': 'Elegant',
    'כפרי': 'Rustic',
    'מודרני': 'Modern',
    'בוהו': 'Boho',
    'מינימליסטי': 'Minimalist',
    'אורבני': 'Urban',
    'מסורתי': 'Traditional',
    'צבעים, פרחים וקישוטים': 'Colors, flowers, and decor',
    'צבעים מועדפים': 'Preferred colors',
    'סוגי פרחים (ניתן לבחור כמה)': 'Flower types (select multiple)',
    'ורדים': 'Roses',
    'אנמונים': 'Anemones',
    'פרחי אביב': 'Spring flowers',
    'סוקולנטים': 'Succulents',
    'סחלבים': 'Orchids',
    'פרחי שדה': 'Wildflowers',
    'קישוטים (ניתן לבחור כמה)': 'Decorations (select multiple)',
    'נרות': 'Candles',
    'תאורה רכה': 'Soft lighting',
    'בדים ווילונות': 'Fabrics and drapes',
    'עץ וטבע': 'Wood and nature',
    'זהב ומתכת': 'Gold and metal',
    'שיחה עם המעצב': 'Conversation with the designer',
    'תארו לי במילים שלכם את האווירה: חופה, שולחנות, צבעים, פרחים, תאורה או כל פרט שחשוב לכם.': 'Describe the atmosphere in your own words: ceremony canopy, tables, colors, flowers, lighting, or any detail that matters to you.',
    'האווירה שאתם חולמים עליה': 'The atmosphere you dream of',
    'הטקסט הזה ייכנס לדוח הדמו ובהמשך ישמש לניתוח AI.': 'This text will appear in the demo report and later be used for AI analysis.',
    'השראה לחתונה': 'Wedding inspiration',
    '(אופציונלי)': '(Optional)',
    'יש לכם לוח Pinterest או השראה שאספתם?': 'Do you have a Pinterest board or saved inspiration?',
    'שתפו קישור אחד ונצרף אותו לבקשה, כדי שהכיוון העיצובי יהיה קרוב יותר למה שאתם אוהבים.': 'Share one link and we will attach it to the request so the design direction is closer to what you love.',
    'בלוג חתונות': 'Wedding blog',
    'קישור להשראה': 'Inspiration link',
    'השדה אופציונלי לחלוטין. אפשר להשאיר ריק ולהמשיך לשלב הבא.': 'This field is completely optional. You can leave it blank and continue.',
    'פרטי יצירת קשר': 'Contact details',
    'שם מלא': 'Full name',
    'טלפון': 'Phone',
    'אימייל': 'Email',
    'חזרה': 'Back',
    'הבא': 'Next',
    'שליחה וקבלת דוח': 'Submit and get report',
    'אישור הדוח': 'Confirm report',
    'עריכת התשובות': 'Edit answers',
    'התחילו מחדש': 'Start over',
    'צרו הדמיית חתונה': 'Create wedding visualization',
    'עצבו הזמנה תואמת': 'Design matching invitation',
    'בנו ספירה לאחור': 'Build countdown',
    'הכלים יקבלו את הפרטים שמילאתם בדוח. בספירה לאחור תצטרכו לבחור תאריך אם עדיין לא הזנתם אחד.': 'The tools will use the details from your report. In the countdown tool you will need to choose a date if you have not entered one yet.',

    'ספירה לאחור לחתונה – WedWise': 'Wedding countdown - WedWise',
    'ספירה לאחור לחתונה': 'Wedding countdown',
    'בחרו תאריך וקבלו ספירה לאחור מעוצבת ליום הגדול': 'Choose a date and get a designed countdown for the big day',
    'תאריך החתונה *': 'Wedding date *',
    'שמות בני הזוג (אופציונלי)': 'Couple names (optional)',
    'כותרת אישית (אופציונלי)': 'Custom title (optional)',
    'תמונת השראה (אופציונלי)': 'Inspiration image (optional)',
    'העלו תמונת השראה כדי שה-AI יוכל ליצור עיצוב דומה לאירוע שלכם': 'Upload an inspiration image so the AI can create a similar design for your event',
    'יצירת ספירה': 'Create countdown',
    'ניקוי': 'Clear',
    'חודשים': 'Months',
    'ימים': 'Days',
    'עיצוב שנוצר על ידי AI': 'AI-generated design',
    'הורדת העיצוב': 'Download design',
    'הורדת התמונה': 'Download image',
    'העתקה': 'Copy',
    'יצירת עיצוב AI': 'Create AI design',
    '✓ התמונה הועתקה!': '✓ Image copied!',
    'בחרו תאריך לחתונה וקליקו על "יצירת ספירה"': 'Choose a wedding date and click "Create countdown"',
    'המשיכו לתכנן': 'Continue planning',
    'הכלים מחוברים לאותה חוויית WedWise ומשלימים את תהליך התכנון.': 'The tools connect to the same WedWise experience and complete the planning process.',
    'עדכנו תקציב, סגנון והעדפות.': 'Update budget, style, and preferences.',
    'פתחו שאלון': 'Open questionnaire',
    'צרו תצוגה מעוצבת לתאריך החתונה.': 'Create a designed view for your wedding date.',
    'אתם כאן': 'You are here',
    'בנו ברכה אישית, מסודרת ומרגשת.': 'Build a personal, organized, heartfelt blessing.',
    'כתבו ברכה': 'Write blessing',
    'פתחו ספירה': 'Open countdown',

    'כתיבת ברכה לחתונה – WedWise': 'Wedding blessing writer - WedWise',
    'כתיבת ברכה לחתונה': 'Wedding blessing writer',
    'צרו ברכה אישית, טבעית ומרגשת בכמה צעדים פשוטים': 'Create a personal, natural, moving blessing in a few simple steps',
    'מי מברך/ת?': 'Who is giving the blessing?',
    'בחרו מי מדבר': 'Choose who is speaking',
    'חברה טובה': 'Close female friend',
    'חבר טוב': 'Close male friend',
    'אחות': 'Sister',
    'אח': 'Brother',
    'אמא': 'Mother',
    'אבא': 'Father',
    'בן משפחה': 'Male family member',
    'בת משפחה': 'Female family member',
    'מלווה': 'Attendant',
    'אורח': 'Guest',
    'שם הכלה': 'Bride name',
    'שם החתן': 'Groom name',
    'סגנון הברכה': 'Blessing tone',
    'בחרו סגנון': 'Choose tone',
    'מרגש': 'Emotional',
    'קליל וחם': 'Light and warm',
    'מצחיק בעדינות': 'Gently funny',
    'קצר ופשוט': 'Short and simple',
    'אישי ומשפחתי': 'Personal and family-oriented',
    'מסורתי ועדין': 'Traditional and gentle',
    'אורך הברכה': 'Blessing length',
    'בחרו אורך': 'Choose length',
    'קצר מאוד (עד 3 משפטים)': 'Very short (up to 3 sentences)',
    'קצר (כ-5-7 משפטים)': 'Short (about 5-7 sentences)',
    'בינוני (כ-10-12 משפטים)': 'Medium (about 10-12 sentences)',
    'פרטים אישיים (אופציונלי)': 'Personal details (optional)',
    'יצירת ברכה': 'Create blessing',
    'העתקת הברכה': 'Copy blessing',
    'יצירה מחדש': 'Regenerate',
    '💡 מומלץ לעבור על הטקסט ולהוסיף נגיעות אישיות לפני ההקראה.': 'Tip: Review the text and add personal touches before reading it aloud.',
    'מלאו את הטופס וקליקו על "יצירת ברכה" כדי ליצור ברכה אישית': 'Fill out the form and click "Create blessing" to generate a personal blessing',
    'שלבו את כלי כתיבת הברכה עם השאלון והספירה לחוויית תכנון אחידה.': 'Combine the blessing writer with the questionnaire and countdown for one connected planning experience.',

    'יצירת הזמנת חתונה – WedWise': 'Wedding invitation creator - WedWise',
    'חזרה לדוח': 'Back to report',
    '💌 יצירת הזמנת החתונה': 'Create your wedding invitation',
    'שם ראשון (כלה / חתן)': 'First name (bride / groom)',
    'שם שני (בן / בת הזוג)': 'Second name (partner)',
    'עריכת פרטי ההזמנה': 'Edit invitation details',
    'בחירת שפת ההזמנה': 'Choose invitation language',
    'תצוגת הזמנת חתונה': 'Wedding invitation preview',
    'תאריך החתונה': 'Wedding date',
    'מקום / אולם': 'Place / venue',
    'טקסט ההזמנה': 'Invitation text',
    'שפת ההזמנה': 'Invitation language',
    'עברית': 'Hebrew',
    'הורדת PNG': 'Download PNG',
    'הדפסה / שמירה כ-PDF': 'Print / save as PDF',

    'אודות – WedWise': 'About - WedWise',
    'הסיפור שלנו': 'Our story',
    'WedWise – תכנון חתונות': 'WedWise - Wedding planning',
    'חכם ואישי': 'Smart and personal',
    'אנחנו מאמינים שכל זוג ראוי לחתונה שמרגישה בדיוק כמותם. WedWise נוצר כדי להפוך את תהליך התכנון לפשוט, מהנה ומותאם אישית — מהרגע הראשון.': 'We believe every couple deserves a wedding that feels exactly like them. WedWise was created to make planning simple, enjoyable, and personal from the very first step.',
    'מה זה WedWise?': 'What is WedWise?',
    'פלטפורמה חכמה לתכנון החתונה של חלומכם': 'A smart platform for planning your dream wedding',
    'WedWise הוא כלי תכנון חתונות דיגיטלי שנבנה עבור זוגות בישראל. הפלטפורמה משלבת שאלון תכנון מעמיק, עיבוד חכם של ה-AI ושירות אנושי אישי — כדי לעזור לכם להתחיל את מסע תכנון החתונה בצורה מסודרת ומדויקת.': 'WedWise is a digital wedding planning tool built for couples in Israel. The platform combines a deep planning questionnaire, smart AI processing, and personal human service to help you start planning clearly and accurately.',
    'בעזרת שאלון קצר, המערכת מייצרת עבורכם דוח מותאם אישית הכולל כיוון עיצובי, המלצות על ספקים, פירוק תקציב ועוד — הכל בהתאמה לחזון שלכם.': 'With a short questionnaire, the system creates a personalized report with design direction, supplier recommendations, budget breakdown, and more, all matched to your vision.',
    'למה יצרנו את זה?': 'Why we created it',
    'כי תכנון חתונה לא אמור להיות מלחיץ': 'Because wedding planning should not feel stressful',
    'תכנון חתונה הוא אחד האירועים המרגשים והמורכבים בחיים. מתוך ניסיון ישיר עם זוגות רבים, הבנו שהשלב הראשון — לדעת מאין להתחיל — הוא לרוב המאתגר ביותר.': 'Wedding planning is one of life’s most exciting and complex events. From direct experience with many couples, we learned that the first step, knowing where to begin, is often the hardest.',
    'המון ספקים, אין-ספור אפשרויות, לחץ תקציבי ושאלות שלא יודעים מה לשאול. WedWise נוצר כדי לייצר לכם נקודת פתיחה ברורה, מותאמת אישית, ובעיקר — שלווה.': 'Many suppliers, endless options, budget pressure, and questions you do not yet know to ask. WedWise was created to give you a clear, personal, and calmer starting point.',
    'איך זה עוזר לכם?': 'How it helps you',
    'ממלאים שאלון — ומקבלים כיוון ברור': 'Fill out a questionnaire and get clear direction',
    'WedWise מלווה אתכם לאורך כל שלבי תכנון החתונה — מהרגע שהחלטתם עד לסגירת כל הספקים.': 'WedWise supports you through every stage of wedding planning, from the decision to begin until all suppliers are booked.',
    'שאלון תכנון מקיף שמכסה תקציב, אורחים, סגנון, צבעים, פרחים ואווירה — בכמה דקות בלבד.': 'A full planning questionnaire covering budget, guests, style, colors, flowers, and atmosphere in only a few minutes.',
    'דוח אישי מותאם עם כיוון עיצובי, פירוק תקציב ראשוני והמלצות על ספקים רלוונטיים.': 'A tailored personal report with design direction, initial budget breakdown, and relevant supplier recommendations.',
    'ספירה לאחור אישית שתזכיר לכם כמה ימים נשארו עד ליום הגדול.': 'A personal countdown that reminds you how many days are left until the big day.',
    'כלי כתיבת ברכה שיעזור לכם לנסח טקסטים אישיים ומרגשים לכרטיסי הזמנה ולהודעות.': 'A blessing-writing tool that helps you craft personal, meaningful text for invitations and messages.',
    'נציג אנושי שיחזור אליכם ויסייע בסגירת כל הפרטים — אולם, דיג׳יי, עיצוב ועוד.': 'A human representative who will contact you and help finalize the details: venue, DJ, design, and more.',
    'ה-AI שמבין את החלום שלכם': 'AI that understands your dream',
    'לב המערכת של WedWise הוא מנוע AI מתקדם שמנתח את כל התשובות שסיפקתם ויוצר עבורכם חוויה מותאמת לחלוטין — לא תבנית גנרית, אלא המלצות שמרגישות כאילו נכתבו בשבילכם בדיוק.': 'At the heart of WedWise is an advanced AI engine that analyzes your answers and creates a fully tailored experience, not a generic template, but recommendations that feel written for you.',
    'ה-AI מנתח את הסגנון, הצבעים והפרחים שבחרתם ומייצר כיוון עיצובי קוהרנטי.': 'The AI analyzes your style, colors, and flowers to create a coherent design direction.',
    'כל ההמלצות מסוננות לפי התקציב שהזנתם — ללא הפתעות ועלויות בלתי צפויות.': 'All recommendations are filtered by the budget you entered, avoiding surprises and unexpected costs.',
    'התאמה אזורית': 'Regional matching',
    'ספקים ואולמות מוצעים בהתאם לאזור הגיאוגרפי שבחרתם בישראל.': 'Suppliers and venues are suggested according to the geographic region you chose in Israel.',
    'השראה חכמה': 'Smart inspiration',
    'ניתן לשתף לוח Pinterest או מצב רוח — ה-AI ילמד ממנו ויתאים את ההמלצות.': 'You can share a Pinterest board or mood board, and the AI will learn from it and adjust recommendations.',
    'הצוות שלנו': 'Our team',
    'הכירו את הסוכנות מאחורי WedWise': 'Meet the agency behind WedWise',
    'WedWise נוצר ומתפעל על ידי צוות אנשי מקצוע בעולמות תכנון חתונות, טכנולוגיה ועיצוב. אנחנו משלבים ניסיון אנושי עם כלים טכנולוגיים מתקדמים כדי להעניק לכם את החוויה הטובה ביותר.': 'WedWise is created and operated by professionals in wedding planning, technology, and design. We combine human experience with advanced tools to give you the best experience.',
    'צוות WedWise': 'WedWise team',
    'תכנון חתונות | טכנולוגיה | עיצוב': 'Wedding planning | Technology | Design',
    'אנחנו קבוצה של אנשי מקצוע שמאמינים שכל חתונה היא סיפור אחר. הצוות שלנו כולל מתכנני אירועים עם ניסיון של שנים, מעצבים גרפיים, ומומחי טכנולוגיה — כולם עם מטרה אחת משותפת: לעזור לכם לממש את חתונת החלומות שלכם.': 'We are a group of professionals who believe every wedding is a different story. Our team includes experienced event planners, graphic designers, and technology specialists, all with one shared goal: helping you bring your dream wedding to life.',
    'הגישה שלנו': 'Our approach',
    'אנושי · אישי · מקצועי': 'Human · Personal · Professional',
    'אנחנו מאמינים שטכנולוגיה היא כלי — אבל האנשים מאחוריה הם הלב. לכן, לצד מנוע ה-AI החכם שלנו, תמיד ישנו נציג אנושי שיעמוד לרשותכם, יענה על שאלות ויסייע בכל החלטה — מהקטנה ועד הגדולה.': 'We believe technology is a tool, but the people behind it are the heart. That is why, alongside our smart AI engine, a human representative is always available to answer questions and support every decision, small or large.',
    'מוכנים להתחיל את המסע?': 'Ready to start the journey?',
    'מלאו את השאלון הקצר שלנו וקבלו דוח מותאם אישית — חינם, בלי התחייבות.': 'Fill out our short questionnaire and receive a personalized report, free and with no commitment.',
    'מעבר לשאלון תכנון': 'Go to planning questionnaire',

    'שאלות נפוצות – WedWise': 'FAQ - WedWise',
    'תשובות לשאלות שלכם': 'Answers to your questions',
    'כל מה שרציתם לדעת על WedWise — השאלון, הדוח, ה-AI, ההזמנות והשירות האנושי — במקום אחד.': 'Everything you wanted to know about WedWise: the questionnaire, report, AI, invitations, and human service, all in one place.',
    'נושאים': 'Topics',
    'כללי': 'General',
    'הדוח וה-AI': 'The report and AI',
    'הזמנות': 'Invitations',
    'פרטיות ושירות': 'Privacy and service',
    'WedWise היא פלטפורמה דיגיטלית לתכנון חתונות, שנבנתה עבור זוגות בישראל. המערכת משלבת': 'WedWise is a digital wedding planning platform built for couples in Israel. The system combines',
    'שאלון תכנון חכם': 'a smart planning questionnaire',
    ', עיבוד AI מתקדם ושירות אנושי אישי — כדי לעזור לכם להתחיל את מסע תכנון החתונה בצורה מסודרת, מהירה ומותאמת אישית.': ', advanced AI processing, and personal human service to help you begin wedding planning in an organized, fast, and personalized way.',
    'תוך כמה דקות של מילוי שאלון, תקבלו דוח ראשוני הכולל כיוון עיצובי, פירוק תקציב ראשוני והמלצות על ספקים — הכל מותאם בדיוק לחזון שלכם.': 'Within a few minutes of filling out the questionnaire, you receive an initial report with design direction, budget breakdown, and supplier recommendations, all matched to your vision.',
    'האם אני צריכ/ה לדעת בדיוק את סגנון החתונה שלי לפני שממלאים את השאלון?': 'Do I need to know my exact wedding style before filling out the questionnaire?',
    'ממש לא. השאלון נועד בדיוק לעזור לכם לגלות ולהגדיר את הסגנון שלכם. מספיק שתענו על השאלות לפי מה שמרגיש לכם נכון —': 'Not at all. The questionnaire is designed to help you discover and define your style. Just answer according to what feels right to you, and',
    'WedWise ידאג לשאר': 'WedWise will take care of the rest.',
    'אם אתם בין שניים סגנונות, בחרו את הקרוב יותר לכם. תמיד ניתן לחזור ולערוך את התשובות.': 'If you are between two styles, choose the one closest to you. You can always go back and edit your answers.',
    'האם WedWise מחליף מתכנן/ת חתונות מקצועי/ת?': 'Does WedWise replace a professional wedding planner?',
    'לא — WedWise הוא': 'No. WedWise is',
    'נקודת פתיחה חכמה': 'a smart starting point',
    ', לא תחליף לניסיון האנושי של מתכנן/ת חתונות. הפלטפורמה מיועדת לעזור לכם להתמצא, להבין מה אתם רוצים ולקבל כיוון ראשוני.': ', not a replacement for the human experience of a wedding planner. The platform helps you understand the landscape, clarify what you want, and get initial direction.',
    'לאחר שתאשרו את הדוח, נציג/ה מהסוכנות שלנו יחזור/תחזור אליכם ויעזור/תעזור לסגור ספקים, אולם וכל שאר הפרטים — בשירות אנושי מלא.': 'After you confirm the report, a representative from our agency will contact you and help close suppliers, the venue, and all other details with full human service.',
    'האם השירות בחינם?': 'Is the service free?',
    'כן — מילוי השאלון וקבלת הדוח הראשוני הם': 'Yes. Filling out the questionnaire and receiving the initial report are',
    'ללא עלות': 'free of charge',
    ', ללא התחייבות. אם תרצו להמשיך ולעבוד עם הסוכנות לאחר קבלת הדוח, נציג יצור איתכם קשר לדיון בתנאים.': ', with no commitment. If you want to continue working with the agency after receiving the report, a representative will contact you to discuss terms.',
    'איך עובד דוח ה-AI של WedWise?': 'How does the WedWise AI report work?',
    'לאחר שתמלאו את השאלון, מנוע ה-AI של WedWise מנתח את כל התשובות שלכם — תקציב, מספר אורחים, אזור, סגנון, צבעים, פרחים, קישוטים ואווירה.': 'After you fill out the questionnaire, the WedWise AI engine analyzes your answers: budget, guest count, region, style, colors, flowers, decor, and atmosphere.',
    'בתוך שניות ייוצר עבורכם': 'Within seconds, it creates',
    'דוח מותאם אישית': 'a personalized report',
    'הכולל:': 'that includes:',
    '• כיוון עיצובי ופלטת צבעים · • פירוק תקציב ראשוני לפי קטגוריות · • המלצות על ספקים · • ציר זמן ראשוני לתכנון · • תקציר חלומות החתונה שלכם': 'Design direction and color palette · Initial budget breakdown by category · Supplier recommendations · Initial planning timeline · Summary of your wedding dream',
    'האם אפשר להוסיף קישור Pinterest או השראה?': 'Can I add a Pinterest or inspiration link?',
    'כן! בשלב 5 של השאלון תמצאו שדה ייעודי להוספת קישור השראה — Pinterest, Instagram, בלוג חתונות, Mood Board, או כל קישור אחר שתרצו.': 'Yes. In step 5 of the questionnaire you will find a field for an inspiration link: Pinterest, Instagram, wedding blog, mood board, or any other link you want.',
    'ה-AI ישתמש בקישור כדי': 'The AI will use the link to',
    'להבין את הסגנון שאתם אוהבים': 'understand the style you love',
    'ויתאים את ההמלצות בהתאם. השדה הוא אופציונלי לחלוטין — ניתן להשאיר ריק ולהמשיך.': 'and adjust recommendations accordingly. The field is completely optional and can be left blank.',
    'האם אפשר לערוך את התשובות שלי לאחר שליחת הדוח?': 'Can I edit my answers after submitting the report?',
    'כן. לאחר שתקבלו את הדוח, תוכלו ללחוץ על': 'Yes. After receiving the report, you can click',
    '"עריכת התשובות"': '"Edit answers"',
    'ולחזור לשאלון עם כל הנתונים שהזנתם. לאחר עריכה, שליחה מחדש תייצר דוח מעודכן.': 'and return to the questionnaire with your entered data. After editing, submitting again will create an updated report.',
    'האם אפשר ליצור הזמנת חתונה תואמת?': 'Can I create a matching wedding invitation?',
    'כן! לאחר אישור הדוח, WedWise מציע כלי ליצירת': 'Yes. After confirming the report, WedWise offers a tool for creating',
    'הזמנת חתונה דיגיטלית': 'a digital wedding invitation',
    'המבוססת על הסגנון, הצבעים והאווירה שבחרתם בשאלון.': 'based on the style, colors, and atmosphere you chose in the questionnaire.',
    'ניתן לגשת לכלי ההזמנות גם ישירות דרך': 'You can also access the invitation tool directly through',
    'עמוד ההזמנות': 'the invitations page.',
    'האם אפשר להוריד את ההזמנה?': 'Can I download the invitation?',
    'כן. לאחר שתיצרו את ההזמנה, תוכלו': 'Yes. After creating the invitation, you can',
    'להוריד אותה כקובץ תמונה': 'download it as an image file',
    'ולשתף אותה ישירות בוואטסאפ, אינסטגרם או כל פלטפורמה אחרת.': 'and share it directly on WhatsApp, Instagram, or any other platform.',
    'האם המידע שלי נשלח לסוכנות?': 'Is my information sent to the agency?',
    'המידע שתזינו בשאלון': 'The information you enter in the questionnaire',
    'נשמר בצורה מאובטחת': 'is stored securely',
    'ומשמש לצורך יצירת הדוח האישי. לאחר שתאשרו את הדוח, פרטי הקשר שלכם (שם, טלפון ואימייל) יועברו לנציג הסוכנות שיחזור אליכם להמשך תהליך התכנון.': 'and used to create your personal report. After you confirm the report, your contact details (name, phone, and email) are passed to an agency representative who will contact you for the next planning stage.',
    'לא נשתף את המידע שלכם עם גורמים שלישיים ללא הסכמתכם.': 'We will not share your information with third parties without your consent.',
    'איך הסוכנות יכולה ליצור איתי קשר?': 'How can the agency contact me?',
    'לאחר שתאשרו את הדוח שקיבלתם, נציג/ה מהסוכנות יחזור/תחזור אליכם': 'After you confirm the report you received, a representative from the agency will contact you',
    'בהודעת טקסט או שיחת טלפון': 'by text message or phone call',
    'למספר שהזנתם בשאלון.': 'using the number you entered in the questionnaire.',
    'זמן החזרה הממוצע הוא עד 24 שעות בימי עסקים.': 'Average response time is up to 24 hours on business days.',
    'לא מצאתם תשובה?': 'Did not find an answer?',
    'מלאו את השאלון ותקבלו דוח אישי — נציג שלנו ישמח לענות על כל שאלה נוספת.': 'Fill out the questionnaire and receive a personal report. Our representative will be happy to answer any further questions.',

    'טיפים ומדריכים לחתונה – WedWise': 'Wedding tips and guides - WedWise',
    'מדריכים וטיפים לזוגות שמתכננים חכם': 'Guides and tips for couples planning smart',
    'טיפים ומדריכים לחתונה רגועה, יפה ומדויקת יותר': 'Tips and guides for a calmer, more beautiful, more precise wedding',
    'אוסף טיפים ומדריכים מעשיים שיעזרו לכם לקבל החלטות טובות יותר: תקציב, רשימת אורחים, בחירת אולם, ספקים, עיצוב, יום האירוע והפרטים הקטנים שנוטים להיזכר בהם מאוחר מדי.': 'A collection of practical tips and guides to help you make better decisions: budget, guest list, venue choice, suppliers, design, event day, and the small details people often remember too late.',
    'תקציב': 'Budget',
    'אורחים': 'Guests',
    'אולם': 'Venue',
    'ספקים': 'Suppliers',
    'צ׳ק ליסט': 'Checklist',
    'טיפים קצרים ומדריכים מעשיים שאפשר באמת להשתמש בהם': 'Short tips and practical guides you can actually use',
    'הכרטיסים נותנים טיפים קצרים לסריקה מהירה. כשרוצים להעמיק, פותחים את המדריך המלא ומקבלים הסבר מסודר יותר על ההחלטה, ההיגיון מאחוריה ונקודות בדיקה לשיחה עם ספקים או עם המשפחה.': 'The cards give short tips for quick scanning. When you want to go deeper, open the full guide for a structured explanation of the decision, the reasoning behind it, and points to check with suppliers or family.',
    'מדריך פתיחה': 'Starter guide',
    'איך בונים תקציב חתונה בלי לגלות מאוחר מדי שחסר כסף': 'How to build a wedding budget without discovering too late that money is missing',
    'תקציב חתונה טוב לא מתחיל מהמחיר של האולם, אלא מהבנה מה באמת חשוב לכם ומה חייב להישאר בשליטה. לפני שמדברים עם ספקים, כדאי לחלק את התקציב לשלושה אזורים: חובה, רצוי, וגמיש.': 'A good wedding budget does not start with the venue price, but with understanding what truly matters and what must stay under control. Before speaking with suppliers, divide the budget into three areas: must-have, wanted, and flexible.',
    'השאירו 8%-12% מהתקציב להוצאות שלא חשבתם עליהן מראש.': 'Leave 8%-12% of the budget for expenses you did not think of in advance.',
    'בדקו מחיר לאורח יחד עם הגברה, תאורה, אבטחה, חניה ומע״מ.': 'Check price per guest together with sound, lighting, security, parking, and VAT.',
    'קבעו מראש על מה לא מתפשרים ועל מה אפשר לוותר אם צריך.': 'Decide in advance what is non-negotiable and what can be dropped if needed.',
    'רשימת אורחים': 'Guest list',
    'רשימת אורחים שמחזיקה תקציב ולא יוצרת דרמות': 'A guest list that protects the budget and avoids drama',
    'הדרך הכי נקייה היא לבנות שלוש שכבות: משפחה קרובה, חברים קרובים, ומעגל נוסף רק אם התקציב מאפשר.': 'The cleanest way is to build three layers: close family, close friends, and an additional circle only if the budget allows.',
    'הגדירו יעד אורחים לפני שמחפשים אולם.': 'Set a guest target before looking for a venue.',
    'סמנו מוזמנים בסבירות הגעה נמוכה.': 'Mark guests with low likelihood of attending.',
    'שמרו גרסה אחת משותפת כדי לא להתבלבל.': 'Keep one shared version to avoid confusion.',
    'בחירת אולם': 'Choosing a venue',
    'שאלות שחייבים לשאול לפני שסוגרים אולם': 'Questions you must ask before booking a venue',
    'אולם יפה הוא רק ההתחלה. חשוב להבין מה כלול, מה בתוספת תשלום ומה קורה אם כמות האורחים משתנה.': 'A beautiful venue is only the beginning. It is important to understand what is included, what costs extra, and what happens if the guest count changes.',
    'מה מחיר המינימום ומה קורה אם מגיעים פחות?': 'What is the minimum price, and what happens if fewer guests arrive?',
    'האם יש מגבלת רעש או שעת סיום?': 'Is there a noise limit or end time?',
    'מי מנהל את האירוע בפועל ביום עצמו?': 'Who actually manages the event on the day itself?',
    'איך לבחור סגנון עיצוב בלי ללכת לאיבוד בפינטרסט': 'How to choose a design style without getting lost on Pinterest',
    'בחרו שלושה עוגנים בלבד: צבע מרכזי, חומר או מרקם, ותחושת אווירה. משם קל יותר לקבל החלטות.': 'Choose only three anchors: a main color, a material or texture, and an atmosphere. From there, decisions become easier.',
    'העדיפו פלטה מצומצמת על פני ערבוב גדול.': 'Prefer a focused palette over a large mix.',
    'חברו את העיצוב לאופי המקום.': 'Connect the design to the character of the venue.',
    'החליטו איפה משקיעים ואיפה שומרים פשוט.': 'Decide where to invest and where to keep things simple.',
    'איך משווים בין ספקים בלי להסתנוור רק מהמחיר': 'How to compare suppliers without focusing only on price',
    'השוואה טובה בודקת התאמה, זמינות, חוזה, גיבוי וניסיון באירועים בגודל דומה לשלכם.': 'A good comparison checks fit, availability, contract, backup, and experience with events of similar size.',
    'בקשו לראות עבודות מאירועים דומים.': 'Ask to see work from similar events.',
    'בדקו מה קורה במקרה ביטול או מחלה.': 'Check what happens in case of cancellation or illness.',
    'כתבו הכל בהצעת מחיר מסודרת.': 'Put everything in a clear price quote.',
    'צילום': 'Photography',
    'לו״ז צילום שמונע לחץ ביום החתונה': 'A photo schedule that prevents stress on the wedding day',
    'ככל שמחליטים מראש איפה ומתי מצטלמים, כך נשאר יותר מקום ליהנות מהאירוע עצמו.': 'The more you decide in advance where and when photos happen, the more space you have to enjoy the event itself.',
    'קבעו שעת מוכנות ריאלית, לא אופטימית.': 'Set a realistic ready time, not an optimistic one.',
    'הכינו רשימת תמונות משפחתיות חובה.': 'Prepare a must-have family photo list.',
    'בדקו זמני נסיעה וחניה בין הלוקיישנים.': 'Check travel and parking times between locations.',
    'אווירה': 'Atmosphere',
    'קבלת פנים שאנשים זוכרים לטובה': 'A welcome reception people remember fondly',
    'שילוט ברור, שתייה נגישה ומוזיקה נעימה עושים את ההבדל בדקות הראשונות.': 'Clear signage, accessible drinks, and pleasant music make the difference in the first minutes.',
    'פרחים': 'Flowers',
    'פרחים: איפה כדאי להשקיע ואיפה אפשר לחסוך': 'Flowers: where to invest and where to save',
    'השקיעו בחופה, בכניסה ובשולחנות המרכזיים. לא כל פינה צריכה אותו תקציב.': 'Invest in the ceremony canopy, entrance, and main tables. Not every corner needs the same budget.',
    'עונות': 'Seasons',
    'חתונת קיץ, חורף או מעבר: מה צריך לבדוק': 'Summer, winter, or shoulder-season wedding: what to check',
    'אל תסגרו תאריך בלי להבין מה קורה בגשם, בחום, ברוח ובשעת השקיעה.': 'Do not close a date without understanding what happens with rain, heat, wind, and sunset time.',
    'אוכל ובר': 'Food and bar',
    'איך בוחרים תפריט שלא נראה טוב רק בטעימות': 'How to choose a menu that works beyond the tasting',
    'טעימות בודקות טעם. באירוע עצמו חשובים גם קצב, צוות ופתרונות לאורחים.': 'Tastings check flavor. At the event itself, pace, staff, and guest solutions also matter.',
    'שבוע האירוע': 'Event week',
    'מה סוגרים בשבוע האחרון כדי לא לרדוף אחרי פרטים': 'What to finalize in the last week so you are not chasing details',
    'השבוע האחרון נועד לסגור קצוות, לא לפתוח מחדש החלטות שכבר התקבלו.': 'The last week is for closing loose ends, not reopening decisions already made.',
    'טקס': 'Ceremony',
    'איך להפוך את הטקס לאישי בלי להפוך אותו לארוך מדי': 'How to make the ceremony personal without making it too long',
    'שניים-שלושה רגעים אישיים עדיפים על טקס ארוך שמאבד קשב.': 'Two or three personal moments are better than a long ceremony that loses attention.',
    'מסיבה': 'Party',
    'רחבה טובה מתחילה הרבה לפני השיר הראשון': 'A good dance floor starts long before the first song',
    'רחבה טובה צריכה בר קרוב, תאורה נכונה ומעט עצירות מיותרות.': 'A good dance floor needs a nearby bar, proper lighting, and few unnecessary stops.',
    'צ׳ק ליסט קצר לפני פגישה עם ספק': 'Short checklist before meeting a supplier',
    'לפני כל פגישה, הכינו תשובות בסיסיות. זה מקצר שיחות, משפר הצעות מחיר, ועוזר לזהות מהר אם הספק מתאים באמת לאופי האירוע שלכם.': 'Before every meeting, prepare basic answers. It shortens conversations, improves quotes, and helps you quickly see whether the supplier truly fits your event.',
    'תאריך או טווח תאריכים אפשרי.': 'A possible date or date range.',
    'מספר אורחים משוער וטווח גמישות.': 'Estimated guest count and flexibility range.',
    'תקציב ריאלי או גבול עליון שאתם לא רוצים לעבור.': 'A realistic budget or upper limit you do not want to pass.',
    'אזור בארץ והעדפות נגישות/חניה.': 'Region in Israel and accessibility/parking preferences.',
    'סגנון כללי: אלגנטי, קליל, כפרי, אורבני או מסורתי.': 'General style: elegant, light, rustic, urban, or traditional.',
    'שלושה דברים שהכי חשובים לכם באירוע.': 'Three things that matter most to you at the event.',
    'מה כבר סגור ומה עדיין פתוח.': 'What is already closed and what is still open.',
    'מי מקבל החלטות ומי צריך לאשר לפני סגירה.': 'Who makes decisions and who must approve before booking.',

    'העוזר של WedWise': 'WedWise Assistant',
    'כאן כדי לעזור': 'Here to help',
    'שלום! אני העוזר של WedWise. אפשר לשאול אותי על האתר, השאלון או תכנון החתונה.': 'Hi! I am the WedWise assistant. You can ask me about the site, questionnaire, or wedding planning.',
    'שלום! אני כאן כדי לעזור בקצרה עם WedWise, השאלון, הדוח וכלי האתר.': 'Hi! I am here to help with WedWise, the questionnaire, the report, and the site tools.',
    'כתבו הודעה': 'Write a message',
    'אפשר לעזור?': 'Need help?',
    'סגירת הצ׳אט': 'Close chat',
    'סגירת הצ\'אט': 'Close chat',
    'פתיחת הצ׳אט': 'Open chat',
    'פתיחת הצ\'אט': 'Open chat',
    'שליחת הודעה': 'Send message',
    'סגירת חלון': 'Close window',
    'הצג המלצות אולמות': 'Show venue recommendations',
    'הצג המלצות די־ג׳יי': 'Show DJ recommendations',
    'הצג המלצות צילום': 'Show photography recommendations',
    'הצג המלצות עיצוב': 'Show design recommendations',
    'הצג המלצות קייטרינג': 'Show catering recommendations',
    'שאלות מהירות': 'Quick questions',
    'מה WedWise עושה?': 'What does WedWise do?',
    'איך מתחילים?': 'How do I start?',
    'מה כולל הדוח?': 'What is in the report?',
    'רגע, בודק בשבילכם...': 'One moment, checking for you...',
    'לא הצלחתי לנסח תשובה כרגע. נסו שוב בעוד רגע.': 'I could not write an answer right now. Please try again in a moment.',
    'הצ׳אט לא זמין כרגע. אפשר להשאיר פרטים דרך השאלון ונחזור אליכם.': 'The chat is not available right now. You can leave details through the questionnaire and we will get back to you.',

    'לדוגמה: 120,000': 'Example: 120,000',
    'לדוגמה: 250': 'Example: 250',
    'לדוגמה: ורוד עתיק, זהב, ירוק זית': 'Example: dusty rose, gold, olive green',
    'לדוגמה: חופה פתוחה בשקיעה, שולחנות ארוכים, מוזיקה שקטה בקבלת הפנים, אווירה אינטימית ורומנטית...': 'Example: an open ceremony canopy at sunset, long tables, quiet music at the reception, an intimate romantic atmosphere...',
    'https://www.pinterest.com/... או כל קישור השראה אחר': 'https://www.pinterest.com/... or any other inspiration link',
    'לדוגמה: רחל ודוד': 'Example: Rachel and David',
    'לדוגמה: עד היום הגדול': 'Example: Until the big day',
    'לדוגמה: רחל': 'Example: Rachel',
    'לדוגמה: דוד': 'Example: David',
    'לדוגמה: שמות בני הזוג, זיכרון משותף, תכונה יפה שלהם, איחולים מיוחדים...': 'Example: couple names, a shared memory, a beautiful quality, special wishes...',
    'שם ראשון': 'First name',
    'שם שני': 'Second name',
    'לדוגמה: 15.8.2026': 'Example: 15.8.2026',
    'שם המקום': 'Venue name',
    'בשמחה רבה אנו מזמינים אתכם...': 'With great joy, we invite you...',
    'איך אפשר לעזור?': 'How can I help?'
  };

  const enToHe = Object.fromEntries(Object.entries(heToEn).map(([he, en]) => [en, he]));
  const attributeNames = ['placeholder', 'aria-label', 'title', 'alt'];
  let observer = null;

  function normalize(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function getLang() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return SUPPORTED.includes(stored) ? stored : DEFAULT_LANG;
  }

  function dictionaryFor(lang) {
    return lang === 'en' ? heToEn : enToHe;
  }

  function translateValue(value, lang) {
    const normalized = normalize(value);
    if (!normalized) return value;
    const translated = dictionaryFor(lang)[normalized];
    return translated || value;
  }

  function translateTextNode(node, lang) {
    const raw = node.nodeValue;
    const trimmed = normalize(raw);
    if (!trimmed) return;
    const translated = dictionaryFor(lang)[trimmed];
    if (!translated || translated === trimmed) return;
    const prefix = raw.match(/^\s*/)?.[0] || '';
    const suffix = raw.match(/\s*$/)?.[0] || '';
    node.nodeValue = `${prefix}${translated}${suffix}`;
  }

  function shouldSkipElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    return ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(element.tagName);
  }

  function translateElement(element, lang) {
    if (shouldSkipElement(element)) return;
    attributeNames.forEach((attr) => {
      if (!element.hasAttribute(attr)) return;
      const current = element.getAttribute(attr);
      const translated = translateValue(current, lang);
      if (translated !== current) element.setAttribute(attr, translated);
    });
  }

  function translateTree(root, lang) {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, lang);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (shouldSkipElement(root)) return;

    if (root.nodeType === Node.ELEMENT_NODE) translateElement(root, lang);

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === Node.ELEMENT_NODE && shouldSkipElement(node)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) translateTextNode(node, lang);
      if (node.nodeType === Node.ELEMENT_NODE) translateElement(node, lang);
      node = walker.nextNode();
    }
  }

  function setDocumentDirection(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.body?.classList.toggle('lang-en', lang === 'en');
  }

  function syncToggle(button, lang) {
    if (!button) return;
    button.textContent = lang === 'en' ? 'HE' : 'EN';
    button.setAttribute(
      'aria-label',
      lang === 'en' ? 'Switch site language to Hebrew' : 'Switch site language to English'
    );
    button.setAttribute('title', button.getAttribute('aria-label'));
  }

  function ensureToggle() {
    const header = document.querySelector('.header-inner');
    if (!header) return null;
    let button = document.getElementById('language-toggle');
    if (button) return button;

    button = document.createElement('button');
    button.type = 'button';
    button.id = 'language-toggle';
    button.className = 'language-toggle';
    button.addEventListener('click', () => {
      setLanguage(getLang() === 'en' ? 'he' : 'en');
    });
    header.appendChild(button);
    return button;
  }

  function startObserver(lang) {
    if (observer) observer.disconnect();
    observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => translateTree(node, lang));
        if (mutation.type === 'attributes' && mutation.target) {
          translateElement(mutation.target, lang);
        }
      });
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: attributeNames,
    });
  }

  function applyLanguage(lang) {
    setDocumentDirection(lang);
    document.title = translateValue(document.title, lang);
    translateTree(document.body, lang);
    syncToggle(document.getElementById('language-toggle'), lang);
    window.dispatchEvent(new CustomEvent('wedwise:languagechange', { detail: { lang } }));
    if (document.body) startObserver(lang);
  }

  function setLanguage(lang) {
    const nextLang = SUPPORTED.includes(lang) ? lang : DEFAULT_LANG;
    localStorage.setItem(STORAGE_KEY, nextLang);
    applyLanguage(nextLang);
  }

  function t(heText) {
    return getLang() === 'en' ? (heToEn[normalize(heText)] || heText) : heText;
  }

  window.WedWiseI18n = {
    getLang,
    setLanguage,
    applyLanguage,
    t,
    isEnglish: () => getLang() === 'en',
    translateTree,
  };

  function init() {
    const button = ensureToggle();
    syncToggle(button, getLang());
    applyLanguage(getLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
