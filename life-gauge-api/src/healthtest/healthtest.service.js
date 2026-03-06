const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/db');
const { getDecryptedApiKey } = require('../user/user.service');
const { TEST_CATEGORIES } = require('../common/constants');
const { REPORT_STATUS } = require('../common/constants');
const { NotFoundError, AppError } = require('../common/errors');
const { paginate, paginationMeta } = require('../common/pagination');

const GEMINI_PROMPT = (rawText) => `
You are a medical data parser. Extract all health test results from the following lab report text and return them as a JSON object.

The JSON must have this exact structure:
{
  "report_date": "YYYY-MM-DD or null",
  "tests": {
    "<test_key>": {
      "display_name": "string",
      "value_numeric": number or null,
      "value_text": "string",
      "unit": "string or null",
      "reference_range": {
        "display": "string or null",
        "min": number or null,
        "max": number or null
      },
      "flag": "normal" | "high" | "low" | "abnormal" | "unknown"
    }
  }
}

Use ONLY the following test_keys (map from the display name in the report):
dht, vit_d_25_oh, vit_b12, psa, t3_total, t4_total, tsh_ultra,
hs_crp, iron_total, tibc, transferrin_sat, uibc, fbg, hba1c, abg,
cholesterol_total, hdl_direct, ldl_direct, triglycerides, tc_hdl_ratio, trig_hdl_ratio, ldl_hdl_ratio, hdl_ldl_ratio, non_hdl, vldl,
amylase, alp, bilirubin_total, bilirubin_direct, bilirubin_indirect, ggt, sgot, sgpt, sgot_sgpt_ratio, protein_total, albumin_serum, globulin_serum, alb_glob_ratio, magnesium, ldh, phosphorous, sodium, potassium, chloride, bun, creatinine_serum, bun_creat_ratio, urea_calc, calcium, urea_creat_ratio, uric_acid, egfr,
esr, hemoglobin, pcv, rbc_total, mcv, mch, mchc, rdw_sd, rdw_cv, rdwi, mentzer_index, wbc_total, neutrophils_pct, lymphocytes_pct, monocytes_pct, eosinophils_pct, basophils_pct, ig_pct, nrbc_pct, neutrophils_abs, lymphocytes_abs, monocytes_abs, basophils_abs, eosinophils_abs, ig_abs, nrbc_abs, platelet_count, mpv, pdw, plcr, pct,
urine_volume, urine_colour, urine_appearance, urine_specific_gravity, urine_ph, urine_protein, urine_glucose, urine_ketone, urine_bilirubin, urine_urobilinogen, urine_bile_salt, urine_bile_pigment, urine_blood, urine_nitrite, urine_leucocyte_esterase, urine_mucus, urine_rbc, urine_pus_cells, urine_epithelial_cells, urine_casts, urine_crystals, urine_bacteria, urine_yeast, urine_parasite

Only include tests that are actually present in the report. Return only the JSON object, no extra text.

Lab Report Text:
---
${rawText}
---
`;

const parseGeminiResponse = (text) => {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new AppError('Gemini returned invalid JSON', 500);
  return JSON.parse(jsonMatch[0]);
};

const listReports = async (userId, { page = 1, limit = 20 } = {}) => {
  const total = await db('health_reports').where({ user_id: userId }).count('id as count').first();
  const query = db('health_reports')
    .where({ user_id: userId })
    .select('id', 'report_date', 'original_filename', 'status', 'error_message', 'created_at')
    .orderBy('report_date', 'desc');
  const reports = await paginate(query, { page, limit });
  return { reports, meta: paginationMeta(total.count, page, limit) };
};

const getReport = async (userId, reportId) => {
  const report = await db('health_reports').where({ id: reportId, user_id: userId }).first();
  if (!report) throw new NotFoundError('Report not found');
  const results = await db('health_test_results').where({ report_id: reportId }).orderBy('category').orderBy('test_key');
  return { ...report, results };
};

const uploadAndProcess = async (userId, file) => {
  // Extract text from PDF
  const pdfBuffer = fs.readFileSync(file.path);
  let rawText = '';
  try {
    const data = await pdfParse(pdfBuffer);
    rawText = data.text;
  } catch {
    rawText = '';
  }

  // Get user LLM settings
  const settings = await db('user_settings').where({ user_id: userId }).first();
  const apiKey = settings ? await getDecryptedApiKey(userId) : null;
  const model = (settings && settings.llm_model) || 'gemini-2.0-flash';

  if (!apiKey) {
    // Save report with pending status — user must configure API key
    const [reportId] = await db('health_reports').insert({
      user_id: userId,
      original_filename: file.originalname,
      file_path: file.path,
      raw_text: rawText,
      status: REPORT_STATUS.PENDING,
    });
    return getReport(userId, reportId);
  }

  // Create report record with processing status
  const [reportId] = await db('health_reports').insert({
    user_id: userId,
    original_filename: file.originalname,
    file_path: file.path,
    raw_text: rawText,
    status: REPORT_STATUS.PROCESSING,
    gemini_model_used: model,
  });

  // Process with Gemini (async, update record when done)
  processWithGemini(userId, reportId, rawText, apiKey, model).catch((err) => {
    console.error('Gemini processing failed for report', reportId, err.message);
  });

  return getReport(userId, reportId);
};

const processWithGemini = async (userId, reportId, rawText, apiKey, model) => {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });
    const result = await geminiModel.generateContent(GEMINI_PROMPT(rawText));
    const responseText = result.response.text();

    const parsed = parseGeminiResponse(responseText);

    await db('health_reports').where({ id: reportId }).update({
      parsed_json: JSON.stringify(parsed),
      report_date: parsed.report_date || null,
      status: REPORT_STATUS.COMPLETED,
      updated_at: db.fn.now(),
    });

    // Save individual test results
    if (parsed.tests) {
      const rows = Object.entries(parsed.tests).map(([key, test]) => {
        const refMin = test.reference_range?.min ?? null;
        const refMax = test.reference_range?.max ?? null;
        const val = test.value_numeric ?? null;
        let flag = test.flag || 'unknown';
        // Override Gemini flag when value sits exactly on a boundary
        if (val !== null) {
          if (refMax !== null && val >= refMax) flag = 'high';
          else if (refMin !== null && val <= refMin) flag = 'low';
        }
        return {
          report_id: reportId,
          user_id: userId,
          test_key: key,
          display_name: test.display_name,
          category: TEST_CATEGORIES[key] || 'Other',
          value_numeric: val,
          value_text: test.value_text,
          unit: test.unit || null,
          ref_min: refMin,
          ref_max: refMax,
          ref_display: test.reference_range?.display || null,
          flag,
          report_date: parsed.report_date || null,
        };
      });
      if (rows.length) {
        await db('health_test_results').insert(rows);
      }
    }
  } catch (err) {
    await db('health_reports').where({ id: reportId }).update({
      status: REPORT_STATUS.FAILED,
      error_message: err.message,
      updated_at: db.fn.now(),
    });
  }
};

const reprocessReport = async (userId, reportId) => {
  const report = await db('health_reports').where({ id: reportId, user_id: userId }).first();
  if (!report) throw new NotFoundError('Report not found');

  const apiKey = await getDecryptedApiKey(userId);
  if (!apiKey) throw new AppError('LLM API key not configured. Please configure it in Settings.', 400);

  const settings = await db('user_settings').where({ user_id: userId }).first();
  const model = (settings && settings.llm_model) || 'gemini-2.0-flash';

  await db('health_test_results').where({ report_id: reportId }).delete();
  await db('health_reports').where({ id: reportId }).update({
    status: REPORT_STATUS.PROCESSING,
    error_message: null,
    gemini_model_used: model,
    updated_at: db.fn.now(),
  });

  processWithGemini(userId, reportId, report.raw_text, apiKey, model).catch((err) => {
    console.error('Reprocess failed for report', reportId, err.message);
  });

  return getReport(userId, reportId);
};

const deleteReport = async (userId, reportId) => {
  const report = await db('health_reports').where({ id: reportId, user_id: userId }).first();
  if (!report) throw new NotFoundError('Report not found');

  // Delete file from disk
  if (report.file_path && fs.existsSync(report.file_path)) {
    fs.unlinkSync(report.file_path);
  }

  await db('health_test_results').where({ report_id: reportId }).delete();
  await db('health_reports').where({ id: reportId }).delete();
};

module.exports = { listReports, getReport, uploadAndProcess, reprocessReport, deleteReport };
