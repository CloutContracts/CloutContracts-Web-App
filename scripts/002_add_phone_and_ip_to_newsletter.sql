-- Add phone number, country code, and IP address columns to newsletter subscribers table
ALTER TABLE cloutcontracts_newsletter_subscribers 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS country_code TEXT,
ADD COLUMN IF NOT EXISTS ip_address TEXT;

-- Create an index on ip_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_ip_address ON cloutcontracts_newsletter_subscribers(ip_address);
