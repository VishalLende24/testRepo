import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import applicationRoutes from './routes/applications';
import ruleRoutes from './routes/rules';
import Rule from './models/Rule';

// Load .env from root directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', applicationRoutes);
app.use('/api', ruleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Seed initial job portal rules
async function seedRules() {
  try {
    const existingRules = await Rule.countDocuments();
    if (existingRules === 0) {
      const defaultRules = [
        {
          ruleId: 'DUP_AADHAAR',
          description: 'Duplicate Aadhaar detected',
          condition: { type: 'exact', field: 'aadhaar' },
          score: 70,
          active: true
        },
        {
          ruleId: 'DUP_EMAIL',
          description: 'Duplicate email address detected',
          condition: { type: 'exact', field: 'email' },
          score: 60,
          active: true
        },
        {
          ruleId: 'DUP_PHONE',
          description: 'Duplicate phone number detected',
          condition: { type: 'exact', field: 'phone' },
          score: 50,
          active: true
        },
        {
          ruleId: 'FUZZY_NAME',
          description: 'Similar applicant name detected',
          condition: { type: 'fuzzy', field: 'fullName', threshold: 0.85 },
          score: 40,
          active: true
        },
        {
          ruleId: 'FUZZY_ADDRESS',
          description: 'Similar address detected',
          condition: { type: 'fuzzy', field: 'address', threshold: 0.8 },
          score: 30,
          active: true
        }
      ];

      await Rule.insertMany(defaultRules);
      console.log('Job portal rules seeded successfully');
    }
  } catch (error) {
    console.error('Error seeding rules:', error);
  }
}

// Start server
async function startServer() {
  try {
    await connectDB();
    await seedRules();
    
    app.listen(PORT, () => {
      console.log(`Job Portal Fraud Detection Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();