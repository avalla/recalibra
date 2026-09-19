export const LANGUAGE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
INSERT OR IGNORE INTO app_settings (key, value) VALUES ('language', 'system');
`;
