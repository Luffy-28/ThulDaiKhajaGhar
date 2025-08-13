import React, { useEffect, useRef, useState } from "react";
import {
  collection,
  getDocs,
  doc,
  setDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "../../firebase/config";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../ui/alert-dialog";

interface UserData {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  points?: number;
  photoURL?: string;
  role?: string;
}

export default function AdminManageUsers() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const [tab, setTab] = useState<"users" | "admins">("users");
  const [users, setUsers] = useState<UserData[]>([]);
  const [admins, setAdmins] = useState<UserData[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const snap = await getDocs(collection(db, "users"));
      const u: UserData[] = [];
      const a: UserData[] = [];
      snap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const entry: UserData = {
          id: docSnap.id,
          name: data.name || "",
          email: data.email || "",
          phoneNumber: data.phoneNumber || "",
          points: data.points || 0,
          photoURL: data.photoURL || "",
          role: data.role || "user",
        };
        if (entry.role === "admin") {
          a.push(entry);
        } else {
          u.push(entry);
        }
      });
      setUsers(u);
      setAdmins(a);
    };
    fetchData();
  }, []);

  const openFilePicker = () => fileInputRef.current?.click();

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) setPhotoFile(file);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      let photoURL = "";
      if (photoFile) {
        const imgRef = ref(storage, `userPhotos/${userCred.user.uid}`);
        await uploadBytes(imgRef, photoFile);
        photoURL = await getDownloadURL(imgRef);
      }
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        name,
        role,
        points: 0,
        photoURL,
      });
      alert("✅ New user added successfully!");
      setEmail("");
      setName("");
      setPassword("");
      setRole("user");
      setPhotoFile(null);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`✅ Password reset email sent to ${email}`);
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  };

  async function handleDeleteUser(id: string): Promise<void> {
    if (!window.confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      return;
    }
    try {
      await setDoc(doc(db, "users", id), { deleted: true }, { merge: true });
      setAdmins((prev) => prev.filter((admin) => admin.id !== id));
      alert("✅ Admin deleted successfully!");
    } catch (err: any) {
      alert(`❌ ${err.message}`);
    }
  }
  return (
    <div className="p-6 bg-[#F5F6F5] min-h-screen transition-all duration-300">
      {/* Add Form */}
      <div className="bg-[#F5F6F5] shadow rounded-lg p-6 max-w-xl mx-auto mb-10 border border-[#4682B4] hover:border-[#FF2400] hover:shadow-xl transition-all duration-300">
        <h2 className="text-xl font-bold mb-4 text-[#FF2400]">Add New Employee</h2>
        <form onSubmit={handleAddUser} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[#4682B4] rounded-md text-[#0A5C36] focus:ring-[#FFC107] focus:border-[#FFC107] hover:border-[#FFC107] hover:shadow-md transition-all duration-300"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[#4682B4] rounded-md text-[#0A5C36] focus:ring-[#FFC107] focus:border-[#FFC107] hover:border-[#FFC107] hover:shadow-md transition-all duration-300"
          />
          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-[#4682B4] rounded-md text-[#0A5C36] focus:ring-[#FFC107] focus:border-[#FFC107] hover:border-[#FFC107] hover:shadow-md transition-all duration-300"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-[#4682B4] rounded-md text-[#0A5C36] focus:ring-[#FFC107] focus:border-[#FFC107] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {!hasPermission ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  type="button"
                  className="w-full bg-[#FF2400] text-[#F5F6F5] py-2 rounded-md hover:bg-[#FFC107] hover:scale-105 hover:shadow-lg transition-all duration-300"
                >
                  Choose Photo
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-[#F5F6F5] border-[#4682B4]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-[#FF2400]">Photo Permission</AlertDialogTitle>
                  <AlertDialogDescription className="text-[#0A5C36]">
                    Do you have permission from this person to use their image?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300"
                    onClick={() => {
                      setHasPermission(true);
                      setTimeout(() => openFilePicker(), 0);
                    }}
                  >
                    Yes
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <button
              type="button"
              className="w-full bg-[#FF2400] text-[#F5F6F5] py-2 rounded-md hover:bg-[#FFC107] hover:scale-105 hover:shadow-lg transition-all duration-300"
              onClick={openFilePicker}
            >
              Choose Photo
            </button>
          )}

          {photoFile && (
            <div className="text-sm text-[#0A5C36] flex items-center gap-2">
              ✅ Selected: {photoFile.name}
              <button
                type="button"
                className="text-[#FF2400] hover:text-[#FFC107] hover:underline transition-all duration-300"
                onClick={() => setPhotoFile(null)}
              >
                Remove
              </button>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
          />

          <button
            type="submit"
            className="w-full bg-[#0A5C36] text-[#F5F6F5] py-2 rounded-md hover:bg-[#FFC107] hover:scale-105 hover:shadow-lg transition-all duration-300"
          >
            Add User
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-[#FF2400] mb-4">Manage Accounts</h2>
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${
              tab === "users"
                ? "bg-[#FF2400] text-[#F5F6F5]"
                : "bg-[#F5F6F5] text-[#0A5C36] border border-[#4682B4] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md"
            } transition-all duration-300`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 rounded-md ${
              tab === "admins"
                ? "bg-[#FF2400] text-[#F5F6F5]"
                : "bg-[#F5F6F5] text-[#0A5C36] border border-[#4682B4] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md"
            } transition-all duration-300`}
            onClick={() => setTab("admins")}
          >
            Admins
          </button>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#F5F6F5] shadow rounded-lg border border-[#4682B4]">
            <thead className="bg-[#4682B4] text-[#F5F6F5]">
              <tr>
                <th className="text-left px-4 py-2">Photo</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Phone</th>
               <th className="text-left px-4 py-2">Reset</th>
                {tab === "users" && <th className="text-left px-4 py-2">Points</th>}
                {tab === "admins" && <th className="text-left px-4 py-2">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {(tab === "users" ? users : admins).map((u) => (
                <tr
                  key={u.id}
                  className="border-t border-[#4682B4] hover:bg-[#FFC107]/20 hover:border-[#FF2400] transition-all duration-300"
                >
                  <td className="px-4 py-2">
                    {u.photoURL ? (
                      <img
                        src={u.photoURL}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover hover:scale-110 transition-all duration-300"
                      />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2 text-[#0A5C36]">{u.name}</td>
                  <td className="px-4 py-2 text-[#0A5C36]">{u.email}</td>
                  <td className="px-4 py-2 text-[#0A5C36]">{u.phoneNumber || "—"}</td>
                    <td className="px-4 py-2">
                      <button
                        className="text-[#4682B4] hover:text-[#FF2400] hover:underline transition-all duration-300"
                        onClick={() => handleResetPassword(u.email)}
                      >
                        Reset
                      </button>
                    </td>
                  {tab === "admins" && (
                    <td className="px-4 py-2">
                      <button
                        className="text-[#4682B4] hover:text-[#FF2400] hover:underline transition-all duration-300"
                        onClick={() => handleDeleteUser(u.id)}
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {(tab === "users" ? users : admins).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-[#0A5C36]">
                    No {tab} found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}