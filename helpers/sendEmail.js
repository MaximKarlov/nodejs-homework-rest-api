const nodemailer = require('nodemailer');
require('dotenv').config();

const { EMAIL_UKRNET_NAME, EMAIL_UKRNET_PASSWORD } = process.env;

const nodemailerConfig = {
  host: 'smtp.ukr.net',
  port: 465,
  secure: true,
  auth: {
    user: EMAIL_UKRNET_NAME,
    pass: EMAIL_UKRNET_PASSWORD,
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

const sendEmail = async data => {
  const email = { ...data, from: EMAIL_UKRNET_NAME };
  await transport
    .sendMail(email)
    .then(() => {
      console.log('Sent mail successfully');
    })
    .catch(err => {
      console.log(err.message);
    });
  return true;
};

module.exports = sendEmail;
