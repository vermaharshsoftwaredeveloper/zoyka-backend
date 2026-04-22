import ApiError from "../utils/api-error/index.js";
import { EMAIL_ADDRESS, EMAIL_NAME } from "../config/env.js";

export const sendEmail = async ({ email, subject, text, html }) => {
  const brevoApiKey = process.env.BREVO_API_KEY;

  if (!brevoApiKey) {
    console.error("🚨 BREVO_API_KEY is missing from environment variables.");
    throw new ApiError(500, "Email service configuration error");
  }

  try {
    const body = {
      sender: {
        name: EMAIL_NAME,
        email: EMAIL_ADDRESS
      },
      to: [{ email: email }],
      subject: subject,
    };

    if (html) {
      body.htmlContent = html;
    } else {
      body.textContent = text;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`Brevo API Error:`, errorData);
      throw new ApiError(500, "Failed to send email via Brevo");
    }

    console.log(`✅ Email successfully sent to ${email} via Brevo HTTP API.`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new ApiError(500, "Failed to send email");
  }
};


// import { EMAIL_ADDRESS, EMAIL_NAME } from "../config/env.js";
// import transporter from "../config/nodemailer.js";
// import ApiError from "../utils/api-error/index.js";

// export const sendEmail = async ({ email, subject, text }) => {
//   const mailOptions = {
//     from: `${EMAIL_NAME} <${EMAIL_ADDRESS}>`,
//     to: email,
//     subject,
//     text,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log(`Email sent to ${email}`);
//   } catch (error) {
//     console.error(`Error sending email to ${email}:`, error);
//     throw new ApiError(500, "Failed to send email");
//   }
// };
