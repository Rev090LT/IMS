import axios from 'axios';

export const sendSms = async (phone, message) => {
  console.log('Sending SMS via SMS.ru:', { phone, message });

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

    console.log('SMS.ru raw response:', response.data); // <= Покажет, что на самом деле пришло

    // SMS.ru возвращает текст, например: "100\n202552-1000000\nbalance=4"
    const responseText = response.data.trim();
    const lines = responseText.split('\n');
    const statusCode = lines[0];

    if (statusCode === '100') {
      console.log('SMS sent successfully');
    } else {
      console.error('SMS.ru error code:', statusCode);
      throw new Error(`SMS.ru error: ${statusCode}`);
    }
  } catch (err) {
    console.error('Error sending SMS:', err.response?.data || err.message);
    throw err;
  }
};