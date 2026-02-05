import React, { useState, useRef } from 'react';
import { ChevronLeft, ZoomIn, RefreshCw, Check, Loader2, Sparkles, Upload, Settings, Plus, Trash2, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateSmartContent, GEMINI_MODELS } from '../lib/gemini';
import imageCompression from 'browser-image-compression';

interface ScannedItem {
    id: string;
    amount: string;
    date: string;
    category: string;
    note: string;
}

const AIScanner: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // UI State
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);

    // Data State
    const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [selectedModel, setSelectedModel] = useState(GEMINI_MODELS[0]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        processImage(file);
    };

    const processImage = async (file: File) => {
        setIsProcessing(true);
        setProgress(10);
        try {
            setProgress(30);

            // Convert file to base64 for Gemini
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const base64Data = (reader.result as string).split(',')[1];
                setProgress(50);

                const prompt = `Analyze this image which may contain ONE or MORE receipts/items. 
                Extract transaction data for EACH distinct receipt or line item you can identify.
                Return a JSON ARRAY of objects. Format:
                [
                    {
                        "amount": number,
                        "date": "YYYY-MM-DD",
                        "category": "string (one of: Groceries, Utilities, Dining Out, Entertainment, Transport, Health, Kids, Other)",
                        "note": "brief summary"
                    }
                ]
                Return ONLY the JSON array.`;

                const result = await generateSmartContent(
                    prompt,
                    { data: base64Data, mimeType: file.type },
                    selectedModel
                );

                const response = result.response.text();
                setProgress(90);

                try {
                    // Clean response (Gemini sometimes adds markdown blocks)
                    const jsonStr = response.replace(/```json|```/g, '').trim();
                    const data = JSON.parse(jsonStr);
                    const items = Array.isArray(data) ? data : [data];

                    const mappedItems = items.map((item: any) => ({
                        id: Math.random().toString(36).substr(2, 9),
                        amount: item.amount?.toString() || '',
                        date: item.date || new Date().toISOString().split('T')[0],
                        category: item.category || 'Groceries',
                        note: item.note || ''
                    }));

                    setScannedItems(mappedItems);
                } catch (e) {
                    console.error('Failed to parse AI response:', response);
                }

                setProgress(100);
                setIsProcessing(false);
            };
        } catch (error: any) {
            console.error('AI Error:', error);
            alert(error.message || 'AI processing failed');
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (scannedItems.length === 0 || !selectedFile) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Compress and Upload Image (Once for all items)
            const compressedFile = await imageCompression(selectedFile, { maxSizeMB: 1, maxWidthOrHeight: 1024 });
            const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;

            const { error: uploadError } = await supabase.storage
                .from('family-os')
                .upload(fileName, compressedFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage.from('family-os').getPublicUrl(fileName);

            // 3. Save to DB (Batch Insert)
            const transactions = scannedItems.map(item => ({
                user_id: user.id,
                amount: parseFloat(item.amount) || 0,
                category: item.category,
                note: item.note,
                date: item.date,
                image_url: publicUrl,
                type: 'expense'
            }));

            const { error: dbError } = await supabase
                .from('transactions')
                .insert(transactions);

            if (dbError) throw dbError;

            navigate('/wallet');
        } catch (error: any) {
            console.error('Save error:', error);
            alert(error.message || 'Failed to save transaction');
        } finally {
            setIsSaving(false);
        }
    };

    const updateItem = (id: string, field: keyof ScannedItem, value: string) => {
        setScannedItems(items => items.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const removeItem = (id: string) => {
        setScannedItems(items => items.filter(item => item.id !== id));
    };

    const addNewItem = () => {
        setScannedItems(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Groceries',
            note: ''
        }]);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-900 dark:text-white transition-colors duration-200">
            <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-gray-200 dark:border-gray-800">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center justify-center p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold tracking-tight">AI Smart Scanner</h1>
                <div className="relative">
                    <select
                        className="bg-gray-100 dark:bg-gray-800 text-xs font-bold py-2 pl-3 pr-8 rounded-xl appearance-none outline-none border-none"
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                    >
                        {GEMINI_MODELS.map(m => (
                            <option key={m} value={m}>{m.replace('gemini-', '').replace('-preview', '')}</option>
                        ))}
                    </select>
                    <Settings size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
            </header>

            <main className="max-w-md mx-auto pb-32 w-full lg:max-w-4xl lg:grid lg:grid-cols-2 lg:gap-8 lg:px-8">
                {/* Image Preview Container */}
                <div className="px-4 py-6 lg:px-0">
                    <div className="relative group">
                        <div className="w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 flex items-center justify-center cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="flex flex-col items-center gap-3 text-slate-400">
                                    <div className="size-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                        <Upload size={32} />
                                    </div>
                                    <p className="font-bold text-sm">Tap to upload receipt</p>
                                </div>
                            )}

                            {/* Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                                    <Loader2 size={64} className="text-primary animate-spin mb-4" />
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-full max-w-xs">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-sm font-medium">Processing with Gemini AI</span>
                                            <span className="text-white text-xs font-bold bg-primary px-2 py-0.5 rounded-full">{progress}%</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        {previewUrl && (
                            <button className="absolute bottom-4 right-4 bg-white/90 dark:bg-gray-800/90 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 text-primary">
                                <ZoomIn size={20} />
                            </button>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileSelect}
                        />
                    </div>
                </div>

                {/* Extracted Details List */}
                <section className="px-4 space-y-6 py-6 lg:px-0">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold">Review Items ({scannedItems.length})</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={addNewItem} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-primary">
                                <Plus size={20} />
                            </button>
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded-xl">
                                <Sparkles size={10} className="text-primary" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">AI Insight</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {scannedItems.map((item, index) => (
                            <div key={item.id} className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <span className="absolute -left-3 top-6 size-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700">
                                    {index + 1}
                                </span>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Total Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-primary">$</span>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-3 pl-9 pr-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none transition-all"
                                            type="number"
                                            step="0.01"
                                            value={item.amount}
                                            onChange={(e) => updateItem(item.id, 'amount', e.target.value)}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Date</label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                            type="date"
                                            value={item.date}
                                            onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Category</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none appearance-none"
                                                value={item.category}
                                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            >
                                                <option>Groceries</option>
                                                <option>Dining Out</option>
                                                <option>Utilities</option>
                                                <option>Entertainment</option>
                                                <option>Transport</option>
                                                <option>Health</option>
                                                <option>Kids</option>
                                                <option>Other</option>
                                            </select>
                                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Notes</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Description..."
                                        value={item.note}
                                        onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        {scannedItems.length === 0 && (
                            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <p className="text-sm font-medium">No items detected yet.</p>
                                <p className="text-xs">Upload a receipt to start.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Actions Container */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-50">
                <div className="max-w-md mx-auto grid grid-cols-2 gap-4 lg:max-w-4xl">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <RefreshCw size={18} />
                        Rescan
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isProcessing || scannedItems.length === 0}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                        Save All ({scannedItems.length})
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AIScanner;
