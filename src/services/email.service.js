import { Resend } from 'resend';
import ApiError from "../utils/api-error/index.js";
import { EMAIL_NAME } from "../config/env.js";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendEmail = async ({ email, subject, text }) => {
  try {
    const { data, error } = await resend.emails.send({
      from: `${EMAIL_NAME} <onboarding@resend.dev>`,
      to: email,
      subject,
      text,
    });

    if (error) {
      console.error(`Resend API Error:`, error);
      throw new ApiError(500, "Failed to send email via Resend");
    }

    console.log(`✅ Email successfully sent to ${email} via Resend. ID: ${data.id}`);
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
