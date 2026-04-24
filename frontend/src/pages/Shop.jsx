import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { ProductCard } from "../components/ProductCard";

const categories = [
  { slug: "all", label: "Todo" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "tees", label: "Tees" },
  { slug: "pants", label: "Pants" },
  { slug: "jackets", label: "Jackets" },
  { slug: "caps", label: "Caps" },
];

const sorts = [
  { value: "newest", label: "Más nuevos" },
  { value: "price_asc", label: "Precio: menor" },
  { value: "price_desc", label: "Precio: mayor" },
];

export const Shop = () => {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") || "all";
  const sort = params.get("sort") || "newest";
  const q = params.get("q") || "";

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (category !== "all") query.set("category", category);
    if (sort) query.set("sort", sort);
    if (q) query.set("q", q);
    api.get(`/products?${query.toString()}`).then((r) => {
      setProducts(r.data);
      setLoading(false);
    });
  }, [category, sort, q]);

  const setParam = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next);
  };

  const title = useMemo(() => {
    const cat = categories.find(c => c.slug === category);
    return cat ? cat.label : "Todo";
  }, [category]);

  return (
    <div className="pt-20 mx-auto max-w-[1600px] px-4 md:px-8 pb-20" data-testid="shop-page">
      <div className="border-b-2 border-zinc-900 pb-8 mb-8">
        <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// CATÁLOGO</div>
        <h1 className="font-display text-6xl md:text-8xl uppercase tracking-tighter leading-none">{title}</h1>
        <p className="mt-4 text-zinc-400 text-sm uppercase tracking-wider">
          {products.length} producto{products.length !== 1 && "s"}
        </p>
      </div>

      <div className="flex flex-wrap gap-6 mb-10 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {categories.map((c) => (
            <button
              key={c.slug}
              onClick={() => setParam("category", c.slug === "all" ? null : c.slug)}
              className={`px-4 py-2 border-2 font-bold uppercase text-xs tracking-wider transition ${
                category === c.slug
                  ? "bg-[#DFFF00] border-[#DFFF00] text-black"
                  : "border-zinc-800 text-white hover:border-white"
              }`}
              data-testid={`filter-${c.slug}`}
            >
              {c.label}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setParam("sort", e.target.value)}
          className="bg-[#0A0A0A] border-2 border-zinc-800 text-white px-4 py-2 uppercase text-xs tracking-wider font-bold focus:outline-none focus:border-[#DFFF00]"
          data-testid="sort-select"
        >
          {sorts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[#0A0A0A] border-2 border-zinc-900 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-32 text-center text-zinc-500">
          <p className="font-display text-4xl uppercase">Nada por acá</p>
          <p className="mt-2">Probá otro filtro.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
};
