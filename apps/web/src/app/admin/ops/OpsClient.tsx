"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  UserCheck,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";

type HealthStatus = "ok" | "error" | "not_configured";
type AlertLevel = "info" | "warning" | "critical";

interface QueueCounts {
  enabled?: boolean;
  waiting?: number;
  active?: number;
  completed?: number;
  failed?: number;
  delayed?: number;
  paused?: number;
  prioritized?: number;
}

interface QueueOverview {
  redisEnabled?: boolean;
  grading?: QueueCounts;
  content?: QueueCounts;
  gradingDeadLetter?: QueueCounts;
  contentDeadLetter?: QueueCounts;
}

interface TelemetrySnapshot {
  uptimeSeconds?: number;
  totals?: {
    requests?: number;
    errors?: number;
    avgDurationMs?: number;
    errorRate?: number;
  };
  routes?: Array<{
    route: string;
    count: number;
    errorCount: number;
    avgDurationMs: number;
    maxDurationMs: number;
    lastStatus: number;
  }>;
  liveProxy?: {
    activeConnections?: number;
    totalConnections?: number;
    rejectedConnections?: number;
    clientErrors?: number;
    upstreamErrors?: number;
    messagesToUpstream?: number;
    messagesToClient?: number;
    bytesToUpstream?: number;
    bytesToClient?: number;
    lastError?: string;
  };
}

interface OpsSummary {
  generatedAt: string;
  database: {
    status: Exclude<HealthStatus, "not_configured">;
    latencyMs: number;
    error?: string;
  };
  aiService: {
    status: HealthStatus;
    url?: string;
    latencyMs?: number;
    httpStatus?: number;
    service?: string;
    error?: string;
    queues?: QueueOverview;
    telemetry?: TelemetrySnapshot;
  };
  activity: {
    usersTotal: number;
    activeUsers24h: number;
    lessonCompletions24h: number;
    submissions24h: number;
    srsReviews24h: number;
    aiMessages24h: number;
    aiConversations24h: number;
    aiTokens7d: number;
    aiEstimatedCost7d: number;
    avgAiLatencyMs: number;
    error?: string;
  };
  alerts: Array<{
    level: AlertLevel;
    title: string;
    message: string;
  }>;
}

export default function OpsClient() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("TEACHER");
  const [status, setStatus] = useState<{ type: "success" | "error" | null; message: string }>({ type: null, message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState<OpsSummary | null>(null);
  const [summaryError, setSummaryError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const queues = summary?.aiService.queues;
  const telemetry = summary?.aiService.telemetry;
  const queueBacklog = useMemo(() => countQueueBacklog(queues), [queues]);
  const queueFailures = useMemo(() => countQueueFailures(queues), [queues]);

  useEffect(() => {
    void loadSummary();
  }, []);

  const loadSummary = async () => {
    setIsRefreshing(true);
    setSummaryError("");

    try {
      const res = await fetch("/api/v1/admin/ops/summary", { cache: "no-store" });
      const data = await res.json() as { success?: boolean; data?: OpsSummary; error?: string };

      if (!res.ok || !data.success || !data.data) {
        throw new Error(data.error || "Failed to load operations summary.");
      }

      setSummary(data.data);
    } catch (error: unknown) {
      setSummaryError(error instanceof Error ? error.message : "Failed to load operations summary.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setStatus({ type: null, message: "" });

    try {
      const res = await fetch("/api/v1/admin/users/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json() as { error?: string };

      if (!res.ok) {
        throw new Error(data.error || "Failed to mutate role.");
      }

      setStatus({ type: "success", message: `Successfully elevated ${email} to ${role}.` });
      setEmail("");
    } catch (error: unknown) {
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Failed to mutate role." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Operations</h1>
          <p className="text-slate-500 mt-1">{"Infrastructure health, AI telemetry, and access controls." /* // locale-allow */}</p>
        </div>
        <button
          type="button"
          onClick={() => void loadSummary()}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {summaryError && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          {summaryError}
        </div>
      )}

      {summary ? (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={Database}
              label="Database"
              value={statusLabel(summary.database.status)}
              detail={`${summary.database.latencyMs} ms health query`}
              tone={summary.database.status === "ok" ? "emerald" : "rose"}
            />
            <MetricCard
              icon={ServerCog}
              label="AI Service"
              value={statusLabel(summary.aiService.status)}
              detail={summary.aiService.latencyMs != null ? `${summary.aiService.latencyMs} ms health check` : "No health endpoint"}
              tone={summary.aiService.status === "ok" ? "emerald" : summary.aiService.status === "not_configured" ? "amber" : "rose"}
            />
            <MetricCard
              icon={Activity}
              label="AI Requests"
              value={formatNumber(telemetry?.totals?.requests ?? 0)}
              detail={`${formatNumber(telemetry?.totals?.errors ?? 0)} errors tracked`}
              tone={(telemetry?.totals?.errors ?? 0) > 0 ? "amber" : "sky"}
            />
            <MetricCard
              icon={Zap}
              label="Queue Backlog"
              value={formatNumber(queueBacklog)}
              detail={`${formatNumber(queueFailures)} failed jobs`}
              tone={queueFailures > 0 ? "rose" : queueBacklog > 0 ? "amber" : "slate"}
            />
          </div>

          {summary.alerts.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                Active alerts
              </div>
              <div className="mt-3 space-y-2">
                {summary.alerts.map((alert) => (
                  <div key={`${alert.level}-${alert.title}`} className="text-sm text-amber-800">
                    <span className="font-medium">{alert.title}:</span> {alert.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Users className="h-5 w-5 text-sky-600" />
                <h2 className="text-base font-semibold text-slate-900">Learning Activity</h2>
              </div>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <SmallStat label="Users" value={formatNumber(summary.activity.usersTotal)} />
                <SmallStat label="Active 24h" value={formatNumber(summary.activity.activeUsers24h)} />
                <SmallStat label="Submissions 24h" value={formatNumber(summary.activity.submissions24h)} />
                <SmallStat label="SRS 24h" value={formatNumber(summary.activity.srsReviews24h)} />
                <SmallStat label="Lessons 24h" value={formatNumber(summary.activity.lessonCompletions24h)} />
                <SmallStat label="AI messages 24h" value={formatNumber(summary.activity.aiMessages24h)} />
                <SmallStat label="AI tokens 7d" value={formatNumber(summary.activity.aiTokens7d)} />
                <SmallStat label="AI cost 7d" value={`$${summary.activity.aiEstimatedCost7d.toFixed(4)}`} />
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-5">
                <Clock3 className="h-5 w-5 text-emerald-600" />
                <h2 className="text-base font-semibold text-slate-900">Runtime</h2>
              </div>
              <div className="space-y-4">
                <SmallStat label="AI uptime" value={formatUptime(telemetry?.uptimeSeconds)} />
                <SmallStat label="Avg AI request" value={`${formatNumber(telemetry?.totals?.avgDurationMs ?? 0)} ms`} />
                <SmallStat label="Stored AI latency" value={`${formatNumber(summary.activity.avgAiLatencyMs)} ms`} />
                <SmallStat label="Voice active" value={formatNumber(telemetry?.liveProxy?.activeConnections ?? 0)} />
                <SmallStat label="Voice sessions" value={formatNumber(telemetry?.liveProxy?.totalConnections ?? 0)} />
                <SmallStat label="Voice rejected" value={formatNumber(telemetry?.liveProxy?.rejectedConnections ?? 0)} />
                <SmallStat
                  label="Voice errors"
                  value={formatNumber((telemetry?.liveProxy?.clientErrors ?? 0) + (telemetry?.liveProxy?.upstreamErrors ?? 0))}
                />
                <SmallStat label="Generated" value={new Date(summary.generatedAt).toLocaleString()} />
              </div>
            </div>
          </div>

          {telemetry?.routes && telemetry.routes.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-5 w-5 text-indigo-600" />
                <h2 className="text-base font-semibold text-slate-900">{"Top AI Routes" /* // locale-allow */}</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-4 font-medium">Route</th>
                      <th className="py-2 px-4 font-medium">Requests</th>
                      <th className="py-2 px-4 font-medium">Errors</th>
                      <th className="py-2 px-4 font-medium">Avg</th>
                      <th className="py-2 pl-4 font-medium">Max</th>
                    </tr>
                  </thead>
                  <tbody>
                    {telemetry.routes.slice(0, 8).map((route) => (
                      <tr key={route.route} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">{route.route}</td>
                        <td className="py-3 px-4 text-slate-700">{formatNumber(route.count)}</td>
                        <td className={route.errorCount > 0 ? "py-3 px-4 text-rose-600 font-medium" : "py-3 px-4 text-slate-700"}>
                          {formatNumber(route.errorCount)}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{formatNumber(route.avgDurationMs)} ms</td>
                        <td className="py-3 pl-4 text-slate-700">{formatNumber(route.maxDurationMs)} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
          Loading operations summary...
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden p-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">{"Elevate Access Role" /* // locale-allow */}</h2>
        </div>

        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{"Target Account Email" /* // locale-allow */}</label>
            <input
              type="email"
              required
              placeholder="e.g. employee@fuxie.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Authorization Level</label>
            <select
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="TEACHER">{"Pedagogy / Teacher" /* // locale-allow */}</option>
              <option value="ADMIN">System Administrator</option>
              <option value="LEARNER">{"Demote to Learner" /* // locale-allow */}</option>
            </select>
          </div>

          {status.type && (
            <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${status.type === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
              {status.type === "error" ? <AlertTriangle className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Commit Role Mutation"}
          </button>
        </form>
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone: "emerald" | "rose" | "amber" | "sky" | "slate";
}) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-700",
    rose: "bg-rose-50 text-rose-700",
    amber: "bg-amber-50 text-amber-700",
    sky: "bg-sky-50 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className={`h-10 w-10 rounded-lg ${toneClass} flex items-center justify-center`}>
          <Icon className="h-5 w-5" />
        </div>
        {tone === "emerald" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
      </div>
      <div className="mt-4 text-sm font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{detail}</div>
    </div>
  );
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-lg font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function countQueueBacklog(queues: QueueOverview | undefined): number {
  if (!queues) return 0;

  return [queues.grading, queues.content].reduce((sum, queue) => (
    sum +
    (queue?.waiting ?? 0) +
    (queue?.active ?? 0) +
    (queue?.delayed ?? 0) +
    (queue?.prioritized ?? 0)
  ), 0);
}

function countQueueFailures(queues: QueueOverview | undefined): number {
  if (!queues) return 0;

  return [queues.grading, queues.content, queues.gradingDeadLetter, queues.contentDeadLetter].reduce(
    (sum, queue) => sum + (queue?.failed ?? 0),
    0
  );
}

function statusLabel(status: HealthStatus): string {
  if (status === "not_configured") return "Not configured";
  return status === "ok" ? "Healthy" : "Unhealthy";
}

function formatNumber(value: number): string {
  return value.toLocaleString();
}

function formatUptime(seconds: number | undefined): string {
  if (!seconds) return "0s";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
}
