import React from 'react';
import { Users, ShoppingBag, Activity, ShieldAlert, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: 'Total Farmers', value: '1,284', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Buyers', value: '3,492', icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'AI Audits Completed', value: '14,802', icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const auditLogs = [
    { id: 'ADT-901', crop: 'Tomatoes', grade: 'A', time: '2 mins ago', status: 'Passed', statusColor: 'text-green-600 bg-green-50' },
    { id: 'ADT-902', crop: 'Wheat', grade: 'C', time: '15 mins ago', status: 'Flagged', statusColor: 'text-red-600 bg-red-50' },
    { id: 'ADT-903', crop: 'Potatoes', grade: 'B', time: '1 hour ago', status: 'Passed', statusColor: 'text-green-600 bg-green-50' },
    { id: 'ADT-904', crop: 'Rice', grade: 'A', time: '3 hours ago', status: 'Passed', statusColor: 'text-green-600 bg-green-50' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>
        <p className="text-gray-600">Platform metrics and AI forensics</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Recent AI Quality Audits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50/50 text-gray-500">
              <tr>
                <th className="px-6 py-4 font-medium">Audit ID</th>
                <th className="px-6 py-4 font-medium">Crop & Grade</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
                <th className="px-6 py-4 font-medium">Forensics Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-900">{log.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{log.crop}</span>
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-gray-100 text-gray-700 font-bold text-xs">
                        {log.grade}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{log.time}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${log.statusColor}`}>
                      {log.status === 'Passed' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
