# WedWise Database Schema

All tables live in Supabase (PostgreSQL). Run `backend/database/supabase-schema.sql` in the Supabase SQL Editor to create them.

---

## submissions
Stores answers from the wedding questionnaire.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| created_at | timestamptz | auto-set |
| budget | integer | total budget in ILS |
| guests | integer | expected guest count |
| region | text | e.g. "center", "north", "south", "jerusalem", "sharon" |
| wedding_style | text | e.g. "classic", "boho", "modern" |
| colors | text[] | selected colors |
| decorations | text[] | selected decoration types |
| flowers | text[] | selected flower types |
| personal_text | text | free-text user description |
| inspiration_url | text | optional inspiration link |

Indexes:

- `idx_submissions_created_at`
- `idx_submissions_region_style`

---

## ai_reports
Stores the AI-generated (currently mock) wedding report for a submission.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK → submissions | cascades on delete |
| title | text | e.g. "Classic Wedding in Central Israel" |
| summary | text | personalised summary paragraph |
| event_type | text | e.g. "classic evening wedding" |
| budget_fit | text | "low", "medium", or "high" |
| budget_notes | text | advice on budget allocation |
| design_concept | text | one-line design description |
| image_prompt | text | passed to image generation service |
| created_at | timestamptz | auto-set |

---

## generated_images
Legacy optional table for persisted image results by submission. The active
frontend flow currently calls `/api/generate-image` directly and displays the
OpenAI image response without saving it to this table.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK → submissions | cascades on delete |
| image_url | text | generated image URL or data URL if persistence is re-enabled |
| prompt_used | text | the prompt sent to the image API |
| created_at | timestamptz | auto-set |

---

## suppliers
For future use if suppliers are migrated to Supabase. Current implementation reads from `data/demo-suppliers/suppliers.demo.json`.

| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | text | supplier name |
| category | text | e.g. venue, DJ, photography |
| region | text | geographic region |
| city | text | supplier city |
| min_budget | integer | minimum price |
| max_budget | integer | maximum price |
| price_unit | text | e.g. per guest or package |
| guest_capacity_min | integer | optional minimum guest count |
| guest_capacity_max | integer | optional maximum guest count |
| style_tags | text[] | style keywords |
| tags | text[] | additional filter tags |
| description | text | short supplier description |
| contact_info | text | email or phone |
| website_url | text | supplier/demo website URL |
| is_demo | boolean | true for synthetic demo data |
| is_active | boolean | whether the supplier can be matched |
| info_source | text | source/review note |
| last_reviewed_at | date | review date |
| created_at | timestamptz | auto-set |

Indexes:

- `idx_suppliers_catalog_lookup`
- `idx_suppliers_style_tags`

---

## leads
Stores contact details submitted by users who want agency follow-up.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK → submissions | set null on delete |
| full_name | text | user's full name |
| phone | text | contact phone |
| email | text | optional email |
| preferred_contact_time | text | e.g. "Evening", "Morning" |
| consent_to_contact | boolean | explicit contact consent |
| status | text | `new`, `in_progress`, `closed`, or `not_relevant` |
| created_at | timestamptz | auto-set |

Indexes:

- `idx_leads_submission_id`
- `idx_leads_status_created_at`

---

## wedding_follow_ups
Stores the user's final decision after confirming the report.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK -> submissions | nullable, set null on delete |
| lead_id | uuid FK -> leads | nullable, set null on delete |
| decision | text | `continue` or `thinking` |
| image_generated | boolean | whether the generated image flow completed |
| report_summary | text | confirmed report text snapshot |
| created_at | timestamptz | auto-set |

Indexes:

- `idx_wedding_follow_ups_decision_created_at`
- `idx_wedding_follow_ups_submission_id`

## secured_clients
Stores contacts who selected `continue`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK -> submissions | nullable, set null on delete |
| lead_id | uuid FK -> leads | nullable, set null on delete |
| full_name | text | required |
| phone | text | required |
| email | text | optional |
| created_at | timestamptz | auto-set |

Indexes:

- `idx_secured_clients_created_at`
- `idx_secured_clients_submission_id`

## potential_clients
Stores contacts who selected `thinking`.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | auto-generated |
| submission_id | uuid FK -> submissions | nullable, set null on delete |
| lead_id | uuid FK -> leads | nullable, set null on delete |
| full_name | text | required |
| phone | text | required |
| email | text | optional |
| created_at | timestamptz | auto-set |

Indexes:

- `idx_potential_clients_created_at`
- `idx_potential_clients_submission_id`

Security:

All public tables in `backend/database/supabase-schema.sql` enable RLS. Add
policies that match the deployment access model before exposing these tables
through Supabase Data API clients.
