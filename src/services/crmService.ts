import { supabase } from '../lib/supabase';
import type { 
  CrmCompany, 
  CrmContact, 
  CrmProject, 
  CallPlan, 
  SourcedPart, 
  DesignIn 
} from '../types/crm';

/**
 * CRM Service - Handles all data operations for B2B Sales Intelligence
 */

// --- Companies ---
export const getCrmCompanies = async () => {
  const { data, error } = await supabase
    .from('crm_companies')
    .select('*')
    .order('name');
  if (error) throw error;
  return data as CrmCompany[];
};

export const createCrmCompany = async (company: Partial<CrmCompany>) => {
  const { data, error } = await supabase
    .from('crm_companies')
    .insert(company)
    .select()
    .single();
  if (error) throw error;
  return data as CrmCompany;
};

export const updateCrmCompany = async (id: string, updates: Partial<CrmCompany>) => {
  const { data, error } = await supabase
    .from('crm_companies')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CrmCompany;
};

// --- Contacts ---
export const getCrmContacts = async (companyId?: string) => {
  let query = supabase.from('crm_contacts').select('*');
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data as CrmContact[];
};

export const createCrmContact = async (contact: Partial<CrmContact>) => {
  const { data, error } = await supabase
    .from('crm_contacts')
    .insert(contact)
    .select()
    .single();
  if (error) throw error;
  return data as CrmContact;
};

// --- Projects ---
export const getCrmProjects = async () => {
  const { data, error } = await supabase
    .from('crm_projects')
    .select('*, crm_companies(name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data as (CrmProject & { crm_companies: { name: string } })[];
};

export const createCrmProject = async (project: Partial<CrmProject>) => {
  const { data, error } = await supabase
    .from('crm_projects')
    .insert(project)
    .select()
    .single();
  if (error) throw error;
  return data as CrmProject;
};

export const updateCrmProjectStage = async (id: string, stage: string, velocityUpdate?: any) => {
  const { data, error } = await supabase
    .from('crm_projects')
    .update({ 
      stage, 
      velocity_data: velocityUpdate,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as CrmProject;
};

// --- Call Plans ---
export const getCallPlans = async (companyId?: string) => {
  let query = supabase.from('crm_call_plans').select('*, crm_contacts(name)');
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  const { data, error } = await query.order('visit_date', { ascending: false });
  if (error) throw error;
  return data as (CallPlan & { crm_contacts: { name: string } })[];
};

export const createCallPlan = async (callPlan: Partial<CallPlan>) => {
  const { data, error } = await supabase
    .from('crm_call_plans')
    .insert(callPlan)
    .select()
    .single();
  if (error) throw error;
  return data as CallPlan;
};

// --- Vector Intelligence ---
export const searchSimilarTechLogs = async (embedding: number[], match_threshold = 0.5, match_count = 5) => {
  const { data, error } = await supabase.rpc('match_crm_call_plans', {
    query_embedding: embedding,
    match_threshold,
    match_count,
  });
  if (error) throw error;
  return data;
};

// --- Sourcing Bridge ---
export const syncSourcedPart = async (sourcedPart: Partial<SourcedPart>) => {
  const { data, error } = await supabase
    .from('crm_sourced_parts')
    .insert(sourcedPart)
    .select()
    .single();
  if (error) throw error;
  return data as SourcedPart;
};

// --- Design-in History ---
export const getDesignInHistory = async (companyId?: string) => {
  let query = supabase.from('crm_design_in_history').select('*');
  if (companyId) {
    query = query.eq('company_id', companyId);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as DesignIn[];
};

export const createDesignIn = async (designIn: Partial<DesignIn>) => {
  const { data, error } = await supabase
    .from('crm_design_in_history')
    .insert(designIn)
    .select()
    .single();
  if (error) throw error;
  return data as DesignIn;
};
