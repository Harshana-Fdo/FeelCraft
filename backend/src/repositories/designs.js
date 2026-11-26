const columns = 'id, title, template_slug AS templateSlug, revision, updated_at AS updatedAt';

export function designRepository(db) {
  async function get(owner, id) {
    const [[row]] = await db.execute(`SELECT ${columns}, document_json FROM designs WHERE user_id = ? AND id = ?`, [owner, id]);
    if (!row) return null;
    const { document_json: document, ...design } = row;
    return { ...design, document: typeof document === 'string' ? JSON.parse(document) : document };
  }

  return {
    get,
    async list(owner) {
      const [rows] = await db.execute(`SELECT ${columns} FROM designs WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100`, [owner]);
      return rows;
    },
    async create(owner, draft) {
      await db.execute('INSERT INTO designs (id, user_id, template_slug, title, document_json) VALUES (?, ?, ?, ?, ?)',
        [draft.id, owner, draft.templateSlug, draft.title, JSON.stringify(draft.document)]);
      return get(owner, draft.id);
    },
    async update(owner, id, { revision, title, document }) {
      const [result] = await db.execute(`UPDATE designs SET title = ?, document_json = ?, revision = revision + 1
        WHERE user_id = ? AND id = ? AND revision = ?`, [title, JSON.stringify(document), owner, id, revision]);
      if (result.affectedRows) return { revision: revision + 1 };
      return await get(owner, id) ? { conflict: true } : null;
    },
    async remove(owner, id) {
      const [result] = await db.execute('DELETE FROM designs WHERE user_id = ? AND id = ?', [owner, id]);
      return result.affectedRows > 0;
    },
  };
}
