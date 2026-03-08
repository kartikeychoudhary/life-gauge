---
title: "Dashboard — Web"
module: "web"
date: "2026-03-09"
status: "completed"
related_features:
  - health-tests
  - layout
---

# Dashboard — Web

Displays the user's latest health test results grouped by category. Each test shows current value, flag badge, trend direction vs. previous result, reference range progress bar, and a drill-in history chart.

## Module

`src/app/modules/dashboard/dashboard.module.ts`

Lazy-loaded at route `/dashboard`.

## Components

### DashboardComponent (`modules/dashboard/components/dashboard/`)

Selector: `app-dashboard`

**State:**
```ts
categories: DashboardCategory[] = [];
loading = true;
searchQuery = '';
selectedFlags: string[] = [];
historyDialogVisible = false;
historyTestKey = '';
historyTestName = '';
```

**Filter options** (`readonly flagOptions`):
```ts
[
  { label: 'Normal',   value: 'normal',   severity: 'success' },
  { label: 'High',     value: 'high',     severity: 'danger' },
  { label: 'Low',      value: 'low',      severity: 'warn' },
  { label: 'Abnormal', value: 'abnormal', severity: 'danger' },
  { label: 'Unknown',  value: 'unknown',  severity: 'secondary' },
]
```

**`filteredCategories` getter:**
- Trims and lowercases `searchQuery`
- For each category, filters tests where:
  - `matchesSearch`: `!q` OR `display_name` or `test_key` contains `q` (case-insensitive)
  - `matchesFlag`: `!selectedFlags.length` OR `selectedFlags.includes(t.flag)`
- Removes categories whose filtered `tests` array is empty

**Lifecycle:** `ngOnInit()` calls `load()`.

**`load()`:** Calls `DashboardService.getSummary()`. On success, sets `categories` and calls `cdr.detectChanges()`.

**Template:**
- **Filter row** (top of page, above categories):
  - Text input (`pInputText`) bound to `searchQuery` with placeholder `"Search tests..."`
  - `p-multiselect` bound to `selectedFlags` with `[options]="flagOptions"`, `placeholder="All"`, `[showClear]="true"`; each option renders a coloured dot + label via item template
- Loading state: skeleton cards (`p-skeleton`) in the same grid layout
- Empty state (no data at all): centered icon + "Upload Report" button linking to `/health-tests`
- **Filter empty state** (data exists but filters return nothing): "No tests match the current filters" + "Clear filters" button that resets both `searchQuery` and `selectedFlags` to defaults
- Populated: `*ngFor` over `filteredCategories`, each rendering a section heading and a responsive grid of `<app-test-card>` components
- `<app-test-history-dialog>` rendered once, controlled by `historyDialogVisible`

**Category section header:**
```html
<h2>{{ cat.category }}</h2>
<div class="flex-1 h-px bg-slate-700/50"></div>
<span class="text-xs text-slate-500">{{ cat.tests.length }} tests</span>
```

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`

---

### TestCardComponent (`modules/dashboard/components/test-card/`)

Selector: `app-test-card`

**Inputs:**
- `@Input() test: DashboardTest`

**Outputs:**
- `@Output() infoClick: EventEmitter<void>` — emitted when card info button clicked

**Computed properties:**

| Property | Logic |
|----------|-------|
| `flagSeverity` | `normal→success`, `high→danger`, `low→warn`, `abnormal→danger`, else `secondary` |
| `flagLabel` | Human label: `Normal`, `High`, `Low`, `Abnormal`, `N/A` |
| `trendIcon` | `pi pi-arrow-up` / `pi pi-arrow-down` / `pi pi-minus` based on `value_numeric` vs `previous.value_numeric` |
| `trendClass` | `text-orange-400` (up), `text-blue-400` (down), `text-slate-400` (flat) |
| `hasRange` | `ref_min !== null \|\| ref_max !== null` |
| `rangePercent` | `clamp(0–100)` of value within `[ref_min, ref_max]` |

**Template layout (card):**
```
┌─────────────────────────────┐
│ display_name        [i] btn │
│ value unit           flag   │
│ ─────── range bar ────────  │
│ ref_display                 │
│ Prev: value unit · date     │
│ trend_icon trend_value      │
└─────────────────────────────┘
```

**Previous value display (2026-03-07 fix):**
Prev row is inline: `Prev: <value> <unit> · <date>`. Previously the date was pushed far-right with `ml-auto`, appearing to belong to the current value — now it sits adjacent to the previous value separated by `·`.

Card background: `bg-slate-900 border border-slate-700/50 rounded-xl p-4`

---

### TestHistoryDialogComponent (`modules/dashboard/components/test-history-dialog/`)

Selector: `app-test-history-dialog`

**Inputs:**
- `@Input() visible: boolean`
- `@Input() testKey: string`
- `@Input() testName: string`

**Outputs:**
- `@Output() close: EventEmitter<void>`

**Lifecycle:** `ngOnChanges` — when `visible` transitions to `true` and `testKey` is set, calls `loadHistory()`.

**State (additional):**
- `description: string | null = null` — medical description from `test_definitions` table

**`loadHistory()`:** Calls `DashboardService.getTestHistory(testKey)`. Response is `TestHistoryResponse`; destructures `data.history` and `data.description`. On success, builds chart data and calls `cdr.detectChanges()`.

**`buildChart(data)`:**
- Filters records to numeric values only
- Labels = `report_date` array
- Dataset: `borderColor: '#3b82f6'`, `fill: true`, `tension: 0.4`
- Point colors: green (normal), red (high), amber (low), slate (other)
- If `ref_min` and `ref_max` found: adds `chartjs-plugin-annotation` box annotation for the reference range
- Chart options: dark axis ticks (`#94a3b8`) and grid lines (`#1e293b`)

**Template:**
- `p-dialog` modal (header = testName, width ~800px)
- Test description paragraph (`*ngIf="description"`) shown below header, above chart — `text-sm text-slate-400 leading-relaxed`
- Line chart (`p-chart` type=`"line"`) shown when `chartData` is not null
- "No numeric data" message when all values are text
- History table: columns = Date, Value, Unit, Flag, Reference Range
  - Flag displayed as `p-tag` with `getFlagSeverity()` mapping

---

## Services

### DashboardService (`core/services/dashboard.service.ts`)

`providedIn: 'root'`

| Method | Endpoint | Returns |
|--------|----------|---------|
| `getSummary()` | GET `/dashboard/summary` | `Observable<DashboardCategory[]>` |
| `getTestHistory(key)` | GET `/dashboard/test/:key/history` | `Observable<TestHistoryResponse>` |

---

## Models (`core/models/health.model.ts`)

```ts
interface DashboardCategory {
  category: string;
  tests: DashboardTest[];
}

interface DashboardTest {
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
  flag: 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';
  report_date: string;
  report_id: number;
  previous: {
    value_numeric: number | null;
    value_text: string;
    report_date: string;
    flag: string;
  } | null;
}

interface TestResult {
  id: number;
  value_numeric: number | null;
  value_text: string;
  unit: string;
  flag: string;
  ref_min: number | null;
  ref_max: number | null;
  ref_display: string;
  report_date: string;
  report_id: number;
}

interface TestHistoryResponse {
  history: TestResult[];
  description: string | null;
}
```

---

## PrimeNG Components Used

| Component | Usage |
|-----------|-------|
| `p-skeleton` | Loading placeholder cards |
| `p-tag` | Flag badge (normal/high/low/abnormal) |
| `p-dialog` | History dialog modal |
| `p-chart` | Line chart for test value history |
| `p-button` | Refresh button, info button on cards |
| `pTooltip` | Tooltip on refresh and info buttons |
| `p-multiselect` | Flag status filter (Normal/High/Low/Abnormal/Unknown) |
| `pInputText` | Search filter input |

`MultiSelectModule` is imported in `SharedModule` (`src/app/shared-module.ts`).

---

## Change Detection

All HTTP subscribe callbacks call `this.cdr.detectChanges()` in both `next` and `error` branches. `ChangeDetectorRef` is injected in `DashboardComponent` and `TestHistoryDialogComponent`.
