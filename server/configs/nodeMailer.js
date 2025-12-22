import nodemailer from 'nodemailer';

if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SENDER_EMAIL) {
  throw new Error("SMTP credentials missing in environment variables");
}

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, body, htmlContent }) => {
  return await transporter.sendMail({
    from: process.env.SENDER_EMAIL,
    to,
    subject,
    html: body || htmlContent,
  });
};

export default sendEmail;
