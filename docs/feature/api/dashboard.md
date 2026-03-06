---
title: "Dashboard API"
module: "api"
date: "2026-03-06"
status: "completed"
related_features:
  - health-reports
  - authentication
---

# Dashboard API

Provides aggregated test result data for the dashboard view. Returns the latest value per test key (with previous value for trend comparison), grouped by category. Also provides per-test historical data for chart views.

## Files

| File | Purpose |
|------|---------|
| `src/dashboard/dashboard.routes.js` | Router: GET /summary, GET /test/:key/history |
| `src/dashboard/dashboard.controller.js` | Request/response handling |
| `src/dashboard/dashboard.service.js` | Knex queries for latest+previous values and history |
| `src/common/constants.js` | `CATEGORY_ORDER` array for display ordering |

## Endpoints

All endpoints require `Authorization: Bearer <token>`.

---

### GET /api/dashboard/summary

Returns the latest test result for every test key the user has, enriched with the previous result for trend comparison. Results are grouped by category in the defined display order.

**Query logic:**

Step 1 — Get latest value per test_key:
```sql
SELECT htr.* FROM health_test_results htr
JOIN (
  SELECT test_key, MAX(report_date) AS max_date
  FROM health_test_results WHERE user_id = ?
  GROUP BY test_key
) latest ON htr.test_key = latest.test_key AND htr.report_date = latest.max_date
WHERE htr.user_id = ?
```

Step 2 — Get previous value per test_key (second most recent date):
```sql
SELECT htr.test_key, htr.value_numeric, htr.value_text, htr.report_date, htr.flag
FROM health_test_results htr
JOIN (
  SELECT test_key, MAX(report_date) AS max_date
  FROM health_test_results WHERE user_id = ? AND test_key IN (...)
  GROUP BY test_key
) latest ON htr.test_key = latest.test_key AND htr.report_date < latest.max_date
WHERE htr.user_id = ?
ORDER BY htr.report_date DESC
```
A map is built from these results (`test_key → first row = most recent previous`).

Step 3 — Group by category, sort by `CATEGORY_ORDER`:
```
1. Hormones & Vitamins
2. Cardiac Markers
3. Blood Sugar
4. Lipid Profile
5. Liver Function
6. Kidney Function
7. Hematology
8. Urinalysis
9. (any unrecognized categories appended at end)
```

**Response 200:**
```json
[
  {
    "category": "Hormones & Vitamins",
    "tests": [
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
        "report_date": "2026-01-15",
        "report_id": 1,
        "previous": {
          "test_key": "tsh_ultra",
          "value_numeric": 2.10,
          "value_text": "2.10",
          "report_date": "2025-10-01",
          "flag": "normal"
        }
      }
    ]
  }
]
```

`previous` is `null` when no prior data exists for that test key.

Returns `[]` if the user has no test results yet.

---

### GET /api/dashboard/test/:key/history

Returns all historical records for a specific test key, ordered chronologically (oldest first). Used to populate trend charts in the history dialog.

**Path param:** `:key` — a valid `test_key` (e.g. `tsh_ultra`, `hemoglobin`)

**Response 200:**
```json
[
  {
    "id": 8,
    "value_numeric": 2.10,
    "value_text": "2.10",
    "unit": "uIU/mL",
    "flag": "normal",
    "ref_min": 0.4,
    "ref_max": 4.0,
    "ref_display": "0.40 - 4.00",
    "report_date": "2025-10-01",
    "report_id": 1
  },
  {
    "id": 10,
    "value_numeric": 2.34,
    "value_text": "2.34",
    "unit": "uIU/mL",
    "flag": "normal",
    "ref_min": 0.4,
    "ref_max": 4.0,
    "ref_display": "0.40 - 4.00",
    "report_date": "2026-01-15",
    "report_id": 2
  }
]
```

Returns `[]` if the user has no results for that test key.

---

## Notes

- All queries are scoped to `user_id` from the JWT — users can only see their own data.
- The `report_date` column on `health_test_results` is denormalized from `health_reports` to enable efficient date-based filtering without joining.
- Dashboard only reflects reports with `status=completed`; pending/failed reports contribute no rows to `health_test_results`.
