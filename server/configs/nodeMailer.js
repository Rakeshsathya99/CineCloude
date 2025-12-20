import nodemailer from 'nodemailer';


const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 587,
  auth: {
    user: process.env.SMTPM_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async({ to, subject, htmlContent }) => {
    const response = await transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to,
      subject,
      html: htmlContent,
    });
    return response;
}

export default sendEmail;
