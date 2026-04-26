using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs.Invoice;

public class SendInvoiceEmailDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
