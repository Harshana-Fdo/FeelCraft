CREATE TABLE IF NOT EXISTS publications (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  owner_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  design_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  share_token CHAR(43) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  title VARCHAR(100) NOT NULL,
  snapshot_json JSON NOT NULL,
  status ENUM('active', 'revoked', 'unpublished') NOT NULL DEFAULT 'active',
  password_hash VARCHAR(100) NULL,
  expires_at DATETIME(3) NULL,
  access_version INT UNSIGNED NOT NULL DEFAULT 1,
  view_count INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (design_id) REFERENCES designs(id) ON DELETE SET NULL,
  INDEX publications_owner_design (owner_id, design_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS publication_reports (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  publication_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  reason ENUM('harassment', 'threat', 'impersonation', 'other') NOT NULL,
  details VARCHAR(500) NOT NULL DEFAULT '',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (publication_id) REFERENCES publications(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
