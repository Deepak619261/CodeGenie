# NexusCode

Cost-aware coding agent for VS Code. Three-tier model router (Ollama / MiniMax / OpenAI / Gemini / Anthropic), per-task budget envelope with hard stop, and a semantic context compactor that elides irrelevant function bodies before sending files to the model.

Requires the NexusCode Python backend running on `ws://127.0.0.1:8765/ws`.

## Commands

- `NexusCode: Open Chat`
- `NexusCode: Set Task Budget`
