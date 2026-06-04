const brevo = require("@getbrevo/brevo");

const apiInstance = new brevo.TransactionalEmailsApi();

apiInstance.authentications.apiKey.apiKey =
  process.env.BREVO_API_KEY;

const sendEmail = async ({ to, subject, html }) => {
  const email = new brevo.SendSmtpEmail();

  email.sender = {
    name: "Employee Management System",
    email: process.env.EMAIL_USER,
  };

  email.to = [
    {
      email: to,
    },
  ];

  email.subject = subject;
  email.htmlContent = html;

  return await apiInstance.sendTransacEmail(email);
};

module.exports = sendEmail;