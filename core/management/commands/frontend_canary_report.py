from __future__ import annotations

from dataclasses import dataclass
from datetime import timedelta
from typing import Iterable, List

from django.core.management.base import BaseCommand
from django.db.models import Count
from django.utils import timezone

from core.models import PlannerRun, RagRequestMetric


@dataclass
class ChatStats:
    count: int = 0
    success_count: int = 0
    error_count: int = 0
    p95_total_ms: int = 0


def _percentile(values: List[int], pct: float) -> int:
    if not values:
        return 0
    sorted_vals = sorted(int(v or 0) for v in values)
    idx = min(int(len(sorted_vals) * pct), len(sorted_vals) - 1)
    return int(sorted_vals[idx])


def _rate(numer: int, denom: int) -> float:
    if denom <= 0:
        return 0.0
    return (float(numer) / float(denom)) * 100.0


def _compute_chat_stats(rows: Iterable[RagRequestMetric]) -> ChatStats:
    rows_list = list(rows)
    totals = [int(x.retrieval_ms or 0) + int(x.rerank_ms or 0) + int(x.llm_time_ms or 0) for x in rows_list]
    success = sum(1 for x in rows_list if int(x.status_code or 0) < 500)
    errors = sum(1 for x in rows_list if int(x.status_code or 0) >= 500)
    return ChatStats(
        count=len(rows_list),
        success_count=success,
        error_count=errors,
        p95_total_ms=_percentile(totals, 0.95),
    )


class Command(BaseCommand):
    help = (
        "Frontend canary report for planner/chat rollout: planner completion/cancel/error mix and "
        "chat send success/error with latency summary."
    )

    def add_arguments(self, parser):
        parser.add_argument("--minutes", type=int, default=60, help="Window in minutes (default: 60)")
        parser.add_argument("--user-ids", type=str, default="", help="Optional comma-separated user ids for canary cohort")
        parser.add_argument(
            "--request-prefix",
            type=str,
            default="",
            help="Optional request_id prefix filter for chat metrics (example: canary-ui-10-)",
        )
        parser.add_argument("--limit", type=int, default=5000, help="Max chat metric rows scanned (default: 5000)")

    def handle(self, *args, **options):
        minutes = max(int(options.get("minutes") or 60), 1)
        limit = max(int(options.get("limit") or 5000), 1)
        request_prefix = str(options.get("request_prefix") or "").strip()
        user_ids_raw = str(options.get("user_ids") or "").strip()

        user_ids: List[int] = []
        if user_ids_raw:
            for part in user_ids_raw.split(","):
                value = part.strip()
                if not value:
                    continue
                try:
                    user_ids.append(int(value))
                except ValueError:
                    self.stdout.write(self.style.ERROR(f"Invalid --user-ids value: {value!r}"))
                    return

        start = timezone.now() - timedelta(minutes=minutes)

        planner_qs = PlannerRun.objects.filter(created_at__gte=start)
        chat_qs = RagRequestMetric.objects.filter(created_at__gte=start)
        if user_ids:
            planner_qs = planner_qs.filter(user_id__in=user_ids)
            chat_qs = chat_qs.filter(user_id__in=user_ids)
        if request_prefix:
            chat_qs = chat_qs.filter(request_id__startswith=request_prefix)
        chat_qs = chat_qs.order_by("-created_at")[:limit]

        planner_total = planner_qs.count()
        planner_by_status = dict(planner_qs.values("status").annotate(total=Count("id")).values_list("status", "total"))

        completed = int(planner_by_status.get(PlannerRun.STATUS_COMPLETED, 0))
        cancelled = int(planner_by_status.get(PlannerRun.STATUS_CANCELLED, 0))
        expired = int(planner_by_status.get(PlannerRun.STATUS_EXPIRED, 0))

        in_progress = (
            int(planner_by_status.get(PlannerRun.STATUS_STARTED, 0))
            + int(planner_by_status.get(PlannerRun.STATUS_READY, 0))
            + int(planner_by_status.get(PlannerRun.STATUS_COLLECTING, 0))
            + int(planner_by_status.get(PlannerRun.STATUS_EXECUTING, 0))
        )

        chat_rows = list(chat_qs)
        chat_stats = _compute_chat_stats(chat_rows)

        self.stdout.write(self.style.SUCCESS("Frontend Canary Report"))
        self.stdout.write(f"Window         : last {minutes} minutes")
        self.stdout.write(f"Cohort users   : {','.join(str(x) for x in user_ids) if user_ids else 'all'}")
        self.stdout.write(f"Req prefix     : {request_prefix or '-'}")
        self.stdout.write("")

        self.stdout.write("Planner:")
        self.stdout.write(f"- Runs total      : {planner_total}")
        self.stdout.write(f"- Completed       : {completed} ({_rate(completed, planner_total):.2f}%)")
        self.stdout.write(f"- Cancelled       : {cancelled} ({_rate(cancelled, planner_total):.2f}%)")
        self.stdout.write(f"- Expired         : {expired} ({_rate(expired, planner_total):.2f}%)")
        self.stdout.write(f"- In progress     : {in_progress} ({_rate(in_progress, planner_total):.2f}%)")

        self.stdout.write("Chat:")
        self.stdout.write(f"- Sends total     : {chat_stats.count} (limit={limit})")
        self.stdout.write(f"- Send success    : {chat_stats.success_count} ({_rate(chat_stats.success_count, chat_stats.count):.2f}%)")
        self.stdout.write(f"- Send errors 5xx : {chat_stats.error_count} ({_rate(chat_stats.error_count, chat_stats.count):.2f}%)")
        self.stdout.write(f"- p95 total (ms)  : {chat_stats.p95_total_ms}")

