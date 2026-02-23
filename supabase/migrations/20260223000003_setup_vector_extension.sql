-- 20260223000003_setup_vector_extension.sql
-- Setup pgvector extension and indexes for technical log search

-- Enable the pgvector extension to work with embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create an HNSW index for vector similarity search
-- Adjusting m and ef_construction for balance between build speed and search quality
CREATE INDEX IF NOT EXISTS idx_crm_call_plans_embedding ON public.crm_call_plans 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
