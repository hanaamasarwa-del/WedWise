-- WedWise demo database seed
-- IMPORTANT: all supplier records are synthetic demonstration data.
-- Do not expose them to real users as verified suppliers, prices or availability.

PRAGMA foreign_keys = ON;

DROP VIEW IF EXISTS v_supplier_catalog;
DROP TABLE IF EXISTS lead_submissions;
DROP TABLE IF EXISTS generated_reports;
DROP TABLE IF EXISTS wedding_requests;
DROP TABLE IF EXISTS supplier_tags;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS supplier_styles;
DROP TABLE IF EXISTS styles;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS service_categories;
DROP TABLE IF EXISTS regions;

CREATE TABLE regions (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE service_categories (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE styles (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE tags (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    city TEXT NOT NULL,
    primary_region_id INTEGER NOT NULL,
    price_min_ils INTEGER CHECK (price_min_ils IS NULL OR price_min_ils >= 0),
    price_max_ils INTEGER CHECK (price_max_ils IS NULL OR price_max_ils >= 0),
    price_unit TEXT NOT NULL CHECK (price_unit IN ('לאורח', 'לחבילה')),
    guest_capacity_min INTEGER CHECK (guest_capacity_min IS NULL OR guest_capacity_min >= 0),
    guest_capacity_max INTEGER CHECK (guest_capacity_max IS NULL OR guest_capacity_max >= 0),
    description TEXT,
    website_url TEXT,
    is_demo INTEGER NOT NULL DEFAULT 1 CHECK (is_demo IN (0,1)),
    info_source TEXT NOT NULL DEFAULT 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד',
    last_reviewed_at TEXT NOT NULL DEFAULT '2026-06-25',
    is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    CHECK (price_min_ils IS NULL OR price_max_ils IS NULL OR price_min_ils <= price_max_ils),
    CHECK (guest_capacity_min IS NULL OR guest_capacity_max IS NULL OR guest_capacity_min <= guest_capacity_max),
    FOREIGN KEY (category_id) REFERENCES service_categories(id),
    FOREIGN KEY (primary_region_id) REFERENCES regions(id)
);

CREATE TABLE supplier_styles (
    supplier_id INTEGER NOT NULL,
    style_id INTEGER NOT NULL,
    PRIMARY KEY (supplier_id, style_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (style_id) REFERENCES styles(id) ON DELETE CASCADE
);

CREATE TABLE supplier_tags (
    supplier_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (supplier_id, tag_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- תשובות השאלון של המשתמש. AI יקרא מכאן את המידע לצורך יצירת הדוח.
CREATE TABLE wedding_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    event_date TEXT,
    estimated_budget_ils INTEGER,
    guest_count INTEGER,
    region_id INTEGER,
    preferred_styles_json TEXT,
    preferred_colors TEXT,
    flowers_and_decor TEXT,
    free_text TEXT,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- פלט שנוצר על ידי המודל: הדוח נשמר כ-JSON, והתמונה נשמרת כ-URL/נתיב.
CREATE TABLE generated_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_request_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    model_name TEXT,
    report_json TEXT NOT NULL,
    inspiration_image_url TEXT,
    FOREIGN KEY (wedding_request_id) REFERENCES wedding_requests(id) ON DELETE CASCADE
);

-- ליד שנשלח לסוכנות ו/או לבוט טלגרם.
CREATE TABLE lead_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    wedding_request_id INTEGER,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    consent_to_contact INTEGER NOT NULL DEFAULT 1 CHECK (consent_to_contact IN (0,1)),
    telegram_sent_at TEXT,
    status TEXT NOT NULL DEFAULT 'חדש' CHECK (status IN ('חדש','בטיפול','נסגר','לא רלוונטי')),
    FOREIGN KEY (wedding_request_id) REFERENCES wedding_requests(id) ON DELETE SET NULL
);

CREATE INDEX idx_suppliers_catalog_lookup
    ON suppliers (
        category_id,
        primary_region_id,
        is_active,
        price_max_ils,
        guest_capacity_min,
        guest_capacity_max
    );

CREATE INDEX idx_supplier_styles_style_id
    ON supplier_styles (style_id, supplier_id);

CREATE INDEX idx_supplier_tags_tag_id
    ON supplier_tags (tag_id, supplier_id);

CREATE INDEX idx_generated_reports_wedding_request_id
    ON generated_reports (wedding_request_id);

CREATE INDEX idx_lead_submissions_wedding_request_id
    ON lead_submissions (wedding_request_id);

CREATE VIEW v_supplier_catalog AS
SELECT
    s.id,
    s.name,
    c.name AS category,
    r.name AS region,
    s.city,
    s.price_min_ils,
    s.price_max_ils,
    s.price_unit,
    s.guest_capacity_min,
    s.guest_capacity_max,
    s.description,
    s.website_url,
    GROUP_CONCAT(DISTINCT st.name) AS styles,
    GROUP_CONCAT(DISTINCT t.name) AS tags,
    s.is_demo,
    s.info_source,
    s.last_reviewed_at,
    s.is_active
FROM suppliers s
JOIN service_categories c ON c.id = s.category_id
JOIN regions r ON r.id = s.primary_region_id
LEFT JOIN supplier_styles ss ON ss.supplier_id = s.id
LEFT JOIN styles st ON st.id = ss.style_id
LEFT JOIN supplier_tags sgt ON sgt.supplier_id = s.id
LEFT JOIN tags t ON t.id = sgt.tag_id
GROUP BY s.id;

BEGIN TRANSACTION;

INSERT INTO regions (id, name, description) VALUES (1, 'ירושלים והסביבה', 'ירושלים');
INSERT INTO regions (id, name, description) VALUES (2, 'המרכז', 'תל אביב והמרכז');
INSERT INTO regions (id, name, description) VALUES (3, 'הצפון', 'חיפה, הגליל והעמקים');
INSERT INTO regions (id, name, description) VALUES (4, 'הדרום', 'באר שבע, אשדוד והנגב');
INSERT INTO service_categories (id, name, description) VALUES (1, 'אולם / גן אירועים', 'מקום לקיום האירוע');
INSERT INTO service_categories (id, name, description) VALUES (2, 'די־ג׳יי', 'מוזיקה, ריקודים והגברה');
INSERT INTO service_categories (id, name, description) VALUES (3, 'צילום', 'סטילס, וידאו וצילומי זוגיות');
INSERT INTO service_categories (id, name, description) VALUES (4, 'עיצוב ופרחים', 'עיצוב חופה, שולחנות, פרחים ותאורה');
INSERT INTO service_categories (id, name, description) VALUES (5, 'קייטרינג', 'אוכל, בר ושירותי הסעדה');
INSERT INTO styles (id, name) VALUES (1, 'רומנטי');
INSERT INTO styles (id, name) VALUES (2, 'אלגנטי');
INSERT INTO styles (id, name) VALUES (3, 'כפרי');
INSERT INTO styles (id, name) VALUES (4, 'מודרני');
INSERT INTO styles (id, name) VALUES (5, 'בוהו');
INSERT INTO styles (id, name) VALUES (6, 'מינימליסטי');
INSERT INTO styles (id, name) VALUES (7, 'אורבני');
INSERT INTO styles (id, name) VALUES (8, 'מסורתי');
INSERT INTO tags (id, name) VALUES (1, 'כשר');
INSERT INTO tags (id, name) VALUES (2, 'אירוע חוץ');
INSERT INTO tags (id, name) VALUES (3, 'אירוע פנים');
INSERT INTO tags (id, name) VALUES (4, 'נגישות');
INSERT INTO tags (id, name) VALUES (5, 'מתאים לחתונה קטנה');
INSERT INTO tags (id, name) VALUES (6, 'מתאים לחתונה גדולה');
INSERT INTO tags (id, name) VALUES (7, 'מסורתי');
INSERT INTO tags (id, name) VALUES (8, 'צמחוני / טבעוני');
INSERT INTO tags (id, name) VALUES (9, 'הגברה כלולה');
INSERT INTO tags (id, name) VALUES (10, 'וידאו כלול');
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (1, 'גן הרים', 1, 'ירושלים', 1, 260, 420, 'לאורח', 120, 450, 'גן אירועים פתוח עם אפשרות לחופה תחת כיפת השמיים.', 'https://example.com/gan-harim', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (2, 'אחוזת האבן', 1, 'מעלה אדומים', 1, 310, 490, 'לאורח', 150, 550, 'מקום אלגנטי בסגנון קלאסי, מתאים לאירועים בינוניים וגדולים.', 'https://example.com/ahuzat-haeven', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (3, 'בית הגפן', 1, 'בית שמש', 1, 220, 360, 'לאורח', 80, 300, 'מקום אינטימי עם עיצוב כפרי ואווירה משפחתית.', 'https://example.com/beit-hagefen', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (4, 'טרסה אורבנית', 1, 'תל אביב', 2, 350, 560, 'לאורח', 90, 320, 'חלל אורבני במרכז העיר עם מרפסת וחלל פנימי.', 'https://example.com/terasa-urbanit', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (5, 'חוות הברושים', 1, 'כפר סבא', 2, 280, 450, 'לאורח', 140, 600, 'גן פתוח עם אזורי ישיבה טבעיים, מתאים לחתונות קיץ.', 'https://example.com/havat-habroshim', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (6, 'היכל השקיעה', 1, 'ראשון לציון', 2, 300, 520, 'לאורח', 180, 750, 'אולם מודרני עם מערכות תאורה והגברה מתקדמות.', 'https://example.com/heichal-hashkia', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (7, 'יקב העמק', 1, 'זכרון יעקב', 3, 300, 480, 'לאורח', 100, 380, 'מתחם בסגנון יקב עם נוף, מתאים לאווירה רומנטית וכפרית.', 'https://example.com/yekev-haemek', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (8, 'גני הצפון', 1, 'חיפה', 3, 250, 410, 'לאורח', 130, 500, 'גן ואולם גמיש לאירועים בעונות שונות.', 'https://example.com/ganei-hatzafon', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (9, 'חצר הגליל', 1, 'כרמיאל', 3, 230, 390, 'לאורח', 90, 360, 'חצר אירועים פתוחה בסגנון טבעי ובוהו.', 'https://example.com/hatzer-hagalil', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (10, 'מדבר לבן', 1, 'באר שבע', 4, 210, 350, 'לאורח', 100, 420, 'מתחם חתונות בדרום עם עיצוב בהיר ומינימליסטי.', 'https://example.com/midbar-lavan', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (11, 'נווה המדבר', 1, 'אשדוד', 4, 240, 400, 'לאורח', 150, 580, 'אולם וגן עם אפשרות לאירוע מסורתי או מודרני.', 'https://example.com/nave-hamidbar', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (12, 'חוות השקמה', 1, 'מצפה רמון', 4, 280, 460, 'לאורח', 70, 250, 'מקום קטן יחסית לחתונות יעד באווירת מדבר.', 'https://example.com/havat-hashikma', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (13, 'DJ נועה', 2, 'ירושלים', 1, 5500, 8500, 'לחבילה', NULL, NULL, 'מוזיקה מיינסטרימית וריקודים, עם פגישת תכנון מראש.', 'https://example.com/dj-noa', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (14, 'קצב העיר', 2, 'תל אביב', 2, 7000, 11000, 'לחבילה', NULL, NULL, 'די־ג׳יי לאירועים אורבניים, פופ, האוס ומוזיקה ישראלית.', 'https://example.com/ketzev-hair', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (15, 'צליל הזהב', 2, 'ראשון לציון', 2, 6000, 9500, 'לחבילה', NULL, NULL, 'התאמה אישית של פלייליסט וסגנונות מוזיקה מגוונים.', 'https://example.com/tzlil-hazahav', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (16, 'רוח צפונית', 2, 'חיפה', 3, 5000, 8000, 'לחבילה', NULL, NULL, 'מוזיקה לאירועים באווירה רגועה, אינדי, ישראלי ולועזי.', 'https://example.com/ruach-tzfonit', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (17, 'DJ עומר', 2, 'טבריה', 3, 4800, 7600, 'לחבילה', NULL, NULL, 'דגש על חתונות מסורתיות, מזרחית, ישראלית וריקודים.', 'https://example.com/dj-omer', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (18, 'פולס דרום', 2, 'באר שבע', 4, 4500, 7200, 'לחבילה', NULL, NULL, 'חבילת מוזיקה והגברה לאירועים קטנים ובינוניים.', 'https://example.com/pulse-darom', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (19, 'מיקס 360', 2, 'אשדוד', 2, 5200, 8400, 'לחבילה', NULL, NULL, 'מוזיקה מיינסטרימית, לטינית וריקודים עדכניים.', 'https://example.com/mix-360', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (20, 'על הרחבה', 2, 'מודיעין', 1, 5800, 9000, 'לחבילה', NULL, NULL, 'די־ג׳יי עם דגש על קריאת קהל ותכנון מסיבת ריקודים.', 'https://example.com/al-harhava', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (21, 'אור טבעי צילום', 3, 'ירושלים', 1, 8000, 13000, 'לחבילה', NULL, NULL, 'צילום סטילס בסגנון תיעודי טבעי, עם אפשרות לאלבום.', 'https://example.com/or-tivi', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (22, 'רגעים בלבן', 3, 'תל אביב', 2, 11000, 17000, 'לחבילה', NULL, NULL, 'צילום חתונות אלגנטי עם סטילס, וידאו וצילומי זוגיות.', 'https://example.com/regaim-balevan', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (23, 'פריים כפרי', 3, 'רחובות', 2, 8500, 14000, 'לחבילה', NULL, NULL, 'צילום באווירה כפרית ורומנטית, כולל צילומי חוץ.', 'https://example.com/frame-kafri', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (24, 'צפון בעדשה', 3, 'חיפה', 3, 7800, 12500, 'לחבילה', NULL, NULL, 'צילום טבעי ומינימליסטי באור יום, עם דגש על רגעים ספונטניים.', 'https://example.com/tzafon-baadasa', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (25, 'שבילי אור', 3, 'עפולה', 3, 7000, 11500, 'לחבילה', NULL, NULL, 'חבילת צילום נגישה לחתונות קטנות ובינוניות.', 'https://example.com/shvilei-or', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (26, 'חול וזהב', 3, 'באר שבע', 4, 7000, 12000, 'לחבילה', NULL, NULL, 'צילום באווירת מדבר, טבע וחתונות יעד בדרום.', 'https://example.com/chol-vzahav', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (27, 'סטודיו רימון', 3, 'אשקלון', 4, 7500, 12500, 'לחבילה', NULL, NULL, 'סטילס ווידאו בסגנון חם ומשפחתי.', 'https://example.com/studio-rimon', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (28, 'עדשה אורבנית', 3, 'רמת גן', 2, 10000, 15500, 'לחבילה', NULL, NULL, 'צילום וידאו וסטילס בקו אופנתי ועירוני.', 'https://example.com/adasa-urbanit', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (29, 'פריחת השקד', 4, 'ירושלים', 1, 5000, 12000, 'לחבילה', NULL, NULL, 'עיצוב חופה, פרחים לבנים ושולחנות בסגנון רומנטי.', 'https://example.com/prichat-hashaked', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (30, 'קווים נקיים', 4, 'תל אביב', 2, 8000, 18000, 'לחבילה', NULL, NULL, 'עיצוב מודרני ומינימליסטי, תאורה, שולחנות ופרחים.', 'https://example.com/kavim-nekiim', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (31, 'פרחי הגליל', 4, 'כרמיאל', 3, 4500, 10500, 'לחבילה', NULL, NULL, 'עיצוב טבעי ובוהו לחתונות גן וחצר.', 'https://example.com/pirchei-hagalil', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (32, 'מדבר פורח', 4, 'באר שבע', 4, 4200, 9800, 'לחבילה', NULL, NULL, 'עיצוב בהיר, טבעי ומינימליסטי לאירועים בדרום.', 'https://example.com/midbar-poreach', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (33, 'טעם הבית', 5, 'ירושלים', 1, 180, 300, 'לאורח', 80, 350, 'קייטרינג בשרי וכשר עם תפריט משפחתי ומסורתי.', 'https://example.com/taam-habait', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (34, 'מטבח השוק', 5, 'תל אביב', 2, 240, 380, 'לאורח', 70, 250, 'קייטרינג שף בסגנון מודרני, חלבי או בשרי לפי בחירה.', 'https://example.com/mitbach-hashuk', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (35, 'טעמי הצפון', 5, 'חיפה', 3, 190, 320, 'לאורח', 90, 420, 'קייטרינג כשר עם אפשרויות קלאסיות, צמחוניות וטבעוניות.', 'https://example.com/taamei-hatzafon', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO suppliers (id, name, category_id, city, primary_region_id, price_min_ils, price_max_ils, price_unit, guest_capacity_min, guest_capacity_max, description, website_url, is_demo, info_source, last_reviewed_at, is_active) VALUES (36, 'אש ותבלין', 5, 'באר שבע', 4, 170, 290, 'לאורח', 100, 400, 'קייטרינג לאירועי חוץ בסגנון מדברי וישראלי.', 'https://example.com/esh-vetavlin', 1, 'נתוני דמו שנוצרו לצורכי פיתוח והדגמה בלבד', '2026-06-25', 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (1, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (1, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (1, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (2, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (2, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (2, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (3, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (3, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (3, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (4, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (4, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (4, 7);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (5, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (5, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (5, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (6, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (6, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (6, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (7, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (7, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (7, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (8, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (8, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (8, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (9, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (9, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (9, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (10, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (10, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (10, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (11, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (11, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (11, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (12, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (12, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (12, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (13, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (13, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (13, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (14, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (14, 7);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (15, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (15, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (15, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (16, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (16, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (16, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (17, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (17, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (18, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (18, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (19, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (19, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (19, 7);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (20, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (20, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (21, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (21, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (21, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (22, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (22, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (22, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (23, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (23, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (23, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (24, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (24, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (25, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (25, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (26, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (26, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (27, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (27, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (28, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (28, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (28, 7);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (29, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (29, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (29, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (30, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (30, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (30, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (31, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (31, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (31, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (32, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (32, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (32, 6);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (33, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (33, 1);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (34, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (34, 4);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (34, 7);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (35, 2);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (35, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (35, 8);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (36, 3);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (36, 5);
INSERT INTO supplier_styles (supplier_id, style_id) VALUES (36, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (1, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (1, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (1, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (1, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (2, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (2, 3);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (2, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (2, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (2, 7);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (3, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (3, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (3, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (3, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (4, 3);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (4, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (4, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (5, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (5, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (5, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (5, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (6, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (6, 3);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (6, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (6, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (7, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (7, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (7, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (7, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (8, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (8, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (8, 3);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (8, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (8, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (9, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (9, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (9, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (10, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (10, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (10, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (10, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 3);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 4);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 6);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (11, 7);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (12, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (12, 2);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (12, 5);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (13, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (13, 7);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (14, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (15, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (16, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (17, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (17, 7);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (18, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (19, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (20, 9);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (21, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (22, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (23, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (24, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (25, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (26, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (27, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (28, 10);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (29, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (30, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (31, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (32, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (33, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (33, 7);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (34, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (34, 8);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (35, 1);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (35, 8);
INSERT INTO supplier_tags (supplier_id, tag_id) VALUES (36, 1);

COMMIT;
