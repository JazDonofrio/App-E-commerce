import { useEffect, useState } from "react";
import { api, formatPrice } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";
import { Package, DollarSign, Clock, TruckIcon, CheckSquare } from "lucide-react";

export const Admin = () => {
  const { user, login, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, o] = await Promise.all([
        api.get("/admin/stats"),
        api.get(`/admin/orders${filter !== "all" ? `?status=${filter}` : ""}`),
      ]);
      setStats(s.data);
      setOrders(o.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) load();
  }, [user, filter]);

  if (authLoading) return <div className="pt-32 text-center">Cargando...</div>;

  if (!user) {
    return (
      <div className="pt-32 text-center px-4">
        <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// ACCESO RESTRINGIDO</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter">Admin</h1>
        <p className="mt-4 text-zinc-400">Ingresá con Google para gestionar tu tienda.</p>
        <button onClick={login} className="mt-8 bg-[#DFFF00] text-black font-bold uppercase px-8 py-4 hover:bg-[#BADD00]" data-testid="admin-login-btn">
          Ingresar con Google
        </button>
      </div>
    );
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      toast.success(`Pedido marcado como ${status}`);
      load();
    } catch {
      toast.error("Error actualizando pedido");
    }
  };

  return (
    <div className="pt-20 mx-auto max-w-[1600px] px-4 md:px-8 pb-20" data-testid="admin-page">
      <div className="border-b-2 border-zinc-900 pb-6 mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// CONTROL ROOM</div>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">Admin</h1>
          <p className="text-zinc-500 mt-2 text-sm">Hola, <span className="text-white">{user.name}</span></p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-10">
          <StatCard icon={<Package size={18} />} label="Pedidos" value={stats.total_orders} color="#DFFF00" testId="stat-total" />
          <StatCard icon={<Clock size={18} />} label="Pendientes" value={stats.pending} color="#DFFF00" testId="stat-pending" />
          <StatCard icon={<CheckSquare size={18} />} label="Pagados" value={stats.paid} color="#00FF66" testId="stat-paid" />
          <StatCard icon={<TruckIcon size={18} />} label="Enviados" value={stats.shipped} color="#009EE3" testId="stat-shipped" />
          <StatCard icon={<DollarSign size={18} />} label="Facturado" value={formatPrice(stats.revenue)} color="#FF007F" testId="stat-revenue" mono />
        </div>
      )}

      <div className="flex flex-wrap gap-1 mb-6">
        {[
          { v: "all", label: "Todos" },
          { v: "pending", label: "Pendientes" },
          { v: "paid", label: "Pagados" },
          { v: "shipped", label: "Enviados" },
          { v: "cancelled", label: "Cancelados" },
        ].map((f) => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider ${
              filter === f.v ? "bg-[#DFFF00] border-[#DFFF00] text-black" : "border-zinc-800 text-white hover:border-white"
            }`}
            data-testid={`admin-filter-${f.v}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="border-2 border-zinc-900 bg-[#0A0A0A] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#121212] border-b-2 border-zinc-900 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Items</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Estado</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="text-center py-16 text-zinc-500">Cargando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-16 text-zinc-500">Sin pedidos</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-b border-zinc-900 hover:bg-[#121212] text-sm" data-testid={`admin-order-${o.id}`}>
                  <td className="px-4 py-4 mono text-xs text-zinc-400">{o.id}</td>
                  <td className="px-4 py-4 text-xs text-zinc-500">{new Date(o.created_at).toLocaleDateString("es-AR")}<br/><span className="text-zinc-600">{new Date(o.created_at).toLocaleTimeString("es-AR")}</span></td>
                  <td className="px-4 py-4">
                    <div className="font-bold">{o.shipping.full_name}</div>
                    <div className="text-xs text-zinc-500">{o.shipping.email}</div>
                  </td>
                  <td className="px-4 py-4 mono">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                  <td className="px-4 py-4 mono text-right font-bold">{formatPrice(o.total)}</td>
                  <td className="px-4 py-4 text-center"><StatusPill status={o.status} /></td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex gap-1 justify-end flex-wrap">
                      {o.status === "pending" && (
                        <button onClick={() => updateStatus(o.id, "paid")} className="bg-[#00FF66] text-black px-2 py-1 text-[10px] uppercase font-bold" data-testid={`mark-paid-${o.id}`}>Marcar pagado</button>
                      )}
                      {o.status === "paid" && (
                        <button onClick={() => updateStatus(o.id, "shipped")} className="bg-[#009EE3] text-white px-2 py-1 text-[10px] uppercase font-bold" data-testid={`mark-shipped-${o.id}`}>Marcar enviado</button>
                      )}
                      {o.status !== "cancelled" && o.status !== "shipped" && (
                        <button onClick={() => updateStatus(o.id, "cancelled")} className="border border-[#FF0033] text-[#FF0033] px-2 py-1 text-[10px] uppercase font-bold hover:bg-[#FF0033] hover:text-white">Cancelar</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color, mono, testId }) => (
  <div className="border-2 border-zinc-900 bg-[#0A0A0A] p-4" data-testid={testId}>
    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">
      <span style={{ color }}>{icon}</span>
      {label}
    </div>
    <div className={`mt-2 font-display text-4xl ${mono ? "mono text-xl" : ""}`} style={{ color }}>
      {value}
    </div>
  </div>
);

const StatusPill = ({ status }) => {
  const map = {
    pending: { bg: "bg-[#DFFF00]", text: "text-black", label: "Pendiente" },
    paid: { bg: "bg-[#00FF66]", text: "text-black", label: "Pagado" },
    shipped: { bg: "bg-[#009EE3]", text: "text-white", label: "Enviado" },
    cancelled: { bg: "bg-[#FF0033]", text: "text-white", label: "Cancelado" },
  };
  const s = map[status] || { bg: "bg-zinc-800", text: "text-white", label: status };
  return <span className={`${s.bg} ${s.text} px-2 py-1 text-[10px] uppercase font-bold tracking-wider`}>{s.label}</span>;
};
