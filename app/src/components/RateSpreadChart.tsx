"use client";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RateSpreadChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) return <div className="h-full w-full flex items-center justify-center text-outline">Loading chart data...</div>;

  // Format data for Recharts
  const chartData = data.filter((d) => Number.isFinite(Number(d.capesize_rate)) && Number.isFinite(Number(d.panamax_rate))).map((d, i) => {
    const date = new Date(d.date);
    return {
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: d.date,
      capesize: Math.round(Number(d.capesize_rate)),
      panamax: Math.round(Number(d.panamax_rate)),
      // Future projection (last 7 points)
      isForecast: i >= data.length - 7
    };
  });

  if (chartData.length === 0) return <div className="h-full w-full flex items-center justify-center text-outline">No rate data available</div>;

  return (
    <ResponsiveContainer width="100%" height={240} minWidth={0}>
      <AreaChart
        data={chartData}
        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorCape" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0F5E5E" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#0F5E5E" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorPmx" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#aaefee" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#aaefee" stopOpacity={0}/>
          </linearGradient>
          {/* Pattern for forecast area */}
          <pattern id="pattern-stripe" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="2" height="4" transform="translate(0,0)" fill="rgba(15, 94, 94, 0.1)"></rect>
          </pattern>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis 
          dataKey="name" 
          tick={{ fontSize: 10, fill: '#74777d', fontFamily: 'JetBrains Mono' }}
          tickMargin={10}
          axisLine={false}
          tickLine={false}
          minTickGap={30}
        />
        <YAxis 
          tick={{ fontSize: 10, fill: '#74777d', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(val) => `$${(val/1000).toFixed(1)}k`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#0B1E33', border: 'none', borderRadius: '4px', color: '#fff' }}
          itemStyle={{ color: '#fff', fontSize: '12px' }}
          labelStyle={{ color: '#8fd2d2', fontSize: '10px', marginBottom: '4px' }}
          formatter={(value: number) => [`$${value.toLocaleString()}`, '']}
        />
        
        <ReferenceLine x={chartData[chartData.length - 8]?.name} stroke="#74777d" strokeDasharray="3 3" />
        
        <Area 
          type="monotone" 
          dataKey="capesize" 
          stroke="#0B1E33" 
          strokeWidth={3}
          fill="url(#colorCape)" 
          name="C3 Capesize"
          activeDot={{ r: 6, fill: '#0B1E33', stroke: '#fff', strokeWidth: 2 }}
        />
        <Area 
          type="monotone" 
          dataKey="panamax" 
          stroke="#0F5E5E" 
          strokeWidth={3}
          strokeDasharray="4 4"
          fill="url(#colorPmx)" 
          name="P2A Panamax"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
