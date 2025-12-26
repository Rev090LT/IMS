import axios from 'axios';

export const sendSms = async (phone, message) => {
  console.log('Sending SMS via SMS.ru:', { phone, message }); // <= Временный лог

  const params = new URLSearchParams({
    api_id: process.env.SMS_API_ID,
    to: phone,
    text: message,
  });

  try {
    const response = await axios.post('https://sms.ru/sms/send', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    console.log('SMS.ru response:', response.data); // <= Временный лог

    if (response.data.status === 'OK') {
      console.log('SMS sent successfully');
    } else {
      console.error('SMS.ru error:', response.data);
      throw new Error(`SMS.ru error: ${response.data.status_code} - ${response.data.status_text}`);
    }
  } catch (err) {
    console.error('Error sending SMS:', err.response?.data || err.message); // <= Вот тут будет ошибка
    throw err;
  }
};