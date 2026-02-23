import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Building2, UserCircle2 } from 'lucide-react';
import { getCrmContacts, createCrmContact, getCrmCompanies } from '../../services/crmService';
import type { CrmContact, CrmCompany, InfluenceLevel } from '../../types/crm';
import clsx from 'clsx';

export const ContactsPanel = () => {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [newContact, setNewContact] = useState<Partial<CrmContact>>({
    name: '',
    company_id: '',
    department: '',
    position: '',
    influence_level: 'USER',
    email: '',
    phone: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [contactsData, companiesData] = await Promise.all([
          getCrmContacts(),
          getCrmCompanies()
        ]);
        setContacts(contactsData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await createCrmContact(newContact);
      setContacts([created, ...contacts]);
      setShowAddForm(false);
      setNewContact({ name: '', company_id: '', department: '', position: '', influence_level: 'USER', email: '', phone: '' });
    } catch (error) {
      console.error('Failed to create contact:', error);
    }
  };

  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInfluenceBadge = (level: InfluenceLevel) => {
    const styles = {
      CHAMPION: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      BLOCKER: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      INFLUENCER: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      USER: 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    };
    return (
      <span className={clsx("px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border", styles[level])}>
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input 
            type="text" 
            placeholder="담당자 또는 부서 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          담당자 등록
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddContact} className="p-6 rounded-2xl bg-slate-900/80 border border-blue-500/30 animate-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <input 
              required
              placeholder="이름"
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.name}
              onChange={e => setNewContact({...newContact, name: e.target.value})}
            />
            <select 
              required
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.company_id}
              onChange={e => setNewContact({...newContact, company_id: e.target.value})}
            >
              <option value="">고객사 선택</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <input 
              placeholder="부서"
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.department}
              onChange={e => setNewContact({...newContact, department: e.target.value})}
            />
            <input 
              placeholder="직급"
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.position}
              onChange={e => setNewContact({...newContact, position: e.target.value})}
            />
            <select 
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.influence_level}
              onChange={e => setNewContact({...newContact, influence_level: e.target.value as InfluenceLevel})}
            >
              <option value="USER">USER (실무자)</option>
              <option value="INFLUENCER">INFLUENCER (영향력자)</option>
              <option value="CHAMPION">CHAMPION (의사결정자)</option>
              <option value="BLOCKER">BLOCKER (차단자)</option>
            </select>
            <input 
              placeholder="이메일"
              className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-200"
              value={newContact.email}
              onChange={e => setNewContact({...newContact, email: e.target.value})}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-slate-400 hover:text-slate-200 text-sm font-bold">취소</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-blue-500/20">저장</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="p-5 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserCircle2 className="w-20 h-20" />
            </div>
            
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-blue-400 border border-slate-700">
                <Users className="w-6 h-6" />
              </div>
              {getInfluenceBadge(contact.influence_level)}
            </div>

            <div className="relative z-10">
              <h3 className="text-lg font-bold text-slate-100">{contact.name}</h3>
              <p className="text-xs text-slate-400 font-medium">{contact.department} · {contact.position}</p>
              
              <div className="mt-4 space-y-2">
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Building2 className="w-3 h-3 opacity-50" />
                  {companies.find(c => c.id === contact.company_id)?.name || 'Unknown Company'}
                </p>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Mail className="w-3 h-3 opacity-50" />
                  {contact.email || 'No Email'}
                </p>
                <p className="text-xs text-slate-300 flex items-center gap-2">
                  <Phone className="w-3 h-3 opacity-50" />
                  {contact.phone || 'No Phone'}
                </p>
              </div>
            </div>

            <button className="w-full mt-6 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-blue-400 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-800/50">
              미팅 히스토리 보기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
