export function parseResume(resumeText: string, jobRole: string): {
  candidate: any;
  experience: any;
  skills: string[];
  tools: string[];
  atsScore: number;
  atsCategory: string;
  roleRelevanceScore: number;
  redFlags: string[];
  aiContentLikelihood: string;
};