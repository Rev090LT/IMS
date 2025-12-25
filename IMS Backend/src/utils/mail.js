// IMS Backend/src/utils/mail.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true', // true для 465, false для 587
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendConfirmationCode = async (toEmail, code) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail, // ваш email (администратора)
    subject: 'Код подтверждения для регистрации нового пользователя',
    text: `Код подтверждения: ${code}. Пожалуйста, продиктуйте его сотруднику.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Confirmation code sent to admin email');
  } catch (err) {
    console.error('Error sending confirmation code:', err);
    throw err;
  }
};

module.exports = { sendConfirmationCode };