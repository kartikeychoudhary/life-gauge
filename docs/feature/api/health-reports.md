---
title: "Health Reports API"
module: "api"
date: "2026-03-07"
status: "completed"
related_features:
  - authentication
  - user-settings
  - dashboard
---

# Health Reports API

Handles PDF upload, async Gemini AI parsing, listing, detail retrieval, reprocessing, and deletion of health reports and their extracted test results.

## Files

| File | Purpose |
|------|---------|
| `src/healthtest/healthtest.routes.js` | Router with multer middleware wired in |
| `src/healthtest/healthtest.controller.js` | Request/response handling |
| `src/healthtest/healthtest.service.js` | Core logic: pdf-parse, Gemini calls, DB operations |
| `src/common/constants.js` | `TEST_CATEGORIES` map (test_key → category), `REPORT_STATUS` enum |
| `src/common/pagination.js` | `paginate()` and `paginationMeta()` helpers |

## File Upload Configuration

| Setting | Default | Env var |
|---------|---------|---------|
| Upload directory | `uploads/` (API root) | `UPLOAD_DIR` |
| Max file size | 20 MB | `MAX_FILE_SIZE_MB` |
| Allowed MIME type | `application/pdf` | — |
| Filename pattern | `{timestamp}-{random}-{originalname}` | — |

Multer is configured with `diskStorage`. Files that fail MIME check are rejected with 400.

## Endpoints

All endpoints require `Authorization: Bearer <token>`.

---

### GET /api/health-reports

Lists all reports for the authenticated user, paginated, ordered by `report_date DESC`.

**Query params:**
- `page` (integer, default 1)
- `limit` (integer, default 20)

**Response 200:**
```json
{
  "reports": [
    {
      "id": 1,
      "report_date": "2026-01-15",
      "original_filename": "blood-test.pdf",
      "status": "completed",
      "error_message": null,
      "created_at": "2026-03-06T10:00:00Z"
    }
  ],
  "meta": { "total": 5, "page": 1, "limit": 20, "pages": 1 }
}
```

---

### POST /api/health-reports/upload

Uploads a PDF and triggers async Gemini parsing.

**Content-Type:** `multipart/form-data`
**Form field:** `file` — PDF file

**Processing flow:**
1. multer saves PDF to `uploads/`
2. `pdf-parse` extracts text from the buffer
3. Look up `user_settings` for the user
4. **If no API key configured:**
   - Insert `health_reports` with `status=pending`
   - Return immediately
5. **If API key exists:**
   - Insert `health_reports` with `status=processing`
   - Spawn `processWithGemini()` as async fire-and-forget
   - Return immediately with `status=processing`

**Response 201:** Full report object (see GET /health-reports/:id) — `results` will be `[]` since parsing is async.

---

### GET /api/health-reports/:id

Returns report metadata plus all extracted test results.

**Response 200:**
```json
{
  "id": 1,
  "report_date": "2026-01-15",
  "original_filename": "blood-test.pdf",
  "status": "completed",
  "gemini_model_used": "gemini-2.0-flash",
  "error_message": null,
  "created_at": "...",
  "results": [
    {
      "id": 10,
      "test_key": "tsh_ultra",
      "display_name": "TSH Ultra Sensitive",
      "category": "Hormones & Vitamins",
      "value_numeric": 2.34,
      "value_text": "2.34",
      "unit": "uIU/mL",
      "ref_min": 0.4,
      "ref_max": 4.0,
      "ref_display": "0.40 - 4.00",
      "flag": "normal",
      "report_date": "2026-01-15"
    }
  ]
}
```

Results ordered by `category`, then `test_key`.

**Errors:** `404` report not found or belongs to another user

---

### DELETE /api/health-reports/:id

Permanently deletes the report and all its test results. Also removes the PDF file from disk.

**Deletion order:**
1. Verify report exists and belongs to user (404 if not)
2. Delete physical file via `fs.unlinkSync()` (skips if file missing)
3. Delete all `health_test_results` where `report_id = id`
4. Delete `health_reports` row

**Response 204:** No content

---

### POST /api/health-reports/:id/reprocess

Re-runs Gemini parsing on the stored `raw_text` using the user's current API key and model setting. Useful when a report previously failed or was pending due to missing API key.

**Pre-conditions:**
- Report must exist and belong to user (404 if not)
- User must have API key configured (400 if not)

**Processing:**
1. Delete existing `health_test_results` for the report
2. Reset `status=processing`, clear `error_message`, update `gemini_model_used`
3. Spawn `processWithGemini()` async fire-and-forget

**Response 200:** Report object with `status=processing`

---

### GET /api/health-reports/:id/stream

Server-Sent Events stream. Authenticated via `?token=<jwt>` query param — registered before `router.use(auth)` so the JWT middleware is bypassed; the controller calls `verify(token)` directly.

**Response headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Event data (emitted every ~2 s):**
```json
{ "status": "processing", "error_message": null }
```

Possible statuses: `pending`, `processing`, `completed`, `failed`, `not_found`

Stream closes when status is `completed`, `failed`, or `not_found`. The `req.on('close')` handler clears the polling interval if the client disconnects early.

**Errors:** Responds `401` and closes immediately if token is invalid or missing.

---

## Gemini Processing (`processWithGemini`)

Async function — errors are caught and stored in `health_reports.error_message`.

**Steps:**
1. Initialize `GoogleGenerativeAI` with user's decrypted API key
2. Call `generateContent(GEMINI_PROMPT(rawText))`
3. Extract JSON block from response text via regex `/{[\s\S]*}/`
4. Parse JSON → `{ report_date, tests: { [test_key]: { display_name, value_numeric, value_text, unit, reference_range, flag } } }`
5. Post-process flags: if `value_numeric >= ref_max → 'high'`; if `value_numeric <= ref_min → 'low'` (overrides Gemini's flag at boundary values)
6. Update `health_reports`: `parsed_json`, `report_date`, `status=completed`
7. Bulk insert `health_test_results` rows — category assigned from `TEST_CATEGORIES[key]` constant

**On any error:**
- Update `health_reports` with `status=failed`, `error_message=err.message`

---

## Error Codes

| Code | Scenario |
|------|---------|
| 400 | No API key configured (reprocess) |
| 400 | Non-PDF file uploaded |
| 401 | Invalid/missing token (SSE stream) |
| 404 | Report not found |
| 413 | File exceeds max size |
