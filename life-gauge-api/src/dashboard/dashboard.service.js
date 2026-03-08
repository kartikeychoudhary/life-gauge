const db = require('../config/db');
const { CATEGORY_ORDER } = require('../common/constants');

/**
 * Returns the latest test result for each test_key, along with the previous value.
 * Results are grouped by category.
 */
const getSummary = async (userId) => {
  // Get the 2 most recent report_dates per test_key for this user
  // We use a subquery to get latest and second-latest values
  const latestResults = await db('health_test_results as htr')
    .where('htr.user_id', userId)
    .join(
      db('health_test_results')
        .where('user_id', userId)
        .select('test_key')
        .max('report_date as max_date')
        .groupBy('test_key')
        .as('latest'),
      function () {
        this.on('htr.test_key', '=', 'latest.test_key').andOn('htr.report_date', '=', 'latest.max_date');
      }
    )
    .select(
      'htr.id',
      'htr.test_key',
      'htr.display_name',
      'htr.category',
      'htr.value_numeric',
      'htr.value_text',
      'htr.unit',
      'htr.ref_min',
      'htr.ref_max',
      'htr.ref_display',
      'htr.flag',
      'htr.report_date',
      'htr.report_id'
    );

  if (!latestResults.length) return [];

  // For each test_key, find the previous value (second most recent report_date)
  const testKeys = latestResults.map((r) => r.test_key);
  const previousResults = await db('health_test_results as htr')
    .where('htr.user_id', userId)
    .whereIn('htr.test_key', testKeys)
    .join(
      db('health_test_results')
        .where('user_id', userId)
        .whereIn('test_key', testKeys)
        .select('test_key')
        .max('report_date as max_date')
        .groupBy('test_key')
        .as('latest'),
      function () {
        this.on('htr.test_key', '=', 'latest.test_key').andOn('htr.report_date', '<', 'latest.max_date');
      }
    )
    .select('htr.test_key', 'htr.value_numeric', 'htr.value_text', 'htr.report_date', 'htr.flag')
    .orderBy('htr.report_date', 'desc');

  // Build a map of test_key -> previous result
  const previousMap = {};
  previousResults.forEach((r) => {
    if (!previousMap[r.test_key]) previousMap[r.test_key] = r;
  });

  // Attach previous values
  const enriched = latestResults.map((r) => ({
    ...r,
    previous: previousMap[r.test_key] || null,
  }));

  // Group by category
  const grouped = {};
  enriched.forEach((r) => {
    const cat = r.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(r);
  });

  // Return in defined category order
  const result = [];
  const allCategories = [...CATEGORY_ORDER, ...Object.keys(grouped).filter((c) => !CATEGORY_ORDER.includes(c))];
  allCategories.forEach((cat) => {
    if (grouped[cat]) {
      result.push({ category: cat, tests: grouped[cat] });
    }
  });

  return result;
};

const getTestHistory = async (userId, testKey) => {
  const history = await db('health_test_results')
    .where({ user_id: userId, test_key: testKey })
    .select('id', 'value_numeric', 'value_text', 'unit', 'flag', 'ref_min', 'ref_max', 'ref_display', 'report_date', 'report_id')
    .orderBy('report_date', 'asc');

  // Fetch description from test_definitions
  const testDef = await db('test_definitions')
    .where('test_key', testKey)
    .select('description')
    .first();

  return { history, description: testDef?.description || null };
};

module.exports = { getSummary, getTestHistory };
