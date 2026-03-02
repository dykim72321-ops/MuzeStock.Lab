import { useState, useEffect } from 'react';
import { Users, Search, Plus, Mail, Phone, Building2, UserCircle2 } from 'lucide-react';
import { getCrmContacts, createCrmContact, getCrmCompanies } from '../../services/crmService';
import type { CrmContact, CrmCompany, InfluenceLevel } from '../../types/crm';
import clsx from 'clsx';

export const ContactsPanel = () => {
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [companies, setCompanies] = useState<CrmCompany[]>([]);
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
      CHAMPION: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      BLOCKER: 'bg-rose-50 text-rose-600 border-rose-100',
      INFLUENCER: 'bg-blue-50 text-[#0176d3] border-blue-100',
      USER: 'bg-slate-50 text-slate-500 border-slate-200'
    };
    return (
      <span className={clsx("px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border shadow-sm", styles[level])}>
        {level}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#0176d3] transition-colors" />
          <input 
            type="text" 
            placeholder="담당자 또는 부서 검색..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="sfdc-input pl-10"
          />
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="sfdc-button-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>담당자 등록</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddContact} className="p-8 rounded-2xl bg-slate-50 border border-blue-200 shadow-inner animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Create New Contact Profile</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Name</label>
              <input 
                required
                className="sfdc-input w-full"
                value={newContact.name}
                onChange={e => setNewContact({...newContact, name: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Company</label>
              <select 
                required
                className="sfdc-input w-full"
                value={newContact.company_id}
                onChange={e => setNewContact({...newContact, company_id: e.target.value})}
              >
                <option value="">고객사 선택</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Department</label>
              <input 
                className="sfdc-input w-full"
                value={newContact.department}
                onChange={e => setNewContact({...newContact, department: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Position</label>
              <input 
                className="sfdc-input w-full"
                value={newContact.position}
                onChange={e => setNewContact({...newContact, position: e.target.value})}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Influence Level</label>
              <select 
                className="sfdc-input w-full"
                value={newContact.influence_level}
                onChange={e => setNewContact({...newContact, influence_level: e.target.value as InfluenceLevel})}
              >
                <option value="USER">USER (실무자)</option>
                <option value="INFLUENCER">INFLUENCER (영향력자)</option>
                <option value="CHAMPION">CHAMPION (의사결정자)</option>
                <option value="BLOCKER">BLOCKER (차단자)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider ml-1">Email</label>
              <input 
                className="sfdc-input w-full"
                value={newContact.email}
                onChange={e => setNewContact({...newContact, email: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button type="button" onClick={() => setShowAddForm(false)} className="sfdc-button-secondary px-8">취소</button>
            <button type="submit" className="sfdc-button-primary px-10 shadow-lg shadow-blue-500/20">데이터베이스 저장</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="p-6 rounded-2xl bg-white border border-slate-200 hover:border-[#0176d3]/30 transition-all group relative overflow-hidden shadow-sm hover:shadow-xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <UserCircle2 className="w-24 h-24 text-[#0176d3]" />
            </div>
            
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0176d3] shadow-inner group-hover:bg-blue-50 transition-colors">
                <Users className="w-6 h-6" />
              </div>
              {getInfluenceBadge(contact.influence_level)}
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-[#0176d3] transition-colors">{contact.name}</h3>
              <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">{contact.department} · {contact.position}</p>
              
              <div className="mt-6 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100 shadow-inner">
                <p className="text-xs text-slate-600 flex items-center gap-2.5 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {companies.find(c => c.id === contact.company_id)?.name || 'Unknown Entity'}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-2.5 font-bold">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {contact.email || 'N/A'}
                </p>
                <p className="text-xs text-slate-600 flex items-center gap-2.5 font-bold">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {contact.phone || 'N/A'}
                </p>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-[#0176d3] rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 hover:border-blue-200 shadow-sm overflow-hidden relative group/btn">
              <span className="relative z-10">Full Engagement History</span>
              <div className="absolute inset-0 bg-blue-50 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
