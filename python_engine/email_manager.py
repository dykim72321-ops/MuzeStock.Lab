import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


class EmailManager:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.username = os.getenv("EMAIL_USERNAME")
        self.password = os.getenv("EMAIL_PASSWORD")
        self.to_email = os.getenv("EMAIL_TO")

    def _send(self, subject, html_content):
        if not all([self.username, self.password, self.to_email]):
            print("⚠️ Email credentials not set. Skipping email.")
            return

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = self.username
        message["To"] = self.to_email

        part = MIMEText(html_content, "html")
        message.attach(part)

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                if self.username and self.password:
                    server.login(self.username, self.password)
                    server.sendmail(self.username, self.to_email, message.as_string())
                else:
                    print("⚠️ SMTP credentials missing after check.")
            print(f"📧 Email sent: {subject}")
        except Exception as e:
            print(f"❌ Failed to send email: {e}")

    def send_discovery_alert(
        self,
        ticker,
        price,
        rsi2,
        deviation_pct,
        rvol,
        target_price,
        stop_price,
        is_super=False,
    ):
        status_label = "🚨 [SUPER OVERSOLD]" if is_super else "🟢 [OVERSOLD]"
        subject = f"{status_label} {ticker} Discovery alert"

        color = "#e74c3c" if is_super else "#27ae60"

        html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h2 style="color: {color};">{status_label} {ticker}</h2>
                <p>A new Mean Reversion candidate has been discovered.</p>
                <table border="0" cellpadding="8" cellspacing="0" style="width: 100%; max-width: 500px; border: 1px solid #eee;">
                    <tr style="background: #f9f9f9;"><td><b>Price</b></td><td>${price:.4f}</td></tr>
                    <tr><td><b>RSI(2)</b></td><td>{rsi2:.2f}</td></tr>
                    <tr style="background: #f9f9f9;"><td><b>Deviation</b></td><td>{deviation_pct:.2f}%</td></tr>
                    <tr><td><b>RVOL</b></td><td>{rvol:.2f}x</td></tr>
                    <tr style="background: #f9f9f9;"><td><b>Target (5.0 ATR)</b></td><td style="color: #27ae60;"><b>${target_price:.4f}</b></td></tr>
                    <tr><td><b>Stop Loss</b></td><td style="color: #e74c3c;"><b>${stop_price:.4f}</b></td></tr>
                </table>
                <br>
                <a href="https://finviz.com/quote.ashx?t={ticker}" style="background: #0176d3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View on Finviz</a>
                <p style="font-size: 10px; color: #999;">MuzeStock.Lab Quant Engine Alert</p>
            </body>
        </html>
        """
        self._send(subject, html)

    def send_daily_summary(self, discovered, validated, super_oversold):
        subject = f"📋 Daily Scan Report - {datetime.now().strftime('%Y-%m-%d')}"

        html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h2>Daily Scan Complete</h2>
                <p>Here is a summary of today's Mean Reversion scan:</p>
                <ul>
                    <li><b>Total Candidates Discovered:</b> {discovered}</li>
                    <li><b>Quant Validated:</b> {validated}</li>
                    <li><b>Super Oversold (High Priority):</b> {super_oversold}</li>
                </ul>
                <p>Check the Dashboard for full details.</p>
                <hr>
                <p style="font-size: 10px; color: #999;">MuzeStock.Lab Automated Pipeline</p>
            </body>
        </html>
        """
        self._send(subject, html)
