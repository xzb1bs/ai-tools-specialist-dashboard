// sync-orders.js — улучшенная версия без строгого фильтра по статусу
const fetch = require('node-fetch');

const CRM_URL = 'https://beibarssagidolla47.retailcrm.ru';
const API_KEY = 'He7UlLraUKD3oxaiEnNDLHWTfKgkR8Pe';   // ← твой ключ

const SUPABASE_URL = 'https://vwqzecuxdftvdlfdyzco.supabase.co';        // ← замени на свой
const SUPABASE_ANON_KEY = 'sb_publishable_UxSRU03dKBvsfeMwGDhKmA_OSi68Utm';               // ← замени на свой

async function syncOrders() {
  console.log('🚀 Начинаем синхронизацию заказов из RetailCRM...');

  // Получаем ВСЕ заказы (без фильтра по статусу, limit=100)
  const url = `${CRM_URL}/api/v5/orders?apiKey=${API_KEY}&limit=100`;

  const response = await fetch(url);
  const data = await response.json();

  console.log(`Получено заказов из RetailCRM: ${data.orders ? data.orders.length : 0}`);

  if (!data.orders || data.orders.length === 0) {
    console.log('❌ Заказов не найдено. Проверь, видны ли они в интерфейсе RetailCRM.');
    return;
  }

  // Подготовка данных для Supabase
  const ordersToUpsert = data.orders.map(order => ({
    external_id: String(order.externalId || order.id),
    total_sum: Number(order.totalSumm || order.totalSum || 0),
    status: order.status || 'new',
    data: order                     // весь заказ сохраняем как JSON
  }));

  console.log(`Подготовлено к вставке/обновлению: ${ordersToUpsert.length} заказов`);

  // Отправка в Supabase (upsert)
  const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates'   // это делает upsert
    },
    body: JSON.stringify(ordersToUpsert)
  });

  const result = await supabaseResponse.text();
  console.log('\nСтатус ответа Supabase:', supabaseResponse.status);
  console.log('Ответ Supabase:', result);

  if (supabaseResponse.ok) {
    console.log('\n✅ Синхронизация прошла успешно!');
    console.log('Теперь данные должны быть в таблице orders в Supabase.');
  } else {
    console.log('\n❌ Ошибка при записи в Supabase.');
  }
}

syncOrders().catch(err => {
  console.error('❌ Критическая ошибка:', err.message);
});