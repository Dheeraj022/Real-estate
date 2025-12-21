const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port: Number(process.env.MAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER || 'dheerajkr2205@gmail.com',
    pass: process.env.MAIL_PASS || 'vslhvybiwytuyrot'
  }
});

/**
 * Send an email using the configured transporter.
 *
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} [options.html] - Optional HTML body
 */
async function sendMail({ to, subject, text, html }) {
  const from =
    process.env.MAIL_FROM || 'MLM Property System <dheerajkr2205@gmail.com>';

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text
  });
}

module.exports = {
  sendMail
};








