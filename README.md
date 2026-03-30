# Agentic-First AI Office Suite

A web-based office suite that uses AI agents to generate, edit, and manage Excel spreadsheets, Word documents, and PowerPoint presentations.

## Architecture

- **Frontend**: Next.js 14+ with TypeScript, Tailwind CSS, Vercel AI SDK v6
- **Backend**: Python 3.11+ with FastAPI, LangGraph for agent orchestration
- **AI Models**: OpenRouter API with free tier models
- **File Generation**: openpyxl, python-docx, python-pptx, ReportLab

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Environment Variables

### Backend (.env)
```
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://user:pass@localhost/office_suite
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
