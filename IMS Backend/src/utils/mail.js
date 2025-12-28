import nodemailer from 'nodemailer';

console.log('SMTP_HOST from env:', process.env.SMTP_HOST);
console.log('SMTP_USER from env:', process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendConfirmationCode = async (toEmail, code) => {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to: toEmail,
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
