// app/api/check-orders/route.ts
import { NextResponse } from 'next/server';

const CRM_URL = 'https://beibarssagidolla47.retailcrm.ru';
const API_KEY = 'RMbE5j7k08slQBK9nAUd8dzKRlRwcnUx';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

let lastCheckedId = 0; // Чтобы не спамить одни и те же заказы

export async function GET() {
  try {
    console.log('🔍 Проверяем новые заказы в RetailCRM...');

    const response = await fetch(
      `${CRM_URL}/api/v5/orders?apiKey=${API_KEY}&limit=50&sort=createdAt`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      throw new Error(`RetailCRM error: ${response.status}`);
    }

    const data = await response.json();
    const orders = data.orders || [];

    console.log(`Найдено заказов: ${orders.length}`);

    let sentCount = 0;

    for (const order of orders) {
      const orderId = Number(order.id || order.externalId || 0);
      const totalSum = Number(order.totalSumm || order.totalSum || 0);

      // Проверяем только заказы больше 50 000 ₸ и которые ещё не обрабатывали
      if (totalSum > 50000 && orderId > lastCheckedId) {
        const message = `🚨 <b>Новый большой заказ!</b>\n\n` +
                        `💰 Сумма: <b>${totalSum.toLocaleString('ru-RU')} ₸</b>\n` +
                        `👤 Клиент: ${order.firstName || ''} ${order.lastName || ''}\n` +
                        `📍 Город: ${order.delivery?.address?.city || '—'}\n` +
                        `🆔 Заказ №${order.number || orderId}`;

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
        sentCount++;

        if (orderId > lastCheckedId) lastCheckedId = orderId;
      }
    }

    return NextResponse.json({
      success: true,
      checked: orders.length,
      notifications_sent: sentCount,
      lastCheckedId
    });

  } catch (error: any) {
    console.error('Ошибка check-orders:', error.message);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}