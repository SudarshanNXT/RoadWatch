const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
      html
    };
    
    // Only attempt to send if credentials are set (so we don't crash when testing without them)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.EMAIL_USER !== 'your-email@gmail.com') {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
      return true;
    } else {
      console.log('Email not sent: Credentials not configured properly.');
      console.log(`To: ${to}\nSubject: ${subject}\nText: ${text}`);
      return false;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = sendEmail;
