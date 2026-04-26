namespace Backend.DTOs;

public class LoyaltySettings
{
    public decimal Threshold { get; set; } = 5000m;
    public decimal Rate { get; set; } = 0.10m;
}
