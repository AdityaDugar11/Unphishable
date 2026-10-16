import { z } from 'zod';
export const MAX_MESSAGE = 10000;
export const riskSchema = z.enum(['Low', 'Moderate', 'High', 'Critical']);
export const tactics = ['Urgency & fear', 'Guilt & emotional coercion', 'Claimed authority', 'Scarcity & FOMO', 'Social proof', 'Excessive trust-building', 'Secrecy & isolation', 'Sensitive information', 'Payment pressure'] as const;
const prose = z.string().trim().min(1).max(1500);
export const requestSchema = z.object({ message: z.string().max(MAX_MESSAGE).refine(s => s.trim().length > 0, 'Paste a message first.'), mode: z.enum(['demo', 'live']) }).strict();
export const findingSchema = z.object({ tactic: z.enum(tactics), severity: riskSchema, evidence: z.array(z.string().min(1).max(MAX_MESSAGE)).min(1).max(5), explanation: prose, alternative: prose }).strict();
export const analysisSchema = z.object({ risk: riskSchema, summary: prose, findings: z.array(findingSchema).max(12), uncertainty: prose, recommendations: z.array(prose).min(1).max(8), safeReply: z.string().max(1500).nullable() }).strict();
export const responseSchema = analysisSchema.extend({ mode: z.enum(['demo', 'live']), notice: prose });
export type Analysis = z.infer<typeof analysisSchema>;
export type Finding = z.infer<typeof findingSchema>;
export type AnalysisResponse = z.infer<typeof responseSchema>;
export type Risk = z.infer<typeof riskSchema>;
export function verifyEvidence(value: unknown, message: string): Analysis {
  const result = analysisSchema.parse(value);
  if (result.findings.some(f => f.evidence.some(e => !e.trim() || !message.includes(e)))) throw new Error('Unverified evidence');
  if (result.risk !== 'Low' && !result.findings.length) throw new Error('Risk requires evidence');
  return result;
}
