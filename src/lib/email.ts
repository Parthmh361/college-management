import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
}

interface AttendanceAlert {
  studentName: string;
  studentEmail: string;
  subjectName: string;
  date: string;
  status: 'absent' | 'late';
  attendanceRate: number;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  async sendAttendanceAlert(alert: AttendanceAlert, parentEmail: string): Promise<boolean> {
    const subject = `Attendance Alert: ${alert.studentName} - ${alert.subjectName}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Attendance Alert</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .alert { background: ${alert.status === 'absent' ? '#fee2e2' : '#fef3c7'}; 
                     border: 1px solid ${alert.status === 'absent' ? '#fca5a5' : '#fbbf24'}; 
                     padding: 15px; border-radius: 5px; margin: 15px 0; }
            .stats { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>College Management System</h1>
              <h2>Attendance Alert</h2>
            </div>
            
            <div class="content">
              <p>Dear Parent/Guardian,</p>
              
              <div class="alert">
                <h3>⚠️ Attendance Alert</h3>
                <p><strong>Student:</strong> ${alert.studentName}</p>
                <p><strong>Subject:</strong> ${alert.subjectName}</p>
                <p><strong>Date:</strong> ${alert.date}</p>
                <p><strong>Status:</strong> ${alert.status.toUpperCase()}</p>
              </div>

              <div class="stats">
                <h3>📊 Current Attendance Rate</h3>
                <p><strong>${alert.attendanceRate.toFixed(1)}%</strong></p>
                ${alert.attendanceRate < 75 ? 
                  '<p style="color: #dc2626;"><strong>⚠️ Warning:</strong> Attendance is below 75%. Please ensure your child attends classes regularly.</p>' : 
                  '<p style="color: #059669;">Attendance is satisfactory.</p>'
                }
              </div>

              <p>Please contact the school if you have any questions or concerns about your child's attendance.</p>
              
              <p>Best regards,<br>
              College Management Team</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from the College Management System.</p>
              <p>Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
      Attendance Alert - College Management System

      Dear Parent/Guardian,

      Student: ${alert.studentName}
      Subject: ${alert.subjectName}
      Date: ${alert.date}
      Status: ${alert.status.toUpperCase()}

      Current Attendance Rate: ${alert.attendanceRate.toFixed(1)}%

      ${alert.attendanceRate < 75 ? 
        'WARNING: Attendance is below 75%. Please ensure your child attends classes regularly.' : 
        'Attendance is satisfactory.'
      }

      Please contact the school if you have any questions or concerns.

      Best regards,
      College Management Team
    `;

    return this.sendEmail({
      to: parentEmail,
      subject,
      html,
      text
    });
  }

  async sendLowAttendanceReport(reports: AttendanceAlert[], recipientEmail: string): Promise<boolean> {
    const subject = 'Weekly Low Attendance Report';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Low Attendance Report</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 800px; margin: 0 auto; padding: 20px; }
            .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f8f9fa; font-weight: bold; }
            .low { background-color: #fee2e2; }
            .critical { background-color: #fecaca; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>College Management System</h1>
              <h2>Low Attendance Report</h2>
            </div>
            
            <div class="content">
              <p>Dear Administrator,</p>
              
              <p>This is your weekly report of students with low attendance rates:</p>

              <table>
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Subject</th>
                    <th>Attendance Rate</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${reports.map(report => `
                    <tr class="${report.attendanceRate < 60 ? 'critical' : 'low'}">
                      <td>${report.studentName}</td>
                      <td>${report.subjectName}</td>
                      <td>${report.attendanceRate.toFixed(1)}%</td>
                      <td>${report.attendanceRate < 60 ? 'Critical' : 'Low'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <p><strong>Summary:</strong></p>
              <ul>
                <li>Total students with low attendance: ${reports.length}</li>
                <li>Critical cases (below 60%): ${reports.filter(r => r.attendanceRate < 60).length}</li>
                <li>Low cases (60-75%): ${reports.filter(r => r.attendanceRate >= 60 && r.attendanceRate < 75).length}</li>
              </ul>

              <p>Please take appropriate action to address these attendance issues.</p>
              
              <p>Best regards,<br>
              College Management System</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: recipientEmail,
      subject,
      html
    });
  }

  async sendWelcomeEmail(userEmail: string, userName: string, tempPassword: string): Promise<boolean> {
    const subject = 'Welcome to College Management System';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Welcome to College Management System</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .credentials { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #3b82f6; }
            .warning { background: #fef3c7; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to College Management System</h1>
            </div>
            
            <div class="content">
              <p>Dear ${userName},</p>
              
              <p>Welcome to our College Management System! Your account has been successfully created.</p>

              <div class="credentials">
                <h3>📧 Login Credentials</h3>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Temporary Password:</strong> ${tempPassword}</p>
              </div>

              <div class="warning">
                <h3>🔒 Important Security Notice</h3>
                <p>Please log in and change your password immediately after your first login for security purposes.</p>
              </div>

              <p>You can access the system at: <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}">${process.env.FRONTEND_URL || 'http://localhost:3000'}</a></p>

              <p>If you have any questions or need assistance, please contact the IT support team.</p>
              
              <p>Best regards,<br>
              College Management Team</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return this.sendEmail({
      to: userEmail,
      subject,
      html
    });
  }
}

export const emailService = new EmailService();
