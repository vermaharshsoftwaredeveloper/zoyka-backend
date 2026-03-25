import { EMAIL_ADDRESS, EMAIL_NAME } from "../config/env.js";
import transporter from "../config/nodemailer.js";
import ApiError from "../utils/api-error/index.js";

export const sendEmail = async ({ email, subject, text }) => {
  const mailOptions = {
    from: `${EMAIL_NAME} <${EMAIL_ADDRESS}>`,
    to: email,
    subject,
    text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    throw new ApiError(500, "Failed to send email");
  }
};
