import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Code2 } from 'lucide-react';
import type { Rule } from '../types';

interface RuleOutputProps {
  rule: Rule;
}

function formatFeatureName(name: string) {
  switch (name) {
    case 'urgency':
      return 'urgency (≈ 1/remaining_ops)';
    case 'inverse_processing_time':
      return 'inverse_processing_time (1/proc_time)';
    case 'priority':
      return 'priority (job priority)';
    default:
      return name;
  }
}

function formatWeight(w: unknown) {
  const n = typeof w === 'number' ? w : Number(w);
  if (!Number.isFinite(n)) return String(w ?? '');
  return n.toFixed(3);
}

export function RuleOutput({ rule }: RuleOutputProps) {
  const meta: any = rule.meta ?? {};
  const metaType = typeof meta?.type === 'string' ? meta.type.toUpperCase() : '';
  const isParametric =
    typeof meta?.rule_type === 'string' && meta.rule_type.toLowerCase() === 'parametric_score';
  const weights: Record<string, number> | null =
    isParametric && meta?.weights && typeof meta.weights === 'object' ? (meta.weights as any) : null;
  const weightEntries = weights
    ? Object.entries(weights).filter(([k, v]) => typeof k === 'string' && typeof v === 'number')
    : [];
  const formula =
    weightEntries.length > 0
      ? `score(task) = ${weightEntries
          .map(([k, v]) => `${formatWeight(v)} * ${k}`)
          .join(' + ')}`
      : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Code2 className="h-5 w-5" />
            Rule Details
          </CardTitle>
          <Badge variant={rule.type === 'llm' ? 'default' : 'secondary'}>
            {rule.type === 'llm' ? 'LLM Generated' : 'Fallback Rule'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-sm text-slate-500 mb-1">Rule Name</div>
          <div className="text-slate-900">
            {rule.type === 'fallback'
              ? 'Fallback FIFO rule'
              : metaType === 'FIFO'
                ? 'FIFO (First In First Out)'
                : metaType === 'SPT'
                  ? 'SPT (Shortest Processing Time)'
                  : metaType === 'LPT'
                    ? 'LPT (Longest Processing Time)'
                    : 'Parametric Score'}
          </div>
        </div>
        
        <div>
          <div className="text-sm text-slate-500 mb-1">Rule Description</div>
          <div className="text-slate-700">{rule.description}</div>
        </div>

        {isParametric && (
          <div className="space-y-3">
            <div>
              <div className="text-sm text-slate-500 mb-1">Parametric Score</div>
              <div className="text-slate-900 font-mono text-sm break-words">
                {formula ?? 'score(task) = Σ w_i * f_i(task)'}
              </div>
            </div>

            {weightEntries.length > 0 && (
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="grid grid-cols-2 bg-slate-50 text-xs text-slate-600">
                  <div className="px-3 py-2 font-medium">Feature</div>
                  <div className="px-3 py-2 font-medium">Weight</div>
                </div>
                {weightEntries.map(([k, v]) => (
                  <div key={k} className="grid grid-cols-2 text-sm">
                    <div className="px-3 py-2 border-t border-slate-200 text-slate-800">
                      {formatFeatureName(k)}
                    </div>
                    <div className="px-3 py-2 border-t border-slate-200 text-slate-800 font-mono">
                      {formatWeight(v)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {rule.raw && (
          <details className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <summary className="cursor-pointer text-sm text-slate-700 font-medium select-none">
              Raw Rule JSON
            </summary>
            <pre className="mt-3 bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm">
              <code>{rule.raw}</code>
            </pre>
          </details>
        )}
      </CardContent>
    </Card>
  );
}
