# Fraud Detection System

A monolithic fraud and duplicate detection web application for public benefit applications using Node.js, Python ML, React, and MongoDB Atlas.

## Architecture

- **Backend**: Node.js + Express (TypeScript)
- **Database**: MongoDB Atlas (Cloud)
- **Frontend**: React + TypeScript
- **ML/AI**: Python scripts with RapidFuzz for fuzzy matching
- **Rules Engine**: JSON-based rules stored in MongoDB

## Features

- ✅ Application ingestion with validation
- ✅ Duplicate detection (exact + fuzzy matching)
- ✅ JSON-based rules engine
- ✅ Risk scoring (0-100 scale)
- ✅ Explainable AI results
- ✅ React dashboard for review
- ✅ Officer actions (approve/reject)

## Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- MongoDB Atlas account (connection string provided)

## Quick Start

### 1. Install Dependencies

```bash
# Install root dependencies
npm run install-all

# Install Python dependencies
cd backend/ml
pip install -r requirements.txt
cd ../..
```

### 2. Environment Setup

The `.env` file is already configured with MongoDB Atlas connection:

```
MONGO_URI=mongodb+srv://vishallende24:vishal24@cluster0.rhy2f.mongodb.net/repo_dub?retryWrites=true&w=majority&appName=Cluster0
PORT=3001
NODE_ENV=development
```

### 3. Run the Application

```bash
# Start both backend and frontend
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- React frontend on http://localhost:3000

### Alternative: Run Separately

```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

## API Endpoints

### Applications
- `POST /api/applications` - Submit new application
- `GET /api/applications` - Get all applications (sorted by risk)
- `GET /api/applications/:id` - Get application details
- `POST /api/applications/:id/action` - Officer action (approve/reject)

### Rules
- `GET /api/rules` - Get all rules
- `POST /api/rules` - Create new rule
- `PUT /api/rules/:id` - Update rule

### Health Check
- `GET /health` - Server health status

## Database Collections

1. **applications** - Application data (with hashed Aadhaar)
2. **duplicatematches** - Detected duplicates
3. **rules** - Detection rules
4. **riskscores** - Risk assessments
5. **explanations** - AI explanations
6. **officeactions** - Officer decisions

## Default Rules

The system seeds these rules automatically:

1. **DUP_AADHAAR** - Duplicate Aadhaar (Score: 60)
2. **DUP_PHONE** - Duplicate phone (Score: 40)
3. **FUZZY_NAME** - Similar name ≥80% (Score: 30)
4. **FUZZY_ADDRESS** - Similar address ≥80% (Score: 25)

## Risk Bands

- **LOW**: 0-30 points
- **MEDIUM**: 31-70 points  
- **HIGH**: 71-100 points

## Usage Flow

1. **Submit Application** - Enter name, Aadhaar, phone, address
2. **Automatic Processing**:
   - Aadhaar gets hashed
   - Duplicate detection runs
   - Rules engine evaluates matches
   - Risk score calculated
   - Explanations generated
3. **Review Dashboard** - View applications sorted by risk
4. **Officer Action** - Approve or reject applications

## Sample Application Data

```json
{
  "name": "John Doe",
  "aadhaar": "123456789012",
  "phone": "9876543210",
  "address": "123 Main Street, City, State"
}
```

## Development

### Project Structure
```
fraud-detection-app/
├── backend/
│   ├── server.ts              # Main Express server
│   ├── config/database.ts     # MongoDB Atlas connection
│   ├── models/               # Mongoose schemas
│   ├── routes/               # API routes
│   ├── services/             # Business logic
│   └── ml/                   # Python ML scripts
├── frontend/react-dashboard/  # React application
├── .env                      # Environment variables
└── README.md
```

### Adding New Rules

```javascript
const newRule = {
  ruleId: "CUSTOM_RULE",
  description: "Custom detection rule",
  condition: {
    type: "fuzzy",        // "exact" or "fuzzy"
    field: "name",        // field to check
    threshold: 0.9        // for fuzzy matching
  },
  score: 50,              // risk points
  active: true
};
```

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Verify internet connection
   - Check if MongoDB Atlas cluster is running
   - Ensure IP is whitelisted in Atlas

2. **Python Script Errors**
   - Install Python dependencies: `pip install rapidfuzz`
   - Ensure Python is in PATH

3. **Port Conflicts**
   - Backend: Change PORT in .env
   - Frontend: Modify package.json proxy

### Logs

- Backend logs: Console output from `npm run server`
- Frontend logs: Browser developer console

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables
3. Deploy to your preferred hosting platform
4. Ensure MongoDB Atlas is accessible from production

## Security Notes

- Aadhaar numbers are hashed using SHA-256
- No credentials are hardcoded in source files
- Environment variables used for sensitive data
- CORS enabled for frontend communication

## License

MIT License - See LICENSE file for details