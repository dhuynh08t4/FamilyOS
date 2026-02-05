import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from "./supabase";

export async function getGeminiApiKey(): Promise<string> {
    // 1. Check user_settings
    const { data: userData } = await supabase
        .from('user_settings')
        .select('value')
        .eq('key', 'GEMINI_API_KEY')
        .single();

    if (userData?.value) return userData.value;

    // 2. Check app_settings
    const { data: appData } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'GEMINI_API_KEY')
        .single();

    if (appData?.value) return appData.value;

    throw new Error("Gemini API Key not found. Please set it in Settings.");
}

export async function getGeminiModel() {
    const apiKey = await getGeminiApiKey();
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
}
