const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Auth App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (error) {
    console.error("Email failed:", error.message);
  }
};

module.exports = sendEmail;