import { X, Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../lib/api";
import { Link } from "react-router-dom";

export const CartDrawer = () => {
  const { open, setOpen, items, updateQty, removeItem, subtotal } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex" data-testid="cart-drawer">
      <div
        className="flex-1 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside className="w-full max-w-md bg-[#0A0A0A] border-l-2 border-zinc-900 flex flex-col">
        <div className="flex items-center justify-between p-5 border-b-2 border-zinc-900">
          <h2 className="font-display text-2xl uppercase tracking-tight">Tu Carrito</h2>
          <button
            onClick={() => setOpen(false)}
            className="p-2 border-2 border-zinc-800 hover:border-[#DFFF00]"
            data-testid="close-cart-btn"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 && (
            <div className="text-center py-20 text-zinc-500">
              <p className="font-display text-2xl uppercase">Vacío</p>
              <p className="text-sm mt-2">Sumá algo de calle.</p>
            </div>
          )}
          {items.map((it) => (
            <div
              key={`${it.product_id}-${it.size}`}
              className="flex gap-4 border border-zinc-900 p-3"
              data-testid={`cart-item-${it.product_id}`}
            >
              <img src={it.image} alt={it.name} className="w-20 h-24 object-cover" />
              <div className="flex-1">
                <h3 className="font-display uppercase tracking-tight text-sm leading-tight">{it.name}</h3>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500 mt-1">Talle: {it.size}</p>
                <p className="mono text-sm font-bold mt-2">{formatPrice(it.price)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <button
                    onClick={() => updateQty(it.product_id, it.size, it.quantity - 1)}
                    className="w-7 h-7 border border-zinc-800 hover:border-[#DFFF00] flex items-center justify-center"
                    data-testid={`qty-dec-${it.product_id}`}
                  >
                    <Minus size={12} />
                  </button>
                  <span className="mono text-sm w-8 text-center">{it.quantity}</span>
                  <button
                    onClick={() => updateQty(it.product_id, it.size, it.quantity + 1)}
                    className="w-7 h-7 border border-zinc-800 hover:border-[#DFFF00] flex items-center justify-center"
                    data-testid={`qty-inc-${it.product_id}`}
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={() => removeItem(it.product_id, it.size)}
                    className="ml-auto p-1 text-[#FF007F] hover:bg-[#FF007F] hover:text-white"
                    data-testid={`remove-${it.product_id}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-zinc-900 p-5 space-y-4">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold">Subtotal</span>
            <span className="font-display text-3xl" data-testid="cart-subtotal">{formatPrice(subtotal)}</span>
          </div>
          <Link
            to="/checkout"
            onClick={() => setOpen(false)}
            className={`block text-center w-full py-4 font-bold uppercase tracking-wider ${
              items.length === 0
                ? "bg-zinc-800 text-zinc-600 pointer-events-none"
                : "bg-[#DFFF00] text-black hover:bg-[#BADD00]"
            }`}
            data-testid="checkout-btn"
          >
            Ir al checkout
          </Link>
        </div>
      </aside>
    </div>
  );
};
