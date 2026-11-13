import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ChevronDown, Filter, LogOut, RefreshCw, Search, SlidersHorizontal, TrendingUp } from "lucide-react";

const initialFilters = { search: "", sector: "", minPrice: "", maxPrice: "", minMarketCap: "", maxPeRatio: "", minChange: "" };
const formatMoney = (value) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(value);
const formatCap = (value) => value >= 1e12 ? `$${(value / 1e12).toFixed(2)}T` : `$${(value / 1e9).toFixed(1)}B`;
const formatVolume = (value) => value >= 1e6 ? `${(value / 1e6).toFixed(1)}M` : value.toLocaleString();

function StatCard({ icon: Icon, label, value, helper, accent }) {
  return <div className="stat-card"><div className={`stat-icon ${accent}`}><Icon size={18} /></div><div><p>{label}</p><strong>{value}</strong><span>{helper}</span></div></div>;
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(new Date());

  useEffect(() => { const timer = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(timer); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const response = await axios.post(endpoint, form);
      localStorage.setItem("marketpulse_token", response.data.token);
      onAuthenticated(response.data.user, response.data.token);
    } catch (err) { setError(err.response?.data?.message || "Unable to connect to the authentication server."); }
    finally { setBusy(false); }
  };
  return <div className="auth-page">
    <div className="auth-glow"></div>
    <div className="auth-brand"><div className="brand-mark"><TrendingUp size={21} /></div><div><strong>MarketPulse</strong><span>Stock intelligence</span></div></div>
    <div className="auth-layout">
      <section className="auth-intro"><p className="eyebrow">YOUR PERSONAL MARKET DESK</p><h1>Make every market move <em>more intentional.</em></h1><p>Sign in to access your private stock screener, discover opportunities, and build a better investing workflow.</p><div className="date-card"><span>Today</span><strong>{now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</strong><small>{now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</small></div></section>
      <section className="auth-card"><div className="auth-tabs"><button className={mode === "login" ? "selected" : ""} onClick={() => { setMode("login"); setError(""); }}>Log in</button><button className={mode === "register" ? "selected" : ""} onClick={() => { setMode("register"); setError(""); }}>Create account</button></div><div className="auth-title"><p className="eyebrow">{mode === "login" ? "WELCOME BACK" : "START YOUR JOURNEY"}</p><h2>{mode === "login" ? "Sign in to your dashboard" : "Create your account"}</h2><p>{mode === "login" ? "Use your email and password to continue." : "Your market workspace is only a minute away."}</p></div>
        <form onSubmit={submit}>{mode === "register" && <label>Full name<input required minLength="2" placeholder="Alex Morgan" value={form.name} onChange={(e) => update("name", e.target.value)} /></label>}<label>Email address<input required type="email" placeholder="you@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} /></label><label>Password<input required minLength="8" type="password" placeholder="At least 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} /></label>{error && <div className="auth-error">{error}</div>}<button className="auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Enter dashboard" : "Create account"}<ArrowUpRight size={16} /></button></form><p className="auth-note">By continuing, you agree to use this development application responsibly. Never share your password.</p></section>
    </div>
  </div>;
}

function Dashboard({ user, token, onLogout }) {
  const [stocks, setStocks] = useState([]); const [summary, setSummary] = useState(null); const [sectors, setSectors] = useState([]); const [filters, setFilters] = useState(initialFilters); const [sortBy, setSortBy] = useState("marketCap"); const [order, setOrder] = useState("desc"); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const queryString = useMemo(() => { const params = new URLSearchParams({ sortBy, order }); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); }); return params.toString(); }, [filters, sortBy, order]);
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };
  const loadData = async () => { setLoading(true); setError(""); try { const [stockResponse, summaryResponse, sectorResponse] = await Promise.all([axios.get(`/api/stocks?${queryString}`, authConfig), axios.get("/api/stocks/summary", authConfig), axios.get("/api/stocks/sectors", authConfig)]); setStocks(stockResponse.data.data); setSummary(summaryResponse.data); setSectors(sectorResponse.data); } catch (err) { if (err.response?.status === 401) onLogout(); else setError("Could not reach the protected API. Make sure the backend is running."); } finally { setLoading(false); } };
  useEffect(() => { loadData(); }, [queryString, token]);
  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value })); const resetFilters = () => setFilters(initialFilters); const gainers = stocks.filter((stock) => stock.changePercent > 0).length;

  return <div className="app-shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><TrendingUp size={21} /></div><div><strong>MarketPulse</strong><span>Stock intelligence</span></div></div><nav><a className="active"><BarChart3 size={18} />Overview</a><a><Activity size={18} />Market scanner</a><a><SlidersHorizontal size={18} />Saved screens</a></nav><div className="sidebar-bottom"><div className="live-dot"><span></span>Private workspace</div><p>Sample market data is ready while you build your live data integration.</p></div></aside><main className="main-content"><header className="topbar"><div><p className="eyebrow">MARKET OVERVIEW <span>•</span> {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" }).toUpperCase()}</p><h1>Good to see you, <em>{user.name.split(" ")[0]}.</em></h1><p className="subtitle">Screen a focused universe of equities using simple fundamental and momentum filters.</p></div><div className="user-actions"><div className="user-chip"><div>{user.name.slice(0, 1).toUpperCase()}</div><span>{user.email}</span></div><button className="logout-button" onClick={onLogout}><LogOut size={15} />Log out</button></div></header>{error && <div className="error-banner">{error}</div>}<section className="stats-grid"><StatCard icon={BarChart3} label="Tracked stocks" value={summary?.total ?? "—"} helper="In your sample universe" accent="blue" /><StatCard icon={ArrowUpRight} label="Market gainers" value={summary?.gainers ?? "—"} helper={`${gainers} match current view`} accent="green" /><StatCard icon={Activity} label="Average daily move" value={summary ? `${summary.averageChange >= 0 ? "+" : ""}${summary.averageChange.toFixed(2)}%` : "—"} helper="Across tracked stocks" accent="purple" /><StatCard icon={TrendingUp} label="Largest company" value={summary?.largestCompany?.symbol ?? "—"} helper={summary?.largestCompany ? formatCap(summary.largestCompany.marketCap) : "—"} accent="orange" /></section><section className="workspace-card"><div className="section-heading"><div><p className="eyebrow">EQUITY SCREENER</p><h2>Filter stocks</h2></div><button className="reset-button" onClick={resetFilters}>Reset filters</button></div><div className="filter-grid"><label className="search-field full"><Search size={17} /><input placeholder="Search by symbol or company" value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} /></label><label><span>Sector</span><div className="select-wrap"><select value={filters.sector} onChange={(e) => updateFilter("sector", e.target.value)}><option value="">All sectors</option>{sectors.map((sector) => <option key={sector}>{sector}</option>)}</select><ChevronDown size={15} /></div></label><label><span>Price range</span><div className="double-input"><input type="number" placeholder="Min $" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} /><input type="number" placeholder="Max $" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} /></div></label><label><span>Minimum market cap</span><input type="number" placeholder="e.g. 1000000000000" value={filters.minMarketCap} onChange={(e) => updateFilter("minMarketCap", e.target.value)} /></label><label><span>Maximum P/E ratio</span><input type="number" placeholder="e.g. 35" value={filters.maxPeRatio} onChange={(e) => updateFilter("maxPeRatio", e.target.value)} /></label><label><span>Minimum daily change</span><input type="number" step="0.1" placeholder="e.g. 1" value={filters.minChange} onChange={(e) => updateFilter("minChange", e.target.value)} /></label></div></section><section className="results-card"><div className="section-heading results-heading"><div><p className="eyebrow">SCREEN RESULTS</p><h2>{stocks.length} stocks found</h2></div><div className="sort-controls"><Filter size={16} /><span>Sort by</span><select value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="marketCap">Market cap</option><option value="changePercent">Daily change</option><option value="price">Price</option><option value="peRatio">P/E ratio</option><option value="volume">Volume</option></select><button onClick={() => setOrder(order === "desc" ? "asc" : "desc")}>{order === "desc" ? "↓" : "↑"}</button></div></div><div className="table-wrap"><table><thead><tr><th>Company</th><th>Price</th><th>Day change</th><th>Market cap</th><th>P/E ratio</th><th>Volume</th></tr></thead><tbody>{loading ? <tr><td colSpan="6" className="empty-state">Loading market data…</td></tr> : stocks.length === 0 ? <tr><td colSpan="6" className="empty-state">No stocks match these filters. Try resetting them.</td></tr> : stocks.map((stock) => <tr key={stock.symbol}><td><div className="company-cell"><div className="ticker">{stock.symbol.slice(0, 2)}</div><div><strong>{stock.symbol}</strong><span>{stock.company}</span></div></div></td><td className="price">{formatMoney(stock.price)}</td><td><span className={`change-pill ${stock.changePercent >= 0 ? "positive" : "negative"}`}>{stock.changePercent >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{Math.abs(stock.changePercent).toFixed(2)}%</span></td><td>{formatCap(stock.marketCap)}</td><td>{stock.peRatio.toFixed(1)}x</td><td>{formatVolume(stock.volume)}</td></tr>)}</tbody></table></div></section><footer>MarketPulse private dashboard · Data shown is illustrative sample data, not financial advice.</footer></main></div>;
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("marketpulse_token")); const [user, setUser] = useState(null); const [checking, setChecking] = useState(Boolean(token));
  useEffect(() => { if (!token) { setChecking(false); return; } axios.get("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }).then((response) => setUser(response.data.user)).catch(() => { localStorage.removeItem("marketpulse_token"); setToken(null); }).finally(() => setChecking(false)); }, [token]);
  const authenticated = (nextUser, nextToken) => { setUser(nextUser); setToken(nextToken); }; const logout = () => { localStorage.removeItem("marketpulse_token"); setUser(null); setToken(null); };
  if (checking) return <div className="auth-loading">Loading your secure workspace…</div>;
  return token && user ? <Dashboard user={user} token={token} onLogout={logout} /> : <AuthScreen onAuthenticated={authenticated} />;
}

export default App;
