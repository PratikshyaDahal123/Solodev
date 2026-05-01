using Backend.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using System.Threading.Tasks;
using System;

namespace Backend.Services;

public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;

    public EmailService(ILogger<EmailService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    private async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var host = _configuration["SmtpSettings:Host"] ?? _configuration["Email:SmtpHost"];
            var port = _configuration.GetValue<int?>("SmtpSettings:Port") 
                       ?? _configuration.GetValue<int?>("Email:SmtpPort") 
                       ?? 587;
            var username = _configuration["SmtpSettings:Username"] ?? _configuration["Email:Username"];
            var password = _configuration["SmtpSettings:Password"] ?? _configuration["Email:Password"];
            var fromEmail = _configuration["SmtpSettings:FromEmail"] ?? _configuration["Email:FromEmail"] ?? username;
            var fromName = _configuration["SmtpSettings:FromName"] ?? _configuration["Email:FromName"] ?? "Vehicle Service Center";
            var enableSsl = _configuration.GetValue<bool?>("SmtpSettings:EnableSsl") 
                             ?? _configuration.GetValue<bool?>("Email:EnableSsl") 
                             ?? true;

            if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("SMTP settings are incomplete.");
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, fromEmail));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            message.Body = new TextPart("html")
            {
                Text = body
            };

            using var client = new SmtpClient();
            
            // Accept all SSL certificates to prevent SSL handshake errors on different environments
            client.ServerCertificateValidationCallback = (s, c, h, e) => true;

            var socketOptions = enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto;
            await client.ConnectAsync(host, port, socketOptions);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);
            
            _logger.LogInformation("Email successfully sent to {Email} with subject {Subject}", toEmail, subject);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Email}", toEmail);
            return false;
        }
    }

    public async Task<bool> SendInvoiceAsync(string toEmail, string subject, string body)
    {
        return await SendEmailAsync(toEmail, subject, body);
    }

    public async Task<bool> SendOverdueReminderAsync(string toEmail, string customerName, decimal balanceAmount)
    {
        var subject = "Overdue Invoice Reminder - Vehicle Service Center";
        var body = $@"
            <h3>Hello {customerName},</h3>
            <p>This is a reminder that you have an overdue balance of <strong>Rs {balanceAmount:F2}</strong> on your account.</p>
            <p>Please arrange for payment as soon as possible.</p>
            <p>Thank you,<br/>Vehicle Service Center Team</p>
        ";

        return await SendEmailAsync(toEmail, subject, body);
    }
}
