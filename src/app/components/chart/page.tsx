'use client';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import DataPoint from '../types/page';

interface ChartProps {
  data: DataPoint[];
  selectedRanges: DataPoint[][];
  connectMode: boolean;
  adjustMode: boolean;
  deleteMode: boolean;
  selectedIndex: number | null;
  onPointClick: (event: any, d: DataPoint) => void;
  onPointDrag: (index: number, rtime: number, intensity: number) => void;
  tooltipRef: React.MutableRefObject<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>;
}

const ChartComponent: React.FC<ChartProps> = ({
  data,
  selectedRanges,
  connectMode,
  adjustMode,
  deleteMode,
  selectedIndex,
  onPointClick,
  onPointDrag,
  tooltipRef,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data.length) return;

    const width = 800;
    const height = 400;
    const margin = { top: 20, right: 30, bottom: 50, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .html('')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear()
      .domain([0, 130])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 10000])
      .range([innerHeight, 0]);

    const line = d3.line<DataPoint>()
      .x(d => xScale(d.rtime))
      .y(d => yScale(d.intensity));

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#4682b4')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    // X-Axis
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale));

    // X-Axis Label
    svg.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 35)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Retention Time');

    // Y-Axis
    svg.append('g')
      .call(d3.axisLeft(yScale));

    // Y-Axis Label
    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('fill', '#fff')
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('Intensity');

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 10)`);

    legend.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 15)
      .attr('height', 15)
      .attr('fill', '#4682b4');

    legend.append('text')
      .attr('x', 20)
      .attr('y', 12)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .text('Data Line');

      const dragHandler = d3.drag()
  .on('start', function (event, d) {
    if (!adjustMode) return;

    // Get the initial cursor position relative to the SVG
    const [xStart, yStart] = d3.pointer(event, svg.node());
    
    // Compute offset between cursor and actual point position
    const index = parseInt(d3.select(this).attr('data-index'));
    const point = data[index];
    const offsetX = xStart - xScale(point.rtime);
    const offsetY = yStart - yScale(point.intensity);

    d3.select(this).raise().classed('active', true);

    // Store offset in the DOM element for later use
    d3.select(this).attr('data-offset-x', offsetX);
    d3.select(this).attr('data-offset-y', offsetY);
  })
  .on('drag', function (event, d) {
    if (!adjustMode) return;

    // Retrieve stored offsets
    const offsetX = parseFloat(d3.select(this).attr('data-offset-x'));
    const offsetY = parseFloat(d3.select(this).attr('data-offset-y'));

    // Get new cursor position and apply the stored offset
    const [x, y] = d3.pointer(event, svg.node());
    const adjustedX = x - offsetX;
    const adjustedY = y - offsetY;

    // Convert to data coordinates
    const rtime = Math.round(xScale.invert(adjustedX));
    const intensity = Math.round(yScale.invert(adjustedY));

    // Keep within bounds
    const boundedRtime = Math.max(0, Math.min(130, rtime));
    const boundedIntensity = Math.max(0, Math.min(10000, intensity));

    // Update state
    const index = parseInt(d3.select(this).attr('data-index'));
    onPointDrag(index, boundedRtime, boundedIntensity);

    // Move the visual element
    d3.select(this)
      .attr('cx', xScale(boundedRtime))
      .attr('cy', yScale(boundedIntensity));
  })
  .on('end', function () {
    d3.select(this).classed('active', false);
  });

    

    const points = svg.selectAll('.point')
      .data(data)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.rtime))
      .attr('cy', d => yScale(d.intensity))
      .attr('r', d => data.findIndex(p => p === d) === selectedIndex ? 6 : 4)
      .attr('data-index', (d, i) => i)
      .style('cursor', adjustMode ? 'move' : 'pointer')
      .style('fill', (d, i) => i === selectedIndex ? '#ff4444' : '#4682b4')
      .call(dragHandler);

    // Tooltip events
    points.on('mouseover', (event, d) => {
      tooltipRef.current!
        .style("opacity", 1)
        .style("display", "block")
        .html(`Intensity: ${d.intensity.toFixed(2)}<br>Retention Time: ${d.rtime}`)
        .style("left", `${event.pageX}px`)
        .style("top", `${event.pageY - 28}px`);
    }).on('mouseout', () => {
      tooltipRef.current!
        .transition()
        .duration(200)
        .style("opacity", 0)
        .on("end", () => tooltipRef.current!.style("display", "none"));
    });

    points.on('click', onPointClick);

    // Draw selected ranges
    const polygonGroup = svg.append('g');
    selectedRanges.forEach(range => {
      polygonGroup.append('polygon')
        .attr('points', range.map(p => `${xScale(p.rtime)},${yScale(p.intensity)}`).join(' '))
        .attr('fill', '#4682b4')
        .attr('fill-opacity', 0.2)
        .attr('stroke', '#4682b4');
    });

  }, [data, selectedRanges, connectMode, adjustMode, deleteMode, selectedIndex, onPointClick, onPointDrag]);

  return <svg ref={svgRef} className="w-full max-w-4xl" />;
};

export default ChartComponent;