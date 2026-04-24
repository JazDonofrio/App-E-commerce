import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatPrice } from "../lib/api";
import { ProductCard } from "../components/ProductCard";
import { ArrowRight } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1767897213817-8664d9b82393?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2OTV8MHwxfHNlYXJjaHwxfHxzdHJlZXR3ZWFyJTIwZmFzaGlvbiUyMG1vZGVsJTIwbmlnaHR8ZW58MHx8fHwxNzc2OTkzNjQzfDA&ixlib=rb-4.1.0&q=85";
const GRAFFITI = "https://images.unsplash.com/photo-1722017862026-9a6b5e7c97bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxNzV8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGdyYWZmaXRpJTIwd2FsbCUyMGRhcmt8ZW58MHx8fHwxNzc2OTkzNjQzfDA&ixlib=rb-4.1.0&q=85";
const LOOKBOOK = "https://images.pexels.com/photos/15213190/pexels-photo-15213190.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const categories = [
  { slug: "hoodies", label: "Hoodies" },
  { slug: "tees", label: "Tees" },
  { slug: "pants", label: "Pants" },
  { slug: "jackets", label: "Jackets" },
  { slug: "caps", label: "Caps" },
];

export const Home = () => {
  const [featured, setFeatured] = useState([]);
  const [all, setAll] = useState([]);

  useEffect(() => {
    api.get("/products?featured=true").then((r) => setFeatured(r.data.slice(0, 4)));
    api.get("/products").then((r) => setAll(r.data.slice(0, 8)));
  }, []);

  return (
    <div className="pt-16">
      {/* HERO */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-end">
        <div className="absolute inset-0">
          <img src={HERO_IMG} alt="" className="w-full h-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505]/80 to-transparent" />
        </div>

        <div className="relative w-full mx-auto max-w-[1600px] px-4 md:px-8 pb-16 md:pb-24">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-[2px] bg-[#DFFF00]" />
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-[#DFFF00]">SS26 COLLECTION / VOID</span>
            </div>
            <h1 className="font-display uppercase text-6xl sm:text-8xl md:text-[10rem] lg:text-[13rem] leading-[0.85] tracking-tighter">
              NOT FOR<br/>
              <span className="text-[#DFFF00]">EVERYONE.</span>
            </h1>
            <p className="mt-6 max-w-xl text-zinc-300 text-lg leading-relaxed">
              Streetwear juvenil forjado en la calle. Piezas limitadas, construcción heavy, actitud antisistema. Si tenés que preguntar si es para vos, no lo es.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 bg-[#DFFF00] text-black font-bold uppercase tracking-wider px-8 py-4 hover:bg-[#BADD00] shadow-brutal"
                data-testid="hero-shop-btn"
              >
                Comprar ahora <ArrowRight size={18} />
              </Link>
              <Link
                to="/shop?featured=true"
                className="inline-flex items-center gap-3 border-2 border-white text-white font-bold uppercase tracking-wider px-8 py-4 hover:bg-white hover:text-black transition"
              >
                Ver último drop
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <section className="border-y-2 border-zinc-900 py-6 overflow-hidden bg-[#DFFF00]">
        <div className="marquee-track">
          {[...Array(6)].map((_, i) => (
            <span key={i} className="font-display text-4xl md:text-6xl uppercase tracking-tight text-black px-8 whitespace-nowrap">
              UNDER STREET / NEW DROP / FUCK THE SYSTEM / SHIP WORLDWIDE / LIMITED EDITION /
            </span>
          ))}
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 py-20 md:py-28">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-12">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// CATEGORÍAS</div>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tight leading-none">
              Elegí tu<br/>armamento
            </h2>
          </div>
          <Link to="/shop" className="text-sm uppercase tracking-wider font-bold hover:text-[#DFFF00] flex items-center gap-2">
            Ver todo <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
          {categories.map((c) => (
            <Link
              key={c.slug}
              to={`/shop?category=${c.slug}`}
              className="group relative aspect-[3/4] overflow-hidden border-2 border-zinc-900 hover:border-[#DFFF00] transition"
              data-testid={`category-${c.slug}`}
            >
              <img src={LOOKBOOK} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-display text-2xl md:text-3xl uppercase tracking-tight group-hover:text-[#DFFF00]">{c.label}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 pb-20">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-[#FF007F] font-bold mb-3">// ÚLTIMO DROP</div>
            <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tight leading-none">Heat drop</h2>
          </div>
          <Link to="/shop?featured=true" className="text-sm uppercase tracking-wider font-bold hover:text-[#DFFF00] flex items-center gap-2">
            Más productos <ArrowRight size={16} />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {featured.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* GRAFFITI BANNER */}
      <section className="relative h-[60vh] overflow-hidden">
        <img src={GRAFFITI} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-[#050505]/50" />
        <div className="relative h-full flex items-center justify-center mx-auto max-w-[1400px] px-6">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-4">MANIFESTO</div>
            <h2 className="font-display uppercase text-5xl md:text-8xl leading-[0.9]">
              la calle<br/>no perdona,<br/><span className="text-[#DFFF00]">vestite acorde.</span>
            </h2>
          </div>
        </div>
      </section>

      {/* ALL PRODUCTS */}
      <section className="mx-auto max-w-[1600px] px-4 md:px-8 py-20">
        <div className="mb-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#DFFF00] font-bold mb-3">// CATÁLOGO</div>
          <h2 className="font-display text-5xl md:text-7xl uppercase tracking-tight leading-none">Todo lo demás</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {all.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        <div className="text-center mt-12">
          <Link to="/shop" className="inline-block border-2 border-white px-10 py-4 uppercase font-bold tracking-wider hover:bg-white hover:text-black transition">
            Ver catálogo completo
          </Link>
        </div>
      </section>
    </div>
  );
};
