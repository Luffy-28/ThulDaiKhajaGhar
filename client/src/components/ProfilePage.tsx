import React, { useEffect, useRef, useState } from "react";
import { auth, db, storage } from "../firebase/config";
import {
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  where,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useUserTheme } from "../hooks/useUserTheme";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "./ui/alert-dialog";

interface OrderItem {
  name: string;
  image?: string;
  quantity: number;
}
interface Order {
  id: string;
  items: OrderItem[];
  total: number;
  status: string;
}
interface NotificationData {
  id: string;
  itemName: string;
  itemImage?: string;
  message: string;
}

export default function ProfilePage() {
  const [tab, setTab] = useState<"details" | "orders" | "track" | "theme" | "notifications">("details");
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loadingNotif, setLoadingNotif] = useState(true);

  // password change states
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { saveTheme } = useUserTheme();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserEmail(user.email || "");
      setPhotoURL(user.photoURL || null);

      const perm = localStorage.getItem("photoPermission");
      if (perm === "true") setHasPermission(true);

      getDoc(doc(db, "users", user.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setUserName(data.name || "");
          setUserPhone(data.phoneNumber || "");
          if (data.photoURL) setPhotoURL(data.photoURL);
        }
      });

      const qOrders = query(collection(db, "orders"), where("userId", "==", user.uid));
      getDocs(qOrders).then((snap) => {
        const fetched: Order[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          fetched.push({
            id: d.id,
            items: data.items || [],
            total: data.total || 0,
            status: data.status || "Pending",
          });
        });
        setOrders(fetched);
      });

      const notifRef = collection(db, "users", user.uid, "notifications");
      const notifQuery = query(notifRef, orderBy("timestamp", "desc"));
      const unsub = onSnapshot(notifQuery, (snap) => {
        const msgs: NotificationData[] = [];
        snap.forEach((d) => {
          const data = d.data() as any;
          msgs.push({
            id: d.id,
            itemName: data.itemName || "",
            itemImage: data.itemImage || "",
            message: data.message || "",
          });
        });
        setNotifications(msgs);
        setLoadingNotif(false);
      });
      return () => unsub();
    }
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/";
  };

  const handleUpdateDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      name: userName,
      phoneNumber: userPhone,
    });
    await updateProfile(user, { displayName: userName });
    alert("✅ Details updated!");
  };

  // Change password
  const handleChangePassword = async () => {
    const user = auth.currentUser;
    if (!user || !user.email) return alert("⚠️ User not found.");
    if (!currentPass || !newPass) return alert("⚠️ Please fill in both fields.");

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      alert("✅ Password updated successfully!");
      setCurrentPass("");
      setNewPass("");
    } catch (err: any) {
      alert("❌ " + err.message);
    }
  };

  const handleAvatarClick = () => {
    if (!hasPermission) {
      setShowPermissionDialog(true);
    } else {
      setShowChangeModal(true);
    }
  };

  const handleAllowPermission = () => {
    localStorage.setItem("photoPermission", "true");
    setHasPermission(true);
    setShowPermissionDialog(false);
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const user = auth.currentUser;
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const imgRef = ref(storage, `userPhotos/${user.uid}`);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    await updateDoc(doc(db, "users", user.uid), { photoURL: url });
    await updateProfile(user, { photoURL: url });
    setPhotoURL(url);
    alert("✅ Profile image updated!");
    setShowChangeModal(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-teal-700 mb-6">
          My Profile
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(["details", "orders", "track", "theme", "notifications"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                tab === t ? "bg-teal-600 text-white border-teal-600" : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {t === "details" && "User Details"}
              {t === "orders" && "Past Orders"}
              {t === "track" && "Track Order"}
              {t === "theme" && "Themes"}
              {t === "notifications" && "Notifications"}
            </button>
          ))}
          <button
            className="ml-auto rounded-full bg-red-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-600"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* DETAILS */}
        {tab === "details" && (
          <form
            onSubmit={handleUpdateDetails}
            className="rounded-xl bg-white p-6 shadow space-y-4"
          >
            <h2 className="text-xl font-bold text-gray-900">Your Details</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={photoURL || "/default-avatar.png"}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-teal-600 cursor-pointer"
                  onClick={handleAvatarClick}
                />
              </div>

              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageSelect}
                className="hidden"
              />
            </div>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Name</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                value={userEmail}
                disabled
                className="mt-1 w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-gray-700">Phone</span>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </label>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="rounded-md bg-teal-600 px-4 py-2 text-white font-semibold hover:bg-teal-700"
              >
                Update Details
              </button>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t">
              <h3 className="text-base font-semibold text-gray-900 mb-2">
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-md bg-teal-600 px-4 py-2 text-white font-semibold hover:bg-teal-700"
                  onClick={handleChangePassword}
                >
                  Change Password
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Modal for changing photo */}
        {showChangeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-gray-900 mb-3">Profile Photo</h3>
              <img
                src={photoURL || "/default-avatar.png"}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-teal-600 mx-auto mb-4"
              />
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowChangeModal(false)}
                >
                  Close
                </button>
                <button
                  className="rounded-md bg-teal-600 px-4 py-2 text-white hover:bg-teal-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </button>
              </div>
            </div>
          </div>
        )}

        {/* First-time permission dialog */}
        {showPermissionDialog && (
          <AlertDialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Allow Photo Upload?</AlertDialogTitle>
                <AlertDialogDescription>
                  We need your permission to upload and store your profile photo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setShowPermissionDialog(false)}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleAllowPermission}>Allow</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Past Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-600">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-700">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Order ID</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {o.items[0]?.image ? (
                            <img
                              src={o.items[0].image}
                              alt={o.items[0].name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{o.id}</td>
                        <td className="px-3 py-2">${o.total.toFixed(2)}</td>
                        <td className="px-3 py-2">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRACK */}
        {tab === "track" && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Track Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-600">No active orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50 text-gray-700">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Order ID</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0">
                        <td className="px-3 py-2">
                          {o.items[0]?.image ? (
                            <img
                              src={o.items[0].image}
                              alt={o.items[0].name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-2">{o.id}</td>
                        <td className="px-3 py-2">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* THEMES */}
        {tab === "theme" && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Select Theme</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "System", value: "system" },
                { name: "Light", value: "light" },
                { name: "Dark", value: "dark" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => saveTheme(opt.value as any)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div className="rounded-xl bg-white p-6 shadow">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Notifications</h2>
            {loadingNotif ? (
              <p className="text-gray-600">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-gray-600">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center gap-3 rounded-lg border border-gray-200 p-3"
                  >
                    {n.itemImage ? (
                      <img
                        src={n.itemImage}
                        alt={n.itemName}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-gray-200" />
                    )}
                    <div>
                      <strong className="block text-gray-900">{n.itemName}</strong>
                      <p className="text-sm text-gray-700">{n.message}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
