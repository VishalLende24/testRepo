import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { connectDB } from './config/database';
import applicationRoutes from './routes/applications';
import ruleRoutes from './routes/rules';
import { seedRules } from './seeders/ruleSeeder';
import { seedATSRules } from './seeders/atsRuleSeeder';

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

// Start server
async function startServer() {
  try {
    await connectDB();
    await seedRules();
    await seedATSRules();
    
    app.listen(PORT, () => {
      console.log(`Fraud Detection Server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Admin Rules Management: http://localhost:3000/admin/rules`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();