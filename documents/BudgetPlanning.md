# Budget Planning Implementation

## Overview
A comprehensive tool for planning and tracking monthly budgets against actual spending. It allows users to set spending limits for specific categories and timeframes.

## Features
- **Plan Management**: Create, Edit, and Delete budget plans.
- **Transaction Linking**: Link existing transactions to a budget plan or create new ones directly within the plan.
- **Visual Progress**: Progress bars showing "Planned vs. Actual" spending with percentage indicators.
- **Unlinking/Removal**: Remove transactions from a plan (unlink) or delete them permanently from the system.
- **Date Picker**: Specific date selection when adding new transactions.

## Technical Details
- **Database**: `budget_plans` table linked to `transactions` via `budget_plan_id`.
- **Real-time**: Updates reflect instantly across devices.
- **Currency**: Formatted in VND (or user preference).
