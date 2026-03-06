---
title: "Health Tests (Reports) — Web"
module: "web"
date: "2026-03-07"
status: "completed"
related_features:
  - dashboard
  - settings
  - layout
---

# Health Tests (Reports) — Web

Upload and manage PDF health reports. Shows report list with status, upload dialog, reprocess trigger, and a detail view of parsed test results.

## Module

`src/app/modules/health-tests/health-tests.module.ts`

Lazy-loaded at route `/health-tests`.

## Components

### HealthTestsComponent (`modules/health-tests/components/health-tests/`)

Selector: `app-health-tests`

The main page component. Shows a `p-table` of all uploaded reports.

**State:**
```ts
reports: HealthReport[] = [];
meta: PaginationMeta = { total: 0, page: 1, limit: 20, pages: 1 };
loading = true;
uploadDialogVisible = false;
selectedReport: HealthReport | null = null;
detailVisible = false;
```

**Lifecycle:** `ngOnInit()` → `load(1)`.

**`load(page)`:** Calls `HealthReportService.list(page, meta.limit)`. Updates `reports` and `meta`. Calls `cdr.detectChanges()` in both `next` and `error`.

**Report table columns:**

| Column | Content |
|--------|---------|
| File | PDF icon + `original_filename` |
| Report Date | `report_date | date:'dd MMM yyyy'` or `—` |
| Uploaded | `created_at | date:'dd MMM yyyy'` |
| Status | `p-tag` with `getStatusSeverity()` |
| Actions | View / Reprocess / Delete icon buttons |

**Status severity mapping:**
```ts
completed → 'success'
processing → 'info'
pending → 'warn'
failed → 'danger'
```

**Actions:**
- **View** (`pi pi-eye`): `viewDetail(report)` — opens `ReportDetailComponent`; disabled unless `status === 'completed'`
- **Reprocess** (`pi pi-refresh`): calls `reprocess(report)` — disabled when `status === 'processing'`
- **Delete** (`pi pi-trash`): calls `confirmDelete(report)` → PrimeNG `ConfirmationService` dialog → `doDelete()`

**Pagination:** shown when `meta.pages > 1`; prev/next buttons call `load(page ± 1)`.

---

### UploadDialogComponent (`modules/health-tests/components/upload-dialog/`)

Selector: `app-upload-dialog`

**Inputs:**
- `@Input() visible: boolean`

**Outputs:**
- `@Output() close: EventEmitter<void>`
- `@Output() uploaded: EventEmitter<HealthReport>`

**State:**
```ts
selectedFile: File | null = null;
uploading = false;
processing = false;       // true while SSE stream is active
processingFailed = false; // true on 'failed' status from SSE
progressPercent = 0;      // 0–100 for the animated progress bar
dragOver = false;
```

**Template — upload state** (`*ngIf="!processing"`):
- Drag-and-drop zone with dashed border; hover changes border colour
- Hidden `<input type="file" accept=".pdf">` opened on click
- Selected file: shows filename + size; "Remove" link clears selection
- Footer: Cancel + "Upload & Process" button (disabled when no file selected; shows spinner while `uploading`)
- `[closable]="!processing"` — X button disabled during processing

**Template — processing state** (`*ngIf="processing"`):
- Circular icon badge: Gemini AI icon (`pi-microchip-ai`, blue) or ✕ (`pi-times`, red) on failure
- Heading: `"Analysing with Gemini AI..."` / `"Processing failed"`
- Sub-text with contextual message
- Animated progress bar: blue while processing, red on failure
- Progress label: `"Processing..."` / `"Done"` / `"Failed"` + numeric percentage

**Upload flow:**
1. `upload()` calls `HealthReportService.upload(file)` — sets `uploading = true`
2. On success:
   - If `report.status === 'processing'` → calls `startProcessing(report)`
   - Otherwise (pending / instantly completed) → emits `uploaded`, dialog remains for parent to close

**`startProcessing(report)` — SSE processing UX:**
1. Sets `processing = true`, `progressPercent = 5`
2. Starts `setInterval` (600 ms) — increments `progressPercent` by random 0–4 until it reaches 88%, giving fake-progress feedback
3. Subscribes to `HealthReportService.streamStatus(report.id)`:
   - `status === 'completed'` → `finishProcessing(report, false)`
   - `status === 'failed'` → `finishProcessing(report, true)`
   - `complete` (SSE closed unexpectedly) → cleans up, resets `processing`, emits `uploaded`

**`finishProcessing(report, failed)`:**
- Cleans up interval + SSE subscription
- Sets `processingFailed` and `progressPercent = 100`; forces `detectChanges()`
- After delay (600 ms success / 1500 ms failure): resets state, emits `uploaded` with updated status, forces `detectChanges()`

**`dismiss()`:** Cleans up interval + SSE, resets all state, emits `close`.

**`ngOnDestroy`:** Calls `cleanup()` to prevent memory leaks if the dialog is destroyed while processing.

---

### ReportDetailComponent (`modules/health-tests/components/report-detail/`)

Selector: `app-report-detail`

**Inputs:**
- `@Input() visible: boolean`
- `@Input() report: HealthReport | null`

**Outputs:**
- `@Output() close: EventEmitter<void>`

**Lifecycle:** `ngOnChanges` — when `visible` becomes true and `report` is set, calls `loadDetail(report.id)`.

**`loadDetail(id)`:** Calls `HealthReportService.getOne(id)`. Builds `groupedResults` (same category grouping as dashboard). Calls `cdr.detectChanges()`.

**Template:** `p-dialog` showing:
- Report metadata (filename, date, model used, status)
- Per-category accordion or section with `p-table` of test results
- Each row: test name, value + unit, flag `p-tag`, reference range

---

## Services

### HealthReportService (`core/services/health-report.service.ts`)

`providedIn: 'root'`

| Method | Endpoint | Returns |
|--------|----------|---------|
| `list(page, limit)` | GET `/health-reports?page=&limit=` | `Observable<{ reports, meta }>` |
| `upload(file: File)` | POST `/health-reports/upload` (multipart) | `Observable<HealthReport>` |
| `getOne(id)` | GET `/health-reports/:id` | `Observable<HealthReport>` |
| `reprocess(id)` | POST `/health-reports/:id/reprocess` | `Observable<HealthReport>` |
| `delete(id)` | DELETE `/health-reports/:id` | `Observable<void>` |
| `streamStatus(id)` | GET `/health-reports/:id/stream?token=` (SSE) | `Observable<ReportStatusEvent>` |

**`streamStatus(id)` implementation:**
- Wraps native `EventSource` in an `Observable<ReportStatusEvent>`
- Retrieves JWT via `AuthService.getToken()` and passes as `?token=` query param (EventSource cannot set custom headers)
- On each SSE message: parses JSON, calls `observer.next(data)`; when `status` is `completed`, `failed`, or `not_found`, closes `EventSource` and calls `observer.complete()`
- `onerror`: closes `EventSource` and calls `observer.complete()`
- Teardown function: closes `EventSource` on unsubscribe

**`ReportStatusEvent` interface:**
```ts
export interface ReportStatusEvent {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'not_found';
  error_message?: string | null;
}
```

---

## Models (`core/models/health.model.ts`)

```ts
interface HealthReport {
  id: number;
  report_date: string | null;
  original_filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message: string | null;
  gemini_model_used: string | null;
  created_at: string;
  results?: TestResultDetail[];
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface TestResultDetail {
  id: number;
  test_key: string;
  display_name: string;
  category: string;
  value_numeric: number | null;
  value_text: string;
  unit: string;
  ref_min: number | null;
  ref_max: number | null;
  ref_display: string;
  flag: string;
  report_date: string;
}
```

---

## PrimeNG Components Used

| Component | Usage |
|-----------|-------|
| `p-table` | Report list with loading state |
| `p-tag` | Status and flag badges |
| `p-button` | Upload, view, reprocess, delete, pagination |
| `p-dialog` | Upload dialog, report detail dialog |
| `p-confirmDialog` | Delete confirmation (rendered in root `app.html`) |
| `pTooltip` | Action button tooltips |
| native `<input type="file">` | PDF file picker in upload dialog (drag-and-drop zone) |

---

## Change Detection

`ChangeDetectorRef` injected in `HealthTestsComponent`, `UploadDialogComponent`, and `ReportDetailComponent`. `detectChanges()` called in all `next` and `error` subscribe callbacks and inside the `setInterval` progress tick.

## SSE Notes

- `EventSource` is a browser API — it cannot send custom headers, so JWT is sent as `?token=` query param.
- The backend SSE route (`GET /health-reports/:id/stream`) is registered **before** `router.use(auth)`, so the JWT middleware is bypassed; the controller performs its own `verify()` call.
- `UploadDialog` implements `OnDestroy` to clean up the SSE subscription and `setInterval` if the dialog is destroyed while a report is being processed.
