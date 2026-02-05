import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

export const GEMINI_MODELS = [
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
];

export async function getGeminiApiKeys(): Promise<string[]> {
    let rawKeys = '';

    // 1. Check user_settings first
    const { data: userData } = await supabase
        .from('user_settings')
        .select('value')
        .eq('key', 'GEMINI_API_KEY')
        .single();

    if (userData?.value) {
        rawKeys = userData.value;
    } else {
        // 2. Fallback to app_settings
        const { data: appData } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'GEMINI_API_KEY')
            .single();
        rawKeys = appData?.value || '';
    }

    if (!rawKeys) throw new Error("Gemini API Key not found. Please set it in Settings.");

    return rawKeys.split('\n').map(k => k.trim()).filter(k => k.length > 0);
}

export async function generateSmartContent(prompt: string, inlineData: { data: string, mimeType: string }, selectedModel: string) {
    const keys = await getGeminiApiKeys();
    if (keys.length === 0) throw new Error("No valid API keys found.");

    // Models to try: Selected First, then others randomly shuffles
    const otherModels = GEMINI_MODELS.filter(m => m !== selectedModel).sort(() => Math.random() - 0.5);
    const modelsToTry = [selectedModel, ...otherModels];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
        // Shuffle keys for each model attempt to distribute load
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        for (const apiKey of shuffledKeys) {
            try {
                console.log(`Trying Model: ${modelName} with Key ending in ...${apiKey.slice(-4)}`);
                const genAI = new GoogleGenerativeAI(apiKey);
                const model = genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent([
                    prompt,
                    { inlineData }
                ]);

                return result; // Success!

            } catch (error: any) {
                console.warn(`Failed with ${modelName} (...${apiKey.slice(-4)}):`, error.message);
                lastError = error;
                // If it's not a quota/server error (e.g. invalid request), maybe we shouldn't retry?
                // For now, assume we retry on everything to be safe.
            }
        }
    }

    throw lastError || new Error("All models and keys failed.");
}
