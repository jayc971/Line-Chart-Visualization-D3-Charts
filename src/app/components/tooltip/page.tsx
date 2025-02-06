'use client'
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export const Tooltip = () => {
  const tooltipRef = useRef<d3.Selection<HTMLDivElement, unknown, null, undefined> | null>(null);

  useEffect(() => {
    tooltipRef.current = d3.select("body")
      .append("div")
      .attr("class", "absolute text-center bg-black border border-gray-300 p-1 rounded pointer-events-none shadow-sm")
      .style("opacity", 0);

    return () => {
      tooltipRef.current?.remove();
    };
  }, []);

  return tooltipRef;
};