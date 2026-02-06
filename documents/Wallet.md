# Wallet & Transactions Implementation

## Overview
A real-time financial tracking system for the family. It tracks income and expenses, categorizes them, and provides a visual breakdown.

## Features
- **Real-time Synchronization**: Uses Supabase Realtime to update the transaction list instantly.
- **Budget Tracking**: Visual progress bars and donut charts for category breakdowns. In the Dashboard, the monthly budget limit is dynamically calculated as the total income of the current month.
- **AI FinAssistant**: Floating chat bubble powered by Gemini to add transactions or budget plans via natural language.
- **Search & Filter**: Search transactions by note/category/user and filter by specific categories.
- **Manual Logging**: Quick entry for cash transactions.
- **Responsive Layout**: Table view for Desktop, scrollable list for Mobile.

## Technical Details
- **Subscription**: `supabase.channel('transactions').on(...)`.
- **Aggregation**: Client-side totals for the current month.
- **Icons**: Category-specific icons from Lucide.
