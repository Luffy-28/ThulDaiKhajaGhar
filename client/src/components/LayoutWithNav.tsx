import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

import AdminNavbar from './AdminNavbar'; // ✅ default imports
import UserNavbar from './UserNavbar';

import { Outlet } from 'react-router-dom'; // ✅ use Outlet instead of children

export default function LayoutWithNav() {
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists()) {
            const data = snap.data();
            setRole(data.role === 'admin' ? 'admin' : 'user');
          } else {
            setRole('user');
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setRole('user');
        }
      } else {
        setRole(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Show navbar depending on role */}
      {role === 'admin' ? <AdminNavbar /> : <UserNavbar />}

      {/* Nested routes render here */}
      <div className="main-content">
        <Outlet />
      </div>
    </>
  );
}
