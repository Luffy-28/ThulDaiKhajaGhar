"use client";
import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import emailjs from 'emailjs-com';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from "../ui/alert-dialog";

interface Order {
  id: string;
  userId: string;
  name: string;
  phoneNumber: string;
  items: { name: string; price: number; quantity: number; image: string }[];
  total: number;
  status: string;
  createdAt: any;
  email?: string;
}

const AdminOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrevious, setShowPrevious] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");

  useEffect(() => {
    fetchCurrentOrders();
  }, []);

  const fetchCurrentOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const fetched: Order[] = snapshot.docs.map((d) => {
        const data = d.data() as any;
        return {
          id: d.id,
          userId: data.userDetails?.uid || '',
          name: data.userDetails?.name || 'Unknown',
          phoneNumber: data.userDetails?.phoneNumber || 'N/A',
          email: data.userDetails?.email || '',
          items: data.items || [],
          total: parseFloat(data.total) || 0,
          status: data.status || 'Pending',
          createdAt: data.createdAt?.toDate?.() || new Date(),
        };
      });

      setOrders(fetched.filter((o) => o.status !== 'Ready'));
      setPreviousOrders(fetched.filter((o) => o.status === 'Ready'));
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async (userId: string | undefined, message: string) => {
    if (!userId) return;
    try {
      const notifRef = collection(db, 'users', userId, 'notifications');
      await addDoc(notifRef, {
        message,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('❌ Failed to send notification:', err);
    }
  };

  const sendEmail = async (order: Order, status: string) => {
    try {
      if (!order.email) {
        console.warn(`⚠️ No email found for order ${order.id}`);
        return;
      }

      const itemListHTML = order.items
        .map(
          (item) =>
            `<li style="display:flex;align-items:center;margin-bottom:10px;">
              <img src="${item.image}" alt="${item.name}" style="width:60px;height:60px;border-radius:5px;object-fit:cover;margin-right:10px;" />
              <span style="font-size:14px;color:#0A5C36;">${item.name} × ${item.quantity}</span>
            </li>`
        )
        .join('');

      const message =
        status === 'Preparing'
          ? `Your order #${order.id} is now being prepared. We'll notify you once it's ready for pickup.`
          : `Your order #${order.id} is now ready for pickup!`;

      await emailjs.send(
        'service_r8ot6gr',
        'template_s1oegfr',
        {
          to_email: order.email,
          customer_name: order.name,
          order_id: order.id,
          order_items: itemListHTML,
          order_total: order.total.toFixed(2),
          order_status: status,
          order_message: message,
          year: new Date().getFullYear(),
        },
        '4GrhFYcHfMKnLVajx'
      );

      console.log(`✅ ${status} email sent to ${order.email}`);
    } catch (err) {
      console.error('❌ Failed to send email:', err);
    }
  };

  const updateOrderStatus = async (orderId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Preparing' : 'Ready';

    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });

      const updatedOrder = orders.find((o) => o.id === orderId);
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );

        if (newStatus === 'Ready') {
          setOrders((prev) => prev.filter((o) => o.id !== orderId));
          setPreviousOrders((prev) => [...prev, { ...updatedOrder, status: 'Ready' }]);
        }

        const msg =
          newStatus === 'Preparing'
            ? `Your order #${orderId} is now being prepared.`
            : `Your order #${orderId} is ready for pickup!`;
        await sendNotification(updatedOrder.userId, msg);

        await sendEmail(updatedOrder, newStatus);

        setAlertMessage(`✅ Order marked as "${newStatus}"`);
        setAlertOpen(true);
      }
    } catch (err) {
      console.error('❌ Error updating status:', err);
      setAlertMessage('❌ Failed to update status');
      setAlertOpen(true);
    }
  };

  return (
    <div className="p-6 bg-[#F5F6F5] min-h-screen transition-all duration-300">
      <h1 className="text-3xl font-extrabold text-[#FF2400] mb-8 text-center">
        📦 Manage Orders
      </h1>

      <div className="flex justify-center gap-4 mb-8">
        <button
          className={`px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 ${
            !showPrevious
              ? 'bg-[#FF2400] text-[#F5F6F5]'
              : 'bg-[#F5F6F5] border border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md'
          }`}
          onClick={() => setShowPrevious(false)}
        >
          Current Orders
        </button>
        <button
          className={`px-5 py-2 rounded-full text-sm font-medium shadow transition-all duration-300 ${
            showPrevious
              ? 'bg-[#FF2400] text-[#F5F6F5]'
              : 'bg-[#F5F6F5] border border-[#4682B4] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-md'
          }`}
          onClick={() => setShowPrevious(true)}
        >
          Previous Orders
        </button>
      </div>

      {loading ? (
        <p className="text-[#0A5C36] text-center">Loading orders...</p>
      ) : !showPrevious ? (
        orders.length === 0 ? (
          <p className="text-[#0A5C36] text-center">No current orders found.</p>
        ) : (
          <OrderList orders={orders} updateOrderStatus={updateOrderStatus} />
        )
      ) : previousOrders.length === 0 ? (
        <p className="text-[#0A5C36] text-center">No previous orders found.</p>
      ) : (
        <OrderList orders={previousOrders} updateOrderStatus={() => {}} />
      )}

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent className="bg-[#F5F6F5] border-[#4682B4]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#FF2400]">Order Status</AlertDialogTitle>
            <AlertDialogDescription className="text-[#0A5C36]">
              {alertMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-[#FF2400] text-[#F5F6F5] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:shadow-lg transition-all duration-300"
              onClick={() => setAlertOpen(false)}
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminOrders;

const OrderList = ({
  orders,
  updateOrderStatus,
}: {
  orders: Order[];
  updateOrderStatus: (id: string, currentStatus: string) => void;
}) => (
  <div className="space-y-6 max-w-5xl mx-auto">
    {orders.map((order) => (
      <div
        key={order.id}
        className="flex flex-col md:flex-row bg-[#F5F6F5] rounded-xl shadow-md p-4 gap-4 border border-[#4682B4] hover:border-[#FF2400] hover:scale-[1.02] hover:shadow-xl transition-all duration-300"
      >
        <img
          src={order.items[0]?.image || '/assets/placeholder.jpg'}
          alt={order.items[0]?.name || 'Order'}
          className="w-full md:w-36 h-36 object-cover rounded-lg border border-[#4682B4] hover:scale-105 transition-all duration-300"
        />

        <div className="flex-1 space-y-2">
          <h3 className="text-xl font-bold text-[#FF2400]">Order #{order.id}</h3>
          {order.userId && <p><span className="font-medium text-[#0A5C36]">UserID:</span> {order.userId}</p>}
          <p><span className="font-medium text-[#0A5C36]">Name:</span> {order.name}</p>
          <p><span className="font-medium text-[#0A5C36]">Phone:</span> {order.phoneNumber}</p>
          {order.email && <p><span className="font-medium text-[#0A5C36]">Email:</span> {order.email}</p>}
          <p><span className="font-medium text-[#0A5C36]">Status:</span> {order.status}</p>
          <p><span className="font-medium text-[#0A5C36]">Total:</span> ${order.total.toFixed(2)}</p>
          <div>
            <span className="font-medium text-[#0A5C36]">Items:</span>
            <ul className="list-disc ml-6 text-sm text-[#0A5C36]">
              {order.items.map((item, i) => (
                <li key={i}>
                  {item.name} × {item.quantity}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col justify-between items-start md:items-end">
          <p className="text-sm text-[#4682B4] mt-2 md:mt-0">
            {new Date(order.createdAt).toLocaleString()}
          </p>
          {order.status !== 'Ready' && (
            <button
              className={`px-4 py-1.5 rounded text-sm text-[#F5F6F5] mt-4 ${
                order.status === 'Pending'
                  ? 'bg-[#FFC107] hover:bg-[#FF2400]'
                  : 'bg-[#0A5C36] hover:bg-[#FFC107]'
              } hover:scale-105 hover:shadow-lg transition-all duration-300`}
              onClick={() => updateOrderStatus(order.id, order.status)}
            >
              {order.status === 'Pending' ? 'Preparing' : 'Ready'}
            </button>
          )}
        </div>
      </div>
    ))}
  </div>
);