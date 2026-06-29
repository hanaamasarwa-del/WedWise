# WedWise Demo Supplier Data

This folder contains synthetic demo supplier data for the WedWise prototype. It is meant for development, course presentation, and matching-flow tests only.

## Files

- `wedwise-demo.sqlite` - ready-to-open SQLite database generated from `schema-and-seed.sql`.
- `schema-and-seed.sql` - canonical SQLite schema and seed data.
- `suppliers.demo.json` - JSON export of the same demo supplier catalog used by the server.
- `example-queries.sql` - sample SQLite statements for supplier matching, request storage, AI report storage, and lead submission.
- `sharon-venues.reference.json` - separate reference dataset for Sharon-area venues; it is not part of the active demo supplier catalog.

## Dataset

- 36 demo suppliers: 12 venues, 8 DJs, 8 photographers, 4 design/floral vendors, and 4 catering vendors.
- 4 regions: Jerusalem area, center, north, and south.
- 8 styles: romantic, elegant, rustic, modern, boho, minimalist, urban, and traditional.
- 10 tags, including kosher, outdoor event, accessibility, small/large wedding fit, and video included.

## Important Data Rule

All supplier names, prices, descriptions, and links are synthetic demo data. Do not show them to real users as verified suppliers, verified prices, or real availability.

Every supplier has:

```sql
is_demo = 1
```

When real suppliers are added later, keep the information source and review date, and tell users that prices and availability must be verified with the supplier.

## Main Tables

- `suppliers` - supplier details, city, category, price range, capacity, description, and demo status.
- `regions` - geographic areas.
- `service_categories` - venue, DJ, photography, design/floral, and catering categories.
- `styles` + `supplier_styles` - many-to-many style matching.
- `tags` + `supplier_tags` - additional filters.
- `wedding_requests` - questionnaire answers from the couple.
- `generated_reports` - AI report JSON plus inspiration image path or URL.
- `lead_submissions` - contact details for a couple that requested follow-up.

## Usage

Open `wedwise-demo.sqlite` with any SQLite client.

To rebuild the database from the SQL seed:

```bash
sqlite3 wedwise-demo.sqlite < schema-and-seed.sql
```

Recommended backend flow:

1. Save questionnaire answers in `wedding_requests`.
2. Query relevant suppliers by region, budget, guest count, category, and style.
3. Send the questionnaire answers plus only the matched supplier records to OpenAI.
4. Save the structured JSON report in `generated_reports`.
5. If the couple asks for follow-up, save contact details in `lead_submissions` and forward the lead through the chosen notification channel.

Prompt rule to keep:

> Recommend only suppliers that were provided from the database. Do not invent names, prices, availability, or contact details.

`example-queries.sql` contains ready-to-adapt SQL for the matching flow. Keep
`schema-and-seed.sql`, `wedwise-demo.sqlite`, and `suppliers.demo.json` in sync
when the dataset changes.
