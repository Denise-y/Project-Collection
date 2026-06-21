import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, Trash2 } from 'lucide-react';
import type { Machine } from '../types';
import { ApiError } from '../lib/apiClient';
import { getMachineDisplayName } from '../utils/machineNames';

type MachineApi = {
  post: <T>(path: string, json?: unknown) => Promise<T>;
  put: <T>(path: string, json?: unknown) => Promise<T>;
  del: <T>(path: string) => Promise<T>;
};

interface MachineListProps {
  machines: Machine[];
  setMachines: (machines: Machine[]) => void;
  apiUrl: string;
  api?: MachineApi;
  onRefresh?: () => Promise<Machine[] | void>;
}

export function MachineList({ machines, setMachines, apiUrl, api, onRefresh }: MachineListProps) {
  const [isLoading, setIsLoading] = useState(false);
  // Local state for editing machine names (to allow free editing)
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});

  const addMachine = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Sync from backend first to avoid "already exists"
      let baseList = machines;
      if (api && onRefresh) {
        const fresh = await onRefresh();
        if (Array.isArray(fresh) && fresh.length > 0) baseList = fresh;
      }

      const existingIds = new Set(baseList.map(m => m.id));
      let nextId = 1;
      while (existingIds.has(String(nextId))) {
        nextId++;
      }

      const newMachine = { id: String(nextId), name: getMachineDisplayName(String(nextId)) };

      const created = api
        ? await api.post<{ id: string; name?: string }>(apiUrl, {
            id: newMachine.id,
            name: newMachine.name,
          })
        : await (async () => {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: newMachine.id,
                name: newMachine.name,
              }),
            });
            if (!response.ok) throw new Error(await response.text());
            return (await response.json()) as { id: string; name?: string };
          })();

      setMachines([...baseList, { id: created.id, name: created.name || newMachine.name }]);
    } catch (error) {
      console.error('Error creating machine:', error);
      const isConflict = error instanceof ApiError && error.status === 400;
      if (isConflict && onRefresh) {
        try {
          await onRefresh();
        } catch {
          // ignore
        }
      } else if (!isConflict) {
        const existingIds = new Set(machines.map(m => m.id));
        let nextId = 1;
        while (existingIds.has(String(nextId))) nextId++;
        const fallback = { id: String(nextId), name: getMachineDisplayName(String(nextId)) };
        setMachines([...machines, fallback]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMachine = async (id: string) => {
    if (machines.length <= 1 || isLoading) {
      return;
    }

    setIsLoading(true);
    try {
      if (api) {
        await api.del(`${apiUrl}${id}`);
        setMachines(machines.filter(m => m.id !== id));
      } else {
        const response = await fetch(`${apiUrl}${id}`, {
          method: 'DELETE',
        });

        if (response.ok || response.status === 204) {
          setMachines(machines.filter(m => m.id !== id));
        } else {
          console.error('Failed to delete machine:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error deleting machine:', error);
      // Only remove locally if we're confident the delete succeeded (e.g. network error)
      // For 4xx/5xx the backend may not have deleted; don't optimistically remove
    } finally {
      setIsLoading(false);
    }
  };

  const handleNameChange = (id: string, newName: string) => {
    // Update local editing state immediately (allows free editing including clearing)
    setEditingNames(prev => ({ ...prev, [id]: newName }));
  };

  const handleNameBlur = async (id: string) => {
    // Only call API when input loses focus
    const editedName = editingNames[id];
    const machine = machines.find(m => m.id === id);
    
    // If name hasn't changed, just clear editing state
    if (editedName === undefined || editedName === machine?.name) {
      setEditingNames(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }

    if (isLoading) return;

    // Use the edited name, or fallback to machine's current name or default
    const finalName = editedName.trim() || getMachineDisplayName(id);

    // Disallow duplicate machine names (case-insensitive) to avoid confusion in UI
    const normalized = (s: string) => s.trim().toLowerCase();
    const desired = normalized(finalName);
    const dup = machines.some((m) => m.id !== id && normalized(m.name) === desired);
    if (dup) {
      window.alert('Machine name already exists. Please choose a unique name.');
      // Clear editing state and revert visual input to persisted name
      setEditingNames(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      return;
    }
    
    // Update local state optimistically
    setMachines(machines.map(m => m.id === id ? { ...m, name: finalName } : m));
    // Clear editing state
    setEditingNames(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    try {
      if (api) {
        await api.put(`${apiUrl}${id}`, { name: finalName });
      } else {
        const response = await fetch(`${apiUrl}${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: finalName }),
        });

        if (!response.ok) {
          // Revert on failure
          if (machine) {
            setMachines(machines.map(m => m.id === id ? machine : m));
          }
          console.error('Failed to update machine:', await response.text());
        }
      }
    } catch (error) {
      console.error('Error updating machine:', error);
      // Revert on error
      if (machine) {
        setMachines(machines.map(m => m.id === id ? machine : m));
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {machines.map((machine) => (
          <div key={machine.id} className="flex items-center gap-3">
            <div className="w-16 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
              <span className="text-sm text-slate-700">{machine.id}</span>
            </div>
            <Input
              value={editingNames[machine.id] !== undefined ? editingNames[machine.id] : machine.name}
              onChange={(e) => handleNameChange(machine.id, e.target.value)}
              onBlur={() => handleNameBlur(machine.id)}
              onKeyDown={(e) => {
                // Save on Enter key
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
                // Cancel on Escape key
                if (e.key === 'Escape') {
                  setEditingNames(prev => {
                    const next = { ...prev };
                    delete next[machine.id];
                    return next;
                  });
                  e.currentTarget.blur();
                }
              }}
              placeholder="Machine Name"
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteMachine(machine.id)}
              className="shrink-0"
              disabled={machines.length <= 1}
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ))}
      </div>
      <Button 
        onClick={addMachine} 
        variant="outline" 
        className="w-full"
        disabled={isLoading}
      >
        <Plus className="mr-2 h-4 w-4" />
        {isLoading ? 'Loading...' : 'Add Machine'}
      </Button>
    </div>
  );
}
