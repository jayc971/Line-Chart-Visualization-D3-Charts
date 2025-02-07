'use client'
import { useEffect, useState } from 'react';
import ChartComponent from '@/app/components/ChartComponent/ChartComponent'; 
import Controls from '@/app/components/controls/page';
import { Tooltip } from '../tooltip/page';
import { DataPoint } from '../type/type';

const LineChart = () => {
  const [polygons, setPolygons] = useState<DataPoint[][]>([]);
  const [selectedLines, setSelectedLines] = useState<DataPoint[][]>([]);
  const [selectedRanges, setSelectedRanges] = useState<DataPoint[][]>([]);
  const [manuallySelectedPoints, setManuallySelectedPoints] = useState<DataPoint[]>([]);
  const [connectMode, setConnectMode] = useState(false);
  const [adjustMode, setAdjustMode] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const tooltipRef = Tooltip();

  const getPointsBetween = (data: DataPoint[], point1: DataPoint, point2: DataPoint) => {
    const start = Math.min(point1.rtime, point2.rtime);
    const end = Math.max(point1.rtime, point2.rtime);
    return data.filter(point => point.rtime >= start && point.rtime <= end);
  };

  useEffect(() => {
    const generateData = () => {
      const points = Array.from({ length: 241 }, (_, i) => i * 0.5) 
        .map(rtime => ({
          rtime,
          intensity: Math.max(
            10000 * Math.exp(-Math.pow(rtime - 20, 2) / 50),
            8000 * Math.exp(-Math.pow(rtime - 40, 2) / 50),
            9000 * Math.exp(-Math.pow(rtime - 60, 2) / 50),
            9500 * Math.exp(-Math.pow(rtime - 80, 2) / 50),
            8500 * Math.exp(-Math.pow(rtime - 100, 2) / 50)
          )
        }));
      return points;
    };
  
    setData(generateData());
  }, []);
  
  const handlePolygonsCreated = (newPolygons: DataPoint[][]) => {
    setPolygons(prev => [...prev, ...newPolygons]);
  };

  const handleLineDrawn = (line: DataPoint[]) => {
    setSelectedLines(prev => [...prev, line]);
  };

  const handleLineAdjusted = (lines: DataPoint[][]) => {
    setSelectedLines(lines);
  };

  const handleLineDeleted = (index: number) => {
    setSelectedLines(prev => prev.filter((_, i) => i !== index));
    setPolygons(prev => prev.filter(p => p[0].lineIndex !== index));
  };

  const toggleMode = (mode: 'connect' | 'adjust' | 'delete') => {
    setConnectMode(mode === 'connect');
    setAdjustMode(mode === 'adjust');
    setDeleteMode(mode === 'delete');
  };

  const handlePointClick = (event: any, d: DataPoint) => {
    if (deleteMode) {
      if (data.length <= 2) {
        alert("Cannot delete: minimum 2 points required");
        return;
      }
      const index = parseInt(event.target.getAttribute('data-index'));
      setData(prev => prev.filter((_, i) => i !== index));
      return;
    }

    if (connectMode) {
      setManuallySelectedPoints(prev => {
        let newPoints = manuallySelectedPoints;
        newPoints = [...prev, d];
        if (newPoints.length === 2) {
          setSelectedRanges(prev => [...prev, getPointsBetween(data, newPoints[0], newPoints[1])]);
          return [];
        }
        return newPoints;
      });
    }

    if (adjustMode) {
      const index = parseInt(event.target.getAttribute('data-index'));
      setSelectedIndex(prev => prev === index ? null : index);
    }
  };

  const handlePointDrag = (index: number, rtime: number, intensity: number) => {
    const newData = [...data];
    newData[index] = { rtime, intensity };
    setData(newData.sort((a, b) => a.rtime - b.rtime));
  };

  const clearSelection = () => {
    setSelectedRanges([]);
    setManuallySelectedPoints([]);
    setSelectedIndex(null);
  };

  return (
    <div className="p-4">
      <Controls
        connectMode={connectMode}
        adjustMode={adjustMode}
        deleteMode={deleteMode}
        onToggleMode={toggleMode}
      />
      <ChartComponent
        data={data}
        selectedLines={selectedLines}
        connectMode={connectMode}
        adjustMode={adjustMode}
        deleteMode={deleteMode}
        onLineDrawn={handleLineDrawn}
        onLineAdjusted={handleLineAdjusted}
        onLineDeleted={handleLineDeleted}
        tooltipRef={tooltipRef}
        onPolygonsCreated={handlePolygonsCreated}
      />
    </div>
  );
};

export default LineChart;