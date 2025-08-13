import React, { useEffect, useState } from "react";
import { collection, getDocs, Timestamp } from "firebase/firestore";
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
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly">(
    "daily"
  );
  const [showTopOnly, setShowTopOnly] = useState(true);

  const COLORS = ["#FF2400", "#0A5C36", "#FFC107", "#4682B4", "#F5F6F5"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const snap = await getDocs(collection(db, "orders"));
        const fetchedOrders: Order[] = snap.docs.map((doc) => {
          const data = doc.data();
          const createdAt =
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate()
              : new Date(data.createdAt);
          return {
            id: doc.id,
            ...data,
            createdAt,
          };
        }) as unknown as Order[];
        setOrders(fetchedOrders);
        processData(fetchedOrders, timeframe, showTopOnly);
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [timeframe, showTopOnly]);

  const processData = (
    ordersIn: Order[],
    tf: "daily" | "weekly" | "monthly",
    topOnly: boolean
  ) => {
    const now = new Date();
    let filtered: Order[] = [];

    if (tf === "daily") {
      const startOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );
      const endOfDay = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999
      );
      filtered = ordersIn.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startOfDay && orderDate <= endOfDay;
      });
    } else if (tf === "weekly") {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      filtered = ordersIn.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startOfWeek && orderDate <= endOfWeek;
      });
    } else if (tf === "monthly") {
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0
      );
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
      );
      filtered = ordersIn.filter((o) => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });
    }

    const itemCount: Record<string, number> = {};
    let totalSales = 0;

    filtered.forEach((order) => {
      const orderTotal = Number(order.total) || 0;
      totalSales += orderTotal;

      (order.items || []).forEach((item) => {
        const q = Number(item.quantity) || 0;
        itemCount[item.name] = (itemCount[item.name] || 0) + q;
      });
    });

    // Sort items by quantity desc
    let sortedBarData = Object.entries(itemCount)
      .map(([name, quantity]) => ({
        name,
        quantity,
      }))
      .sort((a, b) => b.quantity - a.quantity);

    // Limit to top 10 if toggle is on
    if (topOnly) {
      sortedBarData = sortedBarData.slice(0, 10);
    }

    const dateTotals: Record<string, number> = {};
    filtered.forEach((order) => {
      const d = new Date(order.createdAt);
      const key =
        tf === "daily"
          ? `${d.getHours().toString().padStart(2, "0")}:00`
          : d.toISOString().split("T")[0];
      dateTotals[key] =
        (dateTotals[key] || 0) + (Number(order.total) || 0);
    });

    const lineData = Object.entries(dateTotals)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => {
        if (tf === "daily") {
          return (
            parseInt(a.date.split(":")[0], 10) -
            parseInt(b.date.split(":")[0], 10)
          );
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

    const totalItems = sortedBarData.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0),
      0
    );
    const pieData = sortedBarData.map((it) => ({
      name: it.name,
      value: Number(it.quantity) || 0,
      percent:
        totalItems > 0
          ? ((Number(it.quantity) || 0) / totalItems) * 100
          : 0,
    }));

    setChartData({
      bar: sortedBarData,
      line: lineData,
      pie: pieData,
      totalSales,
    });
  };

  return (
    <div className="p-6 bg-[#F5F6F5] min-h-screen transition-all duration-300">
      <h1 className="text-3xl font-bold text-center text-[#FF2400] mb-6">
        📊 Sales Analysis Dashboard
      </h1>

      <div className="flex justify-center mb-6">
        <label
          htmlFor="timeframe"
          className="mr-3 font-medium text-[#0A5C36]"
        >
          Select Timeframe:
        </label>
        <select
          id="timeframe"
          value={timeframe}
          onChange={(e) =>
            setTimeframe(e.target.value as "daily" | "weekly" | "monthly")
          }
          className="px-4 py-2 border border-[#4682B4] rounded-md shadow-sm focus:ring-[#FFC107] focus:border-[#FFC107] text-[#0A5C36] hover:bg-[#FFC107] hover:text-[#0A5C36] hover:scale-105 hover:shadow-lg transition-all duration-300"
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </select>
      </div>

      {loading ? (
        <p className="text-center text-[#0A5C36] text-lg">
          Loading analysis...
        </p>
      ) : (
        <div className="space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
            <div className="bg-[#F5F6F5] p-6 rounded-lg shadow border border-[#4682B4] hover:border-[#FF2400] hover:scale-103 hover:shadow-xl transition-all duration-300">
              <p className="text-lg font-semibold text-[#0A5C36]">
                🛒 Items Sold
              </p>
              <p className="text-2xl font-bold text-[#FF2400]">
                {chartData.bar.reduce(
                  (sum, it) => sum + (Number(it.quantity) || 0),
                  0
                )}
              </p>
            </div>
            <div className="bg-[#F5F6F5] p-6 rounded-lg shadow border border-[#4682B4] hover:border-[#FF2400] hover:scale-103 hover:shadow-xl transition-all duration-300">
              <p className="text-lg font-semibold text-[#0A5C36]">
                💵 Total Sales
              </p>
              <p className="text-2xl font-bold text-[#0A5C36]">
                ${Number(chartData.totalSales || 0).toFixed(2)}
              </p>
            </div>
          </div>

          <div className="bg-[#F5F6F5] p-6 rounded-lg shadow hover:border-[#FF2400] hover:shadow-xl transition-all duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#FF2400]">
                📦 {showTopOnly ? "Top 10" : "All"} Items Sold
              </h2>
              <button
                onClick={() => setShowTopOnly(!showTopOnly)}
                className="px-4 py-1 bg-[#FFC107] text-[#0A5C36] rounded hover:bg-[#FF2400] hover:text-white transition"
              >
                {showTopOnly ? "Show All Items" : "Show Top 10"}
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.bar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4682B4" />
                <XAxis dataKey="name" stroke="#0A5C36" />
                <YAxis stroke="#0A5C36" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F5F6F5",
                    borderRadius: "8px",
                    border: "1px solid #4682B4",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Bar dataKey="quantity" barSize={20}>
                  {chartData.bar.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={index === 0 ? "#FF2400" : "#FFC107"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#F5F6F5] p-6 rounded-lg shadow hover:border-[#FF2400] hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">
              📈 Sales Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.line}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4682B4" />
                <XAxis dataKey="date" stroke="#0A5C36" />
                <YAxis stroke="#0A5C36" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F5F6F5",
                    borderRadius: "8px",
                    border: "1px solid #4682B4",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "10px" }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#FF2400"
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: "#FFC107" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#F5F6F5] p-6 rounded-lg shadow hover:border-[#FF2400] hover:shadow-xl transition-all duration-300">
            <h2 className="text-xl font-bold text-[#FF2400] mb-4">
              🥧 Item Distribution (%)
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.pie}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, percent }) =>
                    percent
                      ? `${name} (${percent.toFixed(1)}%)`
                      : name
                  }
                  labelLine={false}
                >
                  {chartData.pie.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#F5F6F5",
                    borderRadius: "8px",
                    border: "1px solid #4682B4",
                  }}
                />
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
