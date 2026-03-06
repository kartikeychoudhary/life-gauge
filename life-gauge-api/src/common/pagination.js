const paginate = (query, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  return query.limit(limit).offset(offset);
};

const paginationMeta = (total, page, limit) => ({
  total,
  page: parseInt(page),
  limit: parseInt(limit),
  pages: Math.ceil(total / limit),
});

module.exports = { paginate, paginationMeta };
