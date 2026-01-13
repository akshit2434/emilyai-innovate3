# EmilyAI - Research & Marketing Agent

EmilyAI is a hackathon project built to serve as a comprehensive research and marketing agent for brands and startup founders. It leverages cutting-edge AI models and specialized tools to automate market analysis and asset creation.

## Project Vision

The goal of EmilyAI is to provide an intuitive platform where users can either manage existing products or start new ones. Within each product, users have access to two primary capabilities:

1.  **AI Research Assistant**: A chat-based interface where users can request in-depth research, market analysis, and web searches.
2.  **Instant Asset Creation**: A streamlined workflow to generate marketing assets (ads, social media posts, videos, etc.) from simple ideas.

## Core Features

-   **Product Management**: Organize research and assets by specific products or projects.
-   **Intelligent Chat**: Perform complex research tasks using an agentic AI framework.
-   **Multi-Format Asset Generation**:
    -   Social Media Posts: LinkedIn, Twitter.
    -   Marketing Images.
    -   Short-form Videos: 9:16 (Reels/TikTok) and 16:9 (Short ads).
    -   Note: Generation (~5-10 mins) is handled via direct AI model APIs with status notifications.

## Technical Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Database & Storage**: [Supabase](https://supabase.com/) (PostgreSQL for data/chat memory, Storage for assets).
-   **Authentication**: [Clerk](https://clerk.com/) (Preferred for ease of setup).
-   **AI Orchestration**:
    -   [Gemini 2.5 Flash](https://ai.google.dev/models/gemini) (via Google AI API)
    -   [LangChain](https://www.langchain.com/) & [LangGraph](https://www.langchain.com/langgraph)
-   **Infrastructure**:
    -   Deployment: [Vercel](https://vercel.com/)
    -   Async Tasks: Handling 5-10 min AI generations via background webhooks or queuing (e.g., Upstash/QStash).
-   **Tools & APIs**:
    -   **Search**: Brave Web Search or SERP API.
    -   **Execution**: Python execution engine for data analysis.
    -   **File AI**: Specialized handling of files where needed.
    -   **Custom Tools**: Extensible toolset developed as the project evolves.

## Getting Started

### Prerequisites
-   Node.js & [pnpm](https://pnpm.io/)
-   API keys for Gemini, Brave/SERP API, etc.

### Installation
```bash
pnpm install
```

### Development
```bash
pnpm dev
```
