import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './MuzepartSearchPage.css';

// Simple health check fallback
const checkBackendHealth = async () => {
  try {
    const res = await fetch('http://localhost:8000/');
    return res.ok;
  } catch {
    return false;
  }
};

interface ComponentPart {
  id: string;
  mpn: string;
  manufacturer: string;
  distributor: string;
  source_type: string;
  stock: number;
  price: number;
  price_history: number[];
  basePrice?: number;
  currency: string;
  delivery: string;
  condition: string;
  date_code: string;
  is_eol: boolean;
  risk_level: string;
  is_qc_enabled?: boolean;
  datasheet?: string;
  description?: string;
  product_url?: string;
}

interface MarketStats {
  market_temperature: string;
  global_stock_index: number;
  active_brokers: number;
  price_drift: number;
  last_sync: string;
  recent_logs: string[];
}

type JourneyPhase = 'IDLE' | 'SCOUTING' | 'RESULTS';

const QC_PRICE = 72500;

const SearchPlatform: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [phase, setPhase] = useState<JourneyPhase>('IDLE');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ComponentPart[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<ComponentPart | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [marketStats, setMarketStats] = useState<MarketStats | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // --- New: View, Sort, Filter, Pagination State ---
  type ViewMode = 'grid' | 'table';
  type SortField = 'price' | 'stock' | 'distributor' | 'none';
  type SortOrder = 'asc' | 'desc';

  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterInStock, setFilterInStock] = useState(false);
  const [filterDistributor, setFilterDistributor] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Derived: Filtered & Sorted Results ---
  const processedResults = React.useMemo(() => {
    let filtered = [...results];
    
    // Filter: In Stock Only
    if (filterInStock) {
      filtered = filtered.filter(p => p.stock > 0);
    }
    
    // Filter: By Distributor
    if (filterDistributor !== 'all') {
      filtered = filtered.filter(p => 
        p.distributor.toLowerCase().includes(filterDistributor.toLowerCase())
      );
    }
    
    // Sort
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'stock':
            comparison = a.stock - b.stock;
            break;
          case 'distributor':
            comparison = a.distributor.localeCompare(b.distributor);
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    return filtered;
  }, [results, filterInStock, filterDistributor, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedResults.length / itemsPerPage);
  const paginatedResults = processedResults.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Get unique distributors for filter dropdown
  const uniqueDistributors = React.useMemo(() => {
    return [...new Set(results.map(r => r.distributor))];
  }, [results]);

  // Handle sort click
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Reset filters when new search
  const resetFilters = () => {
    setFilterInStock(false);
    setFilterDistributor('all');
    setSortField('none');
    setCurrentPage(1);
  };

  // Check for query parameter on mount
  useEffect(() => {
    const urlQuery = searchParams.get('q');
    if (urlQuery) {
      setQuery(urlQuery);
      handleSearch(undefined, urlQuery);
    }
  }, [searchParams]);

  // --- Logic ---
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/market/stats');
        if (!res.ok) throw new Error('API 연결 실패');
        const data = await res.json();
        setIsBackendConnected(true);
        setConnectionError(null);
        setMarketStats(data);
        if (data.recent_logs) {
          setLogs(prev => [...prev.slice(-10), ...data.recent_logs]);
        }
      } catch (err: any) {
        setIsBackendConnected(false);
        setConnectionError(err.message);
      }
    };
    
    fetchStats();
    
    const loadHistory = () => {
        const localHist = localStorage.getItem('search_history');
        if (localHist) {
            setHistory(JSON.parse(localHist));
        }
    };
    loadHistory();

    const interval = setInterval(fetchStats, 10000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSearch = async (e?: React.FormEvent, historicalQuery?: string) => {
    if (e) e.preventDefault();
    const targetQuery = historicalQuery || query;
    if (!targetQuery.trim()) return;

    setPhase('SCOUTING');
    setError(null);
    setLogs([]); 
    
    setLogs(["[BOOT] Initializing Intel Engine...", "[OSINT] Checking Global Broker Manifests...", "[SCANNING] Secondary Market Clusters..."]);

    const newHistory = [targetQuery, ...history.filter(h => h !== targetQuery)].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('search_history', JSON.stringify(newHistory));

    try {
      const [response] = await Promise.all([
        fetch(`http://localhost:8000/api/parts/search?q=${encodeURIComponent(targetQuery)}`),
        new Promise(resolve => setTimeout(resolve, 2500)) 
      ]);
      
      if (!response.ok) throw new Error('System link failure');
      const data: ComponentPart[] = await response.json();
      
      setResults(data.map(item => ({ ...item, basePrice: item.price, is_qc_enabled: false })));
      resetFilters(); // Reset filters on new search
      if (!history.includes(targetQuery)) setHistory(prev => [targetQuery, ...prev].slice(0, 5));
      setPhase('RESULTS');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown System Error');
      setPhase('IDLE');
    }
  };

  const toggleQC = (id: string, current: boolean) => {
    setResults(prev => prev.map(item => {
      if (item.id === id) {
        const newState = !current;
        return {
          ...item,
          is_qc_enabled: newState,
          price: newState ? (item.basePrice || item.price) + QC_PRICE : (item.basePrice || item.price)
        };
      }
      return item;
    }));
  };

  // --- Smart Link Reconstruction ---
  const getDistributorUrl = (part: ComponentPart) => {
    if (part.product_url) return part.product_url;
    
    // Fallback logic based on distributor name
    const q = part.mpn;
    const dist = part.distributor.toLowerCase();
    
    if (dist.includes('mouser')) return `https://www.mouser.kr/Search/Refine?Keyword=${q}`;
    if (dist.includes('digi-key')) return `https://www.digikey.kr/en/products/result?keywords=${q}`;
    if (dist.includes('win source')) return `https://www.win-source.net/search?q=${q}`;
    if (dist.includes('rochester')) return `https://www.rocelec.com/search?q=${q}`;
    if (dist.includes('flip')) return `https://www.flipelectronics.com/search?q=${q}`;
    
    return `https://www.google.com/search?q=${part.distributor}+${q}`;
  };

  const handleLock = async (part: ComponentPart) => {
    setSelectedPart(part);
    // Optimistic UI update or separate loading state could be added here
    const btnId = `btn-lock-${part.id}`;
    const btn = document.getElementById(btnId);
    if (btn) {
        btn.innerText = "Processing...";
        btn.style.opacity = '0.7';
        btn.style.pointerEvents = 'none';
    }

    try {
      const response = await fetch('http://localhost:8000/procurement/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ part_id: part.id, quantity: 1 })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Simulate processing delay for UX "weight"
        setTimeout(() => {
            setTrackingId(data.tracking_id);
            setShowSuccess(true);
            if (btn) {
                btn.innerText = "LOCKED";
                btn.style.background = 'var(--text-main)';
            }
        }, 800);
      }
    } catch (err) {
      alert("Security protocol violation during lock sequence.");
      if (btn) {
          btn.innerText = "RETRY LOCK";
          btn.style.opacity = '1';
          btn.style.pointerEvents = 'auto';
      }
    }
  };

  const renderSidebar = () => (
    <aside className="sidebar-integrated">
      <nav>
        <div className="nav-section-title">Mission History</div>
        <div className="filter-group">
          {history.length === 0 ? (
            <div style={{ padding: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>No recent missions</div>
          ) : (
            history.map((h, idx) => (
              <div key={`${h}-${idx}`} className="filter-item-light" onClick={() => handleSearch(undefined, h)}>
                🛰️ {h.toUpperCase()}
              </div>
            ))
          )}
        </div>
      </nav>

      <nav>
        <div className="nav-section-title">Market Intel</div>
        <div className="filter-group">
          <div className="filter-item-light active">Global Inventory</div>
          <div className="filter-item-light">EOL Risk Map</div>
          <div className="filter-item-light">Price Volatility</div>
        </div>
      </nav>

      {marketStats && (
        <div className="sidebar-stats-box">
          <div className="stats-label">GLOBAL INDEX</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <span>Stock</span>
            <span style={{ fontWeight: 'bold' }}>{marketStats.global_stock_index.toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Brokers</span>
            <span style={{ fontWeight: 'bold' }}>{marketStats.active_brokers} Active</span>
          </div>
        </div>
      )}
    </aside>
  );

  const handleRetryConnection = async () => {
    setConnectionError(null);
    const isHealthy = await checkBackendHealth();
    setIsBackendConnected(isHealthy);
    if (!isHealthy) {
      setConnectionError('서버에 연결할 수 없습니다. 백엔드 서버가 실행 중인지 확인하세요.');
    }
  };

  const renderConnectionBanner = () => !isBackendConnected && (
    <div className="connection-error-banner">
      <span className="error-icon">⚠️</span>
      <span className="error-message">{connectionError || '백엔드 서버에 연결할 수 없습니다'}</span>
      <button className="retry-btn" onClick={handleRetryConnection}>
        🔄 재시도
      </button>
    </div>
  );

  const renderHeader = () => (
    <div className="results-top-strip">
       <div className="stats-badges">
          <div className="stat-pill">
            <span className="label">MARKET STATUS:</span>
            <span className={`value ${marketStats?.market_temperature === 'CRITICAL' ? 'danger' : 'success'}`}>
              {marketStats?.market_temperature || 'SCANNING...'}
            </span>
          </div>
          <div className="stat-pill">
            <span className="label">PRICE DRIFT:</span>
            <span className={`value ${(marketStats?.price_drift || 0) > 0 ? 'warning' : 'success'}`}>
              {marketStats?.price_drift || 0}%
            </span>
          </div>
       </div>
       <div className="terminal-compact">
          {logs.slice(-1).map((log, i) => (
            <div key={i} className="log-line">{log}</div>
          ))}
       </div>
    </div>
  );

  const renderScouting = () => (
    <div className="scout-container">
      <div className="radar-premium" />
      <h2 style={{ fontSize: '1.5rem', fontWeight: 300, color: 'var(--text-main)', marginBottom: '1rem' }}>CONNECTING TO GLOBAL DISTRIBUTORS</h2>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Scanning Digi-Key, Mouser, and 12 Asia Verified Brokers...</div>
      
      <div className="terminal-feed" ref={logContainerRef}>
        {logs.map((log, i) => (
        <div key={i} style={{ color: '#10b981', opacity: 0.8, marginBottom: '0.2rem' }}>
            {log}
        </div>
        ))}
      </div>
    </div>
  );

  const getDistributorBadgeClass = (name: string) => {
    if (name.toLowerCase().includes('mouser')) return 'dist-mouser';
    if (name.toLowerCase().includes('digi-key')) return 'dist-digikey';
    if (name.toLowerCase().includes('eol') || name.toLowerCase().includes('rochester') || name.toLowerCase().includes('flip')) return 'dist-eol';
    return 'dist-general';
  };

  const renderResults = () => {
    // Helper: Get stock class
    const getStockClass = (stock: number) => {
      if (stock === 0) return 'out-of-stock';
      if (stock < 100) return 'low-stock';
      return 'in-stock';
    };

    // Helper: Get sort class for table header
    const getSortClass = (field: SortField) => {
      if (sortField !== field) return 'sortable';
      return sortOrder === 'asc' ? 'sortable sorted-asc' : 'sortable sorted-desc';
    };

    // Render: Controls Bar
    const renderControls = () => (
      <div className="results-controls">
        <div className="results-meta">
          <span className="results-count">
            <strong>{processedResults.length}</strong> results found
            {filterInStock && ' (in stock only)'}
          </span>
          <div className="view-toggle">
            <button 
              className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              ☰ Table
            </button>
            <button 
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⊞ Grid
            </button>
          </div>
        </div>
        
        <div className="filter-controls">
          <label className={`filter-checkbox ${filterInStock ? 'active' : ''}`}>
            <input 
              type="checkbox" 
              checked={filterInStock} 
              onChange={(e) => { setFilterInStock(e.target.checked); setCurrentPage(1); }}
            />
            In Stock Only
          </label>
          
          <select 
            className="filter-select" 
            value={filterDistributor}
            onChange={(e) => { setFilterDistributor(e.target.value); setCurrentPage(1); }}
          >
            <option value="all">All Distributors</option>
            {uniqueDistributors.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select 
            className="filter-select" 
            value={sortField === 'none' ? '' : `${sortField}-${sortOrder}`}
            onChange={(e) => {
              if (!e.target.value) {
                setSortField('none');
              } else {
                const [field, order] = e.target.value.split('-') as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }
              setCurrentPage(1);
            }}
          >
            <option value="">Sort By...</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-desc">Stock: High to Low</option>
            <option value="stock-asc">Stock: Low to High</option>
          </select>
        </div>
      </div>
    );

    // Render: Table View
    const renderTableView = () => (
      <div className="results-table-container">
        <table className="results-table">
          <thead>
            <tr>
              <th className={getSortClass('distributor')} onClick={() => handleSort('distributor')}>Distributor</th>
              <th>MPN / Manufacturer</th>
              <th className={getSortClass('stock')} onClick={() => handleSort('stock')}>Stock</th>
              <th className={getSortClass('price')} onClick={() => handleSort('price')}>Unit Price</th>
              <th>Lead Time</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedResults.map(part => {
              const badgeClass = getDistributorBadgeClass(part.distributor);
              return (
                <tr key={`${part.id}-${part.distributor}`}>
                  <td className="dist-cell">
                    <span className={`distributor-badge ${badgeClass}`}>{part.distributor}</span>
                  </td>
                  <td>
                    <div className="mpn-cell" onClick={() => navigate(`/part/${part.mpn}`)}>{part.mpn}</div>
                    <div className="mfr-cell">{part.manufacturer}</div>
                  </td>
                  <td className={`stock-cell ${getStockClass(part.stock)}`}>
                    {part.stock > 0 ? part.stock.toLocaleString() : 'Check'}
                  </td>
                  <td className="price-cell">
                    {part.price > 0 
                      ? `${part.price.toLocaleString()} ${part.currency}`
                      : 'Quote'}
                  </td>
                  <td>{part.delivery}</td>
                  <td className="actions-cell">
                    {part.datasheet && (
                      <button 
                        className="btn-table-action"
                        onClick={() => window.open(part.datasheet, '_blank')}
                      >📄</button>
                    )}
                    
                    <button 
                      className="btn-table-action"
                      onClick={() => window.open(getDistributorUrl(part), '_blank')}
                    >🛒</button>
                    
                    <button 
                      className="btn-table-action primary"
                      id={`btn-lock-${part.id}`}
                      onClick={() => handleLock(part)}
                    >LOCK</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );

    // Render: Grid View (Original Cards)
    const renderGridView = () => (
      <div className="results-grid">
        {paginatedResults.map(part => {
          const badgeClass = getDistributorBadgeClass(part.distributor);
          const hasDatasheet = !!part.datasheet;
          const isOfficial = part.source_type === 'Official API';

          return (
            <div key={`${part.id}-${part.distributor}`} className="card">
              <div className="card-header">
                <div>
                  <span className={`distributor-badge ${badgeClass}`}>{part.distributor}</span>
                  <div className="mpn">{part.mpn}</div>
                  <div className="manufacturer">{part.manufacturer}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   {part.stock > 0 ? (
                      <span className="stock-badge">{part.stock.toLocaleString()} UNITS</span>
                   ) : (
                      <span className="stock-badge" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }}>CHECK STOCK</span>
                   )}
                </div>
              </div>

              <table className="data-table">
                <tbody>
                  <tr><td className="label-cell">Source Type</td><td className="value-cell">{part.source_type}</td></tr>
                  <tr><td className="label-cell">Risk Assessment</td><td className={`value-cell badge-risk-${part.risk_level.toLowerCase()}`}>{part.risk_level}</td></tr>
                  <tr><td className="label-cell">Lead Time</td><td className="value-cell">{part.delivery}</td></tr>
                  <tr><td className="label-cell">Description</td><td className="value-cell" style={{ fontSize: '0.8rem', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{part.description}</td></tr>
                </tbody>
              </table>

              {!isOfficial && (part.risk_level === 'Medium' || part.risk_level === 'High') && (
                <div style={{ border: '1px dashed var(--success)', padding: '0.75rem', borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>QC Protocol +₩72,500</span>
                  <input type="checkbox" checked={part.is_qc_enabled} onChange={() => toggleQC(part.id, !!part.is_qc_enabled)} />
                </div>
              )}

              <div className="pricing-row" style={{ flexDirection: 'column', gap: '1rem', alignItems: 'stretch' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  {part.price > 0 ? (
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>UNIT PRICE</div>
                      <div className="price-main">
                        {part.price.toLocaleString()}<span className="currency">{part.currency}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="price-main" style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
                       {part.source_type === 'Deep Link' ? 'Market Price' : 'Quote Only'}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {hasDatasheet && (
                        <button 
                            className="btn-secondary-sm"
                            onClick={() => window.open(part.datasheet, '_blank')}
                            title="View Datasheet"
                        >
                            📄 PDF
                        </button>
                    )}
                    {hasDatasheet && (
                        <button 
                            className="btn-secondary-sm"
                            onClick={() => window.open(part.datasheet, '_blank')}
                            title="View Datasheet"
                        >
                            📄 PDF
                        </button>
                    )}
                    
                    <button 
                        className="btn-secondary-sm"
                        onClick={() => window.open(getDistributorUrl(part), '_blank')}
                        title="Visit Distributor Website to Purchase"
                    >
                        🛒 BUY AT SITE ↗
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {isOfficial && (
                        <button 
                            className="buy-btn" 
                            id={`btn-lock-${part.id}`}
                            onClick={() => handleLock(part)} 
                            style={{ flex: 1, padding: '0.75rem' }}
                        >
                            RESERVE & PROCURE 🛡️
                        </button>
                    )}
                    {!isOfficial && (
                        <button 
                            className="buy-btn" 
                            id={`btn-lock-${part.id}`}
                            style={{ flex: 1, background: 'var(--bg-sidebar)', color: 'white', padding: '0.75rem' }} 
                            onClick={() => handleLock(part)}
                        >
                            INSTANT LOCK
                        </button>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );

    // Render: Pagination
    const renderPagination = () => {
      if (totalPages <= 1) return null;

      const pages: (number | string)[] = [];
      for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
          pages.push(i);
        } else if (pages[pages.length - 1] !== '...') {
          pages.push('...');
        }
      }

      return (
        <div className="pagination">
          <button 
            className="page-btn" 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >←</button>
          
          {pages.map((page, idx) => 
            page === '...' ? (
              <span key={idx} className="page-dots">...</span>
            ) : (
              <button 
                key={idx}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page as number)}
              >{page}</button>
            )
          )}
          
          <button 
            className="page-btn" 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >→</button>
        </div>
      );
    };

    // Empty state
    if (processedResults.length === 0 && results.length > 0) {
      return (
        <div className="container fade-in">
          {renderControls()}
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No results match your filters</h3>
            <p>Try adjusting your filter settings</p>
            <button className="btn-primary" onClick={resetFilters} style={{ marginTop: '1rem' }}>
              Clear Filters
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="container fade-in">
        {renderControls()}
        {viewMode === 'table' ? renderTableView() : renderGridView()}
        {renderPagination()}
      </div>
    );
  };

  const renderSuccessModal = () => (
    <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
      <div className="modal">
        <div className="status-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>INVENTORY SECURED</h2>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>TRACKING INTEL ID</div>
          <div style={{ fontStyle: 'mono', color: 'var(--accent)', fontWeight: 'bold' }}>{trackingId}</div>
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.6' }}>
          Procurement lock initiated for MPN: <strong>{selectedPart?.mpn}</strong>.<br/>
          Shipment authorization is pending financial clearance.
        </p>
        <button className="buy-btn" onClick={() => { setShowSuccess(false); setPhase('IDLE'); }}>
          RETURN TO COMMAND CENTER
        </button>
      </div>
    </div>
  );

  return (
    <div className="search-platform-v2">
        {renderConnectionBanner()}
        {renderHeader()}
        <div className="results-layout">
            {renderSidebar()}
            <div className="results-container">
                {error && <div className="error-message" style={{ color: 'var(--danger)', textAlign: 'center', padding: '2rem' }}>[SYSTEM ERROR] {error}</div>}
                {phase === 'SCOUTING' && renderScouting()}
                {phase === 'RESULTS' && renderResults()}
                {phase === 'IDLE' && (
                  <div className="idle-state">
                    <h2>Ready to Scout</h2>
                    <p>Enter a part number in the top search bar to begin global intelligence mapping.</p>
                  </div>
                )}
            </div>
        </div>

      {showSuccess && renderSuccessModal()}
    </div>
  );
};

export { SearchPlatform as MuzepartSearchPage };
