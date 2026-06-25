-- WedWise: example database queries (SQLite)

-- 1) התאמת אולמות לפי אזור, מספר מוזמנים, תקציב לאורח וסגנון:
-- בדוגמה: ירושלים, 180 מוזמנים, עד 400 ₪ לאורח, סגנון כפרי.
SELECT DISTINCT
    s.id, s.name, s.city, s.price_min_ils, s.price_max_ils, s.price_unit,
    s.guest_capacity_min, s.guest_capacity_max, s.description
FROM suppliers s
JOIN supplier_styles ss ON ss.supplier_id = s.id
JOIN styles st ON st.id = ss.style_id
WHERE s.category_id = 1
  AND s.primary_region_id = 1
  AND s.guest_capacity_min <= 180
  AND s.guest_capacity_max >= 180
  AND s.price_max_ils <= 400
  AND st.name = 'כפרי'
  AND s.is_active = 1;

-- 2) שליפת כל הספקים באזור מסוים, לפי קטגוריה:
SELECT *
FROM v_supplier_catalog
WHERE region = 'המרכז'
  AND category = 'צילום'
  AND is_active = 1
ORDER BY price_min_ils;

-- 3) שמירת תשובות שאלון של זוג:
INSERT INTO wedding_requests (
    event_date, estimated_budget_ils, guest_count, region_id,
    preferred_styles_json, preferred_colors, flowers_and_decor, free_text
) VALUES (
    '2027-06-15', 120000, 220, 1,
    '["רומנטי","כפרי"]',
    'שמנת, ורוד בהיר וזהב',
    'פרחים לבנים, נרות וחופה עם בד נשפך',
    'מחפשים אווירה חמימה ולא מוגזמת, עם דגש על אוכל וריקודים.'
);

-- 4) שמירת דוח AI (בפועל report_json יגיע מ-OpenAI Structured Output):
INSERT INTO generated_reports (
    wedding_request_id, model_name, report_json, inspiration_image_url
) VALUES (
    1,
    'gpt-5',
    '{"summary":"דוח לדוגמה"}',
    '/generated-images/wedding-1.png'
);

-- 5) שמירת ליד לאחר שהזוג ביקש חזרה:
INSERT INTO lead_submissions (
    wedding_request_id, full_name, phone, email, consent_to_contact, status
) VALUES (
    1, 'שם לדוגמה', '050-0000000', 'demo@example.com', 1, 'חדש'
);
