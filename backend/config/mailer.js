const sendEmail = async ({ to, subject, html }) => {
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: {
        name: "Employee Management System",
        email: process.env.EMAIL_USER,
      },
      to: [
        {
          email: to,
        },
      ],
      subject: subject,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(errorData);
  }

  return await response.json();
};

module.exports = sendEmail;