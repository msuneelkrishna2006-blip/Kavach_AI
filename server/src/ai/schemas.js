import { z } from 'zod';

export const scamAnalysisResponseSchema = z.object({
  verdict: z.enum(['likely_scam', 'suspicious', 'likely_legitimate', 'insufficient_information']),
  scam_category: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  risk_adjustment: z.number().int().min(-15).max(15),
  adjustment_reason: z.string().max(200).default(''),
  summary: z.string().max(500),
  simple_explanation: z.string().max(1000),
  red_flags: z.array(z.object({
    label: z.string(),
    evidence_quote: z.string().max(200),
    why_it_matters: z.string().max(300),
    tactic: z.enum(['urgency', 'authority', 'fear', 'reward', 'secrecy', 'isolation', 'scarcity', 'social_proof', 'trust_building', 'other']),
  })).default([]),
  legitimate_signals: z.array(z.string()).default([]),
  recommended_actions: z.array(z.object({
    priority: z.union([z.literal('1'), z.literal('2'), z.literal('3'), z.number()]).transform(String),
    action: z.string(),
  })).default([]),
  do_not: z.array(z.string()).default([]),
  verification_steps: z.array(z.string()).default([]),
  family_alert_message: z.string().max(500).default(''),
  injection_attempt_detected: z.boolean().default(false),
  limitations: z.string().max(300).default(''),
}).passthrough();

export const aiPromptCheckResponseSchema = z.object({
  overall_assessment: z.enum(['no_issues_found', 'review_recommended', 'do_not_share']),
  injection_candidates: z.array(z.object({
    evidence_quote: z.string().max(200),
    reason: z.string(),
    severity: z.enum(['low', 'medium', 'high']),
  })).default([]),
  data_exposure_risks: z.array(z.object({
    placeholder_type: z.string(),
    reason: z.string(),
  })).default([]),
  safer_rewrite: z.string().default(''),
  notes: z.string().default(''),
  limitations: z.string().default(''),
}).passthrough();

export const analystBriefingResponseSchema = z.object({
  headline: z.string(),
  period: z.string(),
  top_trends: z.array(z.object({
    category: z.string(),
    observation: z.string(),
    supporting_numbers: z.array(z.string()),
  })).default([]),
  recommended_awareness_actions: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
}).passthrough();
