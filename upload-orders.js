// upload-orders.js — версия после добавления orderType
const fs = require('fs');
const fetch = require('node-fetch');

const CRM_URL = 'https://beibarssagidolla47.retailcrm.ru';
const API_KEY = 'He7UlLraUKD3oxaiEnNDLHWTfKgkR8Pe';   // ← замени на свой актуальный ключ, если создавал новый
const SITE = 'beibarssagidolla47';

const orders = JSON.parse(fs.readFileSync('./mock_orders.json', 'utf-8'));

console.log(`✅ Найдено заказов: ${orders.length}`);
console.log(`Site: ${SITE}`);

const ordersJson = JSON.stringify(orders);

const formData = new URLSearchParams();
formData.append('site', SITE);
formData.append('orders', ordersJson);

fetch(`${CRM_URL}/api/v5/orders/upload?apiKey=${API_KEY}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: formData
})
  .then(async (res) => {
    const text = await res.text();
    console.log('\nСтатус:', res.status);
    console.log('Ответ RetailCRM:');
    console.log(text);

    if (res.ok || res.status === 201 || res.status === 200) {
      console.log('\n🎉 УСПЕХ! Заказы загружены.');
    } else if (res.status === 460) {
      console.log('\n⚠️  Ошибка 460 — вероятно, нужно добавить тип заказа "eshop-individual" в справочник.');
    } else {
      console.log('\n❌ Ошибка загрузки.');
    }
  })
  .catch(err => console.error('❌ Ошибка сети:', err.message));