const { parseResume } = require('./ats-parser');

// Usage example
const resumeText = `{{RESUME_TEXT}}`;
const jobRole = `{{JOB_ROLE}}`;

const result = parseResume(resumeText, jobRole);
console.log(JSON.stringify(result, null, 2));