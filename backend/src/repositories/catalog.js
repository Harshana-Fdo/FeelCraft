const parse = value => typeof value === 'string' ? JSON.parse(value) : value;

export function catalogRepository(db) {
  return {
    async categories() {
      const [rows] = await db.execute('SELECT category_json FROM categories ORDER BY sort_order');
      return rows.map(row => parse(row.category_json));
    },
    async templates(slug) {
      const sql = `SELECT slug, category_slug, version, status, metadata_json, document_json
        FROM templates WHERE status = 'published'`;
      const [rows] = slug
        ? await db.execute(sql + ' AND slug = ?', [slug])
        : await db.execute(sql + ' ORDER BY sort_order');
      return rows.map(row => ({
        ...parse(row.metadata_json), id: row.slug, slug: row.slug, category: row.category_slug,
        version: row.version, status: row.status, document: parse(row.document_json),
      }));
    },
  };
}
