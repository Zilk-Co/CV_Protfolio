const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => client.query("ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS slug TEXT NOT NULL DEFAULT 'default';"))
  .then(() => client.query("DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_slug_unique') THEN ALTER TABLE portfolio ADD CONSTRAINT portfolio_slug_unique UNIQUE (slug); END IF; END $$;"))
  .then(() => client.query("ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'available';"))
  .then(() => console.log('success'))
  .catch(e => console.error(e))
  .finally(() => client.end());
