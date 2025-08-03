import { NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../firebase/config';
import { useEffect, useState } from 'react';
import logo from '../assets/logo.svg';

export default function UserNavbar() {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const handleLogout = async () => {
    await auth.signOut();
    setOpen(false);
    navigate('/home');
  };

  const linkBase = 'block px-3 py-2 rounded-md text-lg font-medium transition-colors';
  const linkActive = 'text-white bg-teal-600';
  const linkInactive = 'text-gray-700 hover:text-teal-700 hover:bg-teal-50';

  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <NavLink to="/home" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-16 w-16" />
          <span className="text-xl font-bold text-teal-700">Thul Dai Khaja Ghar</span>
        </NavLink>

        <ul className="hidden md:flex gap-5 items-center text-gray-700 font-medium">
          <li><NavLink to="/home" className={({ isActive }) => isActive ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}>Home</NavLink></li>
          <li><NavLink to="/menu" className={({ isActive }) => isActive ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}>Menu</NavLink></li>
          <li><NavLink to="/cart" className={({ isActive }) => isActive ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}>Cart</NavLink></li>
          <li><NavLink to="/contact" className={({ isActive }) => isActive ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}>Contact</NavLink></li>
          <li><NavLink to="/profile" className={({ isActive }) => isActive ? 'text-teal-600 font-semibold' : 'hover:text-teal-600'}>Profile</NavLink></li>
          {!user ? (
            <>
              <li><NavLink to="/login" className="px-3 py-1 border border-teal-600 text-teal-600 rounded hover:bg-teal-50">Login</NavLink></li>
              <li><NavLink to="/signup" className="px-3 py-1 bg-teal-600 text-white rounded hover:bg-teal-700">Signup</NavLink></li>
            </>
          ) : (
            <li><button onClick={handleLogout} className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">Logout</button></li>
          )}
        </ul>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden z-50 ml-2 h-10 w-10 flex items-center justify-center rounded-md text-teal-700 hover:bg-gray-100"
        >
          <div className="relative h-4 w-6">
            <span className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform duration-500 ease-in-out ${open ? 'translate-y-2 rotate-45' : ''}`} />
            <span className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition-opacity duration-300 ${open ? 'opacity-0' : 'opacity-100'}`} />
            <span className={`absolute left-0 bottom-0 h-0.5 w-full bg-current transition-transform duration-500 ease-in-out ${open ? '-translate-y-2 -rotate-45' : ''}`} />
          </div>
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 md:hidden ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full bg-white shadow-xl transform transition-transform duration-700 ease-in-out md:hidden
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b shadow-sm">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <span className="font-semibold text-teal-700">Thul Dai Khaja Ghar</span>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-gray-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col space-y-4">
          <NavLink to="/home" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Home</NavLink>
          <NavLink to="/menu" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Menu</NavLink>
          <NavLink to="/cart" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Cart</NavLink>
          <NavLink to="/contact" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Contact</NavLink>
          <NavLink to="/profile" onClick={() => setOpen(false)} className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkInactive}`}>Profile</NavLink>
          {!user ? (
            <>
              <NavLink to="/login" onClick={() => setOpen(false)} className="text-teal-600 border border-teal-600 rounded px-3 py-2 hover:bg-teal-50">Login</NavLink>
              <NavLink to="/signup" onClick={() => setOpen(false)} className="text-white bg-teal-600 px-3 py-2 rounded hover:bg-teal-700">Signup</NavLink>
            </>
          ) : (
            <button onClick={handleLogout} className="w-full rounded-md bg-red-500 px-3 py-2 text-white hover:bg-red-600">Logout</button>
          )}
        </div>
      </aside>
    </nav>
  );
}
