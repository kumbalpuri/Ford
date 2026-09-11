import React from 'react';
import { useTraceability } from '../context/TraceabilityContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { Activity, AlertTriangle, Clock } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { boxes, dispatches, scDispatches, containmentNotices } = useTraceability();

  // 1. Throughput: Boxes packed per day (last 7 days)
  const throughputData = boxes.reduce((acc, box) => {
    const date = box.productionDate;
    if (!acc[date]) acc[date] = 0;
    acc[date]++;
    return acc;
  }, {} as Record<string, number>);

  const chartThroughput = Object.entries(throughputData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-7)
    .map(([date, count]) => ({ date, boxes: count }));

  // 2. Active Recalls
  const activeRecalls = containmentNotices.filter((n) => n.status !== 'ACKNOWLEDGED').length;

  // 3. Average Processing Time: Box packed -> Factory Dispatch
  const totalProcessingTime = dispatches.reduce((acc, dispatch) => {
    let dispatchTime = 0;
    dispatch.boxIds.forEach(id => {
      const box = boxes.find(b => b.id === id);
      if (box && box.factoryDispatchDate) {
        const packed = new Date(box.packedAt).getTime();
        const dispatched = new Date(box.factoryDispatchDate).getTime();
        dispatchTime += (dispatched - packed) / (1000 * 60 * 60 * 24); // days
      }
    });
    return acc + dispatchTime;
  }, 0);
  
  const totalBoxDispatches = dispatches.reduce((acc, d) => acc + d.boxIds.length, 0);
  const avgProcessingTime = totalBoxDispatches > 0 ? (totalProcessingTime / totalBoxDispatches).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">Performance Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-100 rounded-lg text-blue-700">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Total Boxes</p>
            <p className="text-2xl font-bold text-slate-900">{boxes.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-100 rounded-lg text-amber-700">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Active Recalls</p>
            <p className="text-2xl font-bold text-slate-900">{activeRecalls}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-100 rounded-lg text-emerald-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Avg. Dispatch Time (Days)</p>
            <p className="text-2xl font-bold text-slate-900">{avgProcessingTime}</p>
          </div>
        </div>
      </div>

      {/* Throughput Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <h3 className="text-sm font-bold text-slate-700 mb-4">Production Throughput (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartThroughput}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="boxes" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
