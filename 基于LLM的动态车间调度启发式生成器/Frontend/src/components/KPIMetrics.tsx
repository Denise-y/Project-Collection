/**
 * Author: Yushan WANG (KPI metrics visualization)
 */

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Clock, TrendingUp, Zap } from 'lucide-react';
import type { ScheduleResult } from '../types';

interface KPIMetricsProps {
  result: ScheduleResult;
}

export function KPIMetrics({ result }: KPIMetricsProps) {
  const meta: any = result.rule.meta ?? {};
  const ruleType = (meta?.type ? String(meta.type).toUpperCase() : '') as string;
  const isPreset = ruleType === 'FIFO' || ruleType === 'SPT' || ruleType === 'LPT';
  const ruleName = (() => {
    if (result.rule.type === 'fallback') return 'Fallback FIFO rule';
    if (isPreset) {
      if (ruleType === 'FIFO') return 'FIFO (First In First Out)';
      if (ruleType === 'SPT') return 'SPT (Shortest Processing Time)';
      if (ruleType === 'LPT') return 'LPT (Longest Processing Time)';
    }
    return 'Parametric Score';
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Key Performance Indicators (KPI)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Makespan */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-700">
              <Clock className="h-5 w-5" />
              <span className="text-sm">Total Makespan</span>
            </div>
            <div className="text-3xl text-blue-900">{result.makespan}</div>
            <div className="text-sm text-blue-600">seconds (Makespan)</div>
          </div>

          {/* Machine Utilization */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-green-700">
              <TrendingUp className="h-5 w-5" />
              <span className="text-sm">Machine Utilization</span>
            </div>
            <div className="text-3xl text-green-900">
              {Number.isFinite(result.machineUtilization)
                ? `${result.machineUtilization.toFixed(1)}%`
                : '—'}
            </div>
            <div className="text-sm text-green-600">Average Utilization</div>
          </div>

          {/* Scheduling Rule */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-purple-700">
              <Zap className="h-5 w-5" />
              <span className="text-sm">Scheduling Rule</span>
            </div>
            <div className="text-sm text-purple-900 line-clamp-2">
              {ruleName}
            </div>
            <Badge 
              variant={result.rule.type === 'llm' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {result.rule.type === 'llm' ? 'LLM Generated' : 'Fallback Rule'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
