namespace Backend.Services.Interfaces;

public interface IEmailService
{
    Task<bool> SendInvoiceAsync(string toEmail, string subject, string body);
    Task<bool> SendOverdueReminderAsync(string toEmail, string customerName, decimal balanceAmount);
}
