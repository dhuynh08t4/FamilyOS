import { supabase } from './supabase';
import { generateSmartContent } from './gemini';
import { formatDateLocal } from '../utils/date';

export interface AIAction {
    action: string;
    target: 'transaction' | 'budget_plan' | 'note' | 'message' | 'theme' | 'query';
    data: any;
}

export const AI_SYSTEM_PROMPT = `
Bạn là "Siêu Trợ lý" - Trợ lý thông minh toàn năng cho gia đình.
Nhiệm vụ: Giúp người dùng quản lý tài chính (ví, dự chi), ghi chú, tin nhắn và cài đặt hệ thống (theme).

KHẢ NĂNG CỦA BẠN:
1. TRUY VẤN (query): Tìm kiếm thông tin từ ví, dự chi, ghi chú, thành viên.
2. THÊM/SỬA/XÓA (transaction, budget_plan, note): Quản lý các mục tương ứng.
3. TIN NHẮN (message): Gửi tin nhắn vào nhóm gia đình.
4. GIAO DIỆN (theme): Thay đổi chủ đề (light, dark, modern, cozy, v.v.).
5. TRẢ LỜI TRỰC TIẾP: Nếu yêu cầu đơn giản (ví dụ: "Kể chuyện cười", "Chào bạn", "Bạn là ai", "Hôm nay là ngày bao nhiêu", "Thời tiết", "lịch âm",...), hãy trả lời trực tiếp mà không cần JSON.
6. TRẢ LỜI HÀI HƯỚC: Nếu yêu cầu hài hước, hãy trả lời hài hước.

DANH MỤC TÀI CHÍNH: 'Dâng hiến', 'Ăn uống', 'Mua sắm', 'Nợ', 'Điện nước', 'Giải trí', 'Sức khỏe', 'Di chuyển', 'Con cái', 'Khác'.

QUY TẮC PHẢN HỒI:
- Luôn trả lời bằng tiếng Việt thân thiện.
- Nếu người dùng yêu cầu hành động, hãy giải thích bạn sẽ làm gì và trả về cấu trúc JSON ở CUỐI phản hồi:
---JSON---
{
  "action": "create" | "update" | "delete" | "query" | "set",
  "target": "transaction" | "budget_plan" | "note" | "message" | "theme",
  "data": { 
     "query_type": "latest_transactions" | "budget_summary" | "notes_search" | "member_list" | "top_expenses" | "latest_notes",
     "params": { ... } 
  }
}
---END---

VÍ DỤ:
- "Ăn sáng 30k": target="transaction", action="create", data={"amount": 30000, "category": "Ăn uống", "type": "expense", "note": "Ăn sáng"}
- "Nhắc tôi mua sữa": target="note", action="create", data={"title": "Mua sữa", "content": "Người dùng nhắc mua sữa"}
- "Đổi sang dark mode": target="theme", action="set", data={"mode": "dark"}
- "Tôi thích màu hồng": target="theme", action="set", data={"color": "rose"}
- "Chào cả nhà": target="message", action="create", data={"content": "Chào cả nhà"}

KHI TRUY VẤN:
Nếu người dùng hỏi (ví dụ: "Tháng này tiêu bao nhiêu?"), hãy dùng action="query" và mô tả yêu cầu trong data.

DANH SÁCH MÀU: indigo, slate, rose, amber, emerald, cyan, violet, fuchsia, orange, blue.
DANH SÁCH CHẾ ĐỘ: light, dark, auto.
`;

export async function processAIRequest(userInput: string, userId: string) {
    // 1. Get Context (Optional: Fetch recent items to help Gemini)
    const { data: recentTrans } = await supabase.from('transactions').select('amount, category, note').order('date', { ascending: false }).limit(5);
    const { data: profiles } = await supabase.from('profiles').select('nice_name, role');

    const context = `
    Context hiện tại:
    - User ID: ${userId}
    - Thành viên: ${JSON.stringify(profiles)}
    - Giao dịch gần đây: ${JSON.stringify(recentTrans)}
    - Ngày hiện tại: ${formatDateLocal(new Date())}
    `;

    const result = await generateSmartContent(
        `${AI_SYSTEM_PROMPT}\n${context}\nUser: ${userInput}`,
        { data: '', mimeType: 'text/plain' },
        'gemini-flash-latest'
    );

    const text = result.response.text();
    const cleanText = text.split('---JSON---')[0].trim();
    const jsonMatch = text.match(/---JSON---([\s\S]*?)---END---/);

    let actionResponse = null;
    if (jsonMatch) {
        try {
            actionResponse = JSON.parse(jsonMatch[1].trim());
        } catch (e) {
            console.error("Failed to parse AI JSON:", e);
        }
    }

    return {
        message: cleanText,
        action: actionResponse
    };
}

export async function executeAIAction(action: AIAction, userId: string) {
    switch (action.target) {
        case 'transaction':
            if (action.action === 'create') {
                return await supabase.from('transactions').insert({ ...action.data, user_id: userId });
            }
            if (action.action === 'delete') {
                // Gemini would need to provide an ID or we search for latest matching
                return { error: { message: "Tính năng xóa qua AI cần ID hoặc mô tả cụ thể hơn" } };
            }
            break;

        case 'budget_plan':
            if (action.action === 'create') {
                return await supabase.from('budget_plans').insert({ ...action.data, user_id: userId });
            }
            break;

        case 'note':
            if (action.action === 'create') {
                return await supabase.from('notes').insert({ ...action.data });
            }
            break;

        case 'message':
            if (action.action === 'create') {
                return await supabase.from('messages').insert({ ...action.data, user_id: userId, type: 'text' });
            }
            break;

        case 'theme':
            if (action.action === 'set') {
                // Fetch current theme first to merge
                const { data: current } = await supabase.from('user_settings').select('value').eq('user_id', userId).eq('key', 'THEME_PREFERENCE').single();
                let themeValue = { color: 'indigo', mode: 'auto' };
                if (current?.value) {
                    themeValue = typeof current.value === 'string' ? JSON.parse(current.value) : current.value;
                }

                if (action.data.color) themeValue.color = action.data.color;
                if (action.data.mode) themeValue.mode = action.data.mode;

                return await supabase.from('user_settings').upsert({
                    user_id: userId,
                    key: 'THEME_PREFERENCE',
                    value: themeValue
                }, { onConflict: 'user_id,key' });
            }
            break;

        case 'query':
            if (action.action === 'query') {
                const { query_type, params } = action.data;
                if (query_type === 'latest_transactions') {
                    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false }).limit(params?.limit || 5);
                    return { data, type: 'transactions' };
                }
                if (query_type === 'budget_summary') {
                    const { data } = await supabase.from('budget_plans').select('*').eq('status', 'active');
                    return { data, type: 'budget' };
                }
                if (query_type === 'notes_search') {
                    const { data } = await supabase.from('notes').select('*').ilike('title', `%${params?.q || ''}%`).limit(5);
                    return { data, type: 'notes' };
                }
                if (query_type === 'member_list') {
                    const { data } = await supabase.from('profiles').select('full_name, nice_name, role');
                    return { data, type: 'members' };
                }
                if (query_type === 'top_expenses') {
                    const { data } = await supabase.from('transactions').select('*').eq('type', 'expense').order('amount', { ascending: false }).limit(5);
                    return { data, type: 'transactions' };
                }
                if (query_type === 'latest_notes') {
                    const { data } = await supabase.from('notes').select('*').order('created_at', { ascending: false }).limit(10);
                    return { data, type: 'notes' };
                }
            }
            return { message: "Tôi không tìm thấy thông tin bạn yêu cầu." };
    }
    return { error: { message: "Hành động chưa được hỗ trợ" } };
}
