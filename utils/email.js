const nodemailer = require("nodemailer");

const sendEmail = async options => {
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.GMAIL_USERNAME,
            pass: process.env.GMAIL_PASSWORD
        }
    });

    const mailOptions = {
        from: "Book Exchange Platform <"+process.env.GMAIL_USERNAME+">",
        to: options.email,
        subject: options.subject,
        html: options.html
    }

    await transporter.sendMail(mailOptions);

};

module.exports = sendEmail;