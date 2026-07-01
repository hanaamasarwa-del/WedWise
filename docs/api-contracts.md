# WedWise API Contracts

Base URL: `http://localhost:3000`

---

## GET /
Health check.

**Response 200**
```json
{ "status": "ok", "message": "WedWise backend is running" }
```

---

## POST /api/submissions
Save a questionnaire submission.

**Request body**
```json
{
  "budget": 120000,
  "guests": 250,
  "region": "center",
  "weddingStyle": "classic",
  "colors": ["white", "gold"],
  "decorations": ["candles", "flowers"],
  "flowers": ["white roses"],
  "personalText": "We want a romantic evening wedding.",
  "inspirationUrl": "https://www.pinterest.com/..."
}
```

**Response 201**
```json
{ "submissionId": "uuid", "status": "saved" }
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing/invalid budget, guests, region, or weddingStyle |
| 500 | Database error |

---

## GET /api/submissions/:id
Get a submission by ID.

**Response 200**
```json
{
  "id": "uuid",
  "budget": 120000,
  "guests": 250,
  "region": "center",
  "weddingStyle": "classic",
  "colors": ["white", "gold"],
  "decorations": ["candles"],
  "flowers": ["white roses"],
  "personalText": "...",
  "inspirationUrl": "https://www.pinterest.com/...",
  "createdAt": "2026-06-25T10:00:00Z"
}
```

**Errors**
| Code | Reason |
|------|--------|
| 404 | Submission not found |

---

## POST /api/generate-report
Generate (or return cached) AI report for a submission. Currently uses mock logic.

**Request body**
```json
{ "submissionId": "uuid" }
```

**Response 200**
```json
{
  "reportId": "uuid",
  "submissionId": "uuid",
  "title": "Classic Wedding in Central Israel",
  "summary": "...",
  "eventType": "classic evening wedding",
  "budgetFit": "medium",
  "budgetNotes": "...",
  "designConcept": "...",
  "imagePrompt": "A realistic classic wedding design concept...",
  "createdAt": "..."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing submissionId |
| 404 | Submission not found |
| 500 | Generation failed |

---

## POST /api/generate-image
Generate a realistic wedding visualization from a confirmed report or wedding
description. The route calls the OpenAI Images API from the backend, so the API
key is never exposed to the browser.

**Request body**
```json
{
  "reportText": "Hebrew report or wedding description text...",
  "questionnaire": {
    "budget": 120000,
    "guestCount": 250,
    "regionName": "המרכז",
    "style": "אלגנטי",
    "colors": "ורוד עתיק, זהב, ירוק זית",
    "flowers": "ורדים לבנים",
    "decorations": "נרות, שולחנות ארוכים",
    "freeText": "חופה פתוחה בשקיעה"
  }
}
```

`description` is also accepted as a fallback field instead of `reportText`.
`questionnaire` is optional but improves the generated prompt.

**Response 200**
```json
{
  "imageUrl": "data:image/png;base64,...",
  "promptUsed": "...",
  "model": "gpt-image-1"
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing or too-short `reportText` / `description` |
| 500 | OpenAI API key is not configured, or generation failed |
| 502 | OpenAI returned no image |

---

## GET /api/suppliers/recommendations?submissionId=uuid
Get ranked supplier recommendations based on a submission.

**Response 200**
```json
{
  "submissionId": "uuid",
  "suppliers": [
    {
      "id": 6,
      "name": "היכל השקיעה",
      "category": "אולם / גן אירועים",
      "region": "המרכז",
      "city": "ראשון לציון",
      "priceMin": 300,
      "priceMax": 520,
      "priceUnit": "לאורח",
      "styles": ["אלגנטי", "מודרני"],
      "description": "...",
      "websiteUrl": "...",
      "score": 7,
      "reason": "matches your region, fits your budget per guest, matches your preferred styles"
    }
  ]
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing submissionId query param |
| 404 | Submission not found |

---

## POST /api/leads
Save a contact lead and notify via Telegram.

**Request body**
```json
{
  "submissionId": "uuid",
  "fullName": "Daniel Cohen",
  "phone": "0501234567",
  "email": "daniel@example.com",
  "preferredContactTime": "Evening"
}
```

**Response 201**
```json
{
  "leadId": "uuid",
  "status": "saved",
  "telegramStatus": "mock_logged"
}
```
`telegramStatus` is `"sent"` when Telegram env vars are configured, `"mock_logged"` otherwise.

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing submissionId, fullName, or phone |
| 500 | Database error |

---

## POST /api/wedding-follow-up
Save the user's decision after confirming the report and send a Telegram
notification to the team.

**Request body**
```json
{
  "decision": "continue",
  "submissionId": "uuid",
  "leadId": "uuid",
  "lead": {
    "fullName": "Daniel Cohen",
    "phone": "0501234567",
    "email": "daniel@example.com"
  },
  "questionnaire": {
    "budget": 120000,
    "guestCount": 250,
    "regionName": "המרכז",
    "style": "אלגנטי",
    "colors": "ורוד עתיק, זהב, ירוק זית",
    "flowers": "ורדים לבנים",
    "decorations": "נרות, שולחנות ארוכים",
    "freeText": "חופה פתוחה בשקיעה",
    "inspirationUrl": "https://www.pinterest.com/..."
  },
  "reportText": "Confirmed report text...",
  "imageGenerated": false
}
```

`decision` must be either:

- `continue` — user wants WedWise to continue organizing the wedding.
- `thinking` — user liked the result but wants to think more.

If `submissionId` or `leadId` is missing, the backend creates the missing
submission/lead before saving the follow-up decision.

The backend also sorts the contact into an outcome table:

- `secured_clients` for `continue`.
- `potential_clients` for `thinking`.

**Response 201**
```json
{
  "status": "saved",
  "followUpId": "uuid",
  "submissionId": "uuid",
  "leadId": "uuid",
  "databaseStatus": "saved",
  "databaseError": null,
  "telegramStatus": "sent"
}
```

If Supabase save fails but Telegram notification succeeds, the endpoint returns
`202` so the frontend can still show a successful team notification:

```json
{
  "status": "notified",
  "followUpId": null,
  "submissionId": null,
  "leadId": null,
  "databaseStatus": "failed",
  "databaseError": "Supabase is not configured...",
  "telegramStatus": "sent"
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Invalid decision or missing required contact/questionnaire fields |
| 500 | Both database save and Telegram notification failed, or unexpected server error |

## PATCH /api/wedding-follow-up/:id/image-generated
Mark an existing follow-up decision as having generated a wedding image. This is
called after successful image generation and does not ask the user for another
decision.

**Request body**
```json
{
  "imageGenerated": true
}
```

**Response 200**
```json
{
  "status": "saved",
  "followUpId": "uuid",
  "imageGenerated": true
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing follow-up id |
| 500 | Database error |
