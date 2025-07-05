-- WhatsApp Subscribers Table
CREATE TABLE IF NOT EXISTS whatsapp_subscribers (
  id SERIAL PRIMARY KEY,
  phone_number VARCHAR(20) UNIQUE NOT NULL,
  first_message TEXT,
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  message_count INTEGER DEFAULT 0,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for phone number lookups
CREATE INDEX IF NOT EXISTS idx_whatsapp_subscribers_phone ON whatsapp_subscribers(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_subscribers_active ON whatsapp_subscribers(is_active);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_whatsapp_subscribers_updated_at 
    BEFORE UPDATE ON whatsapp_subscribers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some test data (optional)
INSERT INTO whatsapp_subscribers (phone_number, first_message, is_active) 
VALUES 
  ('+263718558160', 'Hello, I want to subscribe to alerts', true)
ON CONFLICT (phone_number) DO NOTHING; 