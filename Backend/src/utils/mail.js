// src/utils/mail.util.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
    },
});

const sendMail = async ({ to, subject, html }) => {
    const mailOptions = {
        from: `"ChaiTube 📺" <${process.env.MAIL_USER}>`,
        to,
        subject,
        html,
    };

    return await transporter.sendMail(mailOptions);
};


export { sendMail }