# Render Deployment Guide for CultureSense Server

## 🚀 Quick Start

### Step 1: Prepare Your Repository

1. **Ensure your code is committed to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Verify these files exist in your `server/` directory:**
   - ✅ `package.json` (with correct start script)
   - ✅ `app.js` (main entry point)
   - ✅ `render.yaml` (deployment configuration)
   - ✅ `.gitignore` (excludes node_modules, .env)

### Step 2: Set Up MongoDB Database

1. **Create MongoDB Atlas Account** (recommended)
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get your connection string

2. **Alternative: Use Render's MongoDB Service**
   - In Render dashboard, create a new MongoDB service
   - Use the provided connection string

### Step 3: Configure Google OAuth

1. **Go to Google Cloud Console**
   - Visit [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API

2. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Set application type to "Web application"
   - Add authorized redirect URIs:
     ```
     https://your-app-name.onrender.com/api/auth/google/callback
     ```
   - Save your Client ID and Client Secret

### Step 4: Deploy to Render

1. **Sign up/Login to Render**
   - Go to [Render](https://render.com)
   - Sign up with your GitHub account

2. **Create New Web Service**
   - Click "New" > "Web Service"
   - Connect your GitHub repository
   - Select the repository containing your server code

3. **Configure Service Settings**
   ```
   Name: culturesense-server
   Environment: Node
   Region: Choose closest to your users
   Branch: main
   Root Directory: server (if deploying from monorepo)
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**
   Click "Environment" tab and add these variables:

   **Required Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/culturesense
   SESSION_SECRET=your-super-secret-random-string-here
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FRONTEND_URL=https://your-frontend-domain.com
   BACKEND_URL=https://your-app-name.onrender.com
   ```

   **Optional Variables:**
   ```
   GEMINI_API_KEY=your-gemini-api-key
   MISTRAL_API_KEY=your-mistral-api-key
   OPENROUTER_API_KEY=your-openrouter-api-key
   TOGETHER_API_KEY=your-together-api-key
   QLOO_API_URL=https://api.qloo.com
   ```

5. **Enable Auto-Deploy**
   - In the "Settings" tab, ensure "Auto-Deploy" is enabled
   - This will automatically deploy when you push to main branch

6. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy your application
   - Wait for the build to complete (usually 2-5 minutes)

### Step 5: Verify Deployment

1. **Check Health Endpoint**
   ```
   https://your-app-name.onrender.com/health
   ```
   Should return:
   ```json
   {
     "status": "OK",
     "timestamp": "2024-01-01T00:00:00.000Z",
     "environment": "production",
     "database": "connected"
   }
   ```

2. **Test API Endpoints**
   - Test authentication: `GET /api/auth/status`
   - Test discover: `GET /api/discover`
   - Test chat: `POST /api/chat/message`

### Step 6: Configure Custom Domain (Optional)

1. **Add Custom Domain**
   - In Render dashboard, go to your service
   - Click "Settings" > "Custom Domains"
   - Add your domain and configure DNS

## 🔄 Auto-Deployment Setup

### How Auto-Deployment Works

1. **Push to Main Branch**
   ```bash
   git add .
   git commit -m "Update server code"
   git push origin main
   ```

2. **Render Automatically Detects Changes**
   - Render monitors your GitHub repository
   - When it detects a push to main branch, it triggers a new deployment

3. **Build and Deploy**
   - Render runs `npm install` (build command)
   - Then runs `npm start` (start command)
   - Your app is updated with zero downtime

### Auto-Deployment Best Practices

1. **Test Locally First**
   ```bash
   npm install
   npm start
   ```

2. **Use Feature Branches**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git push origin feature/new-feature
   # Create pull request
   # Merge to main when ready
   ```

3. **Monitor Deployments**
   - Check Render logs for any build errors
   - Monitor the health endpoint after deployment
   - Set up alerts for failed deployments

## 🛠️ Troubleshooting

### Common Issues

1. **Build Fails**
   - Check if all dependencies are in `package.json`
   - Verify Node.js version compatibility
   - Check build logs in Render dashboard

2. **Environment Variables Missing**
   - Ensure all required variables are set
   - Check variable names match exactly
   - Restart service after adding variables

3. **Database Connection Issues**
   - Verify MongoDB URI is correct
   - Check if IP whitelist includes Render's IPs
   - Ensure database user has correct permissions

4. **CORS Errors**
   - Update CORS configuration with correct frontend URL
   - Check if `FRONTEND_URL` environment variable is set
   - Verify frontend is making requests to correct backend URL

5. **OAuth Issues**
   - Check redirect URIs in Google Cloud Console
   - Ensure `BACKEND_URL` is set correctly
   - Verify Google OAuth credentials are correct

### Debug Commands

1. **Check Logs**
   - In Render dashboard, go to your service
   - Click "Logs" tab to see real-time logs

2. **Test Health Endpoint**
   ```bash
   curl https://your-app-name.onrender.com/health
   ```

3. **Check Environment Variables**
   - In Render dashboard, go to "Environment" tab
   - Verify all variables are set correctly

## 📊 Monitoring

### Health Checks

- Render automatically monitors your `/health` endpoint
- Service will restart if health checks fail
- Set up alerts for service downtime

### Performance Monitoring

- Monitor response times in Render dashboard
- Check memory and CPU usage
- Set up external monitoring (UptimeRobot, etc.)

### Log Monitoring

- Check Render logs regularly
- Set up log aggregation if needed
- Monitor for errors and warnings

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit sensitive data to Git
   - Use strong, unique values for secrets
   - Rotate secrets regularly

2. **CORS Configuration**
   - Only allow necessary origins
   - Use HTTPS in production
   - Validate all incoming requests

3. **Rate Limiting**
   - Enable rate limiting for API endpoints
   - Monitor for abuse
   - Set appropriate limits

4. **Database Security**
   - Use strong database passwords
   - Enable IP whitelisting
   - Regular security updates

## 🎯 Next Steps

1. **Set up CI/CD Pipeline** (optional)
   - Add automated testing
   - Set up staging environment
   - Implement deployment strategies

2. **Add Monitoring**
   - Set up error tracking (Sentry)
   - Add performance monitoring
   - Configure alerts

3. **Scale Application**
   - Monitor usage patterns
   - Upgrade Render plan if needed
   - Consider load balancing

4. **Backup Strategy**
   - Set up database backups
   - Regular data exports
   - Disaster recovery plan

---

**Happy Deploying! 🚀** 