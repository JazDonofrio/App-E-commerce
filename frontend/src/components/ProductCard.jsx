import { Link } from "react-router-dom";
import { formatPrice } from "../lib/api";

export const ProductCard = ({ product }) => {
  return (
    <Link
      to={`/product/${product.id}`}
      className="group block relative border-2 border-zinc-900 bg-[#0A0A0A] hover:border-[#DFFF00] transition-all"
      data-testid={`product-card-${product.id}`}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#121212]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 grayscale-[15%] group-hover:grayscale-0"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.featured && (
            <span className="bg-[#DFFF00] text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              DROP
            </span>
          )}
          {product.stock < 10 && (
            <span className="bg-[#FF007F] text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">
              Últimas unidades
            </span>
          )}
        </div>
      </div>
      <div className="p-4 flex justify-between items-start gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold">
            {product.category}
          </div>
          <h3 className="mt-1 font-display uppercase tracking-tight text-lg leading-tight text-white group-hover:text-[#DFFF00] transition-colors">
            {product.name}
          </h3>
        </div>
        <div className="text-right">
          <div className="mono text-sm font-bold text-white">{formatPrice(product.price)}</div>
        </div>
      </div>
    </Link>
  );
};
