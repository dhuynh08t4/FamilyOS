# AI Smart Scanner Implementation

## Overview
Automated receipt scanning using Google Gemini 1.5 Flash. The system extracts data from images and populates the transaction form.

## Workflow
1. **Source**: User selects a file or snaps a photo.
2. **AI Processing**:
    - Retrieve Gemini API Key (Personal or Global).
    - Send image to Google Generative AI with a structured prompt.
    - Result is expected in JSON format.
3. **Review**: User verifies the extracted:
    - Amount
    - Date
    - Category
    - Notes
4. **Save**: Data is saved to the `transactions` table and the image is uploaded to the `family-os` storage bucket.

## Technical Details
- **Model**: `gemini-1.5-flash`
- **Library**: `@google/generative-ai`
- **Storage**: Supabase Storage (`family-os` bucket).
- **Compression**: `browser-image-compression` for faster uploads.
