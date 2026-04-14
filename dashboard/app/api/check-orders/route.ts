import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Запрос последних заказов из RetailCRM
    const response = await fetch(
      `${process.env.RETAILCRM_URL}/api/v5/orders?apiKey=${process.env.RETAILCRM_API_KEY}&limit=20&sort=createdAt`,
      { cache: 'no-store' }
    );

    const data = await response.json();
    const orders = data.orders || [];

    for (const order of orders) {
      const orderId = order.id;
      const totalSum = order.totalSumm || 0;

      // Проверяем, отправлялось ли уведомление ранее
      const { data: existing } = await supabase
        .from('notified_orders')
        .select('id')
        .eq('id', orderId)
        .maybeSingle();

      if (!existing && totalSum > 50000) {
        const message = `🛒 Новый крупный заказ!
📦 Номер: ${order.number}
💰 Сумма: ${totalSum} ₸
👤 Клиент: ${order.firstName || ''} ${order.lastName || ''}
📞 Телефон: ${order.phone || 'Не указан'}`;

        // Отправка сообщения в Telegram
        await fetch(
          `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: process.env.TELEGRAM_CHAT_ID,
              text: message,
            }),
          }
        );

        // Сохраняем ID заказа
        await supabase.from('notified_orders').insert({ id: orderId });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error checking orders:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}