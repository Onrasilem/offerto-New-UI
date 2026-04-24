import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showSuccessToast, showErrorToast } from '../lib/toast';
import { api } from '../lib/api';

/**
 * Offerto Context - Global state management for invoices, quotes, customers, and company info.
 * Now integrated with Node.js backend API for multi-device sync and automation.
 */

// API integration flags
const USE_BACKEND_API = true; // Set to false for local-only mode
const SYNC_ON_CHANGE = true; // Auto-sync to backend on data changes

/** Available document statuses */
export const DOC_STATUS = ['Concept','Verzonden','Bekeken','Getekend/Goedgekeurd','Betaald','Geannuleerd'];

/** AsyncStorage keys for persistence */
export const STORAGE = { user: 'offerto.user', archive: 'offerto.archive', counters: 'offerto.counters' };

const OffertoContext = createContext(null);

/**
 * Hook to access the Offerto context from any component.
 * @returns {Object} The Offerto context value with all state and functions.
 */
export const useOfferto = () => useContext(OffertoContext);

const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
const parseNum = (v) => { const n = parseFloat(String(v ?? '').replace(',', '.')); return Number.isFinite(n) ? n : 0; };
const yearNow = () => new Date().getFullYear();

/**
 * Extract the total invoice amount from a document, with fallback chain:
 * 1. Direct doc.total (preferred)
 * 2. doc.totals.incTotal (legacy format)
 * 3. Calculate from line items if neither exists
 * @param {Object} doc - Document object
 * @returns {number} Total amount (incl. VAT)
 */
const getIncFromDoc = (doc) => {
  if (typeof doc?.total === 'number' && !Number.isNaN(doc.total)) return doc.total;
  const t = doc?.totals;
  if (t && typeof t.incTotal === 'number' && !Number.isNaN(t.incTotal)) return t.incTotal;
  const lines = Array.isArray(doc.lines) ? doc.lines : [];
  if (lines.length === 0) return 0;
  const total = lines.reduce((sum, line) => {
    if (typeof line.inc === 'number' && !Number.isNaN(line.inc)) return sum + line.inc;
    const qty = Number(line.aantal ?? 0) || 0;
    const price = Number(line.eenheidsprijs ?? 0) || 0;
    const ex = typeof line.ex === 'number' ? line.ex : qty * price;
    const vatPerc = Number(line.btwPerc ?? 0) || 0;
    const inc = ex * (1 + vatPerc / 100);
    return sum + inc;
  }, 0);
  return total;
};

// Get month key from doc date (YYYY-MM)
const monthKeyFor = (d) => {
  if (!d) return null;
  if (typeof d.date === 'string' && /^\d{4}-\d{2}/.test(d.date)) return d.date.slice(0, 7);
  const dt = new Date(d.date);
  if (Number.isNaN(dt.getTime())) return null;
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Calculate monthly revenue (invoice totals) for the last 12 months.
 * Aggregates all invoices (type='FACTUUR') by month in descending order.
 * @param {Array} archive - Array of document objects
 * @returns {Array} Array of {key, label, total} for each month (last 12)
 */
export const getMonthlyRevenue = (archive) => {
  if (!Array.isArray(archive)) return [];
  const invoices = archive.filter((d) => d.type === 'FACTUUR');
  const monthSums = invoices.reduce((acc, d) => {
    const key = monthKeyFor(d) || 'unknown';
    acc[key] = (acc[key] || 0) + getIncFromDoc(d);
    return acc;
  }, {});
  const months = [];
  for (let i = 0; i < 12; i++) {
    const dt = new Date();
    dt.setMonth(dt.getMonth() - i);
    const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    months.push({ key, label: dt.toLocaleString('nl-BE', { month: 'short', year: 'numeric' }), total: Math.round((monthSums[key] || 0) * 100) / 100 });
  }
  return months;
};

// Data migration: converteer totals.incTotal naar direct total getal
const migrateArchiveData = (rawData) => {
  if (!Array.isArray(rawData)) return [];
  return rawData.map(doc => {
    const migrated = { ...doc };
    
    // Map totals
    if (doc.totals && typeof doc.totals.incTotal === 'number' && !doc.total) {
      migrated.total = doc.totals.incTotal;
    }
    
    // Map Peppol fields from snake_case to camelCase
    if (doc.peppol_status) {
      migrated.peppolStatus = doc.peppol_status;
      migrated.peppolId = doc.peppol_id;
      migrated.peppolSentAt = doc.peppol_sent_at;
    }
    
    return migrated;
  });
};

export function OffertoProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState({ bedrijfsnaam: '', adres: '', postcode: '', stad: '', land: 'België', btwNummer: '', email: '', telefoon: '', iban: '', bic: '', bank: '', betalingsTermijn: '14 dagen', logoUrl: '', offerteGeldigheidDagen: 30, voorwaarden: '' });
  const [klant, setKlant] = useState({ bedrijfsnaam: '', contactpersoon: '', email: '', telefoon: '', adres: '', btwNummer: '', btwTariefDefault: 21 });
  const [onderdelen, setOnderdelen] = useState([]);
  const [docType, setDocType] = useState('OFFERTE');
  const [docNummer, setDocNummer] = useState('');
  const [docDatum, setDocDatum] = useState(new Date().toISOString().slice(0,10));
  const [signRequested, setSignRequested] = useState(false);
  const [archive, setArchive] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALLE');
  const [reminderPrefs, setReminderPrefs] = useState({ daysUntilReminder: 7 });
  const [signatureData, setSignatureData] = useState(null);
  const [products, setProducts] = useState([]);
  const [productCategories, setProductCategories] = useState([]);

  useEffect(()=>{(async()=>{
    try{
      // Initialize API client
      await api.init();
      
      if (USE_BACKEND_API && api.user) {
        // User logged in via backend
        setUser(api.user);
        
        // Sync documents from backend
        try {
          const docs = await api.getDocuments();
          const migratedData = migrateArchiveData(docs);
          setArchive(migratedData);
          await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(migratedData));
        } catch (e) {
          console.error('Failed to sync from backend:', e);
          // Fall back to local storage
          const a = await AsyncStorage.getItem(STORAGE.archive);
          if (a) {
            const rawData = JSON.parse(a);
            const migratedData = migrateArchiveData(rawData);
            setArchive(migratedData);
          }
        }
      } else {
        // Local-only mode or no user
        const u = await AsyncStorage.getItem(STORAGE.user); 
        if (u) setUser(JSON.parse(u));
        const a = await AsyncStorage.getItem(STORAGE.archive); 
        if (a) {
          const rawData = JSON.parse(a);
          const migratedData = migrateArchiveData(rawData);
          setArchive(migratedData);
          if (JSON.stringify(rawData) !== JSON.stringify(migratedData)) {
            await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(migratedData));
          }
        }
      }
    } finally { setBooting(false); }
  })()},[]);

  /** Add line item (onderdeel) to current document */
  const addOnderdeel = (i)=>setOnderdelen(p=>[...p,{id:Date.now().toString(),...i}]);
  
  /** Remove line item by ID */
  const removeOnderdeel = (id)=>setOnderdelen(p=>p.filter(r=>r.id!==id));

  /**
   * Compute totals (excl., VAT, incl.) from all line items.
   * Recalculates whenever line items change.
   */
  const totals = useMemo(()=>{
    const lines=onderdelen.map(r=>{
      const qty=r.eenheid==='forfait'?1:parseNum(r.aantal);
      const up=round2(parseNum(r.eenheidsprijs));
      const ex=round2(qty*up);
      const btwA=round2(ex*(parseNum(r.btwPerc)/100));
      return {...r,aantal:qty,ex,btwA,inc:round2(ex+btwA)};
    });
    const exTotal=round2(lines.reduce((s,r)=>s+r.ex,0));
    const btwTotal=round2(lines.reduce((s,r)=>s+r.btwA,0));
    const incTotal=round2(exTotal+btwTotal);
    return{lines,exTotal,btwTotal,incTotal};
  },[onderdelen]);

  async function nextDocNumber(type){
    const y = String(yearNow());
    const prefix = type==='FACTUUR' ? 'INV' : 'Q';
    let counters = {};
    try{ const raw = await AsyncStorage.getItem(STORAGE.counters); if (raw) counters = JSON.parse(raw)||{}; }catch{}
    counters[y] = counters[y] || { INV: 0, Q: 0 };
    counters[y][prefix] = (counters[y][prefix]||0) + 1;
    await AsyncStorage.setItem(STORAGE.counters, JSON.stringify(counters));
    const seq = String(counters[y][prefix]).padStart(4,'0');
    return `${prefix}-${y}-${seq}`;
  }
  async function regenerateNumberFor(type){ const num = await nextDocNumber(type); setDocNummer(num); }

  async function signUp(email,password,name){
    setIsLoading(true);
    try {
      if (USE_BACKEND_API) {
        const data = await api.register(email, password, name);
        setUser(data.user);
        showSuccessToast('Account aangemaakt');
        
        // Sync existing local data to backend
        if (archive.length > 0) {
          try {
            for (const doc of archive) {
              await syncDocumentToBackend(doc);
            }
            showSuccessToast('Lokale data gesynchroniseerd');
          } catch (e) {
            console.error('Sync error:', e);
          }
        }
      } else {
        setUser({ email, name: name||email.split('@')[0] });
        await AsyncStorage.setItem(STORAGE.user, JSON.stringify({ email, name: name||email.split('@')[0] }));
        showSuccessToast('Account aangemaakt');
      }
    } catch(error) {
      showErrorToast(error.message || 'Registratie mislukt');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  
  async function signIn(email,password){
    setIsLoading(true);
    try {
      if (USE_BACKEND_API) {
        const data = await api.login(email, password);
        setUser(data.user);
        
        // Sync documents from backend
        const docs = await api.getDocuments();
        const migratedData = migrateArchiveData(docs);
        setArchive(migratedData);
        await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(migratedData));
        
        showSuccessToast('Ingelogd');
      } else {
        setUser({ email, name: email.split('@')[0] });
        await AsyncStorage.setItem(STORAGE.user, JSON.stringify({ email, name: email.split('@')[0] }));
        showSuccessToast('Ingelogd');
      }
    } catch(error) {
      showErrorToast(error.message || 'Login mislukt');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }
  
  async function signOutAll(){
    setIsLoading(true);
    try {
      if (USE_BACKEND_API) {
        await api.logout();
      }
      setUser(null);
      await AsyncStorage.removeItem(STORAGE.user);
      showSuccessToast('Uitgelogd');
    } catch(error) {
      showErrorToast('Uitloggen mislukt');
    } finally {
      setIsLoading(false);
    }
  }
  
  /**
   * Sync a document to backend
   */
  async function syncDocumentToBackend(doc) {
    if (!USE_BACKEND_API || !SYNC_ON_CHANGE) return;
    
    try {
      // Map local document format to backend format
      const customer = doc.klant || {};
      const backendDoc = {
        type: doc.type === 'FACTUUR' ? 'Invoice' : 'Quote',
        customer_id: customer.id || null, // Will need customer creation first
        status: doc.status === 'Betaald' ? 'Paid' : doc.status === 'Getekend/Goedgekeurd' ? 'Signed' : 'Sent',
        number: doc.nummer,
        date: doc.datum,
        totals_json: { total: doc.total || doc.totals?.incTotal || 0 },
        lines: (doc.lines || []).map(line => ({
          description: line.omschrijving,
          qty: line.aantal,
          unit: line.eenheid,
          unit_price: line.eenheidsprijs,
          vat_perc: line.btwPerc,
          ex: line.ex,
          vat: line.btwA,
          inc: line.inc,
        })),
      };
      
      // Create document in backend
      await api.createDocument(backendDoc);
    } catch (e) {
      console.error('Sync to backend failed:', e);
    }
  }

  async function refreshArchive(uid){
    if (supabase && uid) {
      const { data, error } = await supabase.from('documents').select('id,type,number,date,total_incl,status,share_url,last_reminder_at').order('date', { ascending:false });
      if (!error && data) setArchive(data.map(d=>({ id:d.id, type:d.type, number:d.number, date:d.date, total:d.total_incl, status:d.status||'Concept', shareUrl:d.share_url, lastReminderAt:d.last_reminder_at })));
    } else {
      const a = await AsyncStorage.getItem(STORAGE.archive); if (a) setArchive(JSON.parse(a));
    }
  }

  async function saveToArchive(doc){
    setIsLoading(true);
    try {
      const item = { 
        id: Date.now().toString(), 
        type: doc.type, 
        nummer: doc.number, 
        datum: doc.date, 
        total: doc.totals?.incTotal ?? 0, 
        signRequested: !!doc.signRequested, 
        status: 'Concept', 
        klant: klant,
        lines: doc.totals?.lines || [],
        shareUrl: undefined, 
        lastReminderAt: null 
      };
      
      const next = [item, ...(archive||[])];
      setArchive(next);
      await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(next));
      
      // Sync to backend if enabled
      if (USE_BACKEND_API && SYNC_ON_CHANGE && user) {
        await syncDocumentToBackend(item);
      }
      
      showSuccessToast(`${doc.type} opgeslagen`);
    } catch(error) {
      showErrorToast(error.message || 'Opslaan mislukt');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(id, status){
    if (!DOC_STATUS.includes(status)) return;
    
    // Update in backend if enabled
    if (USE_BACKEND_API && user?.id) {
      try {
        await api.updateDocument(id, { status });
        // Refresh from backend to get latest
        const docs = await api.listDocuments();
        setArchive(docs);
        await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(docs));
      } catch (e) {
        console.log('Backend update error, falling back to local', e);
        // Fall through to local update
      }
    }
    
    // Local update (always as fallback or when backend disabled)
    const next = archive.map(d=> d.id===id ? { ...d, status } : d);
    setArchive(next);
    await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(next));
  }

  async function updateStatusByNumber(number, status, shareUrl, at){
    if (!number) return;
    const now = at || new Date().toISOString();
    
    try {
      // Update in backend if enabled
      if (USE_BACKEND_API && user?.id) {
        const doc = archive.find(d => d.number === number);
        if (doc) {
          const patch = { status };
          if (shareUrl) patch.share_url = shareUrl;
          if (status === 'Verzonden') patch.sent_at = now;
          
          await api.updateDocument(doc.id, patch);
          const docs = await api.listDocuments();
          setArchive(docs);
          await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(docs));
          return;
        }
      }
      
      // Local update
      const next = archive.map(d=> d.number===number ? { 
        ...d, 
        status: status||d.status, 
        shareUrl: shareUrl??d.shareUrl, 
        sentAt: status==='Verzonden' ? now : d.sentAt 
      } : d);
      setArchive(next);
      await AsyncStorage.setItem(STORAGE.archive, JSON.stringify(next));
    } catch(e){ 
      console.log('updateStatusByNumber error', e);
    }
  }

  const isInArchive = (number) => archive.some(d => d.number === number);

  /**
   * Refresh products from backend
   */
  const refreshProducts = useCallback(async () => {
    if (!USE_BACKEND_API || !user) return;
    try {
      const data = await api.getProducts({ active: true });
      setProducts(data.products || []);
    } catch (e) {
      console.error('Failed to refresh products:', e);
    }
  }, [user]);

  /**
   * Refresh product categories from backend
   */
  const refreshProductCategories = useCallback(async () => {
    if (!USE_BACKEND_API || !user) return;
    try {
      const data = await api.getProductCategories();
      setProductCategories(data.categories || []);
    } catch (e) {
      console.error('Failed to refresh categories:', e);
    }
  }, [user]);

  // Load products on mount if user is logged in
  useEffect(() => {
    if (user && !booting) {
      refreshProducts();
      refreshProductCategories();
    }
  }, [user, booting, refreshProducts, refreshProductCategories]);

  return (
    <OffertoContext.Provider value={{
      booting, user, isLoading,
      company, setCompany,
      klant, setKlant,
      onderdelen, addOnderdeel, removeOnderdeel,
      totals, docType, setDocType, docNummer, setDocNummer, docDatum, setDocDatum,
      signRequested, setSignRequested,
      archive, saveToArchive, updateStatus, updateStatusByNumber,
      signUp, signIn, signOutAll,
      regenerateNumberFor,
      statusFilter, setStatusFilter,
      reminderPrefs, setReminderPrefs,
      signatureData, setSignatureData, isInArchive,
      products, refreshProducts,
      productCategories, refreshProductCategories,
    }}>
      {children}
    </OffertoContext.Provider>
  );
}
