import React, { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { getNormativeParams, getScoreInterpretation } from '../utils/dataParser'
import './ScoreChart.css'

// D3.js bell curve visualization component

function ScoreChart({ testName, score, percentile, date, age }) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current || score === null || score === undefined) return

    // Clear previous content
    d3.select(svgRef.current).selectAll('*').remove()

    const container = containerRef.current
    const width = container.clientWidth
    const height = 300
    // Increased bottom margin to accommodate marker labels and axis labels
    const margin = { top: 20, right: 30, bottom: 70, left: 60 }
    const chartWidth = width - margin.left - margin.right
    const chartHeight = height - margin.top - margin.bottom

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet')

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Get normative parameters
    const { mean, sd } = getNormativeParams('standard')
    
    // Create x scale (score range: mean ± 4 SD for full view)
    const xMin = mean - 4 * sd
    const xMax = mean + 4 * sd
    const xScale = d3.scaleLinear()
      .domain([xMin, xMax])
      .range([0, chartWidth])

    // Create y scale for probability density
    const yMax = d3.max(d3.range(xMin, xMax, 0.1).map(x => 
      normalPDF(x, mean, sd)
    ))
    const yScale = d3.scaleLinear()
      .domain([0, yMax * 1.1])
      .range([chartHeight, 0])

    // Generate bell curve data
    const curveData = d3.range(xMin, xMax, 0.5).map(x => ({
      x,
      y: normalPDF(x, mean, sd)
    }))

    // Create area generator for shaded regions
    const area = d3.area()
      .x(d => xScale(d.x))
      .y0(chartHeight)
      .y1(d => yScale(d.y))
      .curve(d3.curveBasis)

    // Shade regions: Below Average (< -1 SD)
    const belowAvgData = curveData.filter(d => d.x < mean - sd)
    if (belowAvgData.length > 0) {
      g.append('path')
        .datum(belowAvgData)
        .attr('fill', 'rgba(239, 68, 68, 0.2)')
        .attr('d', area)
    }

    // Shade regions: Average (-1 SD to +1 SD)
    const avgData = curveData.filter(d => d.x >= mean - sd && d.x <= mean + sd)
    if (avgData.length > 0) {
      g.append('path')
        .datum(avgData)
        .attr('fill', 'rgba(253, 224, 71, 0.2)')
        .attr('d', area)
    }

    // Shade regions: Above Average (> +1 SD)
    const aboveAvgData = curveData.filter(d => d.x > mean + sd)
    if (aboveAvgData.length > 0) {
      g.append('path')
        .datum(aboveAvgData)
        .attr('fill', 'rgba(134, 239, 172, 0.2)')
        .attr('d', area)
    }

    // Draw bell curve
    const line = d3.line()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y))
      .curve(d3.curveBasis)

    g.append('path')
      .datum(curveData)
      .attr('fill', 'none')
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 2)
      .attr('d', line)

    // Draw vertical lines for mean and ±1 SD, ±2 SD
    const markers = [
      { value: mean - 2 * sd, label: '-2 SD', color: '#dc2626' },
      { value: mean - sd, label: '-1 SD', color: '#f59e0b' },
      { value: mean, label: 'Mean', color: '#2563eb' },
      { value: mean + sd, label: '+1 SD', color: '#10b981' },
      { value: mean + 2 * sd, label: '+2 SD', color: '#059669' }
    ]

    markers.forEach(({ value, label, color }) => {
      const x = xScale(value)
      g.append('line')
        .attr('x1', x)
        .attr('x2', x)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3')
        .attr('opacity', 0.5)

      // Position labels below the x-axis numbers to avoid overlap
      g.append('text')
        .attr('x', x)
        .attr('y', chartHeight + 35)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', color)
        .attr('font-weight', '500')
        .text(label)
    })

    // Draw student score line
    if (score !== null && score !== undefined) {
      const scoreX = xScale(score)
      g.append('line')
        .attr('x1', scoreX)
        .attr('x2', scoreX)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#1f2937')
        .attr('stroke-width', 3)
        .attr('opacity', 0.8)

      // Add circle at score point
      const scoreY = yScale(normalPDF(score, mean, sd))
      g.append('circle')
        .attr('cx', scoreX)
        .attr('cy', scoreY)
        .attr('r', 6)
        .attr('fill', '#1f2937')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)

      // Add tooltip trigger
      const tooltip = g.append('g')
        .attr('class', 'tooltip-group')
        .attr('opacity', 0)

      tooltip.append('rect')
        .attr('x', scoreX - 50)
        .attr('y', scoreY - 40)
        .attr('width', 100)
        .attr('height', 30)
        .attr('fill', 'rgba(0, 0, 0, 0.8)')
        .attr('rx', 4)

      tooltip.append('text')
        .attr('x', scoreX)
        .attr('y', scoreY - 25)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', '12px')
        .text(`Score: ${score}`)

      if (percentile !== null && percentile !== undefined) {
        tooltip.append('text')
          .attr('x', scoreX)
          .attr('y', scoreY - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', 'white')
          .attr('font-size', '11px')
          .text(`Percentile: ${percentile}%`)
      }

      // Show tooltip on hover
      g.append('rect')
        .attr('x', scoreX - 10)
        .attr('y', 0)
        .attr('width', 20)
        .attr('height', chartHeight)
        .attr('fill', 'transparent')
        .attr('cursor', 'pointer')
        .on('mouseenter', () => {
          tooltip.transition().duration(200).attr('opacity', 1)
        })
        .on('mouseleave', () => {
          tooltip.transition().duration(200).attr('opacity', 0)
        })
    }

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .ticks(10)
      .tickFormat(d3.format('d'))

    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(() => '') // Hide y-axis labels (probability density not meaningful to users)

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '11px')
      .attr('fill', '#6b7280')

    g.append('g')
      .call(yAxis)
      .selectAll('line')
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '2,2')

    // Add axis labels - positioned below marker labels
    g.append('text')
      .attr('transform', `translate(${chartWidth / 2}, ${chartHeight + 55})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .text('Standard Score')

    // Title is now shown above the chart in the container, so we don't need it in the SVG

  }, [testName, score, percentile, date, age])

  // Normal probability density function
  function normalPDF(x, mean, sd) {
    const variance = sd * sd
    const coefficient = 1 / Math.sqrt(2 * Math.PI * variance)
    const exponent = -Math.pow(x - mean, 2) / (2 * variance)
    return coefficient * Math.exp(exponent)
  }

  const interpretation = score !== null && score !== undefined 
    ? getScoreInterpretation(score) 
    : 'No Data'

  return (
    <div className="score-chart" ref={containerRef}>
      <div className="chart-info">
        <div className="score-display">
          <span className="score-label">Score:</span>
          <span className="score-value">{score !== null && score !== undefined ? score : 'N/A'}</span>
        </div>
        {percentile !== null && percentile !== undefined && (
          <div className="percentile-display">
            <span className="percentile-label">Percentile:</span>
            <span className="percentile-value">{percentile}%</span>
          </div>
        )}
        <div className="interpretation-badge">
          <span className={`interpretation ${interpretation.toLowerCase().replace(/\s+/g, '-')}`}>
            {interpretation}
          </span>
        </div>
      </div>
      <svg ref={svgRef} className="chart-svg"></svg>
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color below-avg"></span>
          <span>Below Average (&lt; -1 SD)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color average"></span>
          <span>Average (-1 SD to +1 SD)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color above-avg"></span>
          <span>Above Average (&gt; +1 SD)</span>
        </div>
      </div>
    </div>
  )
}

export default ScoreChart
