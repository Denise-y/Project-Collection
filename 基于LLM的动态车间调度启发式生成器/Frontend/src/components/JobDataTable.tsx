/**
 * Author: Yushan WANG (job data table and operations editing UX)
 */

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Job, Machine, Operation } from '../types';

interface JobDataTableProps {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  machines: Machine[];
}

export function JobDataTable({ jobs, setJobs, machines }: JobDataTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingDurations, setEditingDurations] = useState<Record<string, string>>({});

  const createOperation = (machineId: string): Operation => ({
    machineId,
    duration: 30,
    opId: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  });

  const addJob = () => {
    // Use first available machine as default, or '1' if no machines
    const defaultMachineId = machines.length > 0 ? machines[0].id : '1';
    const newJob: Job = {
      id: `Order-${jobs.length + 1}`,
      operations: [
        createOperation(defaultMachineId),
      ],
    };
    setJobs([...jobs, newJob]);
    setEditingId(newJob.id);
  };

  const deleteJob = (id: string) => {
    setJobs(jobs.filter(j => j.id !== id));
  };

  const updateJob = (id: string, updates: Partial<Job>) => {
    setJobs(jobs.map(j => j.id === id ? { ...j, ...updates } : j));
  };

  const handleJobNameChange = (jobId: string, newName: string) => {
    setEditingNames((prev) => ({ ...prev, [jobId]: newName }));
  };

  const commitJobName = (jobId: string) => {
    const draft = editingNames[jobId];
    const job = jobs.find((j) => j.id === jobId);
    if (!job || draft == null) return;

    const finalName = draft.trim() || job.id;
    if (finalName !== job.id) {
      const existing = new Set(jobs.map((j) => j.id));
      existing.delete(job.id);
      if (existing.has(finalName)) {
        window.alert('Job ID already exists. Please choose a unique ID.');
      } else {
        updateJob(jobId, { id: finalName });
        // keep editingId aligned with new id
        if (editingId === jobId) setEditingId(finalName);
      }
    }
    setEditingNames((prev) => {
      const next = { ...prev };
      delete next[jobId];
      delete next[finalName];
      return next;
    });
  };

  const addOperation = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && machines.length > 0) {
      // Use first available machine as default
      const defaultMachineId = machines[0].id;
      updateJob(jobId, {
        operations: [...job.operations, createOperation(defaultMachineId)],
      });
    }
  };

  const removeOperation = (jobId: string, opIndex: number) => {
    const job = jobs.find(j => j.id === jobId);
    if (job && job.operations.length > 1) {
      updateJob(jobId, {
        operations: job.operations.filter((_, i) => i !== opIndex)
      });
    }
  };

  const updateOperation = (jobId: string, opIndex: number, field: 'machineId' | 'duration', value: string | number) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      const newOps = [...job.operations];
      newOps[opIndex] = { ...newOps[opIndex], [field]: value };
      updateJob(jobId, { operations: newOps });
    }
  };

  const commitDuration = (jobId: string, opIndex: number) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const op = job.operations[opIndex];
    if (!op) return;
    const key = op.opId ?? `${job.id}-op-${opIndex}`;
    const draft = editingDurations[key];
    if (draft == null) return;

    const parsed = Number.parseInt(draft, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      window.alert('Duration must be greater than 0.');
      setEditingDurations((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    if (parsed !== op.duration) {
      updateOperation(jobId, opIndex, 'duration', parsed);
    }
    setEditingDurations((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job ID</TableHead>
              <TableHead>Operation Sequence</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  {editingId === job.id ? (
                    <Input
                      value={editingNames[job.id] ?? job.id}
                      onChange={(e) => handleJobNameChange(job.id, e.target.value)}
                      className="h-8"
                      onBlur={() => commitJobName(job.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                        if (e.key === 'Escape') {
                          setEditingNames((prev) => {
                            const next = { ...prev };
                            delete next[job.id];
                            return next;
                          });
                          e.currentTarget.blur();
                        }
                      }}
                    />
                  ) : (
                    job.id
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {job.operations.map((op, idx) => (
                      <div
                        key={op.opId ?? `${job.id}-op-${idx}`}
                        className="flex items-center gap-2"
                      >
                        <Select
                          value={op.machineId}
                          onValueChange={(value) => updateOperation(job.id, idx, 'machineId', value)}
                          disabled={editingId !== job.id}
                        >
                          <SelectTrigger className="h-8 w-36 min-w-[144px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {machines.map((machine) => (
                              <SelectItem key={machine.id} value={machine.id}>
                                {machine.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          value={editingDurations[(op.opId ?? `${job.id}-op-${idx}`)] ?? String(op.duration)}
                          onChange={(e) => {
                            const key = op.opId ?? `${job.id}-op-${idx}`;
                            setEditingDurations((prev) => ({ ...prev, [key]: e.target.value }));
                          }}
                          className="h-8 w-20"
                          disabled={editingId !== job.id}
                          placeholder="Duration"
                          onBlur={() => commitDuration(job.id, idx)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.currentTarget.blur();
                            }
                            if (e.key === 'Escape') {
                              const key = op.opId ?? `${job.id}-op-${idx}`;
                              setEditingDurations((prev) => {
                                const next = { ...prev };
                                delete next[key];
                                return next;
                              });
                              e.currentTarget.blur();
                            }
                          }}
                        />
                        <span className="text-sm text-slate-500">sec</span>
                        {editingId === job.id && job.operations.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeOperation(job.id, idx)}
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {editingId === job.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addOperation(job.id)}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Operation
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {editingId === job.id ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          commitJobName(job.id);
                          setEditingId(null);
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(job.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteJob(job.id)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Button onClick={addJob} variant="outline" className="w-full">
        <Plus className="mr-2 h-4 w-4" />
        Add Job
      </Button>
    </div>
  );
}
