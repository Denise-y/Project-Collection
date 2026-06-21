/**
 * Author: Yushan WANG (main scheduling UI, layout, and interactions)
 * Collaborator: Zizhen WANG (integration with backend APIs and history replay)
 */

import React, { useMemo, useState, useEffect } from 'react';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Textarea } from './components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Play } from 'lucide-react';
import { JobDataTable } from './components/JobDataTable';
import { MachineList } from './components/MachineList';
import { GanttChart } from './components/GanttChart';
import { KPIMetrics } from './components/KPIMetrics';
import { RuleOutput } from './components/RuleOutput';
import type { BackendScheduleResponse, Job, Machine, ScheduleResult } from './types';
import { useAuth } from './auth/AuthContext';
import { getMachineDisplayName } from './utils/machineNames';
import { createApiClient } from './lib/apiClient';
import { AuthPage } from './pages/AuthPage';
import { HistoryPage } from './pages/HistoryPage';
import { generateSchedule, transformScheduleResponse } from './utils/schedule';

const API_BASE_URL =
  ((import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL ??
    '');

const DEFAULT_JOBS: Job[] = [
  {
    id: 'Order-1',
    operations: [
      { machineId: '1', duration: 30 },
      { machineId: '2', duration: 45 },
    ],
  },
  {
    id: 'Order-2',
    operations: [
      { machineId: '2', duration: 20 },
      { machineId: '3', duration: 35 },
    ],
  },
  {
    id: 'Order-3',
    operations: [
      { machineId: '1', duration: 25 },
      { machineId: '3', duration: 40 },
    ],
  },
];

const JOBS_STORAGE_KEY = 'intellisched_jobs_v1';
const DEFAULT_OBJECTIVE =
  'Generate a rule to prioritize jobs with the shortest processing time to minimize total makespan.';

export default function App() {
  const { token, user, logout } = useAuth();
  const baseUrl = API_BASE_URL;
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl,
        getToken: () => token,
        onUnauthorized: logout,
      }),
    [baseUrl, token, logout]
  );

  const [view, setView] = useState<'scheduler' | 'history'>('scheduler');

  const [machines, setMachines] = useState<Machine[]>([
    { id: '1', name: 'Machine A' },
    { id: '2', name: 'Machine B' },
    { id: '3', name: 'Machine C' },
  ]);

  const [jobs, setJobs] = useState<Job[]>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_JOBS;
    }
    try {
      const raw = window.localStorage.getItem(JOBS_STORAGE_KEY);
      if (!raw) return DEFAULT_JOBS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return DEFAULT_JOBS;
      return parsed as Job[];
    } catch {
      return DEFAULT_JOBS;
    }
  });

  const [objective, setObjective] = useState('');

  const [scheduleResult, setScheduleResult] = useState<ScheduleResult | null>(null);
  const [replayMachines, setReplayMachines] = useState<Machine[] | null>(null);
  const mergedMachinesForChart = useMemo(() => {
    const byId = new Map<string, Machine>();
    for (const m of machines) byId.set(m.id, m);
    for (const m of replayMachines ?? []) {
      if (!byId.has(m.id)) byId.set(m.id, m);
    }
    return Array.from(byId.values());
  }, [machines, replayMachines]);
  const [isScheduling, setIsScheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scheduleApiPath = '/api/schedule/';
  const machinesApiPath = '/api/machines/';
  const machinesApiUrl = useMemo(() => `${baseUrl}${machinesApiPath}`, [baseUrl]);

  // Persist jobs (operations) so they survive refresh / navigation / relogin
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(jobs));
    } catch {
      // ignore persistence errors
    }
  }, [jobs]);

  // When logged-in user changes, reset scheduler view to default state
  useEffect(() => {
    if (!user) return;
    // Clear any per-user persisted jobs so new user sees a clean page
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(JOBS_STORAGE_KEY);
      } catch {
        // ignore storage errors
      }
    }
    setJobs(DEFAULT_JOBS);
    setScheduleResult(null);
    setReplayMachines(null);
    setObjective('');
  }, [user?.id]);

  const loadMachines = async (): Promise<Machine[]> => {
    if (!token) return [];
    try {
      const data = await api.get<Array<{ id: string; name?: string }>>(machinesApiPath);
      const machinesList = (Array.isArray(data) ? data : []).map((m) => ({
        id: m.id,
        name: m.name || getMachineDisplayName(m.id),
      }));
      setMachines(machinesList);
      return machinesList;
    } catch (error) {
      console.error('Failed to load machines:', error);
      return [];
    }
  };

  // Load machines from backend on mount
  useEffect(() => {
    void loadMachines();
  }, [api, token]);

  const handleSchedule = async () => {
    setIsScheduling(true);
    setError(null);
    
    try {
      const goalToSend = objective.trim() ? objective : DEFAULT_OBJECTIVE;
      const data = await api.post<BackendScheduleResponse>(scheduleApiPath, {
        jobs: jobs.map(job => ({
          id: job.id,
          steps: job.operations.map(op => ({
            machine: op.machineId,
            duration: op.duration,
          })),
        })),
        goal: goalToSend,
      });
      const result = transformScheduleResponse(data, machines);
      setScheduleResult(result);
      setReplayMachines(null);
    } catch (error) {
      console.error('Scheduling error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error while scheduling');
      setScheduleResult(generateSchedule(jobs, machines));
    } finally {
      setIsScheduling(false);
    }
  };

  if (!token) {
    return <AuthPage baseUrl={baseUrl} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-slate-900">Intelligent Scheduling System</h1>
            <p className="text-slate-600">
              LLM-based Production Scheduling Rule Generation and Optimization
            </p>
            <p className="text-xs text-slate-500">
              Signed in as <span className="font-medium">{user?.username ?? 'User'}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={view === 'scheduler' ? 'default' : 'outline'}
              onClick={() => setView('scheduler')}
            >
              Scheduler
            </Button>
            <Button
              variant={view === 'history' ? 'default' : 'outline'}
              onClick={() => setView('history')}
            >
              History
            </Button>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>

        {view === 'history' ? (
          <HistoryPage
            baseUrl={baseUrl}
            onBack={() => setView('scheduler')}
            onReplay={(result, ms, jobsFromHistory, goalFromHistory) => {
              setReplayMachines(ms);
              setScheduleResult(result);
              if (jobsFromHistory && jobsFromHistory.length > 0) {
                setJobs(jobsFromHistory);
              }
              if (goalFromHistory && goalFromHistory.trim()) {
                setObjective(goalFromHistory);
              } else {
                setObjective('');
              }
              setView('scheduler');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Tabs defaultValue="jobs" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="jobs">Job Data</TabsTrigger>
                      <TabsTrigger value="machines">Machine Resources</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="jobs" className="space-y-4">
                      <JobDataTable 
                        jobs={jobs} 
                        setJobs={setJobs}
                        machines={machines}
                      />
                    </TabsContent>
                    
                    <TabsContent value="machines" className="space-y-4">
                      <MachineList 
                        machines={machines} 
                        setMachines={setMachines}
                        apiUrl={machinesApiUrl}
                        api={{
                          post: (path, json) => api.post(path.replace(baseUrl, ''), json),
                          put: (path, json) => api.put(path.replace(baseUrl, ''), json),
                          del: (path) => api.del(path.replace(baseUrl, '')),
                        }}
                        onRefresh={loadMachines}
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Optimization Objective</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    aria-label="Optimization objective"
                    value={objective}
                    onChange={(e) => setObjective(e.target.value)}
                    placeholder={DEFAULT_OBJECTIVE}
                    className="min-h-32 resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!isScheduling && jobs.length > 0) {
                          void handleSchedule();
                        }
                      }
                    }}
                  />
                  <p className="text-sm text-slate-500">
                    Examples: Prioritize jobs with nearest deadlines; Minimize total makespan; Improve machine utilization, etc.
                  </p>
                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                      {error}
                    </div>
                  )}
                  <Button 
                    onClick={handleSchedule} 
                    className="w-full"
                    disabled={isScheduling || jobs.length === 0}
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isScheduling ? 'Scheduling...' : 'Run Schedule'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Results Section */}
            <div className="space-y-6">
              {scheduleResult ? (
                <>
                  <KPIMetrics result={scheduleResult} />
                  <GanttChart result={scheduleResult} machines={mergedMachinesForChart} />
                  <RuleOutput rule={scheduleResult.rule} />
                </>
              ) : (
                <Card className="h-full min-h-[600px] flex items-center justify-center">
                  <CardContent>
                    <div className="text-center space-y-4 text-slate-400">
                      <div className="w-24 h-24 mx-auto rounded-full bg-slate-100 flex items-center justify-center">
                        <Play className="h-12 w-12" />
                      </div>
                      <div>
                        <p>Waiting for Schedule Results</p>
                        <p className="text-sm">Please configure job data and optimization objective, then click "Run Schedule"</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

