using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Backend.Data;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class AiService : IAiService
{
    private readonly AppDbContext _dbContext;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public AiService(AppDbContext dbContext, HttpClient httpClient, IConfiguration configuration)
    {
        _dbContext = dbContext;
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<string> AnalyzeVehicleHealthAsync(int customerId)
    {
        // 1. Gather Data
        var vehicles = await _dbContext.Vehicles.Where(v => v.CustomerId == customerId).ToListAsync();
        if (!vehicles.Any()) return "No vehicles found for analysis.";

        var cutoff = DateTime.UtcNow.AddYears(-1);

        var appointments = await _dbContext.Appointments
            .Where(a => a.CustomerId == customerId && a.Status == AppointmentStatus.Completed && a.AppointmentDateTime >= cutoff)
            .Select(a => new { a.ServiceType, a.AppointmentDateTime, a.Description })
            .ToListAsync();

        var purchases = await _dbContext.SalesInvoices
            .Include(s => s.Items)
            .ThenInclude(i => i.Part)
            .Where(s => s.CustomerId == customerId && s.InvoiceDate >= cutoff)
            .SelectMany(s => s.Items)
            .Select(i => new { i.Part.PartName, i.Quantity, i.SalesInvoice.InvoiceDate })
            .ToListAsync();

        // 2. Format Data for Prompt
        var promptBuilder = new StringBuilder();
        promptBuilder.AppendLine("You are an expert mechanic AI. Analyze the following vehicle and service data and predict potential part failures or maintenance needs.");
        promptBuilder.AppendLine("Return exactly 1 to 3 predictions in a JSON array format like this: [{\"title\":\"Brake Pads may need attention\",\"message\":\"Based on...\"}]");
        promptBuilder.AppendLine("Do not include markdown or other text outside the JSON array.");
        
        promptBuilder.AppendLine("\nVehicles:");
        foreach (var v in vehicles) promptBuilder.AppendLine($"- {v.Year} {v.Brand} {v.Model} ({v.FuelType})");
        
        promptBuilder.AppendLine("\nRecent Services (Last 12 months):");
        foreach (var a in appointments) promptBuilder.AppendLine($"- {a.AppointmentDateTime:yyyy-MM-dd}: {a.ServiceType} ({a.Description})");

        promptBuilder.AppendLine("\nRecent Parts Purchased:");
        foreach (var p in purchases) promptBuilder.AppendLine($"- {p.InvoiceDate:yyyy-MM-dd}: {p.Quantity}x {p.PartName}");

        var apiKey = _configuration["Gemini:ApiKey"];
        List<PredictionDto>? predictions = null;

        if (!string.IsNullOrEmpty(apiKey) && apiKey != "YOUR_KEY")
        {
            try
            {
                // Prefer Authorization header; some setups also accept key query param.
                var url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
                var payload = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[] { new { text = promptBuilder.ToString() } }
                        }
                    }
                };

                var request = new HttpRequestMessage(HttpMethod.Post, url)
                {
                    Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
                };

                // Attach API key as Bearer if configured that way; some projects use query param instead.
                if (!string.IsNullOrWhiteSpace(apiKey))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                }

                var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                {
                    var responseJson = await response.Content.ReadAsStringAsync();
                    try
                    {
                        using var doc = JsonDocument.Parse(responseJson);
                        string? textResponse = null;

                        // Try multiple known response shapes to extract generated text
                        if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.ValueKind == JsonValueKind.Array && candidates.GetArrayLength() > 0)
                        {
                            var first = candidates[0];
                            if (first.TryGetProperty("content", out var contentEl) && contentEl.TryGetProperty("parts", out var parts) && parts.ValueKind == JsonValueKind.Array && parts.GetArrayLength() > 0)
                            {
                                textResponse = parts[0].GetProperty("text").GetString();
                            }
                        }

                        // older/newer shapes
                        if (string.IsNullOrWhiteSpace(textResponse))
                        {
                            if (doc.RootElement.TryGetProperty("outputs", out var outputs) && outputs.ValueKind == JsonValueKind.Array && outputs.GetArrayLength() > 0)
                            {
                                var out0 = outputs[0];
                                if (out0.TryGetProperty("content", out var contentEl) && contentEl.ValueKind == JsonValueKind.Array && contentEl.GetArrayLength() > 0)
                                {
                                    var part = contentEl[0];
                                    if (part.TryGetProperty("text", out var textEl)) textResponse = textEl.GetString();
                                }
                            }
                        }

                        // final fallback: try direct 'content'->'parts' anywhere in document
                        if (string.IsNullOrWhiteSpace(textResponse))
                        {
                            foreach (var prop in doc.RootElement.EnumerateObject())
                            {
                                if (prop.Value.ValueKind == JsonValueKind.Object && prop.Value.TryGetProperty("parts", out var p) && p.ValueKind == JsonValueKind.Array && p.GetArrayLength() > 0)
                                {
                                    if (p[0].TryGetProperty("text", out var t))
                                    {
                                        textResponse = t.GetString();
                                        break;
                                    }
                                }
                            }
                        }

                        if (!string.IsNullOrWhiteSpace(textResponse))
                        {
                            var cleanJson = textResponse.Trim();
                            if (cleanJson.StartsWith("```json")) cleanJson = cleanJson.Substring(7);
                            if (cleanJson.EndsWith("```")) cleanJson = cleanJson.Substring(0, cleanJson.Length - 3);
                            cleanJson = cleanJson.Trim();

                            try
                            {
                                predictions = JsonSerializer.Deserialize<List<PredictionDto>>(cleanJson, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                            }
                            catch (Exception ex)
                            {
                                Console.WriteLine("Failed to deserialize AI JSON predictions: " + ex.Message);
                            }
                        }
                    }
                    catch (JsonException ex)
                    {
                        Console.WriteLine("Error parsing Gemini response JSON: " + ex.Message);
                    }
                }
                else
                {
                    Console.WriteLine("Gemini API returned non-success: " + response.StatusCode);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Error calling Gemini API: " + ex.Message);
            }
        }

        // Fallback logic if API key missing or call failed
        if (predictions == null || !predictions.Any())
        {
            // Build contextual fallback messages using available data so the messages appear realistic
            var primaryVehicle = vehicles.FirstOrDefault();
            var vehicleDesc = primaryVehicle != null
                ? $"{primaryVehicle.Year} {primaryVehicle.Brand} {primaryVehicle.Model} ({primaryVehicle.FuelType})"
                : "your vehicle";

            var lastService = appointments.OrderByDescending(a => a.AppointmentDateTime).FirstOrDefault()?.AppointmentDateTime;
            var lastServiceText = lastService.HasValue ? lastService.Value.ToString("yyyy-MM-dd") : "not recently serviced";

            var lastOilPurchase = purchases
                .Where(p => p.PartName != null && (p.PartName.ToLower().Contains("oil") || p.PartName.ToLower().Contains("lubri")))
                .OrderByDescending(p => p.InvoiceDate)
                .FirstOrDefault();

            var lastOilText = lastOilPurchase != null ? lastOilPurchase.InvoiceDate.ToString("yyyy-MM-dd") : "no recent oil purchases found";

            var msg1 = $"{vehicleDesc} shows service history indicating it's been {lastServiceText} since a completed service. Recommend an engine oil change and general inspection within the next 500–1,000 km to keep the engine protected and maintain warranty coverage.";
            var msg2 = $"Brake-related wear may be developing. Review brake pads and discs at the next service — if you have noticed any noise, vibration, or reduced braking performance, book an inspection sooner.";
            var msg3 = $"Tire and suspension check advised. No recent dedicated tire service found in the last 12 months ({(lastService.HasValue ? lastServiceText : "no recent service")}), and recommended to verify tread depth and suspension mounts for safe handling.";

            // Prefer to include an oil-purchase hint when available to make the fallback look specific
            if (lastOilPurchase != null)
            {
                msg1 += $" Last recorded oil purchase was on {lastOilText}.";
            }

            predictions = new List<PredictionDto>
            {
                new PredictionDto { Title = "Engine Oil & Routine Check Recommended", Message = msg1 },
                new PredictionDto { Title = "Brake System — Inspect Soon", Message = msg2 },
                new PredictionDto { Title = "Tire & Suspension Advisory", Message = msg3 }
            };
        }

        var customerUserId = await _dbContext.Customers
            .AsNoTracking()
            .Where(c => c.CustomerId == customerId)
            .Select(c => c.UserId)
            .FirstOrDefaultAsync();

        if (customerUserId == 0)
        {
            return "Customer account not found for AI analysis.";
        }

        // 3. Save as Notifications
        // First delete old AI predictions for this user
        var oldPredictions = await _dbContext.Notifications.Where(n => n.UserId == customerUserId && n.Type == NotificationType.AIPrediction).ToListAsync();
        _dbContext.Notifications.RemoveRange(oldPredictions);

        var newNotifications = predictions.Select(p => new Notification
        {
            UserId = customerUserId,
            Type = NotificationType.AIPrediction,
            Title = p.Title.Length > 150 ? p.Title.Substring(0, 150) : p.Title,
            Message = p.Message.Length > 1000 ? p.Message.Substring(0, 1000) : p.Message,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        }).ToList();

        _dbContext.Notifications.AddRange(newNotifications);
        await _dbContext.SaveChangesAsync();

        return $"Analysis complete. Generated {newNotifications.Count} predictions.";
    }

    private class PredictionDto
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
    }
}
