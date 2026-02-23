-- 20260223000004_create_vector_rpc.sql
-- Create RPC function for vector similarity search on call plans

CREATE OR REPLACE FUNCTION match_crm_call_plans (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  company_id uuid,
  contact_id uuid,
  visit_date timestamptz,
  technical_log jsonb,
  defense_logic jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id,
    cp.company_id,
    cp.contact_id,
    cp.visit_date,
    cp.technical_log,
    cp.defense_logic,
    1 - (cp.embedding <=> query_embedding) AS similarity
  FROM crm_call_plans cp
  WHERE 1 - (cp.embedding <=> query_embedding) > match_threshold
  ORDER BY cp.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
