import ATSRule from '../models/ATSRule';

export async function seedATSRules() {
  try {
    const existingCount = await ATSRule.countDocuments();
    if (existingCount > 0) {
      console.log('ATS rules already exist, skipping seed');
      return;
    }

    const rules = [
      {
        ruleId: 'ATS_LOW_SCORE',
        description: 'Low ATS compatibility score',
        minATSScore: 70,
        minRoleRelevance: 0,
        riskScore: 40,
        active: true
      },
      {
        ruleId: 'ROLE_MISMATCH',
        description: 'Low role relevance score',
        minATSScore: 0,
        minRoleRelevance: 60,
        riskScore: 35,
        active: true
      }
    ];

    await ATSRule.insertMany(rules);
    console.log('✅ ATS rules seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding ATS rules:', error);
  }
}