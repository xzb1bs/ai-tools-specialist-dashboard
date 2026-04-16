import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function POST(request: NextRequest) {
  try {
    const order = await request.json();

    const totalSum = Number(order.totalSumm || order.totalSum || 0);

    if (totalSum > 50000) {
      const message = `🚨 <b>Новый большой заказ!</b>\n\n` +
                      `💰 Сумма: <b>${totalSum.toLocaleString('ru-RU')} ₸</b>\n` +
                      `👤 Клиент: ${order.firstName || ''} ${order.lastName || ''}\n` +
                      `📍 Город: ${order.delivery?.address?.city || '—'}\n` +
                      `🔗 ID: ${order.externalId || order.id}`;

      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: 'HTML'
        })
      });

      console.log(`✅ Уведомление отправлено! Сумма: ${totalSum} ₸`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}