import React, { useEffect, useRef, useState } from "react";
import { auth, db, storage } from "../firebase/config";
import {
  signOut,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "react-toastify";
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
  const [tab, setTab] = useState<"details" | "orders" | "track" | "notifications">("details");
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [loadingNotif, setLoadingNotif] = useState<boolean>(true);
  const [currentPass, setCurrentPass] = useState<string>("");
  const [newPass, setNewPass] = useState<string>("");
  const [showChangeModal, setShowChangeModal] = useState<boolean>(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState<boolean>(false);
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const user: User | null = auth.currentUser;
    if (!user) return;

    setUserEmail(user.email || "");
    setPhotoURL(user.photoURL || null);

    const perm = localStorage.getItem("photoPermission");
    if (perm === "true") setHasPermission(true);

    // Load profile doc
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data() as DocumentData;
        setUserName(data.name || "");
        setUserPhone(data.phoneNumber || "");
        if (data.photoURL) setPhotoURL(data.photoURL);
      }
    });

    // ========= ORDERS (realtime) =========
    // Your saved structure uses: userDetails.uid, paymentStatus, total as string (toFixed)
    // Path assumed: collection("orders")
    const ordersRef = collection(db, "orders");
    const ordersQ = query(ordersRef, where("userDetails.uid", "==", user.uid));
    const unsubOrders = onSnapshot(
      ordersQ,
      (snap) => {
        const fetched: Order[] = snap.docs.map((d) => {
          const data = d.data() as any;
          // Map items safely
          const items: OrderItem[] = Array.isArray(data.items)
            ? data.items.map((it: any) => ({
                name: String(it?.name ?? ""),
                image: it?.image ? String(it.image) : undefined,
                quantity: Number(it?.quantity ?? 0),
              }))
            : [];

          // total saved as string via toFixed(2) -> parseFloat
          const total =
            typeof data.total === "number"
              ? data.total
              : parseFloat(String(data.total ?? "0"));

          // status comes from paymentStatus in your payload
          const status = String(data.paymentStatus ?? data.status ?? "Pending");

          return {
            id: d.id,
            items,
            total: isNaN(total) ? 0 : total,
            status,
          };
        });

        // Optional: newest first (by createdAt ISO string if present)
        fetched.sort((a, b) => {
          const aCreated = snap.docs.find((x) => x.id === a.id)?.data()?.createdAt ?? "";
          const bCreated = snap.docs.find((x) => x.id === b.id)?.data()?.createdAt ?? "";
          return String(bCreated).localeCompare(String(aCreated));
        });

        console.debug("[orders] fetched:", fetched);
        setOrders(fetched);
      },
      (err) => {
        console.error("[orders] onSnapshot error:", err);
        toast.error("Failed to load orders.");
      }
    );

    // ========= NOTIFICATIONS (realtime) =========
    const notifRef = collection(db, "users", user.uid, "notifications");
    const notifQ = query(notifRef, orderBy("timestamp", "desc"));
    const unsubNotif = onSnapshot(
      notifQ,
      (snap) => {
        const msgs: NotificationData[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            itemName: data.itemName || "",
            itemImage: data.itemImage || "",
            message: data.message || "",
          };
        });
        setNotifications(msgs);
        setLoadingNotif(false);
      },
      (err) => {
        console.error("[notifications] onSnapshot error:", err);
        setLoadingNotif(false);
      }
    );

    return () => {
      unsubOrders();
      unsubNotif();
    };
  }, []);

  const handleLogout = async (): Promise<void> => {
    await signOut(auth);
    toast.success("Logged out successfully!");
    window.location.href = "/";
  };

  const handleUpdateDetails = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    const user: User | null = auth.currentUser;
    if (!user) return;
    await updateDoc(doc(db, "users", user.uid), {
      name: userName,
      phoneNumber: userPhone,
    });
    await updateProfile(user, { displayName: userName });
    toast.success("✅ Details updated!");
  };

  const handleChangePassword = async (): Promise<void> => {
    const user: User | null = auth.currentUser;
    if (!user || !user.email) return alert("⚠️ User not found.");
    if (!currentPass || !newPass) return alert("⚠️ Please fill in both fields.");

    try {
      const cred = EmailAuthProvider.credential(user.email, currentPass);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPass);
      toast.success("✅ Password updated successfully!");
      setCurrentPass("");
      setNewPass("");
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleAvatarClick = (): void => {
    if (!hasPermission) {
      setShowPermissionDialog(true);
    } else {
      setShowChangeModal(true);
    }
  };

  const handleAllowPermission = (): void => {
    localStorage.setItem("photoPermission", "true");
    setHasPermission(true);
    setShowPermissionDialog(false);
    fileInputRef.current?.click();
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const user: User | null = auth.currentUser;
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const imgRef = ref(storage, `userPhotos/${user.uid}`);
    await uploadBytes(imgRef, file);
    const url = await getDownloadURL(imgRef);
    await updateDoc(doc(db, "users", user.uid), { photoURL: url });
    await updateProfile(user, { photoURL: url });
    setPhotoURL(url);
    toast.success("✅ Profile image updated!");
    setShowChangeModal(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F5] py-8 px-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#FF2400] mb-6">
          My Profile
        </h1>

        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          {(["details", "orders", "track", "notifications"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${
                tab === t
                  ? 'bg-[#FF2400] text-[#F5F6F5] border-[#FF2400]'
                  : 'bg-[#F5F6F5] text-[#0A5C36] border-[#4682B4] hover:bg-[#FFC107] hover:text-[#0A5C36]'
              }`}
            >
              {t === "details" && "User Details"}
              {t === "orders" && "Past Orders"}
              {t === "track" && "Track Order"}
              {t === "notifications" && "Notifications"}
            </button>
          ))}
          <button
            className="ml-auto rounded-full bg-[#FF2400] px-3 py-1.5 text-sm font-semibold text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>

        {/* DETAILS */}
        {tab === "details" && (
          <form
            onSubmit={handleUpdateDetails}
            className="rounded-xl bg-[#F5F6F5] p-6 shadow border border-[#4682B4]/20 space-y-4"
          >
            <h2 className="text-xl font-bold text-[#FF2400]">Your Details</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={photoURL || "/default-avatar.png"}
                  alt="Profile"
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-[#FF2400] cursor-pointer hover:ring-[#FFC107] hover:scale-105 transition-all duration-300"
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
              <span className="text-sm font-medium text-[#0A5C36]">Name</span>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#0A5C36]">Email</span>
              <input
                type="email"
                value={userEmail}
                disabled
                className="mt-1 w-full rounded-md border border-[#4682B4]/20 bg-[#F5F6F5]/50 px-3 py-2 text-[#4682B4]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-[#0A5C36]">Phone</span>
              <input
                type="tel"
                value={userPhone}
                onChange={(e) => setUserPhone(e.target.value)}
                className="mt-1 w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
              />
            </label>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="rounded-md bg-[#FF2400] px-4 py-2 text-[#F5F6F5] font-semibold hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
              >
                Update Details
              </button>
            </div>

            {/* Change Password */}
            <div className="pt-4 border-t border-[#4682B4]/20">
              <h3 className="text-base font-semibold text-[#FF2400] mb-2">
                Change Password
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={currentPass}
                  onChange={(e) => setCurrentPass(e.target.value)}
                  className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="w-full rounded-md border border-[#4682B4] px-3 py-2 text-[#0A5C36] placeholder-[#4682B4] focus:border-[#FFC107] focus:ring-[#FFC107] hover:border-[#FFC107] hover:shadow-md focus:outline-none transition-all duration-300"
                />
              </div>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="rounded-md bg-[#FF2400] px-4 py-2 text-[#F5F6F5] font-semibold hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
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
            <div className="w-full max-w-md rounded-xl bg-[#F5F6F5] p-6 shadow-xl border border-[#4682B4]/20">
              <h3 className="text-lg font-bold text-[#FF2400] mb-3">Profile Photo</h3>
              <img
                src={photoURL || "/default-avatar.png"}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-[#FF2400] mx-auto mb-4 hover:ring-[#FFC107] hover:scale-105 transition-all duration-300"
              />
              <div className="flex justify-end gap-3">
                <button
                  className="rounded-md border border-[#4682B4] px-4 py-2 text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
                  onClick={() => setShowChangeModal(false)}
                >
                  Close
                </button>
                <button
                  className="rounded-md bg-[#FF2400] px-4 py-2 text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
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
                <AlertDialogTitle className="text-[#FF2400]">Allow Photo Upload?</AlertDialogTitle>
                <AlertDialogDescription className="text-[#0A5C36]">
                  We need your permission to upload and store your profile photo.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md transition-all duration-300"
                  onClick={() => setShowPermissionDialog(false)}
                >
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  className="bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-md transition-all duration-300"
                  onClick={handleAllowPermission}
                >
                  Allow
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* ORDERS */}
        {tab === "orders" && (
          <div className="rounded-xl bg-[#F5F6F5] p-6 shadow border border-[#4682B4]/20">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">Past Orders</h2>
            {orders.length === 0 ? (
              <p className="text-[#4682B4]">No orders found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-[#F5F6F5] text-[#0A5C36]">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Order ID</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0 border-[#4682B4]/20 hover:bg-[#FFC107]/10 transition-all duration-300">
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
                        <td className="px-3 py-2 text-[#0A5C36]">{o.id}</td>
                        <td className="px-3 py-2 text-[#0A5C36]">${o.total.toFixed(2)}</td>
                        <td className="px-3 py-2 text-[#0A5C36]">{o.status}</td>
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
          <div className="rounded-xl bg-[#F5F6F5] p-6 shadow border border-[#4682B4]/20">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">Track Orders</h2>
            {orders.length === 0 ? (
              <p className="text-[#4682B4]">No active orders.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-[#F5F6F5] text-[#0A5C36]">
                      <th className="px-3 py-2">Image</th>
                      <th className="px-3 py-2">Order ID</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b last:border-0 border-[#4682B4]/20 hover:bg-[#FFC107]/10 transition-all duration-300">
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
                        <td className="px-3 py-2 text-[#0A5C36]">{o.id}</td>
                        <td className="px-3 py-2 text-[#0A5C36]">{o.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {/* NOTIFICATIONS */}
        {tab === "notifications" && (
          <div className="rounded-xl bg-[#F5F6F5] p-6 shadow border border-[#4682B4]/20">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">Notifications</h2>
            {loadingNotif ? (
              <p className="text-[#4682B4]">Loading...</p>
            ) : notifications.length === 0 ? (
              <p className="text-[#4682B4]">No notifications yet.</p>
            ) : (
              <ul className="space-y-3">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-center gap-3 rounded-lg border border-[#4682B4]/20 p-3 hover:border-[#FF2400] hover:shadow-md transition-all duration-300"
                  >
                    {n.itemImage ? (
                      <img
                        src={n.itemImage}
                        alt={n.itemName}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-[#F5F6F5]" />
                    )}
                    <div>
                      <strong className="block text-[#0A5C36]">{n.itemName}</strong>
                      <p className="text-sm text-[#0A5C36]">{n.message}</p>
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