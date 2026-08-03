import React from 'react';
import DashboardCard from './DashboardCard';

export default function ChartCard({ title, subtitle, children, height = 300, rightAction }) {
  return (
    <DashboardCard title={title} subtitle={subtitle} rightAction={rightAction}>
      <div style={{ height: `${height}px`, width: '100%' }}>
        {children}
      </div>
    </DashboardCard>
  );
}
