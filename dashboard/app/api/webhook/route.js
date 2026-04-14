import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function POST(req: NextRequest) {
  try {
    const order = await req.json();

    const totalSum = Number(order.totalSumm || order.totalSum || 0);

    if (totalSum > 50000) {
      const message = `🚨 Новый большой заказ!\n\n` +
        `Сумма: ${totalSum.toLocaleString('ru-RU')} ₸\n` +
        `Клиент: ${order.firstName || ''} ${order.lastName || ''}\n` +
        `Город: ${order.delivery?.address?.city || '—'}\n` +
        `ID заказа: ${order.externalId || order.id}`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      console.log(`✅ Уведомление отправлено в Telegram. Сумма: ${totalSum} ₸`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}