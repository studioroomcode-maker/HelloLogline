import { lazy, Suspense } from "react";
import { Spinner } from "../ui.jsx";
import { NARRATIVE_FRAMEWORKS } from "../constants.js";
import { StageErrorBoundary } from "../ErrorBoundary.jsx";

/* ─── Lazy-loaded heavy panels ─── */
function lazyWithRetry(importFn) {
  return lazy(() =>
    importFn().catch((err) => {
      const isChunkError =
        err?.message?.includes("dynamically imported module") ||
        err?.message?.includes("Failed to fetch") ||
        err?.message?.includes("Importing a module script failed") ||
        err?.name === "ChunkLoadError";

      if (isChunkError) {
        const alreadyRetried = sessionStorage.getItem("hll-chunk-reload");
        if (!alreadyRetried) {
          sessionStorage.setItem("hll-chunk-reload", "1");
          window.location.reload();
          return new Promise(() => {});
        }
      }
      throw err;
    })
  );
}

const Stage1Content = lazyWithRetry(() => import("../stages/Stage1Content.jsx"));
const Stage2Content = lazyWithRetry(() => import("../stages/Stage2Content.jsx"));
const Stage3Content = lazyWithRetry(() => import("../stages/Stage3Content.jsx"));
const Stage4Content = lazyWithRetry(() => import("../stages/Stage4Content.jsx"));
const Stage5Content = lazyWithRetry(() => import("../stages/Stage5Content.jsx"));
const Stage6Content = lazyWithRetry(() => import("../stages/Stage6Content.jsx"));
const Stage7Content = lazyWithRetry(() => import("../stages/Stage7Content.jsx"));
const Stage8Content = lazyWithRetry(() => import("../stages/Stage8Content.jsx"));
const DashboardView = lazyWithRetry(() => import("../stages/DashboardView.jsx"));

const fallback = (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 200,
    }}
  >
    <Spinner size={24} color="#C8A84B" />
  </div>
);

const STAGE_NAMES = {
  dashboard: "대시보드",
  "1": "Stage 1 · 로그라인",
  "2": "Stage 2 · 개념 분석",
  "3": "Stage 3 · 캐릭터",
  "4": "Stage 4 · 시놉시스",
  "5": "Stage 5 · 트리트먼트",
  "6": "Stage 6 · 시나리오 초고",
  "7": "Stage 7 · Script Coverage",
  "8": "Stage 8 · 고쳐쓰기",
};

/**
 * StageRouter — renderStage(stageId) 함수를 구현한 컴포넌트.
 * 각 스테이지를 StageErrorBoundary로 감싸 한 스테이지 오류가 다른 스테이지에 영향을 주지 않음.
 */
export default function StageRouter(props) {
  return (
    <StageErrorBoundary stageId={props.stageId} stageName={STAGE_NAMES[props.stageId]}>
      <StageContent {...props} />
    </StageErrorBoundary>
  );
}

function StageContent(props) {
  const { stageId, GENRE_BEAT_HINTS } = props;

  switch (stageId) {
    case "dashboard":
      return (
        <Suspense fallback={fallback}>
          <DashboardView />
        </Suspense>
      );

    case "1":
      return (
        <Suspense fallback={fallback}>
          <Stage1Content
            result={props.result}
            setResult={props.setResult}
            loading={props.loading}
            error={props.error}
            analyze={props.analyze}
            compareMode={props.compareMode}
            setCompareMode={props.setCompareMode}
            logline2={props.logline2}
            setLogline2={props.setLogline2}
            result2={props.result2}
            loading2={props.loading2}
            selectedDuration={props.selectedDuration}
            setSelectedDuration={props.setSelectedDuration}
            customTheme={props.customTheme}
            setCustomTheme={props.setCustomTheme}
            customDurationText={props.customDurationText}
            setCustomDurationText={props.setCustomDurationText}
            customFormatLabel={props.customFormatLabel}
            setCustomFormatLabel={props.setCustomFormatLabel}
            insightResult={props.insightResult}
            insightLoading={props.insightLoading}
            insightError={props.insightError}
            generateInsight={props.generateInsight}
            earlyCoverageResult={props.earlyCoverageResult}
            setEarlyCoverageResult={props.setEarlyCoverageResult}
            earlyCoverageLoading={props.earlyCoverageLoading}
            earlyCoverageError={props.earlyCoverageError}
            analyzeEarlyCoverage={props.analyzeEarlyCoverage}
            setStoryFixes={props.setStoryFixes}
            setStoryPivots={props.setStoryPivots}
            setAiImprovement={props.setAiImprovement}
            academicResult={props.academicResult}
            apiKey={props.apiKey}
            serverHasKey={props.serverHasKey}
            referenceScenario={props.referenceScenario}
            setReferenceScenario={props.setReferenceScenario}
            referenceScenarioEnabled={props.referenceScenarioEnabled}
            setReferenceScenarioEnabled={props.setReferenceScenarioEnabled}
            referenceScenarioSummary={props.referenceScenarioSummary}
            extractLoglineFromScenario={props.extractLoglineFromScenario}
            extractLoglineLoading={props.extractLoglineLoading}
            extractLoglineError={props.extractLoglineError}
            summarizeReferenceScenario={props.summarizeReferenceScenario}
            summarizeLoading={props.summarizeLoading}
            summarizeError={props.summarizeError}
          />
        </Suspense>
      );

    case "2":
      return (
        <Suspense fallback={fallback}>
          <Stage2Content
            expertPanelResult={props.expertPanelResult}
            setExpertPanelResult={props.setExpertPanelResult}
            expertPanelLoading={props.expertPanelLoading}
            expertPanelError={props.expertPanelError}
            expertPanelProgress={props.expertPanelProgress}
            runExpertPanel={props.runExpertPanel}
            narrativeTheoryDone={props.narrativeTheoryDone}
            narrativeTheoryLoading={props.narrativeTheoryLoading}
            analyzeNarrativeTheory={props.analyzeNarrativeTheory}
            academicResult={props.academicResult}
            mythMapResult={props.mythMapResult}
            barthesCodeResult={props.barthesCodeResult}
            koreanMythResult={props.koreanMythResult}
            themeResult={props.themeResult}
          />
        </Suspense>
      );

    case "3":
      return (
        <Suspense fallback={fallback}>
          <Stage3Content
            result={props.result}
            charGuide={props.charGuide}
            setCharGuide={props.setCharGuide}
            charGuideLoading={props.charGuideLoading}
            charGuideError={props.charGuideError}
            generateCharGuide={props.generateCharGuide}
            showManualCharInput={props.showManualCharInput}
            setShowManualCharInput={props.setShowManualCharInput}
            treatmentChars={props.treatmentChars}
            setTreatmentChars={props.setTreatmentChars}
            shadowResult={props.shadowResult}
            setShadowResult={props.setShadowResult}
            shadowLoading={props.shadowLoading}
            shadowError={props.shadowError}
            analyzeShadow={props.analyzeShadow}
            authenticityResult={props.authenticityResult}
            setAuthenticityResult={props.setAuthenticityResult}
            authenticityLoading={props.authenticityLoading}
            authenticityError={props.authenticityError}
            analyzeAuthenticity={props.analyzeAuthenticity}
            charDevResult={props.charDevResult}
            setCharDevResult={props.setCharDevResult}
            charDevLoading={props.charDevLoading}
            charDevError={props.charDevError}
            charDevFeedback={props.charDevFeedback}
            setCharDevFeedback={props.setCharDevFeedback}
            charDevRefineLoading={props.charDevRefineLoading}
            charDevHistory={props.charDevHistory}
            setCharDevHistory={props.setCharDevHistory}
            analyzeCharacterDev={props.analyzeCharacterDev}
            charAllDone={props.charAllDone}
            editingCharacter={props.editingCharacter}
            setEditingCharacter={props.setEditingCharacter}
            charEditDraft={props.charEditDraft}
            setCharEditDraft={props.setCharEditDraft}
            writerEdits={props.writerEdits}
            clearWriterEdit={props.clearWriterEdit}
            setWriterEdit={props.setWriterEdit}
            refineCharDev={props.refineCharDev}
            undoHistory={props.undoHistory}
          />
        </Suspense>
      );

    case "4":
      return (
        <Suspense fallback={fallback}>
          <Stage4Content
            result={props.result}
            structureResult={props.structureResult}
            setStructureResult={props.setStructureResult}
            structureLoading={props.structureLoading}
            structureError={props.structureError}
            valueChargeResult={props.valueChargeResult}
            setValueChargeResult={props.setValueChargeResult}
            valueChargeLoading={props.valueChargeLoading}
            valueChargeError={props.valueChargeError}
            analyzeStructureAll={props.analyzeStructureAll}
            structureAllLoading={props.structureAllLoading}
            structureAllDone={props.structureAllDone}
            comparableResult={props.comparableResult}
            setComparableResult={props.setComparableResult}
            comparableLoading={props.comparableLoading}
            comparableError={props.comparableError}
            analyzeComparableWorks={props.analyzeComparableWorks}
            academicResult={props.academicResult}
            mythMapResult={props.mythMapResult}
            koreanMythResult={props.koreanMythResult}
            expertPanelResult={props.expertPanelResult}
            barthesCodeResult={props.barthesCodeResult}
            shadowResult={props.shadowResult}
            authenticityResult={props.authenticityResult}
            charDevResult={props.charDevResult}
            subtextResult={props.subtextResult}
            themeResult={props.themeResult}
            synopsisMode={props.synopsisMode}
            setSynopsisMode={props.setSynopsisMode}
            NARRATIVE_FRAMEWORKS={NARRATIVE_FRAMEWORKS}
            selectedFramework={props.selectedFramework}
            setSelectedFramework={props.setSelectedFramework}
            frameworkInfoId={props.frameworkInfoId}
            setFrameworkInfoId={props.setFrameworkInfoId}
            directionCount={props.directionCount}
            setDirectionCount={props.setDirectionCount}
            generateSynopsis={props.generateSynopsis}
            synopsisLoading={props.synopsisLoading}
            synopsisError={props.synopsisError}
            synopsisResults={props.synopsisResults}
            selectedSynopsisIndex={props.selectedSynopsisIndex}
            setSelectedSynopsisIndex={props.setSelectedSynopsisIndex}
            selectedDuration={props.selectedDuration}
            treatmentChars={props.treatmentChars}
            pipelineResult={props.pipelineResult}
            setPipelineResult={props.setPipelineResult}
            pipelineHistory={props.pipelineHistory}
            setPipelineHistory={props.setPipelineHistory}
            editingSynopsis={props.editingSynopsis}
            setEditingSynopsis={props.setEditingSynopsis}
            synopsisEditDraft={props.synopsisEditDraft}
            setSynopsisEditDraft={props.setSynopsisEditDraft}
            writerEdits={props.writerEdits}
            setWriterEdit={props.setWriterEdit}
            clearWriterEdit={props.clearWriterEdit}
            treatmentResult={props.treatmentResult}
            setTreatmentStale={props.setTreatmentStale}
            beatSheetResult={props.beatSheetResult}
            setBeatSheetStale={props.setBeatSheetStale}
            scenarioDraftResult={props.scenarioDraftResult}
            setScenarioDraftStale={props.setScenarioDraftStale}
            pipelineFeedback={props.pipelineFeedback}
            setPipelineFeedback={props.setPipelineFeedback}
            refinePipelineSynopsis={props.refinePipelineSynopsis}
            pipelineRefineLoading={props.pipelineRefineLoading}
            undoHistory={props.undoHistory}
            episodeDesignResult={props.episodeDesignResult}
            episodeDesignLoading={props.episodeDesignLoading}
            episodeDesignError={props.episodeDesignError}
            generateEpisodeDesign={props.generateEpisodeDesign}
          />
        </Suspense>
      );

    case "5":
      return (
        <Suspense fallback={fallback}>
          <Stage5Content
            showTreatmentPanel={props.showTreatmentPanel}
            setShowTreatmentPanel={props.setShowTreatmentPanel}
            treatmentChars={props.treatmentChars}
            setTreatmentChars={props.setTreatmentChars}
            treatmentStructure={props.treatmentStructure}
            setTreatmentStructure={props.setTreatmentStructure}
            selectedFramework={props.selectedFramework}
            NARRATIVE_FRAMEWORKS={NARRATIVE_FRAMEWORKS}
            selectedDuration={props.selectedDuration}
            pipelineResult={props.pipelineResult}
            charDevResult={props.charDevResult}
            treatmentResult={props.treatmentResult}
            setTreatmentResult={props.setTreatmentResult}
            treatmentLoading={props.treatmentLoading}
            treatmentError={props.treatmentError}
            treatmentStale={props.treatmentStale}
            setTreatmentStale={props.setTreatmentStale}
            treatmentHistory={props.treatmentHistory}
            setTreatmentHistory={props.setTreatmentHistory}
            generateTreatment={props.generateTreatment}
            treatmentFeedback={props.treatmentFeedback}
            setTreatmentFeedback={props.setTreatmentFeedback}
            refineTreatment={props.refineTreatment}
            treatmentRefineLoading={props.treatmentRefineLoading}
            treatmentBefore={props.treatmentBefore}
            showTreatmentBefore={props.showTreatmentBefore}
            setShowTreatmentBefore={props.setShowTreatmentBefore}
            editingTreatment={props.editingTreatment}
            setEditingTreatment={props.setEditingTreatment}
            treatmentEditDraft={props.treatmentEditDraft}
            setTreatmentEditDraft={props.setTreatmentEditDraft}
            writerEdits={props.writerEdits}
            setWriterEdit={props.setWriterEdit}
            setWriterEdits={props.setWriterEdits}
            clearWriterEdit={props.clearWriterEdit}
            treatmentCtx={props.treatmentCtx}
            beatSheetResult={props.beatSheetResult}
            setBeatSheetResult={props.setBeatSheetResult}
            beatSheetLoading={props.beatSheetLoading}
            beatSheetError={props.beatSheetError}
            beatSheetStale={props.beatSheetStale}
            setBeatSheetStale={props.setBeatSheetStale}
            beatSheetHistory={props.beatSheetHistory}
            setBeatSheetHistory={props.setBeatSheetHistory}
            generateBeatSheet={props.generateBeatSheet}
            beatSheetCtx={props.beatSheetCtx}
            beatScenes={props.beatScenes}
            expandedBeats={props.expandedBeats}
            setExpandedBeats={props.setExpandedBeats}
            editingBeats={props.editingBeats}
            setEditingBeats={props.setEditingBeats}
            beatEditDrafts={props.beatEditDrafts}
            setBeatEditDrafts={props.setBeatEditDrafts}
            structureTwistLoading={props.structureTwistLoading}
            structureTwistError={props.structureTwistError}
            structureTwistResult={props.structureTwistResult}
            analyzeStructureTwist={props.analyzeStructureTwist}
            GENRE_BEAT_HINTS={GENRE_BEAT_HINTS}
            undoHistory={props.undoHistory}
            beatSheetFeedback={props.beatSheetFeedback}
            setBeatSheetFeedback={props.setBeatSheetFeedback}
            refineBeatSheet={props.refineBeatSheet}
            beatSheetRefineLoading={props.beatSheetRefineLoading}
            beatSheetBefore={props.beatSheetBefore}
            showBeatSheetBefore={props.showBeatSheetBefore}
            setShowBeatSheetBefore={props.setShowBeatSheetBefore}
            dialogueDevResult={props.dialogueDevResult}
            setDialogueDevResult={props.setDialogueDevResult}
            dialogueDevLoading={props.dialogueDevLoading}
            dialogueDevError={props.dialogueDevError}
            analyzeDialogueDev={props.analyzeDialogueDev}
            generatingBeat={props.generatingBeat}
            generateScene={props.generateScene}
          />
        </Suspense>
      );

    case "6":
      return (
        <Suspense fallback={fallback}>
          <Stage6Content
            scenarioDraftResult={props.scenarioDraftResult}
            setScenarioDraftResult={props.setScenarioDraftResult}
            scenarioDraftLoading={props.scenarioDraftLoading}
            scenarioDraftError={props.scenarioDraftError}
            generateScenarioDraft={props.generateScenarioDraft}
            scenarioDraftStale={props.scenarioDraftStale}
            setScenarioDraftStale={props.setScenarioDraftStale}
            scenarioDraftHistory={props.scenarioDraftHistory}
            setScenarioDraftHistory={props.setScenarioDraftHistory}
            refineScenarioDraft={props.refineScenarioDraft}
            scenarioDraftRefineLoading={props.scenarioDraftRefineLoading}
            scenarioDraftFeedback={props.scenarioDraftFeedback}
            setScenarioDraftFeedback={props.setScenarioDraftFeedback}
            scenarioDraftCtx={props.scenarioDraftCtx}
            scenarioDraftBefore={props.scenarioDraftBefore}
            showScenarioDraftBefore={props.showScenarioDraftBefore}
            setShowScenarioDraftBefore={props.setShowScenarioDraftBefore}
            undoHistory={props.undoHistory}
          />
        </Suspense>
      );

    case "7":
      return (
        <Suspense fallback={fallback}>
          <Stage7Content
            scriptCoverageResult={props.scriptCoverageResult}
            setScriptCoverageResult={props.setScriptCoverageResult}
            valuationResult={props.valuationResult}
            setValuationResult={props.setValuationResult}
            scriptCoverageLoading={props.scriptCoverageLoading}
            valuationLoading={props.valuationLoading}
            scriptCoverageError={props.scriptCoverageError}
            valuationError={props.valuationError}
            analyzeScriptCoverage={props.analyzeScriptCoverage}
            analyzeValuation={props.analyzeValuation}
          />
        </Suspense>
      );

    case "8":
      return (
        <Suspense fallback={fallback}>
          <Stage8Content
            scriptCoverageResult={props.scriptCoverageResult}
            rewriteGuide={props.rewriteGuide}
            setRewriteGuide={props.setRewriteGuide}
            rewriteGuideLoading={props.rewriteGuideLoading}
            rewriteGuideError={props.rewriteGuideError}
            generateRewriteGuide={props.generateRewriteGuide}
            rewriteDiagResult={props.rewriteDiagResult}
            setRewriteDiagResult={props.setRewriteDiagResult}
            rewriteDiagLoading={props.rewriteDiagLoading}
            rewriteDiagError={props.rewriteDiagError}
            generateRewriteDiag={props.generateRewriteDiag}
            scenarioDraftResult={props.scenarioDraftResult}
            partialRewriteInstruction={props.partialRewriteInstruction}
            setPartialRewriteInstruction={props.setPartialRewriteInstruction}
            generatePartialRewrite={props.generatePartialRewrite}
            partialRewriteLoading={props.partialRewriteLoading}
            partialRewriteError={props.partialRewriteError}
            partialRewriteResult={props.partialRewriteResult}
            setPartialRewriteResult={props.setPartialRewriteResult}
            fullRewriteNotes={props.fullRewriteNotes}
            setFullRewriteNotes={props.setFullRewriteNotes}
            generateFullRewrite={props.generateFullRewrite}
            fullRewriteLoading={props.fullRewriteLoading}
            fullRewriteError={props.fullRewriteError}
            fullRewriteResult={props.fullRewriteResult}
            setFullRewriteResult={props.setFullRewriteResult}
          />
        </Suspense>
      );

    default:
      return null;
  }
}
