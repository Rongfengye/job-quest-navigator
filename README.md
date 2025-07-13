# 🎯 Storyline - AI-Powered Interview Preparation

> **Transform your interview skills with personalized AI coaching that adapts to your background and career goals.**

## 🚀 What is Storyline?

Storyline is an intelligent interview preparation platform that helps job seekers master behavioral interviews through AI-guided practice sessions. Unlike generic interview prep tools, Storyline creates personalized questions and feedback based on your specific resume, job description, and career background.

### ✨ Key Features

- **🎯 Personalized Question Generation**: AI analyzes your resume and job description to create relevant behavioral questions
- **🎙️ Interactive Practice Sessions**: Practice answering questions with real-time guidance and feedback
- **📊 Performance Analytics**: Get detailed feedback on your storytelling structure, relevance, and delivery
- **🤖 Guided Response Assistance**: AI helps you brainstorm examples and structure compelling narratives
- **📱 Audio Feedback**: Receive voice-based feedback to improve your verbal communication skills
- **🏢 Company-Specific Questions**: Practice questions tailored to your target company and role

## 🎯 How It Works

### 1. **Upload Your Application Materials**
Upload your resume, job description, and any additional documents. Our AI analyzes your background and the role requirements to understand your experience and the position you're applying for.

### 2. **Practice Behavioral Interviews**
Engage in immersive behavioral practice sessions where you answer real interview questions. Learn to articulate your achievements effectively and develop confidence in showcasing your experience.

### 3. **Receive Personalized Feedback**
Get detailed, AI-powered feedback on your responses. Our system evaluates your storytelling structure, relevance to the question, and overall delivery to help you improve.

### 4. **Practice Company-Specific Questions**
Our AI curates behavioral questions based on your target company, role, and culture—drawing from real interview questions used by hiring managers.

### 5. **Get Guided Response Assistance**
Receive personalized coaching as you craft each response. Our AI helps you brainstorm relevant examples and structure compelling narratives step-by-step.

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Radix UI, Tailwind CSS
- **Backend**: Supabase (Database, Auth, Edge Functions)
- **AI Integration**: OpenAI API for question generation and feedback
- **State Management**: TanStack Query, React Context
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for backend services)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd job-quest-navigator

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase and OpenAI API keys

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file with:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_OPENAI_API_KEY=your_openai_api_key
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Application pages
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── integrations/       # External service integrations
├── utils/              # Utility functions
└── data/               # Static data and constants
```

## 🎯 Core Features Explained

### Behavioral Interview Practice
- **Personalized Questions**: AI generates questions based on your resume and job description
- **Real-time Feedback**: Get instant feedback on your responses
- **Progress Tracking**: Monitor your improvement over time

### AI-Powered Coaching
- **Guided Responses**: AI helps structure your answers with relevant examples
- **Performance Analysis**: Detailed breakdown of your interview skills
- **Company Research**: Questions tailored to specific companies and roles

### User Experience
- **Intuitive Interface**: Clean, modern design focused on practice
- **Mobile Responsive**: Practice anywhere, anytime
- **Progress Dashboard**: Track your interview preparation journey

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Key Components

- **`src/pages/Behavioral.tsx`**: Main behavioral interview dashboard
- **`src/pages/CreateBehavioral.tsx`**: Create new practice sessions
- **`src/pages/BehavioralInterview.tsx`**: Interactive interview practice
- **`src/components/Hero.tsx`**: Landing page hero section
- **`src/components/HowItWorks.tsx`**: Feature demonstration

## 🎯 Mission

Storyline empowers job seekers to approach interviews with confidence by providing personalized, AI-driven practice that adapts to their unique background and career goals. We believe everyone deserves to showcase their best self in interviews, and our platform makes that possible through intelligent, adaptive coaching.

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for more details.

## 📄 License

This project is licensed under the MIT License.

---

**Built with ❤️ by the Storyline team**

*Transform your interview preparation with AI-powered coaching that adapts to you.*
