import mongoose from 'mongoose';
import Rule from '../models/Rule';

const sampleRules = [
  {
    ruleId: 'RULE_001',
    name: 'High Amount Alert',
    description: 'Flag applications with unusually high amount',
    conditions: [
      {
        field: 'amount',
        operator: 'greater_than',
        value: 100000,
        weight: 1
      }
    ],
    logic: 'AND',
    score: 40,
    priority: 1,
    isActive: true,
    version: 1,
    createdBy: 'SYSTEM'
  },
  {
    ruleId: 'RULE_002',
    name: 'Duplicate Phone Detection',
    description: 'Flag applications with duplicate phone numbers',
    conditions: [
      {
        field: 'exactMatches.length',
        operator: 'greater_than',
        value: 0,
        weight: 1
      }
    ],
    logic: 'AND',
    score: 60,
    priority: 2,
    isActive: true,
    version: 1,
    createdBy: 'SYSTEM'
  },
  {
    ruleId: 'RULE_003',
    name: 'Suspicious Email Pattern',
    description: 'Flag applications with suspicious email patterns',
    conditions: [
      {
        field: 'email',
        operator: 'regex',
        value: '^[a-zA-Z0-9._%+-]+@(tempmail|guerrillamail|10minutemail)',
        weight: 1
      }
    ],
    logic: 'AND',
    score: 35,
    priority: 3,
    isActive: true,
    version: 1,
    createdBy: 'SYSTEM'
  },
  {
    ruleId: 'RULE_004',
    name: 'Multiple Fuzzy Matches',
    description: 'Flag applications with multiple fuzzy matches',
    conditions: [
      {
        field: 'fuzzyMatches.length',
        operator: 'greater_than',
        value: 2,
        weight: 1
      }
    ],
    logic: 'AND',
    score: 45,
    priority: 4,
    isActive: true,
    version: 1,
    createdBy: 'SYSTEM'
  },
  {
    ruleId: 'RULE_005',
    name: 'Blacklisted Address',
    description: 'Flag applications from blacklisted addresses',
    conditions: [
      {
        field: 'address',
        operator: 'contains',
        value: 'fake street',
        weight: 0.8
      },
      {
        field: 'address',
        operator: 'contains',
        value: 'test address',
        weight: 0.6
      }
    ],
    logic: 'OR',
    score: 70,
    priority: 5,
    isActive: true,
    version: 1,
    createdBy: 'SYSTEM'
  }
];

export async function seedRules() {
  try {
    // Clear existing rules
    await Rule.deleteMany({ createdBy: 'SYSTEM' });
    
    // Insert sample rules
    await Rule.insertMany(sampleRules);
    
    console.log('✅ Sample rules seeded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error seeding rules:', error);
    return false;
  }
}

// Run seeder if called directly
if (require.main === module) {
  mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fraud-detection')
    .then(() => {
      console.log('Connected to MongoDB');
      return seedRules();
    })
    .then(() => {
      console.log('Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}