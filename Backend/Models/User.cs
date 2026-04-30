using System.ComponentModel.DataAnnotations;
using Backend.Enums;

namespace Backend.Models;

public class User
{
    public int UserId { get; set; }

    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required]
    [MaxLength(150)]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(256)]
    public string PasswordHash { get; set; } = string.Empty;

    [Required]
    [MaxLength(20)]
    [Phone]
    public string PhoneNumber { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Staff? StaffProfile { get; set; }

    public Customer? CustomerProfile { get; set; }

    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
}
