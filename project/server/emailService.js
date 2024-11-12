<content>import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your-notification-email@gmail.com', // Replace with your email
    pass: process.env.EMAIL_APP_PASSWORD || 'your-app-specific-password' // Use app-specific password
  }
});

const activityDescriptions = {
  LOITERING: 'Suspicious loitering detected in monitored area',
  THEFT: 'Potential theft activity observed',
  VIOLENCE: 'Possible violent behavior detected',
  TRESPASSING: 'Unauthorized access or trespassing detected',
  VANDALISM: 'Potential vandalism activity observed',
  SUSPICIOUS_OBJECT: 'Suspicious object or package detected'
};

export const sendNotification = async (detectionResult) => {
  const description = activityDescriptions[detectionResult.activityType] || 'Suspicious activity detected';
  
  const mailOptions = {
    from: 'your-notification-email@gmail.com',
    to: 'ashishyesale007@gmail.com',
    subject: '🚨 Suspicious Activity Alert',
    html: `
      <h2>Suspicious Activity Detected</h2>
      <p><strong>Description:</strong> ${description}</p>
      <p><strong>Confidence:</strong> ${(detectionResult.confidence * 100).toFixed(1)}%</p>
      <p><strong>Time:</strong> ${new Date(detectionResult.timestamp).toLocaleString()}</p>
      <p><strong>Location:</strong> ${detectionResult.location || 'Main Camera'}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Alert email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};</content>