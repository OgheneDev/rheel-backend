// server.js
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';

const PORT = process.env.PORT || 5001;
const app = express();

// Debug incoming requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Content-Type:', req.headers['content-type']);
  next();
});

// Middleware - order matters!
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Configure CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://rheel-main-8cy9.vercel.app',
    'https://rheel.ng'
  ],
  credentials: true
}));

// Test route to verify request parsing
app.get('/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.post('/test', (req, res) => {
  console.log('Test endpoint body:', req.body);
  res.json({ received: req.body });
});

// Set up nodemailer transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

app.post('/api/contact', async (req, res) => {
  console.log('Raw request body:', req.body);
  
  try {
    // Safely extract data with defaults
    const firstName = req.body?.firstName || '';
    const lastName = req.body?.lastName || '';
    const country = req.body?.country || '';
    const email = req.body?.email || '';
    const phone = req.body?.phone || '';
    
    // Validate required fields
    if (!firstName || !lastName || !country || !email) {
      console.log('Missing required fields');
      return res.status(400).json({ 
        error: 'Missing required fields',
        received: { firstName, lastName, country, email }
      });
    }
    
    // For testing purposes, skip sending email if credentials not available
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.log('SMTP credentials not found, skipping email send');
      return res.json({ 
        success: true, 
        note: 'Email not sent - missing SMTP credentials' 
      });
    }
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: "hello@rheelestate.com",
      subject: "New Mailing List Subscription",
      text: `
        Contact Information:
        Name: ${firstName} ${lastName}
        Country: ${country}
        Email: ${email}
        ${phone ? `Phone: ${phone}` : ''}
      `,
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      error: 'Failed to process request', 
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`SMTP_USER configured: ${!!process.env.SMTP_USER}`);
});