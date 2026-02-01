function parseResume(resumeText, jobRole) {
  const candidate = extractCandidate(resumeText);
  const experience = extractExperience(resumeText);
  const skills = extractSkills(resumeText);
  const tools = extractTools(resumeText);
  
  const atsScore = calculateATSScore(resumeText);
  const roleRelevanceScore = calculateRoleRelevance(resumeText, jobRole);
  const redFlags = detectRedFlags(resumeText);
  const aiContentLikelihood = detectAIContent(resumeText);
  
  return {
    candidate,
    experience,
    skills,
    tools,
    atsScore,
    atsCategory: getATSCategory(atsScore),
    roleRelevanceScore,
    redFlags,
    aiContentLikelihood
  };
}

function extractCandidate(text) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
  const nameRegex = /^([A-Z][a-z]+ [A-Z][a-z]+)/m;
  
  return {
    name: text.match(nameRegex)?.[1] || null,
    email: text.match(emailRegex)?.[0] || null,
    phone: text.match(phoneRegex)?.[0] || null
  };
}

function extractExperience(text) {
  const experienceKeywords = ['years', 'experience', 'worked', 'employed'];
  const yearMatches = text.match(/(\d+)\+?\s*(years?|yrs?)/gi) || [];
  const totalYears = Math.max(...yearMatches.map(m => parseInt(m.match(/\d+/)[0])), 0);
  
  const roles = text.match(/(?:software engineer|developer|analyst|manager|consultant|specialist)/gi) || [];
  
  return {
    totalYears,
    primaryRoles: [...new Set(roles.map(r => r.toLowerCase()))]
  };
}

function extractSkills(text) {
  const techSkills = [
    'javascript', 'python', 'java', 'react', 'node.js', 'sql', 'html', 'css',
    'typescript', 'angular', 'vue', 'mongodb', 'postgresql', 'aws', 'docker'
  ];
  
  return techSkills.filter(skill => 
    text.toLowerCase().includes(skill.toLowerCase())
  );
}

function extractTools(text) {
  const tools = [
    'git', 'jira', 'confluence', 'slack', 'figma', 'postman', 'jenkins',
    'kubernetes', 'terraform', 'visual studio', 'intellij', 'eclipse'
  ];
  
  return tools.filter(tool => 
    text.toLowerCase().includes(tool.toLowerCase())
  );
}

function calculateATSScore(text) {
  let score = 50;
  
  // Structure checks
  if (text.includes('EXPERIENCE') || text.includes('Experience')) score += 15;
  if (text.includes('SKILLS') || text.includes('Skills')) score += 15;
  if (text.includes('EDUCATION') || text.includes('Education')) score += 10;
  
  // Format checks
  if (text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)) score += 10;
  
  return Math.min(score, 100);
}

function calculateRoleRelevance(text, jobRole) {
  if (!jobRole) return 50;
  
  const roleKeywords = jobRole.toLowerCase().split(' ');
  const textLower = text.toLowerCase();
  
  const matches = roleKeywords.filter(keyword => textLower.includes(keyword));
  return Math.min((matches.length / roleKeywords.length) * 100, 100);
}

function detectRedFlags(text) {
  const flags = [];
  
  if (!text.includes('@')) flags.push('Missing contact information');
  if (text.length < 500) flags.push('Resume too short');
  if (!/\d{4}/.test(text)) flags.push('No dates found');
  
  return flags;
}

function detectAIContent(text) {
  const aiPhrases = [
    'leverage synergies', 'paradigm shift', 'cutting-edge solutions',
    'innovative approaches', 'dynamic professional'
  ];
  
  const matches = aiPhrases.filter(phrase => 
    text.toLowerCase().includes(phrase.toLowerCase())
  );
  
  if (matches.length >= 3) return 'HIGH';
  if (matches.length >= 1) return 'MEDIUM';
  return 'LOW';
}

function getATSCategory(score) {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 60) return 'GOOD';
  if (score >= 40) return 'FAIR';
  return 'POOR';
}

module.exports = { parseResume };