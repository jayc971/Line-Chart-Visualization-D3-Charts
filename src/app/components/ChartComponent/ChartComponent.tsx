'use client';
import * as d3 from 'd3';
import { useEffect, useRef } from 'react';
import { DataPoint } from '../type/type';

interface ChartProps {
  data: DataPoint[];
  selectedLines: DataPoint[][];
  connectMode: boolean;
  adjustMode: boolean;
  deleteMode: boolean;
  onLineDrawn: (line: DataPoint[]) => void;
  onLineAdjusted: (lines: DataPoint[][]) => void;
  onLineDeleted: (index: number) => void;
  tooltipRef: React.MutableRefObject<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>;
  onPolygonsCreated: (polygons: DataPoint[][]) => void;
}

const ChartComponent = ({
  data,
  selectedLines,
  connectMode,
  adjustMode,
  deleteMode,
  onLineDrawn,
  onLineAdjusted,
  onLineDeleted,
  tooltipRef,
  onPolygonsCreated,
}: ChartProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drawingLine = useRef<DataPoint[] | null>(null);

  const findIntersections = (line: DataPoint[], data: DataPoint[]) => {
    const intersections: DataPoint[] = [];
    const [p1, p2] = line;
    
    for (let i = 0; i < data.length - 1; i++) {
      const p3 = data[i];
      const p4 = data[i + 1];
      
      const denominator = (p4.rtime - p3.rtime) * (p2.intensity - p1.intensity) - 
                         (p4.intensity - p3.intensity) * (p2.rtime - p1.rtime);
      
      if (denominator === 0) continue;
      
      const ua = ((p4.intensity - p3.intensity) * (p1.rtime - p3.rtime) - 
                 (p4.rtime - p3.rtime) * (p1.intensity - p3.intensity)) / denominator;
      
      const ub = ((p2.intensity - p1.intensity) * (p1.rtime - p3.rtime) - 
                 (p2.rtime - p1.rtime) * (p1.intensity - p3.intensity)) / denominator;
      
      if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        const x = p1.rtime + ua * (p2.rtime - p1.rtime);
        const y = p1.intensity + ua * (p2.intensity - p1.intensity);
        intersections.push({ rtime: x, intensity: y });
      }
    }
    
    return intersections.sort((a, b) => a.rtime - b.rtime);
  };

  const getLineYAtX = (x: number, line: DataPoint[]) => {
    const [p1, p2] = line;
    return p1.intensity + ((x - p1.rtime) / (p2.rtime - p1.rtime)) * (p2.intensity - p1.intensity);
  };

  const createPolygons = (line: DataPoint[], data: DataPoint[]) => {
    const intersections = findIntersections(line, data);
    const polygons: DataPoint[][] = [];
    
    if (intersections.length >= 2) {
      intersections.sort((a, b) => a.rtime - b.rtime);
      
      for (let i = 0; i < intersections.length - 1; i++) {
        const startPoint = intersections[i];
        const endPoint = intersections[i + 1];
        
        const segmentData = data.filter(d => 
          d.rtime >= startPoint.rtime && 
          d.rtime <= endPoint.rtime
        );
        
        let isPeak = false;
        for (const point of segmentData) {
          const lineY = getLineYAtX(point.rtime, line);
          if (point.intensity > lineY) {
            isPeak = true;
            break;
          }
        }
        
        if (isPeak && segmentData.length > 0) {
          const polygon = [
            startPoint,
            ...segmentData,
            endPoint
          ];
          polygons.push(polygon);
        }
      }
    }
    
    return polygons;
  };

  const findNearestPoint = (rtime: number): DataPoint => {
    return data.reduce((prev, curr) => 
      Math.abs(curr.rtime - rtime) < Math.abs(prev.rtime - rtime) ? curr : prev
    );
  };

  useEffect(() => {
    if (!svgRef.current || !data.length || !tooltipRef.current) return;

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

    const interactionLayer = svg.append('g').attr('class', 'interaction-layer');

    interactionLayer.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#4682b4')
      .attr('stroke-width', 1.5)
      .attr('d', line);

    const infoBox = svg.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 30)`);

    infoBox.append('rect')
      .attr('width', 120)
      .attr('height', 50)
      .attr('fill', '#1a1a1a')
      .attr('rx', 4);

    const rtimeText = infoBox.append('text')
      .attr('x', 10)
      .attr('y', 20)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .text('RT: -');

    const intensityText = infoBox.append('text')
      .attr('x', 10)
      .attr('y', 40)
      .attr('fill', '#fff')
      .style('font-size', '12px')
      .text('Int: -');

    // Add hover functionality
    const bisect = d3.bisector<DataPoint, number>(d => d.rtime).left;

    // Create a function to update hover info
    const updateHoverInfo = (event: any) => {
      const [mouseX] = d3.pointer(event);
      const x0 = xScale.invert(mouseX);
      const i = bisect(data, x0, 1);
      const d0 = data[i - 1];
      const d1 = data[i];
      if (d0 && d1) {
        const d = x0 - d0.rtime > d1.rtime - x0 ? d1 : d0;
        rtimeText.text(`RT: ${d.rtime.toFixed(2)}`);
        intensityText.text(`Int: ${d.intensity.toFixed(0)}`);
      }
    };

    const resetHoverInfo = () => {
      rtimeText.text('RT: -');
      intensityText.text('Int: -');
    };

    const hoverPath = interactionLayer.append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'none')
      .style('pointer-events', 'all');

    hoverPath
      .on('mousemove', updateHoverInfo)
      .on('mouseleave', resetHoverInfo);

    // Drawing layer for temporary lines
    if (connectMode) {
      const drawLayer = svg.append('g');
      
      const drag = d3.drag<SVGRectElement, unknown>()
        .on('start', (event) => {
          const [x] = d3.pointer(event, svg.node());
          const startPoint = findNearestPoint(xScale.invert(x));
          drawingLine.current = [startPoint];
        })
        .on('drag', (event) => {
          if (!drawingLine.current) return;
          const [x] = d3.pointer(event, svg.node());
          const currentPoint = findNearestPoint(xScale.invert(x));
          
          drawLayer.selectAll('*').remove();
          drawLayer.append('line')
            .attr('x1', xScale(drawingLine.current[0].rtime))
            .attr('y1', yScale(drawingLine.current[0].intensity))
            .attr('x2', xScale(currentPoint.rtime))
            .attr('y2', yScale(currentPoint.intensity))
            .attr('stroke', '#ff4444')
            .attr('stroke-width', 2);
        })
        .on('end', (event) => {
          if (!drawingLine.current) return;
          const [x] = d3.pointer(event, svg.node());
          const endPoint = findNearestPoint(xScale.invert(x));
          const line = [drawingLine.current[0], endPoint];
          
          const polygons = createPolygons(line, data);
          onPolygonsCreated(polygons);
          onLineDrawn(line);
          
          drawingLine.current = null;
          drawLayer.selectAll('*').remove();
        });

      // Add the overlay rect with pointer events only for drag
      svg.append('rect')
        .attr('class', 'draw-overlay')
        .attr('width', innerWidth)
        .attr('height', innerHeight)
        .style('opacity', 0)
        .style('pointer-events', 'all')
        .on('mousemove', updateHoverInfo)
        .on('mouseleave', resetHoverInfo)
        .call(drag);
    }

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

     const drawLayer = svg.append('g');

     if (connectMode) {
       const drag = d3.drag<SVGRectElement, unknown>()
         .on('start', (event) => {
           const [x] = d3.pointer(event, svg.node());
           const startPoint = findNearestPoint(xScale.invert(x));
           drawingLine.current = [startPoint];
         })
         .on('drag', (event) => {
           if (!drawingLine.current) return;
           const [x] = d3.pointer(event, svg.node());
           const currentPoint = findNearestPoint(xScale.invert(x));
           
           drawLayer.selectAll('*').remove();
           drawLayer.append('line')
             .attr('x1', xScale(drawingLine.current[0].rtime))
             .attr('y1', yScale(drawingLine.current[0].intensity))
             .attr('x2', xScale(currentPoint.rtime))
             .attr('y2', yScale(currentPoint.intensity))
             .attr('stroke', '#ff4444')
             .attr('stroke-width', 2);
         })
         .on('end', (event) => {
          if (!drawingLine.current) return;
          const [x] = d3.pointer(event, svg.node());
          const endPoint = findNearestPoint(xScale.invert(x));
          const line = [drawingLine.current[0], endPoint];
          
          const polygons = createPolygons(line, data);
          onPolygonsCreated(polygons);
          onLineDrawn(line);
          
          drawingLine.current = null;
          drawLayer.selectAll('*').remove();
        });
 
       svg.append('rect')
         .attr('class', 'draw-overlay')
         .attr('width', innerWidth)
         .attr('height', innerHeight)
         .style('opacity', 0)
         .call(drag);
     }

     const polygonGroup = svg.append('g');
     selectedLines.forEach((line, index) => {
       const polygons = createPolygons(line, data);
       polygons.forEach(polygon => {
         polygonGroup.append('polygon')
           .attr('points', polygon.map(p => `${xScale(p.rtime)},${yScale(p.intensity)}`).join(' '))
           .attr('fill', '#4682b4')
           .attr('fill-opacity', 0.2)
           .attr('stroke', '#4682b4')
           .attr('data-line-index', index)
           .style('cursor', deleteMode ? 'pointer' : 'default')
           .on('click', () => {
             if (deleteMode) {
               onLineDeleted(index);
             }
           });
       });
     });
 
     const lineGroup = svg.append('g');
     selectedLines.forEach((line, index) => {
       const lineElement = lineGroup.append('line')
         .attr('x1', xScale(line[0].rtime))
         .attr('y1', yScale(line[0].intensity))
         .attr('x2', xScale(line[1].rtime))
         .attr('y2', yScale(line[1].intensity))
         .attr('stroke', '#ff4444')
         .attr('stroke-width', 2)
         .attr('data-index', index)
         .style('cursor', deleteMode ? 'pointer' : 'default')
         .on('click', () => {
           if (deleteMode) {
             onLineDeleted(index);
           }
         });
 
       if (adjustMode) {
         const dragHandler = d3.drag<SVGCircleElement, unknown>()
           .on('drag', function(event) {
             const [x, y] = d3.pointer(event, svg.node());
             const pointType = d3.select(this).attr('data-point-type') as 'start' | 'end';
             const newLines = [...selectedLines];
             
             if (pointType === 'start') {
               newLines[index][0] = findNearestPoint(xScale.invert(x));
             } else {
               newLines[index][1] = findNearestPoint(xScale.invert(x));
             }
             
             onLineAdjusted(newLines);
           });
 
         lineGroup.append('circle')
           .attr('cx', xScale(line[0].rtime))
           .attr('cy', yScale(line[0].intensity))
           .attr('r', 5)
           .attr('fill', '#00ff00')
           .attr('data-point-type', 'start')
           .call(dragHandler);
 
         lineGroup.append('circle')
           .attr('cx', xScale(line[1].rtime))
           .attr('cy', yScale(line[1].intensity))
           .attr('r', 5)
           .attr('fill', '#00ff00')
           .attr('data-point-type', 'end')
           .call(dragHandler);
       }
     });
 
    }, [data, selectedLines, connectMode, adjustMode, deleteMode, onLineDrawn, onLineAdjusted, onLineDeleted, tooltipRef]);

    return <svg ref={svgRef} className="w-full max-w-4xl" />;
  };
  
  export default ChartComponent;