import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { api, formatPrice } from "../lib/api";
import { toast } from "sonner";
import { Lock, CreditCard } from "lucide-react";

export const Checkout = () => {
  const { items, subtotal, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [mpMockOpen, setMpMockOpen] = useState(false);
  const [orderId, setOrderId] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    zip_code: "",
    notes: "",
  });

  const shipping = subtotal >= 50000 ? 0 : 4500;
  const total = subtotal + shipping;

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Carrito vacío");
      return;
    }
    const req = ["full_name", "email", "phone", "address", "city", "province", "zip_code"];
    for (const k of req) {
      if (!form[k]) {
        toast.error("Completá todos los datos de envío");
        return;
      }
    }

    setLoading(true);
    try {
      const { data } = await api.post("/orders", {
        items,
        shipping: form,
        payment_method: "mercadopago",
      });
      setOrderId(data.id);
      setMpMockOpen(true);
    } catch (err) {
      toast.error("Error al crear el pedido");
    } finally {
      setLoading(false);
    }
  };

  const confirmMockPayment = async () => {
    setLoading(true);
    try {
      await api.post(`/orders/${orderId}/mock-pay`);
      clear();
      toast.success("¡Pago aprobado!");
      navigate(`/order/${orderId}`);
    } catch {
      toast.error("Error procesando pago");
      setLoading(false);
    }
  };

  if (items.length === 0 && !mpMockOpen) {
    return (
      <div className="pt-32 min-h-screen text-center">
        <h1 className="font-display text-5xl uppercase">Carrito vacío</h1>
        <p className="mt-4 text-zinc-500">Sumá algo antes de pagar.</p>
      </div>
    );
  }

  return (
    <div className="pt-20 mx-auto max-w-[1400px] px-4 md:px-8 pb-20">
      <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// FINALIZAR COMPRA</div>
      <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter leading-none mb-12">Checkout</h1>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="border-2 border-zinc-900 bg-[#0A0A0A] p-6 md:p-8">
            <h2 className="font-display text-2xl uppercase tracking-tight mb-6">01 / Datos de envío</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Nombre completo" value={form.full_name} onChange={(v) => setF("full_name", v)} testId="in-name" />
              <Field label="Email" type="email" value={form.email} onChange={(v) => setF("email", v)} testId="in-email" />
              <Field label="Teléfono" value={form.phone} onChange={(v) => setF("phone", v)} testId="in-phone" />
              <Field label="Código postal" value={form.zip_code} onChange={(v) => setF("zip_code", v)} testId="in-zip" />
              <Field label="Dirección" value={form.address} onChange={(v) => setF("address", v)} className="md:col-span-2" testId="in-address" />
              <Field label="Ciudad" value={form.city} onChange={(v) => setF("city", v)} testId="in-city" />
              <Field label="Provincia" value={form.province} onChange={(v) => setF("province", v)} testId="in-province" />
              <Field label="Notas (opcional)" value={form.notes} onChange={(v) => setF("notes", v)} className="md:col-span-2" testId="in-notes" />
            </div>
          </section>

          <section className="border-2 border-zinc-900 bg-[#0A0A0A] p-6 md:p-8">
            <h2 className="font-display text-2xl uppercase tracking-tight mb-6">02 / Método de pago</h2>
            <label className="flex items-center gap-4 border-2 border-[#DFFF00] p-4 bg-[#DFFF00]/5 cursor-pointer">
              <input type="radio" checked readOnly className="accent-[#DFFF00]" />
              <div className="flex-1">
                <div className="font-bold uppercase tracking-wider">MercadoPago</div>
                <div className="text-xs text-zinc-500 mt-1">Tarjetas, transferencia o efectivo. Procesamiento seguro.</div>
              </div>
              <CreditCard className="text-[#DFFF00]" />
            </label>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start space-y-4 border-2 border-zinc-900 bg-[#0A0A0A] p-6">
          <h3 className="font-display text-xl uppercase tracking-tight">Tu pedido</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {items.map((i) => (
              <div key={`${i.product_id}-${i.size}`} className="flex gap-3 text-xs">
                <img src={i.image} alt="" className="w-12 h-14 object-cover" />
                <div className="flex-1">
                  <div className="font-bold uppercase leading-tight">{i.name}</div>
                  <div className="text-zinc-500 mt-1">{i.size} × {i.quantity}</div>
                </div>
                <div className="mono font-bold">{formatPrice(i.price * i.quantity)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800 pt-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-400">Subtotal</span><span className="mono">{formatPrice(subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-zinc-400">Envío</span><span className="mono">{shipping === 0 ? "GRATIS" : formatPrice(shipping)}</span></div>
            <div className="flex justify-between items-baseline pt-3 border-t border-zinc-800">
              <span className="text-xs uppercase tracking-[0.2em] font-bold">Total</span>
              <span className="font-display text-3xl text-[#DFFF00]" data-testid="checkout-total">{formatPrice(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#DFFF00] text-black font-bold uppercase tracking-wider py-4 hover:bg-[#BADD00] disabled:bg-zinc-700 flex items-center justify-center gap-2"
            data-testid="place-order-btn"
          >
            <Lock size={14} /> Pagar ahora
          </button>
          <p className="text-[10px] text-center text-zinc-500 uppercase tracking-wider">Compra 100% segura</p>
        </aside>
      </form>

      {mpMockOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" data-testid="mp-mock-modal">
          <div className="w-full max-w-md bg-[#0A0A0A] border-2 border-[#DFFF00]">
            <div className="p-6 border-b-2 border-zinc-900 bg-[#121212]">
              <div className="flex items-center justify-between">
                <div className="font-bold text-[#009EE3] text-xl">MercadoPago</div>
                <span className="text-[10px] uppercase tracking-wider bg-[#DFFF00] text-black px-2 py-1 font-bold">MOCK</span>
              </div>
            </div>
            <div className="p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold">Total a pagar</p>
              <p className="font-display text-5xl text-white mt-2">{formatPrice(total)}</p>
              <p className="text-sm text-zinc-400 mt-6 leading-relaxed">
                Este es un flujo de pago simulado. En producción se redirige al checkout oficial de MercadoPago con tus credenciales.
              </p>
              <div className="mt-8 space-y-3">
                <button
                  onClick={confirmMockPayment}
                  disabled={loading}
                  className="w-full bg-[#DFFF00] text-black font-bold uppercase tracking-wider py-4 hover:bg-[#BADD00] disabled:bg-zinc-700"
                  data-testid="mp-pay-btn"
                >
                  {loading ? "Procesando..." : "Simular pago aprobado"}
                </button>
                <button
                  onClick={() => { setMpMockOpen(false); navigate(`/order/${orderId}`); }}
                  className="w-full border-2 border-zinc-800 text-white font-bold uppercase tracking-wider py-3 hover:border-white text-sm"
                  data-testid="mp-cancel-btn"
                >
                  Pagar más tarde
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, value, onChange, type = "text", className = "", testId }) => (
  <label className={`block ${className}`}>
    <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full bg-[#050505] border-2 border-zinc-800 px-4 py-3 text-white focus:outline-none focus:border-[#DFFF00] transition"
      data-testid={testId}
    />
  </label>
);
