using Backend.Data;
using Backend.DTOs.Customer;
using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services;

public class CustomerService : ICustomerService
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher<User> _passwordHasher;

    public CustomerService(AppDbContext dbContext, IPasswordHasher<User> passwordHasher)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
    }

    public async Task<CustomerDto> RegisterAsync(CreateCustomerDto request)
    {
        var emailExists = await _dbContext.Users.AnyAsync(x => x.Email == request.Email);
        if (emailExists)
        {
            throw new InvalidOperationException("Email is already in use.");
        }

        var phoneExists = await _dbContext.Users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber);
        if (phoneExists)
        {
            throw new InvalidOperationException("Phone number is already in use.");
        }

        if (request.Vehicle is not null)
        {
            var vehicleExists = await _dbContext.Vehicles.AnyAsync(x => x.RegistrationNumber == request.Vehicle.RegistrationNumber);
            if (vehicleExists)
            {
                throw new InvalidOperationException("Vehicle registration number already exists.");
            }
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PhoneNumber = request.PhoneNumber,
            Role = UserRole.Customer,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var customer = new Customer
        {
            UserId = user.UserId,
            CustomerCode = $"CUST-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Address = request.Address,
            DateJoined = DateTime.UtcNow,
            CreditBalance = 0,
            TotalSpent = 0,
            LoyaltyPoints = 0
        };

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        if (request.Vehicle is not null)
        {
            var vehicle = new Vehicle
            {
                CustomerId = customer.CustomerId,
                RegistrationNumber = request.Vehicle.RegistrationNumber,
                Brand = request.Vehicle.Brand,
                Model = request.Vehicle.Model,
                Year = request.Vehicle.Year,
                Color = request.Vehicle.Color,
                FuelType = request.Vehicle.FuelType
            };

            _dbContext.Vehicles.Add(vehicle);
            await _dbContext.SaveChangesAsync();
        }

        return await GetByIdAsync(customer.CustomerId) ?? throw new InvalidOperationException("Failed to load customer.");
    }

    public async Task<IReadOnlyList<CustomerDto>> SearchAsync(string term)
    {
        var query = _dbContext.Customers
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Vehicles)
            .AsQueryable();

        query = query.Where(x => x.User.IsActive);

        if (!string.IsNullOrWhiteSpace(term))
        {
            term = term.Trim();
            var pattern = $"%{term}%";
            var hasCustomerId = int.TryParse(term, out var customerId);

            query = query.Where(x =>
                (hasCustomerId && x.CustomerId == customerId) ||
                EF.Functions.ILike(x.CustomerCode, pattern) ||
                EF.Functions.ILike(x.User.FullName, pattern) ||
                EF.Functions.ILike(x.User.PhoneNumber, pattern) ||
                EF.Functions.ILike(x.User.Email, pattern) ||
                x.Vehicles.Any(v => EF.Functions.ILike(v.RegistrationNumber, pattern)));
        }

        return await query
            .OrderBy(x => x.User.FullName)
            .Select(x => new CustomerDto
            {
                CustomerId = x.CustomerId,
                CustomerCode = x.CustomerCode,
                UserId = x.UserId,
                FullName = x.User.FullName,
                Email = x.User.Email,
                PhoneNumber = x.User.PhoneNumber,
                Address = x.Address,
                DateJoined = x.DateJoined,
                CreditBalance = x.CreditBalance,
                TotalSpent = x.TotalSpent,
                LoyaltyPoints = x.LoyaltyPoints,
                VehicleRegistrationNumbers = x.Vehicles.Select(v => v.RegistrationNumber).ToList(),
                Vehicles = x.Vehicles.Select(v => new CustomerVehicleDto
                {
                    VehicleId = v.VehicleId,
                    RegistrationNumber = v.RegistrationNumber,
                    Brand = v.Brand,
                    Model = v.Model,
                    Year = v.Year,
                    Color = v.Color,
                    FuelType = v.FuelType
                }).ToList()
            })
            .ToListAsync();
    }

    public async Task<CustomerDto?> GetByIdAsync(int customerId)
    {
        return await _dbContext.Customers
            .AsNoTracking()
            .Include(x => x.User)
            .Include(x => x.Vehicles)
            .Where(x => x.CustomerId == customerId && x.User.IsActive)
            .Select(x => new CustomerDto
            {
                CustomerId = x.CustomerId,
                CustomerCode = x.CustomerCode,
                UserId = x.UserId,
                FullName = x.User.FullName,
                Email = x.User.Email,
                PhoneNumber = x.User.PhoneNumber,
                Address = x.Address,
                DateJoined = x.DateJoined,
                CreditBalance = x.CreditBalance,
                TotalSpent = x.TotalSpent,
                LoyaltyPoints = x.LoyaltyPoints,
                VehicleRegistrationNumbers = x.Vehicles.Select(v => v.RegistrationNumber).ToList(),
                Vehicles = x.Vehicles.Select(v => new CustomerVehicleDto
                {
                    VehicleId = v.VehicleId,
                    RegistrationNumber = v.RegistrationNumber,
                    Brand = v.Brand,
                    Model = v.Model,
                    Year = v.Year,
                    Color = v.Color,
                    FuelType = v.FuelType
                }).ToList()
            })
            .FirstOrDefaultAsync();
    }

    public async Task<bool> DeleteAsync(int customerId)
    {
        var customer = await _dbContext.Customers
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.CustomerId == customerId);

        if (customer is null)
        {
            return false;
        }

        if (!customer.User.IsActive)
        {
            return true;
        }

        customer.User.IsActive = false;
        await _dbContext.SaveChangesAsync();
        return true;
    }

    public async Task<ReviewDto> CreateReviewAsync(int customerId, CreateReviewDto request)
    {
        var customerExists = await _dbContext.Customers.AnyAsync(x => x.CustomerId == customerId);
        if (!customerExists)
        {
            throw new InvalidOperationException("Customer not found.");
        }

        // Validate appointment exists and is completed
        if (request.AppointmentId <= 0)
        {
            throw new InvalidOperationException("AppointmentId is required to create a review.");
        }

        var appointment = await _dbContext.Appointments.FirstOrDefaultAsync(a => a.AppointmentId == request.AppointmentId);
        if (appointment == null || appointment.CustomerId != customerId)
        {
            throw new InvalidOperationException("Appointment not found for this customer.");
        }

        if (appointment.Status != AppointmentStatus.Completed)
        {
            throw new InvalidOperationException("Cannot submit review until the appointment is marked as completed.");
        }

        var entity = await _dbContext.Reviews.FirstOrDefaultAsync(x =>
            x.CustomerId == customerId && x.AppointmentId == request.AppointmentId);

        var now = DateTime.UtcNow;

        if (entity is null)
        {
            entity = new Review
            {
                CustomerId = customerId,
                AppointmentId = request.AppointmentId,
                Rating = request.Rating,
                Comment = request.Comment,
                CreatedAt = now,
                IsApproved = false
            };

            _dbContext.Reviews.Add(entity);
        }
        else
        {
            entity.Rating = request.Rating;
            entity.Comment = request.Comment;
            entity.CreatedAt = now;
            entity.IsApproved = false;
        }

        await _dbContext.SaveChangesAsync();

        return await MapReviewAsync(entity.ReviewId);
    }

    public async Task<IReadOnlyList<ReviewDto>> GetAllReviewsAsync()
    {
        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => r.ReviewId)
            .ToListAsync();

        return await MapReviewsAsync(reviews);
    }

    public async Task<IReadOnlyList<ReviewDto>> GetReviewsForStaffAsync(int staffId)
    {
        var reviewIds = await _dbContext.Reviews
            .AsNoTracking()
            .Include(r => r.Appointment)
            .ThenInclude(a => a!.Staff)
            .Include(r => r.Appointment)
            .ThenInclude(a => a!.Customer)
            .Where(r => r.Appointment != null && r.Appointment.StaffId == staffId)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => r.ReviewId)
            .ToListAsync();

        return await MapReviewsAsync(reviewIds);
    }

    public async Task<CustomerHistoryDto?> GetHistoryAsync(int customerId)
    {
        var customerExists = await _dbContext.Customers.AnyAsync(x => x.CustomerId == customerId);
        if (!customerExists)
        {
            return null;
        }

        var purchases = await _dbContext.SalesInvoices
            .AsNoTracking()
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.InvoiceDate)
            .Select(x => new CustomerPurchaseHistoryItemDto
            {
                SalesInvoiceId = x.SalesInvoiceId,
                InvoiceNumber = x.InvoiceNumber,
                InvoiceDate = x.InvoiceDate,
                TotalAmount = x.TotalAmount,
                BalanceAmount = x.BalanceAmount,
                Status = x.Status.ToString()
            })
            .ToListAsync();

        var appointmentEntities = await _dbContext.Appointments
            .AsNoTracking()
            .Include(x => x.Customer)
                .ThenInclude(x => x.User)
            .Include(x => x.Staff)
                .ThenInclude(x => x!.User)
            .Include(x => x.Review)
            .Where(x => x.CustomerId == customerId)
            .OrderByDescending(x => x.AppointmentDateTime)
            .ToListAsync();

        var appointments = appointmentEntities
            .Select(x => new CustomerAppointmentHistoryItemDto
            {
                AppointmentId = x.AppointmentId,
                AppointmentDateTime = x.AppointmentDateTime,
                ServiceType = x.ServiceType,
                Status = x.Status.ToString(),
                Review = x.Review is null
                    ? null
                    : new ReviewDto
                    {
                        ReviewId = x.Review.ReviewId,
                        CustomerId = x.Review.CustomerId,
                        CustomerName = x.Customer?.User?.FullName ?? string.Empty,
                        AppointmentId = x.Review.AppointmentId,
                        AppointmentDateTime = x.AppointmentDateTime,
                        ServiceType = x.ServiceType,
                        AppointmentStatus = x.Status.ToString(),
                        StaffId = x.StaffId,
                        StaffName = x.Staff?.User?.FullName,
                        Rating = x.Review.Rating,
                        Comment = x.Review.Comment,
                        CreatedAt = x.Review.CreatedAt,
                        IsApproved = x.Review.IsApproved
                    }
            })
            .ToList();

        return new CustomerHistoryDto
        {
            CustomerId = customerId,
            Purchases = purchases,
            Appointments = appointments
        };
    }

    private async Task<ReviewDto> MapReviewAsync(int reviewId)
    {
        var review = await _dbContext.Reviews
            .AsNoTracking()
            .Include(r => r.Customer)
                .ThenInclude(x => x.User)
            .Include(r => r.Appointment)
                .ThenInclude(a => a!.Staff)
                    .ThenInclude(x => x!.User)
            .FirstAsync(r => r.ReviewId == reviewId);

        return new ReviewDto
        {
            ReviewId = review.ReviewId,
            CustomerId = review.CustomerId,
            CustomerName = review.Customer.User?.FullName ?? string.Empty,
            AppointmentId = review.AppointmentId,
            AppointmentDateTime = review.Appointment?.AppointmentDateTime,
            ServiceType = review.Appointment?.ServiceType,
            AppointmentStatus = review.Appointment?.Status.ToString(),
            StaffId = review.Appointment?.StaffId,
            StaffName = review.Appointment?.Staff?.User?.FullName,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt,
            IsApproved = review.IsApproved
        };
    }

    private async Task<List<ReviewDto>> MapReviewsAsync(IEnumerable<int> reviewIds)
    {
        var ids = reviewIds.Distinct().ToList();
        if (ids.Count == 0)
        {
            return [];
        }

        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .Include(r => r.Customer)
                .ThenInclude(x => x.User)
            .Include(r => r.Appointment)
                .ThenInclude(a => a!.Staff)
                    .ThenInclude(x => x!.User)
            .Where(r => ids.Contains(r.ReviewId))
            .ToListAsync();

        return ids
            .Join(reviews, id => id, review => review.ReviewId, (_, review) => new ReviewDto
            {
                ReviewId = review.ReviewId,
                CustomerId = review.CustomerId,
                CustomerName = review.Customer.User?.FullName ?? string.Empty,
                AppointmentId = review.AppointmentId,
                AppointmentDateTime = review.Appointment?.AppointmentDateTime,
                ServiceType = review.Appointment?.ServiceType,
                AppointmentStatus = review.Appointment?.Status.ToString(),
                StaffId = review.Appointment?.StaffId,
                StaffName = review.Appointment?.Staff?.User?.FullName,
                Rating = review.Rating,
                Comment = review.Comment,
                CreatedAt = review.CreatedAt,
                IsApproved = review.IsApproved
            })
            .ToList();
    }

    public async Task<CustomerDto?> UpdateProfileAsync(int customerId, UpdateCustomerProfileDto request)
    {
        var customer = await _dbContext.Customers
            .Include(x => x.User)
            .FirstOrDefaultAsync(x => x.CustomerId == customerId);

        if (customer is null)
            return null;

        if (!string.IsNullOrWhiteSpace(request.FullName))
            customer.User.FullName = request.FullName;

        if (!string.IsNullOrWhiteSpace(request.Email))
        {
            var emailExists = await _dbContext.Users.AnyAsync(x => x.Email == request.Email && x.UserId != customer.UserId);
            if (emailExists)
                throw new InvalidOperationException("Email is already in use.");
            customer.User.Email = request.Email;
        }

        if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
        {
            var phoneExists = await _dbContext.Users.AnyAsync(x => x.PhoneNumber == request.PhoneNumber && x.UserId != customer.UserId);
            if (phoneExists)
                throw new InvalidOperationException("Phone number is already in use.");
            customer.User.PhoneNumber = request.PhoneNumber;
        }

        if (request.Address is not null)
            customer.Address = request.Address;

        await _dbContext.SaveChangesAsync();
        return await GetByIdAsync(customerId);
    }

    public async Task<CustomerDto?> AddVehicleAsync(int customerId, CreateVehicleDto request)
    {
        var customerExists = await _dbContext.Customers.AnyAsync(x => x.CustomerId == customerId);
        if (!customerExists)
            return null;

        var vehicleExists = await _dbContext.Vehicles.AnyAsync(x => x.RegistrationNumber == request.RegistrationNumber);
        if (vehicleExists)
            throw new InvalidOperationException("Vehicle registration number already exists.");

        var vehicle = new Vehicle
        {
            CustomerId = customerId,
            RegistrationNumber = request.RegistrationNumber,
            Brand = request.Brand,
            Model = request.Model,
            Year = request.Year,
            Color = request.Color,
            FuelType = request.FuelType
        };

        _dbContext.Vehicles.Add(vehicle);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(customerId);
    }

    public async Task<CustomerDto?> UpdateVehicleAsync(int customerId, int vehicleId, UpdateVehicleDto request)
    {
        var vehicle = await _dbContext.Vehicles
            .FirstOrDefaultAsync(x => x.VehicleId == vehicleId && x.CustomerId == customerId);

        if (vehicle is null)
            return null;

        vehicle.Brand = request.Brand;
        vehicle.Model = request.Model;
        vehicle.Year = request.Year;
        vehicle.Color = request.Color;
        vehicle.FuelType = request.FuelType;

        await _dbContext.SaveChangesAsync();
        return await GetByIdAsync(customerId);
    }

    public async Task<CustomerDto?> DeleteVehicleAsync(int customerId, int vehicleId)
    {
        var vehicle = await _dbContext.Vehicles
            .FirstOrDefaultAsync(x => x.VehicleId == vehicleId && x.CustomerId == customerId);

        if (vehicle is null)
            return null;

        _dbContext.Vehicles.Remove(vehicle);
        await _dbContext.SaveChangesAsync();

        return await GetByIdAsync(customerId);
    }

    public async Task<PartRequestDto> CreatePartRequestAsync(int customerId, CreatePartRequestDto request)
    {
        var customerExists = await _dbContext.Customers.AnyAsync(x => x.CustomerId == customerId);
        if (!customerExists)
            throw new InvalidOperationException("Customer not found.");

        var entity = new PartRequest
        {
            CustomerId = customerId,
            PartName = request.PartName,
            RequestedQuantity = request.RequestedQuantity,
            Notes = request.Notes,
            Status = PartRequestStatus.Pending,
            RequestedAt = DateTime.UtcNow
        };

        _dbContext.PartRequests.Add(entity);
        await _dbContext.SaveChangesAsync();

        return new PartRequestDto
        {
            PartRequestId = entity.PartRequestId,
            CustomerId = entity.CustomerId,
            PartName = entity.PartName,
            RequestedQuantity = entity.RequestedQuantity,
            Notes = entity.Notes,
            Status = entity.Status.ToString(),
            RequestedAt = entity.RequestedAt
        };
    }

    public async Task<IReadOnlyList<PartRequestDto>> GetPartRequestsAsync(int customerId)
    {
        var exists = await _dbContext.Customers.AnyAsync(c => c.CustomerId == customerId);
        if (!exists) return new List<PartRequestDto>();

        return await _dbContext.PartRequests
            .AsNoTracking()
            .Where(pr => pr.CustomerId == customerId)
            .OrderByDescending(pr => pr.RequestedAt)
            .Select(pr => new PartRequestDto
            {
                PartRequestId = pr.PartRequestId,
                CustomerId = pr.CustomerId,
                PartName = pr.PartName,
                RequestedQuantity = pr.RequestedQuantity,
                Notes = pr.Notes,
                Status = pr.Status.ToString(),
                RequestedAt = pr.RequestedAt
            })
            .ToListAsync();
    }
}
