const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Send email function
const sendEmail = async (to, subject, text, html = null) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
            html: html || text,
        };

        const result = await transporter.sendMail(mailOptions);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Email sending error:', error);
        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    welcome: (name) => ({
        subject: 'Welcome to Juba!',
        text: `Hi ${name}, welcome to Juba! We're excited to have you on board.`,
        html: `<h1>Welcome to Juba!</h1><p>Hi ${name}, we're excited to have you on board.</p>`
    }),
    jobPosted: (name, jobTitle) => ({
        subject: 'Your job has been posted',
        text: `Hi ${name}, your job "${jobTitle}" has been successfully posted.`,
        html: `<h1>Job Posted</h1><p>Hi ${name}, your job "${jobTitle}" has been successfully posted.</p>`
    }),
    freelancerApplied: (clientName, freelancerName, jobTitle) => ({
        subject: 'New application for your job',
        text: `Hi ${clientName}, ${freelancerName} has applied for your job "${jobTitle}".`,
        html: `<h1>New Application</h1><p>Hi ${clientName}, ${freelancerName} has applied for your job "${jobTitle}".</p>`
    }),
    adminNotification: (title, message) => ({
        subject: `Admin Notification: ${title}`,
        text: message,
        html: `<h1>${title}</h1><p>${message}</p>`
    })
};

module.exports = {
    sendEmail,
    emailTemplates
};
