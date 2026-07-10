# InternshipX Deployment Guide

This guide outlines how to run your 1-month internship mini-project locally and how to deploy it online.

---

## 💻 Local Setup & Testing

### 1. Backend Server
1. Navigate to the `backend` directory in your terminal:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server in development mode:
   ```bash
   npm run dev
   ```
   *Your server should print: `🚀 Server running on port 5000` and `✅ MongoDB Connected`.*

### 2. Frontend Client
1. Make sure `frontend/js/config.js` is set to your local backend URL:
   ```javascript
   const CONFIG = {
       API_URL: "http://localhost:5000/api"
   };
   ```
2. Open `frontend/index.html` directly in your browser, or serve it using an extension like **Live Server** in VS Code.

---

## 🚀 Live Deployment Guide

To make your project accessible to anyone on the web, you can deploy the backend to **Render** and the frontend to **Netlify** or **Vercel** for free.

### Phase 1: Deploying the Backend on Render
1. Create a free account at [Render](https://render.com/).
2. Push your codebase to a GitHub repository (both `backend/` and `frontend/` folders in the same repo is fine).
3. On Render, click **New +** and select **Web Service**.
4. Connect your GitHub repository.
5. Configure the web service:
   * **Name:** `internshipx-backend`
   * **Root Directory:** `backend` (Important: this tells Render to look in the backend folder!)
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `node server.js`
6. Add Environment Variables under the **Environment** tab:
   * `PORT`: `5000`
   * `MONGO_URI`: `mongodb://maksuf_db_user:Maksuf123@ac-eonrj20-shard-00-00.ewxhwth.mongodb.net:27017,ac-eonrj20-shard-00-01.ewxhwth.mongodb.net:27017,ac-eonrj20-shard-00-02.ewxhwth.mongodb.net:27017/?ssl=true&replicaSet=atlas-ra93s4-shard-0&authSource=admin&appName=Cluster0`
   * `JWT_SECRET`: `ThisIsMySecretKey123`
   * `EMAIL_USER`: `maksufmasrur786@gmail.com`
   * `EMAIL_PASS`: `ojepqzrowkbellcb`
7. Click **Deploy Web Service**. Once deployed, Render will provide a live URL (e.g. `https://internshipx-backend.onrender.com`).

---

### Phase 2: Updating the Frontend Config
Before deploying the frontend, update `frontend/js/config.js` to point to your new live backend URL:
```javascript
const CONFIG = {
    API_URL: "https://internshipx-backend.onrender.com/api" // Replace with your Render URL
};
```
Make sure to commit and push this change to GitHub.

---

### Phase 3: Deploying the Frontend on Netlify or Vercel
You can deploy the frontend folder for free.

#### Option A: Netlify (Drag and Drop)
1. Go to [Netlify](https://www.netlify.com/) and log in.
2. Go to the **Sites** tab.
3. Drag and drop the `frontend` folder from your computer directly into the deployment upload box.
4. Netlify will instantly host your page and give you a live shareable URL!

#### Option B: Vercel (GitHub integration)
1. Go to [Vercel](https://vercel.com/) and log in with GitHub.
2. Click **Add New** ➡️ **Project**.
3. Select your repository.
4. Configure the settings:
   * **Root Directory:** `frontend`
5. Click **Deploy**. Vercel will build and host your frontend!

---

## 🛠️ Verification Checklist for Submission
- [x] Landing page uses the premium **Modern Tech** color scheme (no "AI template" look).
- [x] Dashboards show clear prefixes for Company, Location, Stipend, Duration, and Skills.
- [x] Card titles are clear and legible at `1.45rem`.
- [x] Login and Dashboard pages have matched color schemes.
- [x] Backend connects to MongoDB and starts successfully.
