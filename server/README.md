# CultureSense Server

Backend API server for the CultureSense AI application.

## Deployment on Render

### Prerequisites

1. **MongoDB Database**: Set up a MongoDB database (MongoDB Atlas recommended)
2. **Google OAuth**: Configure Google OAuth credentials
3. **AI Service API Keys**: Get API keys for AI services (Gemini, Mistral, etc.)

### Environment Variables

Set these environment variables in your Render dashboard:

#### Required Variables:
- `MONGODB_URI`: Your MongoDB connection string
- `SESSION_SECRET`: A secure random string for session encryption
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `FRONTEND_URL`: Your frontend application URL
- `BACKEND_URL`: Your backend application URL (will be provided by Render)

#### Optional Variables:
- `GEMINI_API_KEY`: Google Gemini AI API key
- `MISTRAL_API_KEY`: Mistral AI API key
- `OPENROUTER_API_KEY`: OpenRouter API key
- `TOGETHER_API_KEY`: Together AI API key
- `QLOO_API_URL`: Qloo API URL

### Deployment Steps

1. **Connect Repository**: Connect your GitHub repository to Render
2. **Create Web Service**: Create a new Web Service
3. **Configure Settings**:
   - **Name**: `culturesense-server`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `server` (if deploying from monorepo)
4. **Set Environment Variables**: Add all required environment variables
5. **Enable Auto-Deploy**: Enable auto-deploy for automatic updates

### Health Check

The application includes a health check endpoint at `/health` that Render will use to monitor the service.

### CORS Configuration

Update the CORS configuration in `app.js` to include your frontend domain:

```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:8080', `${process.env.FRONTEND_URL}`],
  credentials: true,
  optionsSuccessStatus: 200
}));
```

### Google OAuth Configuration

1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add your Render domain to authorized redirect URIs:
   - `https://your-app-name.onrender.com/api/auth/google/callback`

### Database Setup

1. Create a MongoDB database (MongoDB Atlas recommended)
2. Get the connection string
3. Set `MONGODB_URI` environment variable

### Monitoring

- Check Render logs for any deployment issues
- Monitor the health check endpoint
- Set up alerts for service downtime

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with file watching
npm run dev:watch
```

## API Endpoints

- `GET /health` - Health check
- `GET /api/auth/google` - Google OAuth login
- `GET /api/auth/status` - Check authentication status
- `POST /api/chat/message` - Send chat message
- `GET /api/discover` - Get cultural discoveries
- `GET /api/ai-insights/personality-analysis` - Get AI insights

## Troubleshooting

1. **Build Failures**: Check if all dependencies are in `package.json`
2. **Environment Variables**: Ensure all required variables are set
3. **Database Connection**: Verify MongoDB URI is correct
4. **CORS Issues**: Update CORS configuration with correct frontend URL
5. **OAuth Issues**: Check redirect URIs in Google Cloud Console 