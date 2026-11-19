import { useEffect, useState } from "react";
import { ArrowLeft, BarChart3, Check, Plus, RefreshCw, Shield, UserCheck, UserX } from "lucide-react";
import api from "./api";

function AdminPanel({ user, token, onBack, onLogout }) {
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPlan, setNewPlan] = useState({ name: "", description: "", price: 0, durationDays: 30 });

  const loadAdminData = async () => {
    setBusy(true); setError("");
    try {
      const [statsResponse, usersResponse, plansResponse] = await Promise.all([
        api.get("/admin/stats", authConfig),
        api.get("/admin/users", authConfig),
        api.get("/plans", authConfig)
      ]);
      setStats(statsResponse.data); setUsers(usersResponse.data); setPlans(plansResponse.data);
    } catch (err) {
      if (err.response?.status === 401) onLogout();
      else setError(err.response?.data?.message || "Could not load admin data.");
    } finally { setBusy(false); }
  };

  useEffect(() => { loadAdminData(); }, []);

  const updateUser = async (id, updates) => {
    setError(""); setMessage("");
    try {
      await api.patch(`/admin/users/${id}`, updates, authConfig);
      setMessage("User updated successfully.");
      await loadAdminData();
    } catch (err) { setError(err.response?.data?.message || "Could not update user."); }
  };

  const assignPlan = async (id, planId) => {
    if (!planId) return;
    const expiresAt = window.prompt("Expiry date (YYYY-MM-DD). Leave blank to use the plan duration:", "");
    try {
      await api.patch(`/admin/users/${id}/subscription`, { planId, ...(expiresAt ? { expiresAt } : {}) }, authConfig);
      setMessage("Subscription assigned successfully.");
      await loadAdminData();
    } catch (err) { setError(err.response?.data?.message || "Could not assign subscription."); }
  };

  const createPlan = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      await api.post("/plans", { ...newPlan, price: Number(newPlan.price), durationDays: Number(newPlan.durationDays) }, authConfig);
      setNewPlan({ name: "", description: "", price: 0, durationDays: 30 });
      setMessage("Subscription plan created.");
      await loadAdminData();
    } catch (err) { setError(err.response?.data?.message || "Could not create plan."); }
  };

  return <div className="admin-page">
    <header className="admin-header">
      <div><button className="back-button" onClick={onBack}><ArrowLeft size={16} /> Back to dashboard</button><p className="eyebrow">ADMINISTRATION</p><h1>Platform control center</h1><p className="subtitle">Manage users, subscription access, and platform plans.</p></div>
      <div className="admin-badge"><Shield size={16} /> Administrator: {user.name}</div>
    </header>
    {error && <div className="error-banner">{error}</div>}
    {message && <div className="success-banner"><Check size={16} />{message}</div>}
    <div className="admin-toolbar"><button className="secondary-button" onClick={loadAdminData} disabled={busy}><RefreshCw size={15} /> {busy ? "Refreshing…" : "Refresh data"}</button></div>
    <section className="admin-stats-grid"><div className="admin-stat"><UserCheck size={20} /><span>Total users</span><strong>{stats?.users ?? "—"}</strong></div><div className="admin-stat"><BarChart3 size={20} /><span>Active users</span><strong>{stats?.activeUsers ?? "—"}</strong></div><div className="admin-stat"><Shield size={20} /><span>Administrators</span><strong>{stats?.admins ?? "—"}</strong></div></section>
    <section className="admin-card"><div className="section-heading"><div><p className="eyebrow">ACCOUNT ACCESS</p><h2>Manage users</h2></div></div><div className="admin-table-wrap"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Subscription</th><th>Actions</th></tr></thead><tbody>{users.map((item) => <tr key={item._id}><td><strong>{item.name}</strong><span className="admin-muted">{item.email}</span></td><td><select value={item.role} disabled={item._id === user.id} onChange={(e) => updateUser(item._id, { role: e.target.value })}><option value="user">User</option><option value="admin">Admin</option></select></td><td><span className={`status-badge ${item.isActive ? "status-active" : "status-inactive"}`}>{item.isActive ? "Active" : "Inactive"}</span></td><td><select value={item.subscription?.planId?._id || ""} onChange={(e) => assignPlan(item._id, e.target.value)}><option value="">{item.subscription?.planName || "Free"}</option>{plans.map((plan) => <option key={plan._id} value={plan._id}>{plan.name}</option>)}</select><span className="admin-muted">{item.subscription?.expiresAt ? `Expires ${new Date(item.subscription.expiresAt).toLocaleDateString()}` : "No expiry"}</span></td><td><button className="table-action" disabled={item._id === user.id} onClick={() => updateUser(item._id, { isActive: !item.isActive })}>{item.isActive ? <><UserX size={14} /> Deactivate</> : <><UserCheck size={14} /> Activate</>}</button></td></tr>)}</tbody></table></div></section>
    <section className="admin-card"><div className="section-heading"><div><p className="eyebrow">ACCESS PACKAGES</p><h2>Subscription plans</h2></div></div><div className="plan-grid">{plans.map((plan) => <div className="plan-card" key={plan._id}><div><h3>{plan.name}</h3><p>{plan.description || "No description"}</p></div><strong>{plan.price === 0 ? "Free" : `₹${plan.price}`}</strong><small>{plan.durationDays ? `${plan.durationDays} days` : "No expiry"} · {plan.features?.maxScreenFilters ?? 0} filters</small></div>)}</div><form className="create-plan-form" onSubmit={createPlan}><h3><Plus size={17} /> Create a plan</h3><input required placeholder="Plan name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} /><input placeholder="Description" value={newPlan.description} onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })} /><input type="number" min="0" placeholder="Price" value={newPlan.price} onChange={(e) => setNewPlan({ ...newPlan, price: e.target.value })} /><input type="number" min="0" placeholder="Duration days" value={newPlan.durationDays} onChange={(e) => setNewPlan({ ...newPlan, durationDays: e.target.value })} /><button className="primary-button"><Plus size={15} /> Create plan</button></form></section>
  </div>;
}

export default AdminPanel;
