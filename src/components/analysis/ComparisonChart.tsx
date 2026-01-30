import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';

interface ComparisonChartProps {
  currentData: { date: string; price: number }[];
  benchmarkData: { date: string; price: number }[];
  currentName: string;
  benchmarkName: string;
}

export const ComparisonChart = ({ currentData, benchmarkData, currentName, benchmarkName }: ComparisonChartProps) => {
  // Merge data for display (simplified assumption: data arrays are aligned by day index)
  const mergedData = benchmarkData.map((bItem, index) => {
    const cItem = currentData[index] || {};
    return {
      day: bItem.date,
      [benchmarkName]: bItem.price,
      [currentName]: cItem.price,
    };
  });

  return (
    <Card className="p-6 bg-slate-900 border-slate-800">
      <div style={{ width: '100%', height: 400, minHeight: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={mergedData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="left" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis yAxisId="right" orientation="right" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f1f5f9' }}
              itemStyle={{ color: '#f1f5f9' }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey={benchmarkName} 
              stroke="#6366f1" 
              strokeWidth={2} 
              dot={false} 
              strokeDasharray="5 5"
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey={currentName} 
              stroke="#10b981" 
              strokeWidth={2} 
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
