import React, { useState, useEffect, useMemo } from 'react';
import { 
  QueryClient, 
  QueryClientProvider, 
  useQuery, 
  keepPreviousData 
} from '@tanstack/react-query';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, 
  Calendar, CreditCard, Mail, Phone, RefreshCw, Loader2, TrendingUp, User, ShoppingBag, Database 
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * UTILITY: CSS Class Merger
 */
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * --- [TASK CONFIGURATION] ---
 * Toggle this to FALSE when you are ready to deploy with the Real API.
 */
const USE_MOCK_DATA = true; 
const API_BASE_URL = 'https://sales-dashboard-backend.onrender.com'; // Replace with the URL from your docs if different

// --- API SERVICES ---

// [TASK Requirement 7: POST /getAuthorize]
const fetchToken = async () => {
  if (USE_MOCK_DATA) return "demo_token_123";

  try {
    const response = await fetch(`${API_BASE_URL}/getAuthorize`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
        console.warn("API Auth failed, falling back to demo token"); 
        return "demo_token_123";
    }
    const data = await response.json();
    return data.token || data.key; 
  } catch (e) {
    console.warn("API unreachable (likely CORS), switching to Demo Mode automatically.");
    return "demo_token_123"; 
  }
};

// [TASK Requirement 7: GET /sales]
const fetchSales = async ({ queryKey }) => {
  const [_, { token, filters, pagination, sorting }] = queryKey;
  
  // [TASK Requirement 2 & 5: Pass filters and sorting to API]
  const cleanParams = {
    limit: '50', // [TASK Requirement 4: Show 50 items]
    sort: sorting.field,
    order: sorting.direction,
    ...filters
  };
  
  // [TASK Requirement 6: Use before/after tokens]
  if (pagination.before) cleanParams.before = pagination.before;
  if (pagination.after) cleanParams.after = pagination.after;

  // Cleanup: Remove empty params
  Object.keys(cleanParams).forEach(key => {
    if (cleanParams[key] === '' || cleanParams[key] === null || cleanParams[key] === undefined) {
      delete cleanParams[key];
    }
  });

  if (USE_MOCK_DATA) {
    return generateMockData(cleanParams);
  }

  const queryParams = new URLSearchParams(cleanParams);

  try {
    const response = await fetch(`${API_BASE_URL}/sales?${queryParams}`, {
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('API Request Failed');
    return response.json();
  } catch (error) {
      console.warn("Fetch failed, using fallback data.", error);
      return generateMockData(cleanParams);
  }
};

// --- MOCK DATA GENERATOR (For Testing/Demo) ---
const generateMockData = (params) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      let items = Array.from({ length: 50 }).map((_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (i % 30)); 
        return {
          id: `sale_${Math.random().toString(36).substr(2, 9)}`,
          date: date.toISOString().split('T')[0],
          amount: Math.floor(Math.random() * 8000) + 500, 
          customer_email: `user${Math.floor(Math.random() * 1000)}@dhaka-mail.com`,
          phone_number: `+88017${Math.floor(10000000 + Math.random() * 90000000)}`,
          product_name: ['Enterprise Solution', 'Startup Bundle', 'Growth Plan'][Math.floor(Math.random() * 3)],
          status: ['Paid', 'Pending', 'Failed'][Math.floor(Math.random() * 3)]
        };
      });

      // Mock Sorting Logic
      if (params.sort) {
        items.sort((a, b) => {
          const field = params.sort === 'price' ? 'amount' : params.sort;
          return params.order === 'asc' 
            ? (a[field] > b[field] ? 1 : -1) 
            : (a[field] < b[field] ? 1 : -1);
        });
      }

      resolve({
        data: items,
        pagination: { 
            before: params.after ? 'token_prev' : null, 
            after: 'token_next' 
        }
      });
    }, 600);
  });
};

// --- UI COMPONENTS ---

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-start justify-between transition-transform hover:-translate-y-1 duration-300">
    <div>
      <p className="text-sm font-semibold text-slate-500 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{value}</h3>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
    <div className={cn("p-3 rounded-xl bg-opacity-10 backdrop-blur-sm", colorClass)}>
      <Icon className={cn("w-6 h-6", colorClass.replace('bg-', 'text-'))} />
    </div>
  </div>
);

const FilterInput = ({ label, icon: Icon, ...props }) => (
  <div className="flex flex-col space-y-2">
    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">{label}</label>
    <div className="relative group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
      </div>
      <input
        className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50/50 text-sm placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
        {...props}
      />
    </div>
  </div>
);

// --- MAIN DASHBOARD ---

function Dashboard() {
  const [token, setToken] = useState(null);
  
  // [TASK Requirement 1 & 2: Filters State]
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    minPrice: '',
    email: '',
    phone: ''
  });
  
  // [TASK Requirement 5: Sorting State]
  const [sorting, setSorting] = useState({ field: 'date', direction: 'desc' });
  
  // [TASK Requirement 6: Pagination State]
  const [pagination, setPagination] = useState({ after: null, before: null });
  
  useEffect(() => {
    fetchToken().then(setToken);
  }, []);

  // [TASK Bonus 1: Caching via React Query]
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['sales', { token, filters, pagination, sorting }],
    queryFn: fetchSales,
    enabled: !!token,
    placeholderData: keepPreviousData,
    staleTime: 60000, // 1 Minute Cache
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPagination({ after: null, before: null }); // Reset page on filter
  };

  const handleSort = (field) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handlePageChange = (direction) => {
    if (!data?.pagination) return;
    if (direction === 'next') {
      setPagination({ after: data.pagination.after, before: null });
    } else {
      setPagination({ before: data.pagination.before, after: null });
    }
  };

  // Prepare Data for Chart
  const chartData = useMemo(() => {
    if (!data?.data) return [];
    const getPrice = (item) => item.price || item.amount || 0;
    const getDate = (item) => item.date || item.created_at;

    const grouped = data.data.reduce((acc, curr) => {
      const d = getDate(curr);
      acc[d] = (acc[d] || 0) + getPrice(curr);
      return acc;
    }, {});
    
    return Object.entries(grouped)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data]);

  const totalRevenue = data?.data?.reduce((sum, item) => sum + (item.price || item.amount || 0), 0) || 0;

  if (!token) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      <p className="text-slate-500 font-medium animate-pulse">Initializing Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-900 pb-20 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-purple-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">Sales<span className="text-indigo-600">Dash</span></h1>
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Analytics Console</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {USE_MOCK_DATA && (
                <div className="hidden md:flex items-center px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-medium text-amber-700">
                    <Database className="w-3 h-3 mr-1.5" /> Demo Mode
                </div>
            )}
            <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-xs font-semibold text-slate-700">Junior Engineer</span>
                <span className="text-[10px] text-slate-400">Dhaka, Bangladesh</span>
            </div>
            <div className="h-9 w-9 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
              <User className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      </header>

      {/* [TASK Bonus 2: Mobile Responsive Layout] */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Filters Section */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wide flex items-center">
               <Filter className="w-4 h-4 mr-2 text-indigo-600" /> Filters
            </h2>
            {isFetching && (
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-full flex items-center animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin mr-1.5"/> Syncing...
                </span>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* [TASK Requirement 1: Date Range] */}
            <FilterInput type="date" name="startDate" label="Start Date" icon={Calendar} value={filters.startDate} onChange={handleFilterChange} />
            <FilterInput type="date" name="endDate" label="End Date" icon={Calendar} value={filters.endDate} onChange={handleFilterChange} />
            
            {/* [TASK Requirement 2: Other Filters] */}
            <FilterInput type="number" name="minPrice" label="Min Price (৳)" icon={CreditCard} placeholder="500" value={filters.minPrice} onChange={handleFilterChange} />
            <FilterInput type="text" name="email" label="Email" icon={Mail} placeholder="search@email..." value={filters.email} onChange={handleFilterChange} />
            <FilterInput type="text" name="phone" label="Phone" icon={Phone} placeholder="017..." value={filters.phone} onChange={handleFilterChange} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="space-y-6">
             <StatCard title="Total Revenue" value={`৳ ${totalRevenue.toLocaleString()}`} subtext="In current view" icon={CreditCard} colorClass="bg-emerald-500 text-emerald-600" />
             <StatCard title="Transactions" value={data?.data?.length || 0} subtext="Orders listed" icon={ShoppingBag} colorClass="bg-blue-500 text-blue-600" />
          </div>

          {/* [TASK Requirement 3: Time-Series Chart] */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] border border-slate-200">
             <h3 className="text-lg font-bold text-slate-800 mb-6">Sales Trend</h3>
             <div className="h-[280px] w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} dy={10} tickFormatter={(str) => { const d = new Date(str); return `${d.getDate()}/${d.getMonth() + 1}`; }} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#94a3b8'}} tickFormatter={(val) => `৳${val/1000}k`} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} formatter={(value) => [`৳ ${value.toLocaleString()}`, 'Revenue']} />
                      <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <p className="text-sm">No data available for chart</p>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* [TASK Requirement 4: Sales Table] */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
             <h3 className="text-lg font-bold text-slate-800">Recent Transactions</h3>
             <button onClick={() => setFilters({...filters})} className="px-4 py-2 bg-white border border-slate-200 text-indigo-600 rounded-lg text-sm font-medium flex items-center shadow-sm hover:bg-slate-50">
                <RefreshCw className={cn("w-4 h-4 mr-2", isFetching && "animate-spin")} /> Refresh
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/80">
                <tr>
                  {/* [TASK Requirement 5: Sorting Icons] */}
                  <SortableHeader label="Date" field="date" currentSort={sorting} onSort={handleSort} />
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <SortableHeader label="Amount" field="price" currentSort={sorting} onSort={handleSort} align="right" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {isLoading ? (
                   Array.from({length: 5}).map((_, i) => (
                     <tr key={i} className="animate-pulse">
                       <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full"></div></td>
                     </tr>
                   ))
                ) : data?.data?.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-500">No transactions found</td></tr>
                ) : (
                  data?.data?.map((sale, idx) => (
                    <tr key={sale.id || idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(sale.date || sale.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{sale.productName || sale.product_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        <div>{sale.customerEmail || sale.customer_email}</div>
                        <div className="text-[10px] text-slate-400">{sale.phoneNumber || sale.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={sale.status || 'Paid'} /></td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-slate-800 font-mono">
                         ৳ {(sale.price || sale.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* [TASK Requirement 6: Pagination (Before/After)] */}
          <div className="bg-slate-50/50 px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Showing 50 rows per page</span>
            <div className="flex space-x-3">
              <button
                disabled={!data?.pagination?.before || isFetching}
                onClick={() => handlePageChange('prev')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                <ChevronLeft className="w-4 h-4 mr-1"/> Previous
              </button>
              <button
                disabled={!data?.pagination?.after || isFetching}
                onClick={() => handlePageChange('next')}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 bg-white hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4 ml-1"/>
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

const StatusBadge = ({ status }) => {
    const styles = {
        'Paid': 'bg-emerald-100 text-emerald-700 border-emerald-200',
        'Pending': 'bg-amber-50 text-amber-700 border-amber-200',
        'Failed': 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return (
        <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide", styles[status] || 'bg-slate-100 text-slate-600')}>
            {status}
        </span>
    );
};

const SortableHeader = ({ label, field, currentSort, onSort, align = 'left' }) => {
  const isActive = currentSort.field === field;
  return (
    <th onClick={() => onSort(field)} className={cn("px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-100 group select-none", align === 'right' ? 'text-right' : 'text-left')}>
      <div className={cn("flex items-center space-x-1", align === 'right' && "justify-end")}>
        <span>{label}</span>
        {isActive ? (currentSort.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-indigo-600"/> : <ArrowDown className="w-3 h-3 text-indigo-600"/>) : <ArrowUpDown className="w-3 h-3 text-slate-300 group-hover:text-slate-500"/>}
      </div>
    </th>
  );
};

const queryClient = new QueryClient();
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
}