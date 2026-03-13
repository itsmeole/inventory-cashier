import { NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `Kamu adalah konsultan bisnis ahli bernama "WARDIG AI" yang membantu para pemilik warung/toko kelontong kecil di Indonesia. 
Tugasmu adalah memberikan saran strategis, motivasi, dan panduan pengembangan usaha yang praktis dan mudah diterapkan.
Fokus pada:
- Strategi pemasaran sederhana dan hemat biaya
- Pengelolaan stok barang dan modal
- Meningkatkan penjualan dan keuntungan
- Persaingan dengan kompetitor
- Digitalisasi warung kecil
- Manajemen keuangan sederhana
- Pengembangan produk dan layanan

Gunakan Bahasa Indonesia yang ramah, mudah dipahami, dan tidak terlalu formal. Berikan saran yang konkret dan bisa langsung diterapkan. 
Jika pertanyaan tidak berkaitan dengan bisnis/usaha warung, arahkan kembali ke topik pengembangan usaha dengan ramah.`;

export async function POST(request: Request) {
    try {
        const { history, message } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Convert history from Gemini format {role, parts:[{text}]} to OpenAI format {role, content}
        const historyMessages = (history || []).map((m: any) => ({
            role: m.role === 'model' ? 'assistant' : 'user',
            content: m.parts?.[0]?.text || m.content || ''
        }));

        const messages = [
            { role: 'system', content: SYSTEM_PROMPT },
            ...historyMessages,
            { role: 'user', content: message }
        ];

        const body = {
            model: 'llama-3.1-8b-instant',
            messages,
            temperature: 0.8,
            max_tokens: 1024
        };

        const res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(body)
        });

        if (!res.ok) {
            const errData = await res.json();
            console.error('Groq API Error:', errData);
            return NextResponse.json({ error: errData?.error?.message || 'Groq API Error' }, { status: res.status });
        }

        const data = await res.json();
        const reply = data?.choices?.[0]?.message?.content || 'Tidak ada respons dari AI.';

        return NextResponse.json({ reply });

    } catch (error: any) {
        console.error('Chatbot proxy error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
