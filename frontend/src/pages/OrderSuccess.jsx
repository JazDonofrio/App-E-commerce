import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatPrice } from "../lib/api";
import { CheckCircle, Clock, Package } from "lucide-react";

export const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data));
  }, [id]);

  if (!order) return <div className="pt-32 text-center text-zinc-500">Cargando...</div>;

  const isPaid = order.status === "paid" || order.status === "shipped";

  return (
    <div className="pt-28 mx-auto max-w-3xl px-4 md:px-8 pb-20">
      <div className="border-2 border-zinc-900 bg-[#0A0A0A] p-8 md:p-12" data-testid="order-success">
        <div className="flex flex-col items-center text-center">
          {isPaid ? (
            <>
              <CheckCircle size={64} className="text-[#00FF66]" />
              <div className="text-xs uppercase tracking-[0.3em] text-[#00FF66] font-bold mt-6">PEDIDO CONFIRMADO</div>
              <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mt-3">Gracias.</h1>
              <p className="text-zinc-400 mt-4 max-w-lg">Tu pedido fue recibido y está siendo preparado. Te enviamos un email a {order.shipping.email}.</p>
            </>
          ) : (
            <>
              <Clock size={64} className="text-[#DFFF00]" />
              <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mt-6">PENDIENTE DE PAGO</div>
              <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter mt-3">Pedido creado</h1>
              <p className="text-zinc-400 mt-4 max-w-lg">Tu pedido queda como pendiente hasta confirmar el pago.</p>
            </>
          )}
        </div>

        <div className="mt-10 border-t-2 border-zinc-900 pt-8 space-y-2 text-sm">
          <Row label="N° de pedido" value={<span className="mono">{order.id}</span>} />
          <Row label="Estado" value={<Status status={order.status} />} />
          <Row label="Método" value={order.payment_method === "mercadopago" ? "MercadoPago (mock)" : order.payment_method} />
          {order.payment_id && <Row label="ID pago" value={<span className="mono text-xs">{order.payment_id}</span>} />}
        </div>

        <div className="mt-8 border-t-2 border-zinc-900 pt-6">
          <h3 className="font-display text-xl uppercase tracking-tight mb-4">Items</h3>
          <div className="space-y-3">
            {order.items.map((i, idx) => (
              <div key={idx} className="flex gap-3 text-sm">
                <img src={i.image} alt="" className="w-16 h-20 object-cover" />
                <div className="flex-1">
                  <div className="font-bold uppercase">{i.name}</div>
                  <div className="text-zinc-500 text-xs mt-1">Talle {i.size} × {i.quantity}</div>
                </div>
                <div className="mono font-bold">{formatPrice(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t-2 border-zinc-900 pt-6 space-y-2 text-sm">
          <Row label="Subtotal" value={<span className="mono">{formatPrice(order.subtotal)}</span>} />
          <Row label="Envío" value={<span className="mono">{order.shipping_cost === 0 ? "GRATIS" : formatPrice(order.shipping_cost)}</span>} />
          <Row label={<span className="text-sm uppercase tracking-[0.2em] font-bold">Total</span>} value={<span className="font-display text-3xl text-[#DFFF00]">{formatPrice(order.total)}</span>} />
        </div>

        <div className="mt-10 flex flex-col sm:flex-row gap-3">
          <Link to="/shop" className="flex-1 text-center bg-[#DFFF00] text-black font-bold uppercase tracking-wider py-4 hover:bg-[#BADD00]">Seguir comprando</Link>
          <Link to="/my-orders" className="flex-1 text-center border-2 border-white text-white font-bold uppercase tracking-wider py-4 hover:bg-white hover:text-black flex items-center justify-center gap-2">
            <Package size={16} /> Mis pedidos
          </Link>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value }) => (
  <div className="flex justify-between items-baseline">
    <span className="text-zinc-400 uppercase text-xs tracking-wider">{label}</span>
    <span>{value}</span>
  </div>
);

const Status = ({ status }) => {
  const map = {
    pending: { text: "Pendiente", color: "text-[#DFFF00]" },
    paid: { text: "Pagado", color: "text-[#00FF66]" },
    shipped: { text: "Enviado", color: "text-[#00FF66]" },
    cancelled: { text: "Cancelado", color: "text-[#FF0033]" },
  };
  const s = map[status] || { text: status, color: "text-zinc-400" };
  return <span className={`font-bold uppercase tracking-wider ${s.color}`}>{s.text}</span>;
};
