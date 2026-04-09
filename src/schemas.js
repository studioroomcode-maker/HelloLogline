/**
 * Zod schemas for all Claude JSON responses.
 * Each schema validates the top-level structure while using .passthrough()
 * on deeply nested fields to avoid false negatives on minor variations.
 *
 * Naming convention: <Feature>Schema  →  imported by utils.js callers
 */
import { z } from "zod";

// ─── Shared helpers ───────────────────────────────────────────────────────────

const ScoreField = z
  .object({ score: z.number() })
  .passthrough();

const ScoreFieldOpt = z
  .object({ score: z.number().optional() })
  .passthrough();

// ─── Stage 1: 로그라인 ────────────────────────────────────────────────────────

export const LoglineAnalysisSchema = z
  .object({
    structure: z
      .object({
        protagonist: ScoreField,
        inciting_incident: ScoreField,
        goal: ScoreField,
        conflict: ScoreField,
        stakes: ScoreField,
      })
      .passthrough(),
    expression: z
      .object({
        irony: ScoreField,
        mental_picture: ScoreField,
        emotional_hook: ScoreField,
        originality: ScoreField,
      })
      .passthrough(),
    technical: z
      .object({
        conciseness: ScoreField,
        active_language: ScoreField,
        no_violations: ScoreField,
        genre_tone: ScoreField,
      })
      .passthrough(),
    interest: z
      .object({
        information_gap: ScoreField,
        cognitive_dissonance: ScoreField,
        narrative_transportation: ScoreField,
        universal_relatability: ScoreField,
        unpredictability: ScoreField,
      })
      .passthrough(),
    overall_feedback: z.string(),
    improvement_questions: z.array(z.string()),
    detected_genre: z.string().optional(),
  })
  .passthrough();

export const ImprovementSchema = z
  .object({
    improved: z.string(),
    changes: z.array(z.string()),
    why: z.string(),
  })
  .passthrough();

export const WeaknessFixSchema = z
  .object({
    fixes: z.array(
      z
        .object({
          weakness: z.string(),
          fixed_logline: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export const StoryPivotSchema = z
  .object({
    pivots: z.array(
      z
        .object({
          label: z.string(),
          pivot_logline: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

// ─── Stage 2: 개념 분석 ───────────────────────────────────────────────────────

export const SynopsisSchema = z
  .object({
    synopses: z.array(
      z
        .object({
          direction_title: z.string(),
          synopsis: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export const AcademicAnalysisSchema = z
  .object({
    aristotle: z.object({}).passthrough(),
    integrated_assessment: z
      .object({
        dominant_theory_fit: z.string().optional(),
        theoretical_verdict: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const MythMapSchema = z
  .object({
    primary_stage: z.string(),
    campbell_verdict: z.string(),
    journey_phases: z.object({}).passthrough(),
    archetype_roles: z.object({}).passthrough(),
  })
  .passthrough();

export const BarthesCodeSchema = z
  .object({
    hermeneutic_code: ScoreField,
    proairetic_code: ScoreField,
    semic_code: ScoreField,
    symbolic_code: ScoreField,
    cultural_code: ScoreField,
    total_activation: z.number().optional(),
    dominant_code: z.string(),
    barthes_verdict: z.string(),
  })
  .passthrough();

export const KoreanMythSchema = z
  .object({
    han_resonance: ScoreField,
    jeong_resonance: ScoreField,
    sinmyeong_element: ScoreField,
    korean_myth_verdict: z.string(),
  })
  .passthrough();

export const ExpertPanelSchema = z
  .object({
    panel_title: z.string(),
    round1: z.array(z.object({}).passthrough()),
    round2: z.array(z.object({}).passthrough()),
    synthesis: z
      .object({
        consensus: z.string().optional(),
        strongest_element: z.string().optional(),
      })
      .passthrough(),
  })
  .passthrough();

export const ValueChargeSchema = z
  .object({
    primary_charge: z.object({}).passthrough(),
    charge_intensity: z.object({ score: z.number() }).passthrough(),
    mckee_verdict: z.string(),
  })
  .passthrough();

// ─── Stage 3: 캐릭터 ──────────────────────────────────────────────────────────

export const ShadowAnalysisSchema = z
  .object({
    hero_archetype: z.object({}).passthrough(),
    shadow: z.object({}).passthrough(),
    individuation_arc: z.object({}).passthrough(),
    jung_verdict: z.string(),
  })
  .passthrough();

export const AuthenticitySchema = z
  .object({
    authenticity_score: z.number(),
    authenticity_label: z.string().optional(),
    existential_verdict: z.string(),
  })
  .passthrough();

export const CharacterDevSchema = z
  .object({
    protagonist: z
      .object({
        egri_dimensions: z.object({}).passthrough(),
        want: z.string().optional(),
        need: z.string().optional(),
        arc_type: z.string().optional(),
      })
      .passthrough(),
    supporting_characters: z.array(z.object({}).passthrough()),
    moral_argument: z.string().optional(),
  })
  .passthrough();

// ─── Stage 4: 시놉시스/구조 ───────────────────────────────────────────────────

export const StructureAnalysisSchema = z
  .object({
    structure_type: z.string(),
    acts: z.array(z.object({}).passthrough()),
    plot_points: z.array(z.object({}).passthrough()),
  })
  .passthrough();

export const ThemeAnalysisSchema = z
  .object({
    controlling_idea: z.string(),
    moral_premise: z.object({}).passthrough(),
    thematic_question: z.string().optional(),
    protagonist_inner_journey: z.object({}).passthrough(),
  })
  .passthrough();

export const SubtextSchema = z
  .object({
    subtext_score: z.number(),
    surface_story: z.string(),
    deeper_story: z.string(),
    chekhov_verdict: z.string(),
  })
  .passthrough();

// ─── Stage 5: 트리트먼트/비트 ─────────────────────────────────────────────────

export const BeatSheetSchema = z
  .object({
    format_name: z.string().optional(),
    total_pages: z.number().optional(),
    beats: z.array(
      z
        .object({
          id: z.string().optional(),
          name_kr: z.string(),
          summary: z.string(),
        })
        .passthrough()
    ),
  })
  .passthrough();

export const DialogueDevSchema = z
  .object({
    character_voices: z.array(z.object({}).passthrough()),
    subtext_techniques: z.array(z.object({}).passthrough()),
    key_scene_dialogue: z.object({}).passthrough(),
  })
  .passthrough();

// ─── Stage 4: 유사 작품 비교 ──────────────────────────────────────────────────

export const ComparableWorksSchema = z
  .object({
    comparable_works: z.array(
      z
        .object({
          title: z.string(),
          year: z.number().optional(),
          similarity_score: z.number(),
          why_comparable: z.string(),
          what_to_learn: z.string(),
        })
        .passthrough()
    ),
    market_positioning: z.string(),
    tone_reference: z.string(),
    target_audience: z.object({}).passthrough(),
  })
  .passthrough();

// ─── Stage 6: Script Coverage ─────────────────────────────────────────────────

export const ScriptCoverageSchema = z
  .object({
    overall_score: z.number(),
    recommendation: z.string(),
    scores: z.object({}).passthrough(),
    strengths: z.array(z.string()),
    weaknesses: z.array(z.string()),
  })
  .passthrough();

// ─── Stage 6: 시장 가치 평가 ──────────────────────────────────────────────────

export const ValuationSchema = z
  .object({
    completion_score: z.number(),
    completion_label: z.string(),
    completion_breakdown: z.object({}).passthrough(),
    market_tier: z.string(),
    korean_market: z
      .object({
        format_assumed: z.string().optional(),
        price_rationale: z.string(),
      })
      .passthrough(),
    factors_boosting_value: z.array(z.string()),
    factors_reducing_value: z.array(z.string()),
    development_recommendation: z.string(),
    disclaimer: z.string(),
  })
  .passthrough();

// ─── Early Coverage (Stage 1 빠른 상업성 체크) ────────────────────────────────

export const EarlyCoverageSchema = z
  .object({
    marketability_score: z.number(),     // 1~10
    one_line_verdict: z.string(),         // 한 줄 판정
    best_platform: z.string(),            // OTT/극장/방송/유튜브 등
    target_audience: z.string(),          // 핵심 타겟 설명
    comparable_hit: z.string(),           // 가장 유사한 최근 히트작
    key_strengths: z.array(z.string()),   // 강점 2~3개
    key_risks: z.array(z.string()),       // 위험 2~3개
    development_priority: z.string(),     // 지금 당장 보완해야 할 것 1가지
  })
  .passthrough();
