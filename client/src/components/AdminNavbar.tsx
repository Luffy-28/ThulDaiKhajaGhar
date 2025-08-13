import { NavLink, useNavigate } from 'react-router-dom';
import logo from '../assets/logo.svg';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';

export default function AdminNavbar() {
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

  return (
    <nav className="bg-[#F5F6F5] shadow-md fixed top-0 left-0 right-0 z-50 border-b border-[#4682B4]/20">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <NavLink to="/admin/orders" className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-16 w-16 mix-blend-multiply" />
          <span className="text-xl font-bold text-[#FF2400]">Thul Dai Admin Panel</span>
        </NavLink>

        <ul className="hidden md:flex gap-5 items-center text-[#0A5C36] font-medium">
          <li>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#FF2400] font-semibold'
                  : 'text-[#0A5C36] hover:text-[#FF2400] hover:underline transition-all duration-300'
              }
            >
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/panel"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#FF2400] font-semibold'
                  : 'text-[#0A5C36] hover:text-[#FF2400] hover:underline transition-all duration-300'
              }
            >
              Menu Panel
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/analysis"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#FF2400] font-semibold'
                  : 'text-[#0A5C36] hover:text-[#FF2400] hover:underline transition-all duration-300'
              }
            >
              Analysis
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#FF2400] font-semibold'
                  : 'text-[#0A5C36] hover:text-[#FF2400] hover:underline transition-all duration-300'
              }
            >
              Users
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/admin/inquiries"
              className={({ isActive }) =>
                isActive
                  ? 'text-[#FF2400] font-semibold'
                  : 'text-[#0A5C36] hover:text-[#FF2400] hover:underline transition-all duration-300'
              }
            >
              Inquiries
            </NavLink>
          </li>
           
          {!user ? (
            <>
              <li>
                <NavLink
                  to="/login"
                  className="px-3 py-1 border border-[#4682B4] text-[#0A5C36] rounded hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
                >
                  Login
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/signup"
                  className="px-3 py-1 bg-[#FF2400] text-[#F5F6F5] rounded hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
                >
                  Signup
                </NavLink>
              </li>
            </>
          ) : (
            <li>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-[#FF2400] text-[#F5F6F5] rounded hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
              >
                Logout
              </button>
            </li>
          )}
        </ul>

        <button
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden z-50 ml-2 h-10 w-10 flex items-center justify-center rounded-md text-[#0A5C36] hover:bg-[#FFC107] transition-all duration-300"
        >
          <div className="relative h-4 w-6">
            <span
              className={`absolute left-0 top-0 h-0.5 w-full bg-current transition-transform duration-500 ease-in-out ${
                open ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-current transition-opacity duration-300 ${
                open ? 'opacity-0' : 'opacity-100'
              }`}
            />
            <span
              className={`absolute left-0 bottom-0 h-0.5 w-full bg-current transition-transform duration-500 ease-in-out ${
                open ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </div>
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-500 md:hidden ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
      />

      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full bg-[#F5F6F5] shadow-xl transform transition-transform duration-700 ease-in-out md:hidden ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#4682B4]/20">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Logo" className="h-8 w-8" />
            <span className="font-semibold text-[#FF2400]">Thul Dai Admin</span>
          </div>
          <button
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-md text-[#0A5C36] hover:bg-[#FFC107] transition-all duration-300"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-[#0A5C36]"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 flex flex-col space-y-4">
          <NavLink
            to="/admin/orders"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                isActive ? 'text-[#F5F6F5] bg-[#FF2400]' : 'text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`
            }
          >
            Orders
          </NavLink>
          <NavLink
            to="/admin/panel"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                isActive ? 'text-[#F5F6F5] bg-[#FF2400]' : 'text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`
            }
          >
            Menu Panel
          </NavLink>
          <NavLink
            to="/admin/analysis"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                isActive ? 'text-[#F5F6F5] bg-[#FF2400]' : 'text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`
            }
          >
            Analysis
          </NavLink>
          <NavLink
            to="/admin/profile"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                isActive ? 'text-[#F5F6F5] bg-[#FF2400]' : 'text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`
            }
          >
            Users
          </NavLink>
           <NavLink
            to="/admin/inquiries"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-lg font-medium transition-all duration-300 ${
                isActive ? 'text-[#F5F6F5] bg-[#FF2400]' : 'text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`
            }
          >
            Inquiries
          </NavLink>
          {!user ? (
            <>
              <NavLink
                to="/login"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md text-[#0A5C36] border border-[#4682B4] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 rounded-md bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
              >
                Signup
              </NavLink>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="block w-full rounded-md bg-[#FF2400] px-3 py-2 text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
            >
              Logout
            </button>
          )}
        </div>
      </aside>
    </nav>
  );
}
