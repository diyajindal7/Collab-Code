const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
        secure: Number(process.env.EMAIL_PORT) === 465,

      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const result = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: options.email,
      subject: options.subject,
      html: options.html
    });

    return result;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = sendEmail;
