namespace Backend.Services.Interfaces;

public interface IAiService
{
    Task<string> AnalyzeVehicleHealthAsync(int customerId);
}
