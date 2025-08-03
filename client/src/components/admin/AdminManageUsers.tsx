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

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Add Form */}
      <div className="bg-white shadow rounded-lg p-6 max-w-xl mx-auto mb-10">
        <h2 className="text-xl font-bold mb-4 text-teal-700">Add New Employee</h2>
        <form onSubmit={handleAddUser} className="space-y-4">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <input
            type="password"
            placeholder="Temporary Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          {!hasPermission ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button type="button" className="w-full bg-teal-600 text-white py-2 rounded-md">
                  Choose Photo
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Photo Permission</AlertDialogTitle>
                  <AlertDialogDescription>
                    Do you have permission from this person to use their image?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border border-gray-300 rounded px-4 py-2">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-teal-600 text-white px-4 py-2 rounded"
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
              className="w-full bg-teal-600 text-white py-2 rounded-md"
              onClick={openFilePicker}
            >
              Choose Photo
            </button>
          )}

          {photoFile && (
            <div className="text-sm text-gray-600 flex items-center gap-2">
              ✅ Selected: {photoFile.name}
              <button
                type="button"
                className="text-red-500 hover:underline"
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

          <button type="submit" className="w-full bg-teal-700 text-white py-2 rounded-md">
            Add User
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Manage Accounts</h2>
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded-md ${tab === "users" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`px-4 py-2 rounded-md ${tab === "admins" ? "bg-teal-600 text-white" : "bg-gray-200 text-gray-800"}`}
            onClick={() => setTab("admins")}
          >
            Admins
          </button>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-left px-4 py-2">Photo</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Email</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-left px-4 py-2">Points</th>
                {tab === "admins" && <th className="text-left px-4 py-2">Reset</th>}
              </tr>
            </thead>
            <tbody>
              {(tab === "users" ? users : admins).map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-4 py-2">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-2">{u.name}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.phoneNumber || "—"}</td>
                  <td className="px-4 py-2">{u.points || 0}</td>
                  {tab === "admins" && (
                    <td className="px-4 py-2">
                      <button
                        className="text-blue-600 hover:underline"
                        onClick={() => handleResetPassword(u.email)}
                      >
                        Reset
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {(tab === "users" ? users : admins).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
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
