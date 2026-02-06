import React, { useState, useRef } from 'react';
import { FaChevronLeft, FaSearchPlus, FaSync, FaCheck, FaSpinner, FaMagic, FaUpload, FaCog, FaPlus, FaTrash, FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { generateSmartContent, GEMINI_MODELS } from '../lib/gemini';
import { useToast } from '../components/ui/ToastProvider';

interface ScannedItem {
    id: string;
    amount: string;
    date: string;
    category: string;
    note: string;
}

const AIScanner: React.FC = () => {
    const navigate = useNavigate();
    const { showToast } = useToast();
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

                /*
                    'Dâng hiến': FaChurch,
                    'Ăn uống': FaUtensils,
                    'Mua sắm': FaShoppingCart,
                    'Nợ': FaBahai,
                    'Điện nước': FaBolt,
                    'Giải trí': FaFilm,
                    'Sức khỏe': FaHeartbeat,
                    'Di chuyển': FaHome,
                    'Con cái': FaChild,
                    'Khác': FaEllipsisH,
                    'Thu nhập': FaMoneyBillWave,
                    'Thu khác': FaMoneyBillWave
                */
                const prompt = `Analyze this image which may contain ONE or MORE receipts/items. 
                Extract transaction data for EACH distinct receipt or line item you can identify.
                Return a JSON ARRAY of objects. Format:
                [
                    {
                        "amount": number,
                        "date": "YYYY-MM-DD",
                        "category": "string (one of: Dâng hiến, Ăn uống, Mua sắm, Nợ, Điện nước, Giải trí, Sức khỏe, Di chuyển, Con cái, Khác, Thu nhập, Thu khác)",
                        "note": "brief summary in Vietnamese"
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
                        amount: item.amount ? Math.abs(parseFloat(item.amount.toString().replace(/,/g, ''))).toString() : '',
                        date: item.date || new Date().toISOString().split('T')[0],
                        category: item.category || 'Đi chợ',
                        note: item.note || ''
                    }));

                    setScannedItems(mappedItems);
                    showToast(`Đã tìm thấy ${mappedItems.length} mục`, 'success');
                } catch (e) {
                    console.error('Failed to parse AI response:', response);
                    showToast('Không thể đọc dữ liệu từ AI', 'error');
                }

                setProgress(100);
                setIsProcessing(false);
            };
        } catch (error: any) {
            console.error('AI Error:', error);
            showToast(error.message || 'AI processing failed', 'error');
            setIsProcessing(false);
        }
    };

    const handleSave = async () => {
        if (scannedItems.length === 0 || !selectedFile) return;
        setIsSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            // 1. Upload Original Image (Preserve Quality)
            const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;

            const { error: uploadError } = await supabase.storage
                .from('family-os')
                .upload(fileName, selectedFile);

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

            showToast('Đã lưu tất cả hóa đơn', 'success');
            navigate('/wallet');
        } catch (error: any) {
            console.error('Save error:', error);
            showToast(error.message || 'Failed to save transaction', 'error');
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
            category: 'Đi chợ',
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
                    <FaChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-bold tracking-tight">Quét Thông Minh AI</h1>
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
                    <FaCog size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                                        <FaUpload size={32} />
                                    </div>
                                    <p className="font-bold text-sm">Chạm để tải lên hóa đơn</p>
                                </div>
                            )}

                            {/* Processing Overlay */}
                            {isProcessing && (
                                <div className="absolute inset-0 bg-background-dark/40 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                                    <FaSpinner size={64} className="text-primary animate-spin mb-4" />
                                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md border border-white/20 w-full max-w-xs">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-white text-sm font-medium">Đang xử lý với Gemini AI</span>
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
                                <FaSearchPlus size={20} />
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
                        <h2 className="text-xl font-bold">Xem lại các mục ({scannedItems.length})</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={addNewItem} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-primary">
                                <FaPlus size={20} />
                            </button>
                            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-2 py-1.5 rounded-xl">
                                <FaMagic size={10} className="text-primary" />
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Thông tin AI</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {scannedItems.map((item, index) => (
                            <div key={item.id} className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 group">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                        <FaTrash size={16} />
                                    </button>
                                </div>

                                <span className="absolute -left-3 top-6 size-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-400 border border-slate-200 dark:border-slate-700">
                                    {index + 1}
                                </span>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Tổng số tiền</label>
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
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Ngày</label>
                                        <input
                                            className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                            type="date"
                                            value={item.date}
                                            onChange={(e) => updateItem(item.id, 'date', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Danh mục</label>
                                        <div className="relative">
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none appearance-none"
                                                value={item.category}
                                                onChange={(e) => updateItem(item.id, 'category', e.target.value)}
                                            >
                                                <option>Đi chợ</option>
                                                <option>Ăn uống</option>
                                                <option>Điện nước</option>
                                                <option>Giải trí</option>
                                                <option>Di chuyển</option>
                                                <option>Sức khỏe</option>
                                                <option>Con cái</option>
                                                <option>Dâng hiến</option>
                                                <option>Khác</option>
                                            </select>
                                            <FaChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">Ghi chú</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border-none rounded-xl py-2.5 px-4 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        placeholder="Mô tả..."
                                        value={item.note}
                                        onChange={(e) => updateItem(item.id, 'note', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                        {scannedItems.length === 0 && (
                            <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                <p className="text-sm font-medium">Chưa tìm thấy mục nào.</p>
                                <p className="text-xs">Tải lên hóa đơn để bắt đầu.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Bottom Actions Container */}
            <footer className="fixed bottom-0 left-0 right-0 bg-background-light dark:bg-background-dark border-t border-gray-200 dark:border-gray-800 p-4 pb-8 z-50">
                <div className="max-w-md mx-auto grid grid-cols-2 gap-4 lg:max-w-4xl pb-[100px] lg:pb-0">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl border border-gray-200 dark:border-gray-700 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                        <FaSync size={18} />
                        Quét lại
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isProcessing || scannedItems.length === 0}
                        className="flex items-center justify-center gap-2 py-4 rounded-xl bg-primary text-white font-bold shadow-lg shadow-primary/30 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? <FaSpinner size={18} className="animate-spin" /> : <FaCheck size={18} />}
                        Lưu tất cả ({scannedItems.length})
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default AIScanner;
