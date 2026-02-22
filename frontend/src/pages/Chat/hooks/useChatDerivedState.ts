import { useMemo } from "react";
import type { DocumentDto, PlannerHeaderMeta, PlannerProfileHintsSummary, PlannerWizardStep } from "@/lib/api";
import type { DocStatus } from "@/components/molecules/DocumentItem";

type PlannerUiState = "idle" | "onboarding" | "uploading" | "branching" | "ready" | "reviewing" | "executing" | "done";

type PlannerPanelArgs = {
  plannerUiState: PlannerUiState;
  documents: DocumentDto[];
  plannerRelevanceError: string | null;
  plannerMajorSummary: PlannerProfileHintsSummary | null;
  plannerProgressMessage: string;
  plannerProgressMode: "start" | "branching" | "execute";
  wizardSteps: PlannerWizardStep[];
  wizardIndex: number;
  progressCurrent: number;
  progressEstimatedTotal: number;
  plannerHeader: PlannerHeaderMeta | null;
  plannerMajorSource: "user_override" | "inferred" | string;
  plannerStepHeader: { path_label?: string; reason?: string } | null;
  wizardAnswers: Record<string, string>;
  plannerCanGenerateNow: boolean;
  plannerPathSummary: string;
  plannerDocs: Array<{ id: number; title: string }>;
  embeddedDocs: Array<{ id: number; title: string }>;
  selectedDocIds: number[];
  selectedDocTitles: string[];
  plannerDocPickerOpen: boolean;
  loading: boolean;
  deletingDocId: number | null;
  plannerWarning: string | null;
  onUploadNew: () => void;
  onOpenDocPicker: () => void;
  onConfirmDocPicker: (ids: number[]) => void;
  onCloseDocPicker: () => void;
  onClearDocSelection: () => void;
  onSelectOption: (value: string) => void;
  onChangeManual: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onEdit: (stepKey: string) => void;
  onExecute: () => void;
};

export function useChatDerivedState({
  documents,
  activeSessionIdNum,
  plannerSelectedDocIdsBySession,
  plannerWarningBySession,
  mode,
  plannerUiState,
}: {
  documents: DocumentDto[];
  activeSessionIdNum?: number;
  plannerSelectedDocIdsBySession: Record<number, number[]>;
  plannerWarningBySession: Record<number, string | null>;
  mode: "chat" | "planner";
  plannerUiState: PlannerUiState;
}) {
  const plannerWarning = activeSessionIdNum ? plannerWarningBySession[activeSessionIdNum] ?? null : null;
  const embeddedDocs = useMemo(
    () => documents.filter((d) => d.is_embedded).map((d) => ({ id: d.id, title: d.title })),
    [documents]
  );
  const sidebarDocs = useMemo<Array<{ id: number; title: string; status: DocStatus }>>(
    () =>
      documents.map((d) => ({
        id: d.id,
        title: d.title,
        status: (d.is_embedded ? "analyzed" : "processing") as DocStatus,
      })),
    [documents]
  );
  const composerDocs = useMemo(() => documents.map((d) => ({ id: d.id, title: d.title })), [documents]);
  const isPlannerLocked = mode === "planner" && plannerUiState !== "done" && plannerUiState !== "idle";
  const selectedDocIds = useMemo(() => {
    if (!activeSessionIdNum) return [];
    const selected = plannerSelectedDocIdsBySession[activeSessionIdNum] ?? [];
    const allowedDocIds = new Set(embeddedDocs.map((d) => d.id));
    return selected.filter((id) => allowedDocIds.has(id));
  }, [activeSessionIdNum, plannerSelectedDocIdsBySession, embeddedDocs]);
  const selectedDocTitles = useMemo(() => {
    if (!selectedDocIds.length) return [];
    const byId = new Map(embeddedDocs.map((d) => [d.id, d.title] as const));
    return selectedDocIds.map((id) => byId.get(id)).filter((title): title is string => !!title);
  }, [embeddedDocs, selectedDocIds]);

  return {
    plannerWarning,
    embeddedDocs,
    sidebarDocs,
    composerDocs,
    isPlannerLocked,
    selectedDocIds,
    selectedDocTitles,
  };
}

export function usePlannerPanelProps(args: PlannerPanelArgs) {
  const {
    plannerUiState,
    documents,
    plannerRelevanceError,
    plannerMajorSummary,
    plannerProgressMessage,
    plannerProgressMode,
    wizardSteps,
    wizardIndex,
    progressCurrent,
    progressEstimatedTotal,
    plannerHeader,
    plannerMajorSource,
    plannerStepHeader,
    wizardAnswers,
    plannerCanGenerateNow,
    plannerPathSummary,
    plannerDocs,
    embeddedDocs,
    selectedDocIds,
    selectedDocTitles,
    plannerDocPickerOpen,
    loading,
    deletingDocId,
    plannerWarning,
    onUploadNew,
    onOpenDocPicker,
    onConfirmDocPicker,
    onCloseDocPicker,
    onClearDocSelection,
    onSelectOption,
    onChangeManual,
    onNext,
    onBack,
    onEdit,
    onExecute,
  } = args;
  return useMemo(
    () => ({
      state: plannerUiState,
      hasEmbeddedDocs: documents.some((d) => d.is_embedded),
      relevanceError: plannerRelevanceError,
      majorSummary: plannerMajorSummary,
      progressMessage: plannerProgressMessage,
      progressMode: plannerProgressMode,
      wizardSteps,
      wizardIndex,
      progressCurrent,
      progressEstimatedTotal,
      plannerHeader,
      plannerMajorSource,
      plannerStepHeader,
      wizardAnswers,
      plannerCanGenerateNow,
      plannerPathSummary,
      plannerDocs,
      embeddedDocs,
      selectedDocIds,
      selectedDocTitles,
      docPickerOpen: plannerDocPickerOpen,
      loading,
      deletingDocId,
      plannerWarning,
      onUploadNew,
      onOpenDocPicker,
      onConfirmDocPicker,
      onCloseDocPicker,
      onClearDocSelection,
      onSelectOption,
      onChangeManual,
      onNext,
      onBack,
      onEdit,
      onExecute,
    }),
    [
      plannerUiState,
      documents,
      plannerRelevanceError,
      plannerMajorSummary,
      plannerProgressMessage,
      plannerProgressMode,
      wizardSteps,
      wizardIndex,
      progressCurrent,
      progressEstimatedTotal,
      plannerHeader,
      plannerMajorSource,
      plannerStepHeader,
      wizardAnswers,
      plannerCanGenerateNow,
      plannerPathSummary,
      plannerDocs,
      embeddedDocs,
      selectedDocIds,
      selectedDocTitles,
      plannerDocPickerOpen,
      loading,
      deletingDocId,
      plannerWarning,
      onUploadNew,
      onOpenDocPicker,
      onConfirmDocPicker,
      onCloseDocPicker,
      onClearDocSelection,
      onSelectOption,
      onChangeManual,
      onNext,
      onBack,
      onEdit,
      onExecute,
    ]
  );
}
