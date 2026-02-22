from io import StringIO
from datetime import timedelta

from django.contrib.auth.models import User
from django.core.management import call_command
from django.test import TestCase
from django.utils import timezone

from core.models import ChatSession, PlannerRun, RagRequestMetric


class FrontendCanaryCommandTests(TestCase):
    def test_frontend_canary_report_prints_summary(self):
        user = User.objects.create_user(username="canary_u", password="x")
        session = ChatSession.objects.create(user=user, title="canary")
        now = timezone.now()

        PlannerRun.objects.create(
            user=user,
            session=session,
            status=PlannerRun.STATUS_COMPLETED,
            expires_at=now + timedelta(hours=1),
        )
        PlannerRun.objects.create(
            user=user,
            session=session,
            status=PlannerRun.STATUS_CANCELLED,
            expires_at=now + timedelta(hours=1),
        )

        RagRequestMetric.objects.create(
            request_id="canary-ui-10-r1",
            user=user,
            mode="structured_transcript",
            retrieval_ms=100,
            rerank_ms=20,
            llm_time_ms=300,
            status_code=200,
        )
        RagRequestMetric.objects.create(
            request_id="canary-ui-10-r2",
            user=user,
            mode="rag_semantic",
            retrieval_ms=300,
            rerank_ms=30,
            llm_time_ms=400,
            status_code=500,
        )

        out = StringIO()
        call_command(
            "frontend_canary_report",
            minutes=120,
            limit=100,
            user_ids=str(user.id),
            request_prefix="canary-ui-10-",
            stdout=out,
        )
        text = out.getvalue()
        self.assertIn("Frontend Canary Report", text)
        self.assertIn("Planner:", text)
        self.assertIn("Chat:", text)
        self.assertIn("Completed", text)
        self.assertIn("Cancelled", text)
        self.assertIn("Send errors 5xx", text)

