-- Replace ip_address column with ip_hash for privacy
-- The hash is one-way so we can check for duplicates without storing the actual IP

ALTER TABLE cloutcontracts_newsletter_subscribers 
DROP COLUMN IF EXISTS ip_address;

ALTER TABLE cloutcontracts_newsletter_subscribers 
ADD COLUMN IF NOT EXISTS ip_hash TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_ip_hash ON cloutcontracts_newsletter_subscribers(ip_hash);
