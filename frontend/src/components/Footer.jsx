export const Footer = () => {
  return (
    <footer className="border-t-2 border-zinc-900 mt-32 bg-[#050505]" data-testid="site-footer">
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 py-16 grid md:grid-cols-4 gap-12">
        <div>
          <h3 className="font-display text-3xl uppercase tracking-tight">
            UNDER<span className="text-[#DFFF00]">/</span>STREET
          </h3>
          <p className="mt-4 text-sm text-zinc-400 leading-relaxed">
            Indumentaria juvenil hecha para la calle. Drops limitados. Vos contra todos.
          </p>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">Shop</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li><a href="/shop?category=hoodies" className="hover:text-[#DFFF00]">Hoodies</a></li>
            <li><a href="/shop?category=tees" className="hover:text-[#DFFF00]">Tees</a></li>
            <li><a href="/shop?category=pants" className="hover:text-[#DFFF00]">Pants</a></li>
            <li><a href="/shop?category=jackets" className="hover:text-[#DFFF00]">Jackets</a></li>
            <li><a href="/shop?category=caps" className="hover:text-[#DFFF00]">Caps</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">Info</h4>
          <ul className="mt-4 space-y-2 text-sm">
            <li>Envíos a todo el país</li>
            <li>Cambios en 30 días</li>
            <li>Pago con MercadoPago</li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-400">Contacto</h4>
          <ul className="mt-4 space-y-2 text-sm text-zinc-400">
            <li>hello@understreet.co</li>
            <li>@understreet_ar</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-zinc-900 py-6 px-4 md:px-8 text-center text-xs text-zinc-600 uppercase tracking-[0.2em]">
        © 2026 Under Street — NOT FOR EVERYONE
      </div>
    </footer>
  );
};
