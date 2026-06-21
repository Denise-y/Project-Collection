/**
 * Author: Yushan WANG (Gantt chart visualization and interactions)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import type { ScheduleResult, Machine } from '../types';

interface GanttChartProps {
  result: ScheduleResult;
  machines: Machine[];
}

export function GanttChart({ result, machines }: GanttChartProps) {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);

  const timeScale = 5; // pixels per time unit
  const rowHeight = 60;
  const labelWidth = 120;
  const chartWidth = result.makespan * timeScale + 100;

  // Assign colors to each job
  const jobColors: Record<string, string> = {};
  const colorPalette = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
    '#06b6d4', '#6366f1', '#84cc16', '#f97316', '#14b8a6'
  ];
  
  result.ganttData.forEach((task, idx) => {
    if (!jobColors[task.jobId]) {
      jobColors[task.jobId] = colorPalette[Object.keys(jobColors).length % colorPalette.length];
    }
  });

  // Generate time marks (guard against makespan=0 to avoid infinite loop)
  const timeMarks: number[] = [];
  const safeMakespan = Math.max(0, result.makespan);
  const interval = safeMakespan > 0 ? Math.max(1, Math.ceil(safeMakespan / 10)) : 1;
  for (let i = 0; i <= safeMakespan; i += interval) {
    timeMarks.push(i);
  }
  if (timeMarks.length === 0) timeMarks.push(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gantt Chart - Schedule Results</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div style={{ minWidth: labelWidth + chartWidth }}>
            {/* Time Axis */}
            <div className="flex mb-4">
              <div style={{ width: labelWidth }} className="shrink-0" />
              <div className="relative" style={{ width: chartWidth }}>
                <div className="flex items-center h-8 border-b border-slate-200">
                  {timeMarks.map((time) => (
                    <div
                      key={time}
                      className="absolute text-xs text-slate-500"
                      style={{ left: time * timeScale }}
                    >
                      {time}s
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Machine Rows */}
            <TooltipProvider>
              {machines.map((machine, idx) => {
                const machineTasks = result.ganttData.filter(t => t.machineId === machine.id);
                
                return (
                  <div key={machine.id} className="flex items-center mb-2">
                    <div 
                      style={{ width: labelWidth }} 
                      className="shrink-0 pr-4"
                    >
                      <div className="bg-slate-100 rounded px-3 py-2">
                        <div className="text-sm text-slate-900">{machine.name}</div>
                        <div className="text-xs text-slate-500">{machine.id}</div>
                      </div>
                    </div>
                    <div 
                      className="relative bg-slate-50 rounded"
                      style={{ width: chartWidth, height: rowHeight }}
                    >
                      {/* Time Grid Lines */}
                      {timeMarks.map((time) => (
                        <div
                          key={time}
                          className="absolute top-0 bottom-0 w-px bg-slate-200"
                          style={{ left: time * timeScale }}
                        />
                      ))}
                      
                      {/* Task Bars */}
                      {machineTasks.map((task, taskIdx) => {
                        const taskKey = `${task.jobId}-${task.operationIndex}-${task.machineId}-${task.startTime}`;

                        return (
                        <Tooltip key={taskKey}>
                          <TooltipTrigger asChild>
                            <div
                              className="absolute top-2 bottom-2 rounded-md cursor-pointer transition-all hover:brightness-110 hover:shadow-lg flex items-center justify-center"
                              style={{
                                left: task.startTime * timeScale,
                                width: task.duration * timeScale,
                                backgroundColor: jobColors[task.jobId],
                                opacity: hoveredTask === taskKey ? 1 : 0.9,
                                transform: hoveredTask === taskKey ? 'scale(1.02)' : 'scale(1)',
                              }}
                              onMouseEnter={() => setHoveredTask(taskKey)}
                              onMouseLeave={() => setHoveredTask(null)}
                            >
                              <span className="text-white text-xs px-2 truncate">
                                {task.jobId}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <div><strong>Job:</strong> {task.jobId}</div>
                              <div><strong>Machine:</strong> {machine.name}</div>
                              <div><strong>Operation:</strong> #{task.operationIndex + 1}</div>
                              <div><strong>Start Time:</strong> {task.startTime}s</div>
                              <div><strong>End Time:</strong> {task.endTime}s</div>
                              <div><strong>Duration:</strong> {task.duration}s</div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )})}
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="flex flex-wrap gap-4">
                {Object.entries(jobColors).map(([jobId, color]) => (
                  <div key={jobId} className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm text-slate-600">{jobId}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
