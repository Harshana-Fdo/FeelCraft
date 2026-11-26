const metadata = `id, (SELECT d.id FROM designs d WHERE d.id = publications.design_id AND d.user_id = publications.owner_id) AS designId,
  share_token AS token, title, status,
  expires_at AS expiresAt, password_hash IS NOT NULL AS protected,
  view_count AS views, created_at AS createdAt`;

export function publicationRepository(db) {
  const ownerOne = async (owner, id) => {
    const [[row]] = await db.execute(`SELECT ${metadata} FROM publications WHERE owner_id = ? AND id = ?`, [owner, id]);
    return row;
  };
  return {
    async list(owner, designId) {
      const [rows] = designId
        ? await db.execute(`SELECT ${metadata} FROM publications WHERE owner_id = ? AND design_id = ? ORDER BY created_at DESC LIMIT 100`, [owner, designId])
        : await db.execute(`SELECT ${metadata} FROM publications WHERE owner_id = ? ORDER BY created_at DESC LIMIT 100`, [owner]);
      return rows;
    },
    async loadDraft(owner, id) {
      const [[row]] = await db.execute(`SELECT d.id, d.title, d.document_json AS document, u.name,
        t.category_slug AS category FROM designs d JOIN users u ON u.id = d.user_id
        LEFT JOIN templates t ON t.slug = d.template_slug WHERE d.user_id = ? AND d.id = ?`, [owner, id]);
      return row;
    },
    async insert(owner, designId, entry) {
      const { id, token, title, snapshot, passwordHash, expiresAt } = entry;
      const [result] = await db.execute(`INSERT INTO publications
        (id, owner_id, design_id, share_token, title, snapshot_json, password_hash, expires_at, created_at)
        SELECT ?, user_id, id, ?, ?, ?, ?, ?, UTC_TIMESTAMP(3)
        FROM designs WHERE user_id = ? AND id = ?`,
      [id, token, title, JSON.stringify(snapshot), passwordHash, expiresAt, owner, designId]);
      return result.affectedRows ? ownerOne(owner, id) : null;
    },
    async ownerSnapshot(owner, id) {
      const [[row]] = await db.execute('SELECT snapshot_json AS snapshot FROM publications WHERE owner_id = ? AND id = ?', [owner, id]);
      return row;
    },
    async privacy(owner, id, { changeExpiry, expiresAt, changePassword, passwordHash }) {
      const [result] = await db.execute(`UPDATE publications SET expires_at = CASE WHEN ? THEN ? ELSE expires_at END,
        password_hash = CASE WHEN ? THEN ? ELSE password_hash END, access_version = access_version + 1
        WHERE owner_id = ? AND id = ? AND status = 'active'`, [changeExpiry, expiresAt, changePassword, passwordHash, owner, id]);
      return result.affectedRows ? ownerOne(owner, id) : null;
    },
    async close(owner, id, status) {
      const [result] = await db.execute(`UPDATE publications SET status = ?, access_version = access_version + 1
        WHERE owner_id = ? AND id = ? AND status = 'active'`, [status, owner, id]);
      return result.affectedRows ? ownerOne(owner, id) : null;
    },
    async remove(owner, id) {
      const [result] = await db.execute('DELETE FROM publications WHERE owner_id = ? AND id = ?', [owner, id]);
      return Boolean(result.affectedRows);
    },
    async byToken(token, snapshot = false) {
      const [[row]] = await db.execute(`SELECT id, status, expires_at AS expiresAt, password_hash AS passwordHash,
        access_version AS accessVersion${snapshot ? ', snapshot_json AS snapshot' : ''}
        FROM publications WHERE share_token = ?`, [token]);
      return row;
    },
    async recordView({ id, accessVersion }) {
      await db.execute(`UPDATE publications SET view_count = view_count + 1 WHERE id = ? AND access_version = ?
        AND status = 'active' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3))`, [id, accessVersion]);
    },
    async report(id, { id: publicationId, accessVersion }, reason, details) {
      const [result] = await db.execute(`INSERT INTO publication_reports (id, publication_id, reason, details, created_at)
        SELECT ?, id, ?, ?, UTC_TIMESTAMP(3) FROM publications WHERE id = ? AND access_version = ?
        AND status = 'active' AND (expires_at IS NULL OR expires_at > UTC_TIMESTAMP(3))`, [id, reason, details, publicationId, accessVersion]);
      return Boolean(result.affectedRows);
    },
  };
}
