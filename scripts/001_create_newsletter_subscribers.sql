-- Create newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Enable RLS for security
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for public signup)
CREATE POLICY "Allow public insert" ON newsletter_subscribers 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read (for admin purposes - you can restrict this later)
CREATE POLICY "Allow public select" ON newsletter_subscribers 
  FOR SELECT 
  USING (true);
