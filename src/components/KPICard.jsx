import React from 'react'
import './KPICard.css'

/**
 * KPI Card Component
 * Displays a key performance indicator with value, change percentage, and trend indicator
 */
function KPICard({ title, value, change, changeType, color = 'blue', icon }) {
  const isPositive = changeType === 'increase'
  const changeColor = isPositive ? '#10b981' : '#ef4444'
  const changeIcon = isPositive ? '↑' : '↓'

  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-header">
        <span className="kpi-title">{title}</span>
        {icon && <span className="kpi-icon">{icon}</span>}
      </div>
      <div className="kpi-value">{value}</div>
      {change !== null && change !== undefined && (
        <div className="kpi-change" style={{ color: changeColor }}>
          <span className="change-icon">{changeIcon}</span>
          <span className="change-value">{Math.abs(change).toFixed(1)}%</span>
          <span className="change-label">from previous</span>
        </div>
      )}
    </div>
  )
}

export default KPICard
