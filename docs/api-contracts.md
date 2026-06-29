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
  "personalText": "We want a romantic evening wedding."
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
Generate (or return cached) placeholder image for a submission.

**Request body**
```json
{
  "submissionId": "uuid",
  "imagePrompt": "A realistic classic wedding design concept..."
}
```

**Response 200**
```json
{
  "imageId": "uuid",
  "submissionId": "uuid",
  "imageUrl": "https://placehold.co/1024x1024?text=WedWise+Wedding+Concept",
  "promptUsed": "...",
  "createdAt": "..."
}
```

**Errors**
| Code | Reason |
|------|--------|
| 400 | Missing submissionId or imagePrompt |
| 500 | Generation failed |

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
