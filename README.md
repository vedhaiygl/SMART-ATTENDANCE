<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Supabase Setup

This app uses Supabase for authentication and data storage. To set it up:

1. **Create a Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Wait for the project to be ready

2. **Get Your Credentials:**
   - Go to Settings > API in your Supabase dashboard
   - Copy your Project URL and anon/public key

3. **Update Environment Variables:**
   - Open `.env.local` file
   - Replace the placeholder values with your actual Supabase credentials:
     ```
     VITE_SUPABASE_URL=your_actual_supabase_url
     VITE_SUPABASE_ANON_KEY=your_actual_anon_key
     ```

4. **Run Database Migrations:**
   - In your Supabase dashboard, go to the SQL Editor
   - Copy and run the contents of `supabase/migrations/create_profiles_table.sql`
   - Then copy and run the contents of `supabase/migrations/create_courses_and_attendance.sql`

5. **Configure Authentication:**
   - In your Supabase dashboard, go to Authentication > Settings
   - Disable "Enable email confirmations" for easier testing
   - You can enable it later for production

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set up your environment variables in [.env.local](.env.local):
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `GEMINI_API_KEY`: Your Gemini API key (for AI features)
3. Run the app:
   `npm run dev`

## Features

- **Authentication:** Secure login for faculty and students
- **Course Management:** Create courses and manage enrollments
- **QR Code Attendance:** Generate QR codes for live attendance tracking
- **Analytics:** View attendance trends and insights
- **AI Insights:** Get AI-powered recommendations for improving engagement
- **Student Portal:** Students can view their attendance and scan QR codes
- **Leaderboards:** Gamified attendance tracking with streaks and badges

## Default Test Users

After setting up Supabase, you can create test accounts:
- Faculty: Use the "Faculty Portal" to sign up
- Student: Use the "Student Portal" to sign up

The app will automatically create the appropriate user profiles in the database.