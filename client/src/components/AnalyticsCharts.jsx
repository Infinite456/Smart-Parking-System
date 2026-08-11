import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const PIE_COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a78bfa', '#64748b'];

const AnalyticsCharts = ({ data }) => {
  if (!data) return <p className="text-muted">Loading chart analytics...</p>;

  const { revenueAnalytics, peakHoursData, violationsData, evChargingDemandData } = data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
      {/* 1. Revenue Trends */}
      <div className="card">
        <h3>Revenue & Parking Sessions (Past 7 Days)</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={revenueAnalytics} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f1f5f9' }} />
              <Legend />
              <Area type="monotone" dataKey="revenue" name="Revenue (₹)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Peak Hours Occupancy */}
      <div className="card">
        <h3>Expected Hourly Occupancy vs EV Demand</h3>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <AreaChart data={evChargingDemandData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorEV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="hour" stroke="#475569" />
              <YAxis stroke="#475569" />
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f1f5f9' }} />
              <Legend />
              <Area type="monotone" dataKey="occupancy" name="Total Occupancy (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOcc)" />
              <Area type="monotone" dataKey="evDemand" name="EV Charging Load (%)" stroke="#ef4444" fillOpacity={1} fill="url(#colorEV)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Violations Breakdown */}
      <div className="card" style={{ gridColumn: 'span 2' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Violation Types Distribution</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', flexWrap: 'wrap' }}>
          <div style={{ width: '50%', height: 280, minWidth: '280px' }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={violationsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {violationsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#1f2937', color: '#f1f5f9' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {violationsData.map((entry, index) => (
              <div key={entry.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '16px', height: '16px', backgroundColor: PIE_COLORS[index % PIE_COLORS.length], borderRadius: '4px' }}></div>
                <span style={{ fontSize: '0.9rem' }}>{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
