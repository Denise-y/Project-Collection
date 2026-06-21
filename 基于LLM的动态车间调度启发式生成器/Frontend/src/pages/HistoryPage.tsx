/**
 * Author: Yushan WANG (history UI and replay interactions)
 * Collaborator: Zhiqian ZHANG (mapping backend history payloads to UI)
 */

import React, { useMemo, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createApiClient } from "@/lib/apiClient";
import { useAuth } from "@/auth/AuthContext";
import type { Job, Machine, ScheduleResult } from "@/types";
import {
  buildReplayData,
  formatRuleTypeDisplay,
  safeString,
  type ScheduleHistoryDetail,
  type ScheduleHistorySummary,
} from "@/utils/historyReplay";

export function HistoryPage({
  baseUrl,
  onBack,
  onReplay,
}: {
  baseUrl: string;
  onBack: () => void;
  onReplay: (
    result: ScheduleResult,
    machines: Machine[],
    jobs: Job[],
    goal: string
  ) => void;
}) {
  const { token, logout } = useAuth();
  const api = useMemo(
    () =>
      createApiClient({
        baseUrl,
        getToken: () => token,
        onUnauthorized: logout,
      }),
    [baseUrl, token, logout]
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ScheduleHistorySummary[]>([]);
  const [selected, setSelected] = useState<ScheduleHistoryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);

  const loadHistory = async () => {
    setError(null);
    setLoading(true);
    try {
      const list = await api.get<ScheduleHistorySummary[]>("/api/schedules/history");
      setItems(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, [api]);

  const loadDetail = async (id: string | number) => {
    setError(null);
    setDetailLoading(true);
    try {
      const d = await api.get<ScheduleHistoryDetail>(`/api/schedules/history/${id}`);
      setSelected(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load detail");
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteItem = async (id: string | number) => {
    const ok = window.confirm(`Delete history item #${String(id)}? This cannot be undone.`);
    if (!ok) return;

    setError(null);
    setDeletingId(id);
    try {
      await api.del(`/api/schedules/history/${id}`);
      if (selected && String(selected.id) === String(id)) {
        setSelected(null);
      }
      await loadHistory();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete history item");
    } finally {
      setDeletingId(null);
    }
  };

  const replay = () => {
    if (!selected?.result_payload) return;
    try {
      const replayData = buildReplayData(selected);
      onReplay(replayData.result, replayData.machines, replayData.jobs, replayData.goal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Replay failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="text-slate-900 text-lg font-semibold">Schedule History</div>
          <div className="text-slate-600 text-sm">
            View previous scheduling runs and open details.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button onClick={() => void loadHistory()} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.length === 0 && !loading ? (
              <div className="text-sm text-slate-500">
                No history yet. Run a schedule to create one.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Rule</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Makespan</TableHead>
                    <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((it) => (
                    <TableRow key={String(it.id)}>
                      <TableCell className="max-w-[180px] truncate">
                        {it.created_at ? new Date(it.created_at).toLocaleString() : "-"}
                      </TableCell>
                      <TableCell>{formatRuleTypeDisplay(it.rule_type)}</TableCell>
                      <TableCell>{it.status ?? "-"}</TableCell>
                      <TableCell>{it.makespan ?? "-"}</TableCell>
                      <TableCell className="text-right min-w-[140px]">
                        <div className="flex items-center justify-end gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void loadDetail(it.id)}
                          >
                            Open
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="history-delete-btn"
                            disabled={deletingId != null}
                            onClick={() => void deleteItem(it.id)}
                          >
                            {deletingId != null && String(deletingId) === String(it.id)
                              ? "Deleting..."
                              : "Delete"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detail</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selected ? (
              <div className="text-sm text-slate-500">
                Select an item from the left to view detail.
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-2 text-sm">
                  <div>
                    <span className="text-slate-500">Time:</span>{" "}
                    {selected.created_at ? new Date(selected.created_at).toLocaleString() : "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">Rule:</span> {formatRuleTypeDisplay(selected.rule_type)}
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span> {selected.status ?? "-"}
                  </div>
                  <div>
                    <span className="text-slate-500">Goal:</span> {selected.goal ?? "-"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setSelected(null)}>
                    Close
                  </Button>
                  <Button onClick={replay} disabled={detailLoading}>
                    {detailLoading ? "Loading..." : "Replay in Scheduler"}
                  </Button>
                  <Button
                    variant="outline"
                    className="history-delete-btn"
                    disabled={deletingId != null}
                    onClick={() => void deleteItem(selected.id)}
                  >
                    {deletingId != null && String(deletingId) === String(selected.id)
                      ? "Deleting..."
                      : "Delete"}
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-700">Stored payloads</div>
                  <pre className="text-xs bg-slate-50 border border-slate-200 rounded-md p-3 overflow-auto max-h-[360px]">
                    {JSON.stringify(
                      {
                        request_payload: selected.request_payload,
                        result_payload: selected.result_payload,
                      },
                      null,
                      2
                    ) ?? safeString(selected)}
                  </pre>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

