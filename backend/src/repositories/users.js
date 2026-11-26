export function userRepository(db) {
  return {
    async create(user, passwordHash) {
      await db.execute('INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
        [user.id, user.name, user.email, passwordHash]);
    },
    async find(email) {
      const [[row]] = await db.execute('SELECT id, name, email, role, password_hash FROM users WHERE email = ?', [email]);
      return row;
    },
    async rename(id, name) {
      await db.execute('UPDATE users SET name = ? WHERE id = ?', [name, id]);
      const [[row]] = await db.execute('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
      return row;
    },
    async issue(hash, userId, expires) {
      await db.execute('INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [hash, userId, expires]);
    },
    async rotate(hash, nextHash, expires) {
      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();
        const [[row]] = await connection.execute(`SELECT u.id, u.name, u.email, u.role
          FROM refresh_tokens t JOIN users u ON u.id = t.user_id
          WHERE t.token_hash = ? AND t.expires_at > UTC_TIMESTAMP(3) FOR UPDATE`, [hash]);
        if (row) {
          await connection.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);
          await connection.execute('INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)', [nextHash, row.id, expires]);
        }
        await connection.commit();
        return row;
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    },
    async revoke(hash) {
      await db.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [hash]);
    },
  };
}
