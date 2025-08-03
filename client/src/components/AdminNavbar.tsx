// src/ui/AdminNavbar.tsx
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

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/home');
  };

  const linkBase =
    'block px-3 py-2 rounded-md text-sm font-medium transition-colors';
  const linkActive = 'text-white bg-teal-600';
  const linkInactive =
    'text-gray-700 hover:text-teal-700 hover:bg-teal-50';

  return (
    <nav className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top row */}
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <NavLink to="/admin/orders" className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-16 w-18" />
            <span className="text-lg sm:text-xl font-bold text-teal-700">
              Thul Dai Khaja Ghar — Admin
            </span>
          </NavLink>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              Active Order
            </NavLink>
            <NavLink
              to="/admin/panel"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              Active Panel
            </NavLink>
            <NavLink
              to="/admin/analysis"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              Active Analysis
            </NavLink>
            <NavLink
              to="/admin/profile"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
              end
            >
              Manage User
            </NavLink>

            {!user ? (
              <>
                <NavLink
                  to="/login"
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? linkActive
                        : 'text-teal-600 border border-teal-600 hover:bg-teal-50'
                    }`
                  }
                >
                  Login
                </NavLink>
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `${linkBase} ${
                      isActive
                        ? linkActive
                        : 'text-white bg-teal-600 hover:bg-teal-700'
                    }`
                  }
                >
                  Signup
                </NavLink>
              </>
            ) : (
              <button
                onClick={handleLogout}
                className="ml-2 inline-flex items-center rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {open ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4">
            <div className="space-y-1">
              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                onClick={() => setOpen(false)}
              >
                Active Order
              </NavLink>
              <NavLink
                to="/admin/panel"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                onClick={() => setOpen(false)}
              >
                Active Panel
              </NavLink>
              <NavLink
                to="/admin/analysis"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                onClick={() => setOpen(false)}
              >
                Active Analysis
              </NavLink>
              <NavLink
                to="/admin/profile"
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
                onClick={() => setOpen(false)}
              >
                Manage User
              </NavLink>

              {!user ? (
                <>
                  <NavLink
                    to="/login"
                    className={`${linkBase} text-teal-600 border border-teal-600 hover:bg-teal-50`}
                    onClick={() => setOpen(false)}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/signup"
                    className={`${linkBase} text-white bg-teal-600 hover:bg-teal-700`}
                    onClick={() => setOpen(false)}
                  >
                    Signup
                  </NavLink>
                </>
              ) : (
                <button
                  onClick={() => {
                    setOpen(false);
                    handleLogout();
                  }}
                  className="mt-1 inline-flex w-full items-center justify-center rounded-md bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
