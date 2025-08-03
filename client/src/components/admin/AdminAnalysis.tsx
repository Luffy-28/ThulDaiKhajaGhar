import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase/config";
import type { MenuItem } from "../../firebase/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Order {
  id: string;
  createdAt: Date;
  items: (MenuItem & { quantity: number })[];
  total: number | string;
  status: string;
}

interface ChartData {
  bar: { name: string; quantity: number }[];
  line: { date: string; total: number }[];
  pie: { name: string; value: number; percent?: number }[];
  totalSales: number;
}

const AdminAnalysis: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartData>({
    bar: [],
    line: [],
    pie: [],
    totalSales: 0,
  });
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">("daily");

  const COLORS = ["#3578b3ff", "#00C49F", "#FFBB28", "#FF8042", "#845EC2", "#D65DB1", "#FF6F91"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "orders"));
        const fetchedOrders: Order[] = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: (doc.data() as any).createdAt?.toDate?.() ?? new Date(),
        })) as unknown as Order[];
        setOrders(fetchedOrders);
        processData(fetchedOrders, timeframe);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [timeframe]);

  const processData = (ordersIn: Order[], tf: "daily" | "weekly" | "monthly") => {
    const now = new Date(); // use current time
    let filtered: Order[] = [];

    if (tf === "daily") {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      filtered = ordersIn.filter((o) => new Date(o.createdAt) >= startOfDay);
    } else if (tf === "weekly") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      startOfWeek.setDate(startOfWeek.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      filtered = ordersIn.filter((o) => new Date(o.createdAt) >= startOfWeek);
    } else {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      filtered = ordersIn.filter((o) => new Date(o.createdAt) >= startOfMonth);
    }

    const itemCount: Record<string, number> = {};
    let totalSales = 0;

    filtered.forEach((order) => {
      const orderTotal = Number(order.total) || 0;
      totalSales += orderTotal;

      (order.items || []).forEach((item) => {
        const q = Number((item as any).quantity) || 0;
        itemCount[item.name] = (itemCount[item.name] || 0) + q;
      });
    });

    const barData = Object.entries(itemCount).map(([name, quantity]) => ({
      name,
      quantity,
    }));

    const dateTotals: Record<string, number> = {};
    filtered.forEach((order) => {
      const d = new Date(order.createdAt);
      const key = tf === "daily" ? d.toLocaleTimeString() : d.toLocaleDateString();
      dateTotals[key] = (dateTotals[key] || 0) + (Number(order.total) || 0);
    });

    const lineData = Object.entries(dateTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => {
        const da = new Date(a.date).getTime();
        const db = new Date(b.date).getTime();
        return (isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db);
      });

    const totalItems = barData.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0);
    const pieData = barData.map((it) => ({
      name: it.name,
      value: Number(it.quantity) || 0,
      percent: totalItems > 0 ? ((Number(it.quantity) || 0) / totalItems) * 100 : 0,
    }));

    setChartData({ bar: barData, line: lineData, pie: pieData, totalSales });
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-center text-teal-800 mb-6">
        📊 Sales Analysis Dashboard
      </h1>

      <div className="flex justify-center mb-6">
        <label htmlFor="timeframe" className="mr-3 font-medium text-gray-700">
          Select Timeframe:
        </label>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value as "daily" | "weekly" | "monthly")}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-600 text-lg">Loading analysis...</p>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-lg font-semibold text-gray-600">🛒 Items Sold</p>
              <p className="text-2xl font-bold text-teal-700">
                {chartData.bar.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0)}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-lg font-semibold text-gray-600">💵 Total Sales</p>
              <p className="text-2xl font-bold text-green-600">
                ${Number(chartData.totalSales || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📦 Items Sold</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.bar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="name" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none" }} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="quantity" fill="#14b8a6" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-700 mb-4">📈 Sales Over Time</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.line}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none" }} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold text-gray-700 mb-4">🥧 Item Distribution (%)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.pie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) => (percent ? `${name} (${percent.toFixed(1)}%)` : name)}
                  labelLine={false}
                >
                  {chartData.pie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "none" }} />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalysis;
