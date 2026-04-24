import { useEffect, useState } from "react";
import { api, formatPrice } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export const MyOrders = () => {
  const { user, login, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    api.get("/my/orders").then((r) => {
      setOrders(r.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  if (authLoading) return <div className="pt-32 text-center text-zinc-500">Cargando...</div>;

  if (!user) {
    return (
      <div className="pt-32 text-center px-4">
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter">Ingresá</h1>
        <p className="mt-4 text-zinc-400">Iniciá sesión con Google para ver tus pedidos.</p>
        <button onClick={login} className="mt-8 bg-[#DFFF00] text-black font-bold uppercase px-8 py-4 hover:bg-[#BADD00]" data-testid="my-orders-login">
          Ingresar con Google
        </button>
      </div>
    );
  }

  return (
    <div className="pt-20 mx-auto max-w-[1200px] px-4 md:px-8 pb-20" data-testid="my-orders-page">
      <div className="border-b-2 border-zinc-900 pb-6 mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// CUENTA</div>
        <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">Mis pedidos</h1>
      </div>

      {loading ? (
        <p className="text-zinc-500">Cargando...</p>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center text-zinc-500">
          <p className="font-display text-3xl uppercase">Sin pedidos</p>
          <Link to="/shop" className="mt-6 inline-block bg-[#DFFF00] text-black font-bold uppercase px-6 py-3">Explorar catálogo</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} to={`/order/${o.id}`} className="block border-2 border-zinc-900 hover:border-[#DFFF00] bg-[#0A0A0A] p-5 transition" data-testid={`my-order-${o.id}`}>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="mono text-xs text-zinc-500">{o.id}</div>
                  <div className="mt-1 font-display text-2xl uppercase">{o.items.length} item{o.items.length !== 1 && "s"}</div>
                  <div className="text-xs text-zinc-500 mt-1">{new Date(o.created_at).toLocaleString("es-AR")}</div>
                </div>
                <div className="flex items-center gap-6">
                  <StatusBadge status={o.status} />
                  <div className="font-display text-2xl text-[#DFFF00]">{formatPrice(o.total)}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const map = {
    pending: "bg-[#DFFF00] text-black",
    paid: "bg-[#00FF66] text-black",
    shipped: "bg-[#009EE3] text-white",
    cancelled: "bg-[#FF0033] text-white",
  };
  const label = { pending: "Pendiente", paid: "Pagado", shipped: "Enviado", cancelled: "Cancelado" }[status] || status;
  return <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider ${map[status] || ""}`}>{label}</span>;
};
