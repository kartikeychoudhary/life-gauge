---
title: "Backend Specification"
module: "api"
date: "2026-03-06"
status: "completed"
related_features:
  - authentication
  - user-settings
  - health-reports
  - dashboard
---

# Backend Specification

## Project Layout
```
life-gauge-api/src/
├── index.js              — HTTP server entry point
├── app.js                — Express app setup (middleware, routes)
├── config/
│   ├── db.js             — Knex instance
│   ├── env.js            — dotenv loader (path: ../../../.env)
│   └── cors.js           — CORS config using FRONTEND_URL env var
├── middleware/
│   ├── authMiddleware.js — JWT verify, attaches req.user
│   ├── errorHandler.js   — Maps custom error classes to HTTP codes
│   └── validator.js      — express-validator error formatter
├── auth/                 — register, login
├── user/                 — profile, password, settings
├── healthtest/           — upload, list, detail, reprocess, delete
├── dashboard/            — summary, test history
└── common/
    ├── errors.js         — AppError, NotFoundError, UnauthorizedError, ConflictError
    ├── jwt.js            — sign(payload), verify(token)
    ├── encrypt.js        — encrypt(text), decrypt(encrypted, iv, tag)
    ├── pagination.js     — paginate(query, {page,limit}), paginationMeta()
    └── constants.js      — TEST_CATEGORIES, CATEGORY_ORDER, REPORT_STATUS
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AUTO_INCREMENT | |
| name | VARCHAR(255) NOT NULL | |
| email | VARCHAR(255) UNIQUE NOT NULL | |
| password_hash | VARCHAR(255) NOT NULL | bcryptjs, rounds=12 |
| role | ENUM('user','admin') NOT NULL DEFAULT 'user' | |
| force_password_change | BOOLEAN NOT NULL DEFAULT false | Set true when admin creates/resets password |
| created_at | TIMESTAMP DEFAULT NOW | |
| updated_at | TIMESTAMP DEFAULT NOW ON UPDATE | |

### user_settings
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AUTO_INCREMENT | |
| user_id | INT UNSIGNED FK → users.id | CASCADE DELETE |
| llm_api_key_encrypted | TEXT | AES-256-GCM ciphertext (hex) |
| llm_api_key_iv | VARCHAR(64) | Random IV (hex), 12 bytes |
| llm_api_key_tag | VARCHAR(64) | GCM auth tag (hex), 16 bytes |
| llm_model | VARCHAR(100) DEFAULT 'gemini-2.0-flash' | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

Notes: Row created automatically on user registration with nulls. `has_api_key` returned to frontend is `!!llm_api_key_encrypted`.

### health_reports
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AUTO_INCREMENT | |
| user_id | INT UNSIGNED FK → users.id | CASCADE DELETE |
| report_date | DATE | Extracted from Gemini response |
| original_filename | VARCHAR(255) | |
| file_path | VARCHAR(500) | Absolute path in uploads dir |
| raw_text | LONGTEXT | Full text from pdf-parse |
| parsed_json | JSON | Complete Gemini response object |
| gemini_model_used | VARCHAR(100) | |
| status | ENUM('pending','processing','completed','failed') DEFAULT 'pending' | |
| error_message | TEXT | Gemini error if failed |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### health_test_results
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AUTO_INCREMENT | |
| report_id | INT UNSIGNED FK → health_reports.id | CASCADE DELETE |
| user_id | INT UNSIGNED FK → users.id | Denormalized for direct queries |
| test_key | VARCHAR(100) | e.g. `tsh_ultra` |
| display_name | VARCHAR(255) | e.g. `TSH Ultra Sensitive` |
| category | VARCHAR(100) | e.g. `Hormones & Vitamins` |
| value_numeric | DECIMAL(15,4) | NULL if non-numeric result |
| value_text | VARCHAR(255) | Raw value string |
| unit | VARCHAR(50) | e.g. `uIU/mL` |
| ref_min | DECIMAL(15,4) | |
| ref_max | DECIMAL(15,4) | |
| ref_display | VARCHAR(100) | e.g. `0.40 - 4.00` |
| flag | ENUM('normal','high','low','abnormal','unknown') | |
| report_date | DATE | Denormalized from health_reports |
| created_at | TIMESTAMP | |

Index: `(user_id, test_key, report_date)` for dashboard summary query performance.

### app_settings
| Column | Type | Notes |
|--------|------|-------|
| setting_key | VARCHAR(100) PK | e.g. `allow_signups` |
| setting_value | TEXT NOT NULL | String value |
| updated_at | TIMESTAMP | |

### test_definitions
| Column | Type | Notes |
|--------|------|-------|
| id | INT UNSIGNED PK AUTO_INCREMENT | |
| test_key | VARCHAR(100) UNIQUE NOT NULL | e.g. `tsh_ultra` |
| display_name | VARCHAR(255) NOT NULL | e.g. `TSH Ultra Sensitive` |
| category | VARCHAR(100) NOT NULL | e.g. `Hormones & Vitamins` |
| category_order | INT UNSIGNED NOT NULL DEFAULT 0 | Display order for categories |
| description | TEXT | Medical description of the test |
| unit | VARCHAR(50) | e.g. `uIU/mL` |
| default_ref_min | DECIMAL(15,4) | |
| default_ref_max | DECIMAL(15,4) | |
| is_active | BOOLEAN NOT NULL DEFAULT true | Inactive tests excluded from Gemini prompt |
| sort_order | INT UNSIGNED NOT NULL DEFAULT 0 | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Migrations

| File | Description |
|------|-------------|
| `20260306000001_create_users_table.js` | users table with bcrypt hash column |
| `20260306000002_create_user_settings_table.js` | user_settings with AES fields |
| `20260306000003_create_health_reports_table.js` | health_reports with status enum |
| `20260306000004_create_health_test_results_table.js` | health_test_results with composite index |
| `20260308000001_add_role_and_force_password_change_to_users.js` | Adds role + force_password_change to users |
| `20260308000002_create_app_settings_table.js` | App settings key-value table |
| `20260308000003_create_test_definitions_table.js` | Configurable test definitions |
| `20260308000004_seed_test_definitions_from_constants.js` | Data migration: seeds test_definitions from hardcoded constants |
| `20260308000005_add_description_and_category_order_to_test_definitions.js` | Adds description (TEXT) and category_order (INT) columns |
| `20260308000006_populate_descriptions_and_add_missing_tests.js` | Populates descriptions, updates display names, adds 4 missing tests |

All migrations implement both `up` and `down`. Run via:
```bash
cd life-gauge-api
npx knex migrate:latest
```

## API Key Encryption (`common/encrypt.js`)
- Algorithm: **AES-256-GCM**
- Key material: `SHA-256(JWT_SECRET)` — produces a 32-byte key from the JWT secret
- IV: 12 random bytes generated per encryption, stored as hex
- Auth tag: 16 bytes from GCM, stored as hex
- Storage: three separate columns (`llm_api_key_encrypted`, `llm_api_key_iv`, `llm_api_key_tag`)
- The raw key is **never returned** in any API response; `has_api_key: boolean` is the only signal

## Gemini Integration (`healthtest/healthtest.service.js`)

### Processing Pipeline
1. multer writes PDF to `uploads/` directory
2. `pdf-parse` extracts text from the PDF buffer
3. If no API key: save report with `status=pending`, return early
4. Insert `health_reports` row with `status=processing`
5. Call `processWithGemini()` asynchronously (fire-and-forget via `.catch()`)
6. Upload returns immediately with the `processing` report

### processWithGemini()
1. Initialize `GoogleGenerativeAI` with user's decrypted key
2. Call `generateContent(GEMINI_PROMPT(rawText))`
3. Parse JSON from response (regex-extract `{...}` block)
4. Update `health_reports`: set `parsed_json`, `report_date`, `status=completed`
5. Insert rows into `health_test_results` (one per parsed test)
6. On any error: update `health_reports` with `status=failed`, `error_message`

### Reprocess
- Deletes all `health_test_results` for the report
- Resets status to `processing`
- Runs `processWithGemini()` with the stored `raw_text`

### Gemini Prompt
Instructs the model to return a specific JSON schema with `report_date` and a `tests` map keyed by ~100 defined test keys. Only keys actually present in the report are included.

## Supported Test Keys (100+)

**Hormones & Vitamins:** `dht`, `vit_d_25_oh`, `vit_b12`, `psa`, `t3_total`, `t4_total`, `tsh_ultra`

**Cardiac Markers:** `hs_crp`, `iron_total`, `tibc`, `transferrin_sat`, `uibc`

**Blood Sugar:** `fbg`, `hba1c`, `abg`

**Lipid Profile:** `cholesterol_total`, `hdl_direct`, `ldl_direct`, `triglycerides`, `tc_hdl_ratio`, `trig_hdl_ratio`, `ldl_hdl_ratio`, `hdl_ldl_ratio`, `non_hdl`, `vldl`

**Liver Function:** `amylase`, `alp`, `bilirubin_total`, `bilirubin_direct`, `bilirubin_indirect`, `ggt`, `sgot`, `sgpt`, `sgot_sgpt_ratio`, `protein_total`, `albumin_serum`, `globulin_serum`, `alb_glob_ratio`, `magnesium`, `ldh`, `phosphorous`

**Kidney Function:** `sodium`, `potassium`, `chloride`, `bun`, `creatinine_serum`, `bun_creat_ratio`, `urea_calc`, `calcium`, `urea_creat_ratio`, `uric_acid`, `egfr`

**Hematology:** `esr`, `hemoglobin`, `pcv`, `rbc_total`, `mcv`, `mch`, `mchc`, `rdw_sd`, `rdw_cv`, `rdwi`, `mentzer_index`, `wbc_total`, `neutrophils_pct`, `lymphocytes_pct`, `monocytes_pct`, `eosinophils_pct`, `basophils_pct`, `ig_pct`, `nrbc_pct`, `neutrophils_abs`, `lymphocytes_abs`, `monocytes_abs`, `basophils_abs`, `eosinophils_abs`, `ig_abs`, `nrbc_abs`, `platelet_count`, `mpv`, `pdw`, `plcr`, `pct`

**Urinalysis:** `urine_volume`, `urine_colour`, `urine_appearance`, `urine_specific_gravity`, `urine_ph`, `urine_protein`, `urine_glucose`, `urine_ketone`, `urine_bilirubin`, `urine_urobilinogen`, `urine_bile_salt`, `urine_bile_pigment`, `urine_blood`, `urine_nitrite`, `urine_leucocyte_esterase`, `urine_mucus`, `urine_rbc`, `urine_pus_cells`, `urine_epithelial_cells`, `urine_casts`, `urine_crystals`, `urine_bacteria`, `urine_yeast`, `urine_parasite`

## Error Classes (`common/errors.js`)
| Class | HTTP Code |
|-------|-----------|
| `AppError` | 500 (configurable) |
| `NotFoundError` | 404 |
| `UnauthorizedError` | 401 |
| `ConflictError` | 409 |

Validation errors from `express-validator` return 422 with an `errors` array.

## File Upload Config
- Directory: `UPLOAD_DIR` env var (default: `uploads/` relative to API root)
- Max size: `MAX_FILE_SIZE_MB` env var (default: 20 MB)
- Allowed type: `application/pdf` only
- Filename: `{timestamp}-{random}-{originalname}`

## Category Display Order (CATEGORY_ORDER)
1. Hormones & Vitamins
2. Cardiac Markers
3. Blood Sugar
4. Lipid Profile
5. Liver Function
6. Kidney Function
7. Hematology
8. Urinalysis

## Environment Variables
| Variable | Used By | Description |
|----------|---------|-------------|
| `DB_HOST` | Knex | MySQL host |
| `DB_PORT` | Knex | MySQL port (default 3306) |
| `DB_NAME` | Knex | Database name |
| `DB_USER` | Knex | Database user |
| `DB_PASSWORD` | Knex | Database password |
| `JWT_SECRET` | jwt.js, encrypt.js | JWT signing key + AES key derivation |
| `JWT_EXPIRY` | jwt.js | Token expiry (e.g. `24h`) |
| `API_PORT` | index.js | HTTP server port (default 3000) |
| `FRONTEND_URL` | cors.js | Allowed CORS origin |
| `UPLOAD_DIR` | healthtest.routes.js | Upload directory path |
| `MAX_FILE_SIZE_MB` | healthtest.routes.js | Max upload size |
| `ENCRYPTION_KEY` | encrypt.js | Optional explicit AES key (falls back to SHA-256 of JWT_SECRET) |
| `NODE_ENV` | various | `development` / `production` |
