-- Create member_inventory table
CREATE TABLE IF NOT EXISTS member_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, -- Assuming you have auth, or string if simple ID
    mpn TEXT NOT NULL,
    manufacturer TEXT,
    quantity INTEGER DEFAULT 0,
    price_usd DECIMAL(10, 2),
    condition TEXT DEFAULT 'New',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast search
CREATE INDEX idx_member_inventory_mpn ON member_inventory(mpn);
