'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Dashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) console.error(error);
    else setOrders(data || []);
    setLoading(false);
  };

  // Группировка по дням + красивый формат даты
  const chartData = orders.reduce((acc: any[], order) => {
    const dateObj = new Date(order.created_at);
    const date = dateObj.toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    });

    const sum = Number(order.total_sum) || 0;

    const existing = acc.find(item => item.date === date);
    if (existing) {
      existing.sum += sum;
      existing.count += 1;
    } else {
      acc.push({ date, sum, count: 1 });
    }
    return acc;
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total_sum) || 0), 0);
  const avgCheck = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  if (loading) return <div className="flex min-h-screen items-center justify-center">Загрузка...</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="text-4xl">📊</div>
          <h1 className="text-4xl font-bold text-gray-900">Дашборд заказов</h1>
        </div>
        <p className="text-gray-600 mb-10">RetailCRM → Supabase → Vercel</p>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow">
            <p className="text-gray-500">Всего заказов</p>
            <p className="text-4xl font-bold text-blue-600">{totalOrders}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow">
            <p className="text-gray-500">Общая выручка</p>
            <p className="text-4xl font-bold text-green-600">
              {totalRevenue.toLocaleString('ru-RU')} ₸
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow">
            <p className="text-gray-500">Средний чек</p>
            <p className="text-4xl font-bold text-purple-600">
              {avgCheck.toLocaleString('ru-RU')} ₸
            </p>
          </div>
        </div>

        {/* График */}
        <div className="bg-white p-8 rounded-3xl shadow">
          <h2 className="text-2xl font-semibold mb-6">Динамика выручки по дням</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={420}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => [`${value.toLocaleString('ru-RU')} ₸`, 'Выручка']} 
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sum" 
                  stroke="#3b82f6" 
                  strokeWidth={5} 
                  dot={{ r: 8, fill: '#3b82f6' }}
                  name="Выручка"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p>Нет данных для графика</p>
          )}
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          Данные обновляются из RetailCRM через Supabase • Деплой на Vercel
        </p>
      </div>
    </div>
  );
}