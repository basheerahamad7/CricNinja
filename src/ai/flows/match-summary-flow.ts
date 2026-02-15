
'use server';
/**
 * @fileOverview AI flow to generate match summaries for CricketConnect.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MatchSummaryInputSchema = z.object({
  teamAName: z.string(),
  teamBName: z.string(),
  innings1: z.object({
    runs: z.number(),
    wickets: z.number(),
    balls: z.number(),
  }),
  innings2: z.object({
    runs: z.number(),
    wickets: z.number(),
    balls: z.number(),
  }),
  status: z.string(),
});

export type MatchSummaryInput = z.infer<typeof MatchSummaryInputSchema>;

const MatchSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise, professional, and exciting summary of the cricket match.'),
  headline: z.string().describe('A catchy news headline for the match.'),
  keyTakeaway: z.string().describe('The most important point or turning point of the game.'),
});

export type MatchSummaryOutput = z.infer<typeof MatchSummaryOutputSchema>;

export async function generateMatchSummary(input: MatchSummaryInput): Promise<MatchSummaryOutput> {
  return matchSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'matchSummaryPrompt',
  input: { schema: MatchSummaryInputSchema },
  output: { schema: MatchSummaryOutputSchema },
  prompt: `You are an expert cricket commentator and sports journalist.
  
Generate a professional match report based on these details:
Team A: {{{teamAName}}}
Team B: {{{teamBName}}}
Innings 1 Score: {{{innings1.runs}}}/{{{innings1.wickets}}} ({{{innings1.balls}}} balls)
Innings 2 Score: {{{innings2.runs}}}/{{{innings2.wickets}}} ({{{innings2.balls}}} balls)
Match Status: {{{status}}}

Make the summary engaging, focusing on the competitive spirit of local cricket.`,
});

const matchSummaryFlow = ai.defineFlow(
  {
    name: 'matchSummaryFlow',
    inputSchema: MatchSummaryInputSchema,
    outputSchema: MatchSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) throw new Error('Failed to generate summary');
    return output;
  }
);
