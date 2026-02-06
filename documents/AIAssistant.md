# AI Assistant (FamilyOS Assistant)

## Overview
A smart digital companion integrated into FamilyOS to help manage finances, notes, and system settings through natural language.

## Capabilities
- **Financial Querying**: Ask for latest transactions, budget summaries, or top expenses.
- **Action Execution**:
    - **Transactions**: Add new expenses or income (e.g., "Ăn sáng 30k").
    - **Budgeting**: Create or update budget plans.
    - **Notes**: Search or add new notes (e.g., "Nhắc tôi mua sữa").
    - **Messages**: Send messages to the family chat.
- **Theme Management**: Change system color themes and light/dark modes (e.g., "Chế độ tối", "Màu hồng").
- **Quick Actions**: Icon-based buttons for frequent tasks (Joke, Add Note, Add Budget, Add Expense, Summaries).
- **Interactive Data**: Query results are rendered as structured UI cards within the chat.
- **Text-to-Speech (TTS)**: High-quality Vietnamese voice narration for AI responses using Natural/Google voices.

## Integration
- **Floating Bubble**: Accessible from any page via a floating action button.
- **Dedicated Chat Mode**: Integrated into the main Chat page as a private interaction channel.
- **Dual Flow**: Supports both direct text responses and structured JSON-based database actions.

## Technical Stack
- **AI Core**: Google Gemini API via `processAIRequest`.
- **Infrastructure**: Supabase for data persistence and `user_settings` for preferences.
- **Real-time**: Dispatches custom events (`family-os-refresh`) to sync UI state after AI actions.
