CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  email VARCHAR(254) NOT NULL UNIQUE,
  password_hash VARCHAR(100) NOT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  token_hash BINARY(32) PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  INDEX refresh_expires (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS categories (
  slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  sort_order SMALLINT UNSIGNED NOT NULL,
  category_json JSON NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS templates (
  slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  category_slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL,
  status ENUM('draft', 'published') NOT NULL DEFAULT 'draft',
  version INT UNSIGNED NOT NULL DEFAULT 1,
  metadata_json JSON NOT NULL,
  document_json JSON NOT NULL,
  FOREIGN KEY (category_slug) REFERENCES categories (slug),
  INDEX catalog_published (status, sort_order)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS designs (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
  user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  template_slug VARCHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
  title VARCHAR(100) NOT NULL,
  document_json JSON NOT NULL,
  revision INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  FOREIGN KEY (template_slug) REFERENCES templates (slug) ON DELETE SET NULL,
  INDEX design_owner_updated (user_id, updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
