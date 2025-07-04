-- Add WhatsApp verification codes table
CREATE TABLE IF NOT EXISTS whatsapp_verification_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, phone_number, code)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_user_id ON whatsapp_verification_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_phone_number ON whatsapp_verification_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_verification_codes_expires_at ON whatsapp_verification_codes(expires_at);

-- Enable RLS
ALTER TABLE whatsapp_verification_codes ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view own verification codes" ON whatsapp_verification_codes FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert own verification codes" ON whatsapp_verification_codes FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can delete own verification codes" ON whatsapp_verification_codes FOR DELETE USING (auth.uid()::text = user_id::text); 