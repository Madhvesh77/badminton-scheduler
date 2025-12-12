# Deploy Badminton Scheduler to Render

## ✅ Code Changes Complete

All necessary code changes have been made:

- ✅ Backend now serves frontend static files in production
- ✅ Frontend API URL uses relative paths in production
- ✅ Root package.json with build and start scripts
- ✅ Environment-aware configuration

## 📋 Deployment Steps

### Step 1: Push Your Code to GitHub

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub (recommended)

### Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub account (if not already connected)
3. Select your `badminton-scheduler` repository
4. Click **"Connect"**

### Step 4: Configure the Service

Fill in these settings:

**Basic Info:**

- **Name**: `badminton-scheduler` (or any name you prefer)
- **Region**: Choose closest to your location
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave blank
- **Runtime**: `Node`

**Build & Deploy Settings:**

**Build Command:**

```bash
npm run install-backend && npm run install-frontend && npm run build
```

**Start Command:**

```bash
npm start
```

**Advanced Settings:**

- **Auto-Deploy**: Yes (enabled by default)
- **Node Version**: Ensure it's 18.x or higher

### Step 5: Environment Variables (Optional)

Click **"Advanced"** and add if needed:

- `NODE_ENV`: `production` (should be automatic)
- `PORT`: Will be set automatically by Render

### Step 6: Deploy!

1. Click **"Create Web Service"**
2. Render will start building your app
3. Watch the build logs (takes 3-5 minutes)

### Step 7: Verify Deployment

Once deployed (status shows "Live"):

1. Click on your app URL (e.g., `https://badminton-scheduler-xxxx.onrender.com`)
2. Test creating a schedule
3. Verify all features work:
   - ✅ Create schedule with players
   - ✅ View rounds
   - ✅ Mark rounds as complete
   - ✅ Copy/Download schedule

## 🎯 Your App URL

After deployment, your URL will be:

```
https://badminton-scheduler-XXXX.onrender.com
```

Replace `XXXX` with your unique Render identifier.

## 🔄 Automatic Deployments

Every time you push to GitHub (main branch):

- Render automatically detects changes
- Rebuilds and redeploys your app
- Zero downtime deployment

## 🐛 Troubleshooting

### Build Fails

- Check Render logs for errors
- Verify all dependencies are in package.json files
- Ensure Node version is 18.x or higher

### App Loads but API Fails

- Check Render logs for backend errors
- Verify environment variables are set
- Check that frontend build was successful

### 404 on Refresh

- Ensure the catch-all route in backend is working
- Verify `NODE_ENV=production` is set

### Need to Check Logs

1. Go to Render dashboard
2. Click on your service
3. Click "Logs" tab
4. View real-time logs

## 💰 Pricing

**Free Tier:**

- ✅ Perfect for this app
- 750 hours/month (enough for one always-on app)
- App sleeps after 15 min of inactivity
- Takes ~30 seconds to wake up

**Paid Tier ($7/month):**

- Always on, no sleep
- Better performance
- Custom domain support

## 🌐 Custom Domain (Optional)

To add your own domain:

1. Go to your service **Settings**
2. Scroll to **Custom Domain**
3. Add your domain (e.g., `badminton.yourdomain.com`)
4. Follow DNS instructions:
   - Add CNAME record pointing to your Render URL
   - Wait for DNS propagation (5-60 minutes)

## ✨ Post-Deployment

Your app is now live! Share the URL with your team.

**Pro Tips:**

- Render free tier apps sleep after 15 min - first load may be slow
- Keep your GitHub repo private if you don't want code public
- Monitor usage in Render dashboard
- Check logs regularly for any issues

## 🚀 Done!

Your Badminton Scheduler is now deployed and accessible worldwide!

Need help? Check Render docs: https://render.com/docs
