-- 20260223000001_create_crm_core.sql
-- Core CRM tables for B2B Sales Intelligence

-- 1. Companies Table
CREATE TABLE IF NOT EXISTS public.crm_companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    industry TEXT,
    address TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb, -- PLC, MCU 등 주요 장비 정보
    dart_code TEXT, -- DART 공시 연동용 코드
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Contacts Table
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    department TEXT,
    position TEXT,
    influence_level TEXT CHECK (influence_level IN ('CHAMPION', 'BLOCKER', 'INFLUENCER', 'USER')),
    preferences JSONB DEFAULT '{}'::jsonb, -- 선호 대화 주제/성향
    contact_history TEXT,
    email TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Projects Table (Pipeline)
CREATE TABLE IF NOT EXISTS public.crm_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    stage TEXT NOT NULL DEFAULT 'NEEDS' CHECK (stage IN ('NEEDS', 'SAMPLE', 'TEST', 'NEGOTIATION', 'WIN', 'DROP')),
    target_product TEXT,
    competitor_product TEXT,
    expected_value DOUBLE PRECISION DEFAULT 0.0,
    velocity_data JSONB DEFAULT '{}'::jsonb, -- 각 단계별 체류 시간 통계
    customer_dna_alert_level TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'WARNING', 'CRITICAL' (DNA 스코어 연동용)
    next_followup_date TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Design-in History Table
CREATE TABLE IF NOT EXISTS public.crm_design_in_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.crm_companies(id) ON DELETE CASCADE,
    part_number TEXT NOT NULL,
    application_name TEXT,
    status TEXT CHECK (status IN ('DESIGNED_IN', 'PROTOTYPE')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_design_in_history ENABLE ROW LEVEL SECURITY;

-- Allow public access for now (Development simplicity)
CREATE POLICY "Public Read/Write Companies" ON public.crm_companies FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Contacts" ON public.crm_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write Projects" ON public.crm_projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read/Write DesignIn" ON public.crm_design_in_history FOR ALL USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_crm_companies_modtime
    BEFORE UPDATE ON public.crm_companies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_crm_contacts_modtime
    BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_crm_projects_modtime
    BEFORE UPDATE ON public.crm_projects
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
