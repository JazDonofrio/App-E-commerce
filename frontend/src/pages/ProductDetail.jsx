import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api, formatPrice } from "../lib/api";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Truck, Shield, RotateCcw } from "lucide-react";

export const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [qty, setQty] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    api.get(`/products/${id}`).then((r) => {
      setProduct(r.data);
      setSelectedSize(r.data.sizes[0]);
    });
  }, [id]);

  if (!product) {
    return <div className="pt-32 text-center text-zinc-500">Cargando...</div>;
  }

  const handleAdd = () => {
    if (!selectedSize) {
      toast.error("Elegí un talle");
      return;
    }
    addItem(product, selectedSize, qty);
    toast.success(`${product.name} sumado al carrito`);
  };

  return (
    <div className="pt-20 mx-auto max-w-[1600px] px-4 md:px-8 pb-20" data-testid="product-detail">
      <Link to="/shop" className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-[#DFFF00] mb-8">
        <ArrowLeft size={14} /> Volver al catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <div className="relative">
          <div className="sticky top-24">
            <div className="aspect-[3/4] border-2 border-zinc-900 overflow-hidden bg-[#0A0A0A]">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {product.featured && (
              <div className="absolute top-4 left-4 bg-[#DFFF00] text-black text-xs font-bold uppercase tracking-wider px-3 py-1">
                DROP LIMITADO
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-zinc-500 font-bold mb-3">{product.category}</div>
          <h1 className="font-display text-5xl md:text-7xl uppercase tracking-tighter leading-none">{product.name}</h1>
          <div className="mt-6 font-display text-4xl text-[#DFFF00]" data-testid="product-price">
            {formatPrice(product.price)}
          </div>
          <p className="mt-8 text-zinc-300 leading-relaxed">{product.description}</p>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">Talle</span>
              <span className="text-xs text-zinc-500">Stock: {product.stock}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`min-w-[52px] px-4 py-3 border-2 font-bold uppercase text-sm tracking-wider transition ${
                    selectedSize === s
                      ? "bg-[#DFFF00] border-[#DFFF00] text-black"
                      : "border-zinc-800 text-white hover:border-white"
                  }`}
                  data-testid={`size-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400 mb-3">Cantidad</div>
            <div className="inline-flex items-center border-2 border-zinc-800">
              <button onClick={() => setQty(Math.max(1, qty-1))} className="w-10 h-10 hover:bg-zinc-900" data-testid="qty-dec">-</button>
              <span className="mono w-12 text-center" data-testid="qty-display">{qty}</span>
              <button onClick={() => setQty(qty+1)} className="w-10 h-10 hover:bg-zinc-900" data-testid="qty-inc">+</button>
            </div>
          </div>

          <button
            onClick={handleAdd}
            className="mt-10 w-full flex items-center justify-center gap-3 bg-[#DFFF00] text-black font-bold uppercase tracking-wider py-5 hover:bg-[#BADD00] shadow-brutal"
            data-testid="add-to-cart-btn"
          >
            <ShoppingBag size={18} /> Agregar al carrito
          </button>

          <div className="mt-8 grid grid-cols-3 gap-4 pt-8 border-t-2 border-zinc-900">
            <div className="text-center">
              <Truck size={20} className="mx-auto mb-2 text-[#DFFF00]" />
              <div className="text-[10px] uppercase tracking-wider font-bold">Envío nacional</div>
            </div>
            <div className="text-center">
              <Shield size={20} className="mx-auto mb-2 text-[#DFFF00]" />
              <div className="text-[10px] uppercase tracking-wider font-bold">Pago seguro MP</div>
            </div>
            <div className="text-center">
              <RotateCcw size={20} className="mx-auto mb-2 text-[#DFFF00]" />
              <div className="text-[10px] uppercase tracking-wider font-bold">Cambios 30 días</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
