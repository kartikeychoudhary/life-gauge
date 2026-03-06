export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type TestFlag = 'normal' | 'high' | 'low' | 'abnormal' | 'unknown';

export interface HealthReport {
  id: number;
  user_id: number;
  report_date: string | null;
  original_filename: string;
  file_path: string;
  status: ReportStatus;
  error_message: string | null;
  created_at: string;
  results?: TestResult[];
}

export interface TestResult {
  id: number;
  report_id: number;
  user_id: number;
  test_key: string;
  display_name: string;
  category: string;
  value_numeric: number | null;
  value_text: string;
  unit: string | null;
  ref_min: number | null;
  ref_max: number | null;
  ref_display: string | null;
  flag: TestFlag;
  report_date: string | null;
}

export interface DashboardTest extends TestResult {
  previous: TestResult | null;
}

export interface DashboardCategory {
  category: string;
  tests: DashboardTest[];
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedReports {
  reports: HealthReport[];
  meta: PaginationMeta;
}

export interface UserSettings {
  llm_model: string | null;
  has_api_key: boolean;
}
