import nodemailer from 'nodemailer';
import {
  NEWS_SUMMARY_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE,
  INACTIVE_USER_REMINDER_EMAIL_TEMPLATE,
} from '@/lib/nodemailer/templates';

export const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.NODEMAILER_EMAIL!,
    pass: process.env.NODEMAILER_PASSWORD!,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace('{{name}}', name).replace(
    '{{intro}}',
    intro
  );

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `Welcome to Signalist - your stock market toolkit is ready!`,
    text: 'Thanks for joining Signalist',
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}): Promise<void> => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    '{{date}}',
    date
  ).replace('{{newsContent}}', newsContent);

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📈 Market News Summary Today - ${date}`,
    text: `Today's market news summary from Signalist`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendInactiveUserEmail = async ({
  email,
  name,
  dashboardUrl = 'https://signalist-mauve.vercel.app/',
  unsubscribeUrl = '#',
}: {
  email: string;
  name: string;
  dashboardUrl?: string;
  unsubscribeUrl?: string;
}): Promise<void> => {
  const htmlTemplate = INACTIVE_USER_REMINDER_EMAIL_TEMPLATE.replace(
    '{{name}}',
    name
  )
    .replace(/{{dashboardUrl}}/g, dashboardUrl)
    .replace('{{unsubscribeUrl}}', unsubscribeUrl);

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `${name}, opportunities are waiting for you`,
    text: `Hi ${name}, we miss you at Signalist! Your market opportunities are waiting.`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendStockAlertUpperEmail = async ({
  email,
  symbol,
  company,
  currentPrice,
  targetPrice,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  currentPrice: string;
  targetPrice: string;
  timestamp: string;
}) => {
  const { STOCK_ALERT_UPPER_EMAIL_TEMPLATE } = await import(
    '@/lib/nodemailer/templates'
  );
  const htmlTemplate = STOCK_ALERT_UPPER_EMAIL_TEMPLATE.replace(
    /{{symbol}}/g,
    symbol
  )
    .replace(/{{company}}/g, company)
    .replace(/{{currentPrice}}/g, currentPrice)
    .replace(/{{targetPrice}}/g, targetPrice)
    .replace(/{{timestamp}}/g, timestamp);

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📈 Price Above: ${symbol} hit ${targetPrice}`,
    text: `${symbol} is above ${targetPrice}. Current: ${currentPrice}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendStockAlertLowerEmail = async ({
  email,
  symbol,
  company,
  currentPrice,
  targetPrice,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  currentPrice: string;
  targetPrice: string;
  timestamp: string;
}) => {
  const { STOCK_ALERT_LOWER_EMAIL_TEMPLATE } = await import(
    '@/lib/nodemailer/templates'
  );
  const htmlTemplate = STOCK_ALERT_LOWER_EMAIL_TEMPLATE.replace(
    /{{symbol}}/g,
    symbol
  )
    .replace(/{{company}}/g, company)
    .replace(/{{currentPrice}}/g, currentPrice)
    .replace(/{{targetPrice}}/g, targetPrice)
    .replace(/{{timestamp}}/g, timestamp);

  const mailOptions = {
    from: `"Signalist" <${process.env.NODEMAILER_EMAIL}>`,
    to: email,
    subject: `📉 Price Below: ${symbol} hit ${targetPrice}`,
    text: `${symbol} is below ${targetPrice}. Current: ${currentPrice}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
