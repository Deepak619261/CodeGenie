# 🧬 CodeGenie: The Cost-Aware Coding Agent

[![VS Code Extension](https://img.shields.io/badge/VS%20Code-Extension-blue?logo=visual-studio-code)](https://marketplace.visualstudio.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**CodeGenie** is a high-performance, cost-aware coding agent designed to provide state-of-the-art LLM capabilities while keeping your API spending under strict control. It features an intelligent 3-tier routing system that selects the most efficient model for every sub-task, ensuring you get "GPT-4 quality" for complex logic and "Ollama/MiniMax speed" for routine boilerplate.

---

## 🚀 Key Features

- **🧠 Intelligent 3-Tier Router**: Automatically routes tasks between **T0 (Fast/Local)**, **T1 (Balanced)**, and **T2 (Powerhouse)** models based on task complexity and remaining budget.
- **💰 Per-Task Budget Envelope**: Set a maximum USD budget for any single task. CodeGenie will halt execution before exceeding your limit.
- **📄 Semantic Context Compaction**: Saves tokens and money by intelligently eliding irrelevant function bodies and non-essential code before sending context to the LLM.
- **📊 Real-time Budget Tracking**: A native VS Code status bar item shows your current spending vs. budget in real-time.
- **⚡ High-Performance Backend**: Communicates via WebSockets to a dedicated Python backend for low-latency tool execution and file manipulation.

---

## 🛠️ Tech Stack

- **Frontend**: VS Code Extension API, TypeScript.
- **Communication**: WebSockets (`ws`) for fast, bi-directional event streaming.
- **Routing**: Support for multiple providers including Ollama, MiniMax, OpenAI, Gemini, and Anthropic.
- **Backend (Required)**: Python-based agentic server for context processing and model orchestration.

---

## 📦 Setup Instructions

### 1. Prerequisites
- [VS Code v1.85.0+](https://code.visualstudio.com/)
- Node.js & npm
- A running **CodeGenie Backend Server** (Python)

### 2. Installation
Clone the repository and install dependencies:
```bash
git clone https://github.com/Deepak619261/CodeGenie.git
cd CodeGenie/extension
npm install
```

### 3. Build & Run
1. Open the project in VS Code.
2. Run the build task:
   ```bash
   npm run compile
   ```
3. Press `F5` to open a new **Extension Development Host** window with CodeGenie enabled.

### 4. Connect Backend
Ensure your CodeGenie Python backend is running on:
`ws://127.0.0.1:8765/ws`

---

## 🎮 How to Use

1. **Open the Chat**: Use the command `CodeGenie: Open Chat` or click the 🚀 icon in the activity bar.
2. **Set a Budget**: Click the budget bar in the status bar (bottom right) or run `CodeGenie: Set Task Budget`.
3. **Start Coding**: Type your request. CodeGenie will show you exactly which model it's using (T0/T1/T2) and how much each step costs.

---

## 📝 Problem It Solves

Modern coding agents are powerful but often **prohibitively expensive** or **unnecessarily slow**. They frequently use expensive flagship models for simple tasks like "rename this variable" or "write a docstring." 

**CodeGenie solves this by:**
1. **Never overpaying**: Using local or cheaper models for 80% of routine work.
2. **Context Guard**: Reducing input noise to save up to 60% on token costs.
3. **Hard Ceiling**: Giving developers peace of mind with a hard stop on billing per task.

---

## 🛡️ Security & Privacy
- **No API Keys Stored in Extension**: All sensitive credentials remain in your backend environment.
- **Local Proxy Support**: Compatible with local LLMs via Ollama for 100% private coding.

---

*Happy Coding with CodeGenie!* 🧞‍♂️
