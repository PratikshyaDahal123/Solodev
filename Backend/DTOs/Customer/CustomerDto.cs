namespace Backend.DTOs.Customer;

public class CustomerDto
{
    public int CustomerId { get; set; }
    public string CustomerCode { get; set; } = string.Empty;
    public int UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? Address { get; set; }
    public DateTime DateJoined { get; set; }
    public decimal CreditBalance { get; set; }
    public decimal TotalSpent { get; set; }
    public int LoyaltyPoints { get; set; }
    public IReadOnlyList<string> VehicleRegistrationNumbers { get; set; } = [];
    public IReadOnlyList<CustomerVehicleDto> Vehicles { get; set; } = [];
}

public class CustomerVehicleDto
{
    public int VehicleId { get; set; }
    public string RegistrationNumber { get; set; } = string.Empty;
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string? Color { get; set; }
    public string? FuelType { get; set; }
}
