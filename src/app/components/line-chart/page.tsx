'use client'
import { useEffect, useState } from 'react';
import ChartComponent from '@/app/components/ChartComponent/ChartComponent'; 
import Controls from '../controls/page';
import { Tooltip } from '../tooltip/page';
import { DataPoint } from '../type/type';

const LineChart = () => {
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
      const points = [
        0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120
      ].map(rtime => ({
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

  const toggleMode = (mode: 'connect' | 'adjust' | 'delete') => {
    setConnectMode(mode === 'connect');
    setAdjustMode(mode === 'adjust');
    setDeleteMode(mode === 'delete');
    setSelectedRanges([]);
    setManuallySelectedPoints([]);
    setSelectedIndex(null);
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
        onClearSelection={clearSelection}
      />
      <ChartComponent
        data={data}
        selectedRanges={selectedRanges}
        connectMode={connectMode}
        adjustMode={adjustMode}
        deleteMode={deleteMode}
        selectedIndex={selectedIndex}
        onPointClick={handlePointClick}
        onPointDrag={handlePointDrag}
        tooltipRef={tooltipRef}
      />
    </div>
  );
};

export default LineChart;