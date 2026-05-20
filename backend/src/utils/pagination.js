/**
 * Reusable pagination helper
 * @param {number} page - Current page number (starts at 1)
 * @param {number} limit - Items per page
 * @returns {{ skip: number, limit: number }}
 */
const getPagination = (page = 1, limit = 20) => {
  const currentPage = Math.max(1, Number(page));
  const pageLimit = Math.min(100, Math.max(1, Number(limit)));
  const skip = (currentPage - 1) * pageLimit;

  return { skip, limit: pageLimit, currentPage };
};

/**
 * Build pagination metadata for response
 * @param {number} totalItems - Total documents count
 * @param {number} currentPage - Current page
 * @param {number} limit - Items per page
 * @returns {object} Pagination metadata
 */
const getPaginationMeta = (totalItems, currentPage, limit) => {
  const totalPages = Math.ceil(totalItems / limit);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
    nextPage: currentPage < totalPages ? currentPage + 1 : null,
    prevPage: currentPage > 1 ? currentPage - 1 : null,
  };
};

export { getPagination, getPaginationMeta };
