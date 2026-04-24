import { Link, NavLink } from "react-router-dom";
import { ShoppingBag, User, Menu, LogOut, Package } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export const Header = () => {
  const { count, setOpen } = useCart();
  const { user, login, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLink = ({ isActive }) =>
    `font-display text-sm uppercase tracking-wider px-3 py-2 transition-colors ${
      isActive ? "text-[#DFFF00]" : "text-white hover:text-[#DFFF00]"
    }`;

  return (
    <header
      data-testid="site-header"
      className="fixed top-0 w-full z-50 bg-[#050505]/90 backdrop-blur-xl border-b-2 border-zinc-900"
    >
      <div className="mx-auto max-w-[1600px] px-4 md:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
          <span className="font-display text-2xl md:text-3xl uppercase tracking-tight text-white">
            UNDER<span className="text-[#DFFF00]">/</span>STREET
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" end className={navLink} data-testid="nav-home">Home</NavLink>
          <NavLink to="/shop" className={navLink} data-testid="nav-shop">Shop</NavLink>
          <NavLink to="/shop?category=hoodies" className={navLink} data-testid="nav-hoodies">Hoodies</NavLink>
          <NavLink to="/shop?category=tees" className={navLink} data-testid="nav-tees">Tees</NavLink>
          <NavLink to="/shop?category=pants" className={navLink} data-testid="nav-pants">Pants</NavLink>
          <NavLink to="/shop?category=jackets" className={navLink} data-testid="nav-jackets">Jackets</NavLink>
          {user && (
            <NavLink to="/admin" className={navLink} data-testid="nav-admin">Admin</NavLink>
          )}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link
                to="/my-orders"
                className="flex items-center gap-2 px-3 py-2 text-white hover:text-[#DFFF00] text-xs uppercase tracking-wider font-bold"
                data-testid="my-orders-link"
              >
                <Package size={16} />
                Mis pedidos
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-3 py-2 text-white hover:text-[#FF007F] text-xs uppercase tracking-wider font-bold"
                data-testid="logout-btn"
              >
                <LogOut size={16} />
                Salir
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="hidden md:flex items-center gap-2 px-3 py-2 text-white hover:text-[#DFFF00] text-xs uppercase tracking-wider font-bold"
              data-testid="login-btn"
            >
              <User size={16} />
              Ingresar
            </button>
          )}

          <button
            onClick={() => setOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 bg-[#DFFF00] text-black font-bold uppercase text-xs tracking-wider hover:bg-[#BADD00] transition"
            data-testid="open-cart-btn"
          >
            <ShoppingBag size={16} />
            <span>Carrito</span>
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-[#FF007F] text-white font-bold text-[10px] w-5 h-5 flex items-center justify-center" data-testid="cart-count">
                {count}
              </span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 border-2 border-zinc-800"
            data-testid="mobile-menu-btn"
          >
            <Menu size={18} />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t-2 border-zinc-900 bg-[#050505]" data-testid="mobile-menu">
          {["/", "/shop", "/shop?category=hoodies", "/shop?category=tees", "/shop?category=pants", "/shop?category=jackets"].map((to, idx) => (
            <Link
              key={idx}
              to={to}
              onClick={() => setMenuOpen(false)}
              className="block px-6 py-3 font-display uppercase tracking-wider border-b border-zinc-900 text-white hover:text-[#DFFF00]"
            >
              {["Home","Shop","Hoodies","Tees","Pants","Jackets"][idx]}
            </Link>
          ))}
          {user ? (
            <>
              <Link to="/my-orders" onClick={() => setMenuOpen(false)} className="block px-6 py-3 font-display uppercase tracking-wider border-b border-zinc-900 text-white">Mis pedidos</Link>
              <Link to="/admin" onClick={() => setMenuOpen(false)} className="block px-6 py-3 font-display uppercase tracking-wider border-b border-zinc-900 text-[#DFFF00]">Admin</Link>
              <button onClick={() => { setMenuOpen(false); logout(); }} className="block w-full text-left px-6 py-3 font-display uppercase tracking-wider text-[#FF007F]">Salir</button>
            </>
          ) : (
            <button onClick={() => { setMenuOpen(false); login(); }} className="block w-full text-left px-6 py-3 font-display uppercase tracking-wider text-[#DFFF00]" data-testid="mobile-login-btn">Ingresar con Google</button>
          )}
        </div>
      )}
    </header>
  );
};
