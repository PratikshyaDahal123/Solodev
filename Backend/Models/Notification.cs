using System.ComponentModel.DataAnnotations;
using Backend.Enums;

namespace Backend.Models;

public class Notification
{
    public int NotificationId { get; set; }

    public int UserId { get; set; }

    public NotificationType Type { get; set; }

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    public bool IsRead { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? RelatedEntityType { get; set; }

    public int? RelatedEntityId { get; set; }

    public User User { get; set; } = null!;
}
