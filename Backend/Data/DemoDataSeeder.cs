using Backend.Enums;
using Backend.Models;
using Backend.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public static class DemoDataSeeder
{
    public static async Task SeedAsync(IServiceProvider services, IConfiguration configuration)
    {
        using var scope = services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<User>>();
        var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

        await using var transaction = await dbContext.Database.BeginTransactionAsync();

        var adminUser = await EnsureUserAsync(
            dbContext,
            passwordHasher,
            email: configuration["AdminSeed:Email"] ?? "admin@backend.local",
            phoneNumber: configuration["AdminSeed:PhoneNumber"] ?? "9800000000",
            fullName: configuration["AdminSeed:FullName"] ?? "System Admin",
            role: UserRole.Admin,
            password: configuration["AdminSeed:Password"] ?? "Admin@12345");

        var staffSeeds = new[]
        {
            new { Email = "staff1@backend.local", PhoneNumber = "9811111111", FullName = "Rohan Shrestha", EmployeeCode = "EMP-001", JobTitle = "Service Advisor", HireDate = DateTime.UtcNow.AddYears(-2), Salary = 65000m },
            new { Email = "staff2@backend.local", PhoneNumber = "9811111112", FullName = "Aarav K.C.", EmployeeCode = "EMP-002", JobTitle = "Senior Mechanic", HireDate = DateTime.UtcNow.AddYears(-3), Salary = 72000m },
            new { Email = "staff3@backend.local", PhoneNumber = "9811111113", FullName = "Suman Maharjan", EmployeeCode = "EMP-003", JobTitle = "Mechanic", HireDate = DateTime.UtcNow.AddYears(-1).AddMonths(-6), Salary = 58000m },
            new { Email = "staff4@backend.local", PhoneNumber = "9811111114", FullName = "Dipesh Thapa", EmployeeCode = "EMP-004", JobTitle = "Mechanic", HireDate = DateTime.UtcNow.AddYears(-1).AddMonths(-3), Salary = 56000m },
            new { Email = "staff5@backend.local", PhoneNumber = "9811111115", FullName = "Nabin Karki", EmployeeCode = "EMP-005", JobTitle = "Service Advisor", HireDate = DateTime.UtcNow.AddYears(-1), Salary = 54000m },
            new { Email = "staff6@backend.local", PhoneNumber = "9811111116", FullName = "Prashant Adhikari", EmployeeCode = "EMP-006", JobTitle = "Electrician", HireDate = DateTime.UtcNow.AddMonths(-18), Salary = 59000m },
            new { Email = "staff7@backend.local", PhoneNumber = "9811111117", FullName = "Ritesh Pandey", EmployeeCode = "EMP-007", JobTitle = "Painter", HireDate = DateTime.UtcNow.AddYears(-2).AddMonths(-4), Salary = 52000m },
            new { Email = "staff8@backend.local", PhoneNumber = "9811111118", FullName = "Bikash Gurung", EmployeeCode = "EMP-008", JobTitle = "Parts Coordinator", HireDate = DateTime.UtcNow.AddYears(-2).AddMonths(-2), Salary = 51000m },
            new { Email = "staff9@backend.local", PhoneNumber = "9811111119", FullName = "Anil Basnet", EmployeeCode = "EMP-009", JobTitle = "Technician", HireDate = DateTime.UtcNow.AddYears(-1).AddMonths(-8), Salary = 57000m },
            new { Email = "staff10@backend.local", PhoneNumber = "9811111120", FullName = "Suresh Tamang", EmployeeCode = "EMP-010", JobTitle = "Supervisor", HireDate = DateTime.UtcNow.AddYears(-4), Salary = 76000m },
        };

        var staffUsers = new List<User>();
        var staffProfiles = new List<Staff>();
        foreach (var seed in staffSeeds)
        {
            var user = await EnsureUserAsync(
                dbContext,
                passwordHasher,
                email: seed.Email,
                phoneNumber: seed.PhoneNumber,
                fullName: seed.FullName,
                role: UserRole.Staff,
                password: "Staff@12345");

            staffUsers.Add(user);
            staffProfiles.Add(await EnsureStaffAsync(dbContext, user.UserId, seed.EmployeeCode, seed.JobTitle, seed.HireDate, seed.Salary));
        }

        var regularCustomerSeeds = new[]
        {
            new { Email = "pratikshyadahal92@gmail.com", PhoneNumber = "9822222222", FullName = "Suman Khadka", CustomerCode = "CUS-001", Address = "New Road, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-8), CreditBalance = 2200m, TotalSpent = 7200m, LoyaltyPoints = 120, Vehicle = new { RegistrationNumber = "BA-1-PA-1001", Brand = "Toyota", Model = "Corolla", Year = 2018, Color = "White", FuelType = "Petrol" } },
            new { Email = "pratikshyadahal26@gmail.com", PhoneNumber = "9833333333", FullName = "Mina Thapa", CustomerCode = "CUS-002", Address = "Putalisadak, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-4), CreditBalance = 0m, TotalSpent = 1800m, LoyaltyPoints = 30, Vehicle = new { RegistrationNumber = "BA-2-CH-2002", Brand = "Honda", Model = "City", Year = 2020, Color = "Silver", FuelType = "Petrol" } },
            new { Email = "customer3@backend.local", PhoneNumber = "9844444444", FullName = "Rajesh Pandey", CustomerCode = "CUS-003", Address = "Baneshwor, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-6), CreditBalance = 1500m, TotalSpent = 5000m, LoyaltyPoints = 75, Vehicle = new { RegistrationNumber = "BA-3-PA-3003", Brand = "Suzuki", Model = "Swift", Year = 2019, Color = "Blue", FuelType = "Petrol" } },
            new { Email = "customer4@backend.local", PhoneNumber = "9855555555", FullName = "Kriti Shrestha", CustomerCode = "CUS-004", Address = "Koteshwor, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-5), CreditBalance = 0m, TotalSpent = 12500m, LoyaltyPoints = 210, Vehicle = new { RegistrationNumber = "BA-4-PA-4004", Brand = "Nissan", Model = "Magnite", Year = 2021, Color = "Black", FuelType = "Petrol" } },
            new { Email = "customer5@backend.local", PhoneNumber = "9866666666", FullName = "Bikram Rai", CustomerCode = "CUS-005", Address = "Gwarko, Lalitpur", DateJoined = DateTime.UtcNow.AddMonths(-3), CreditBalance = 300m, TotalSpent = 3600m, LoyaltyPoints = 45, Vehicle = new { RegistrationNumber = "BA-5-PA-5005", Brand = "Hyundai", Model = "i20", Year = 2017, Color = "Grey", FuelType = "Petrol" } },
            new { Email = "customer6@backend.local", PhoneNumber = "9877777777", FullName = "Pooja Khatri", CustomerCode = "CUS-006", Address = "Lazimpat, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-7), CreditBalance = 900m, TotalSpent = 6400m, LoyaltyPoints = 96, Vehicle = new { RegistrationNumber = "BA-6-PA-6006", Brand = "Kia", Model = "Sonet", Year = 2022, Color = "Red", FuelType = "Petrol" } },
            new { Email = "customer7@backend.local", PhoneNumber = "9888888888", FullName = "Keshav Adhikari", CustomerCode = "CUS-007", Address = "Kapan, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-9), CreditBalance = 2100m, TotalSpent = 9800m, LoyaltyPoints = 140, Vehicle = new { RegistrationNumber = "BA-7-PA-7007", Brand = "Mahindra", Model = "XUV300", Year = 2020, Color = "White", FuelType = "Diesel" } },
            new { Email = "customer8@backend.local", PhoneNumber = "9899999999", FullName = "Sneha Lama", CustomerCode = "CUS-008", Address = "Chabahil, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-2), CreditBalance = 0m, TotalSpent = 2400m, LoyaltyPoints = 25, Vehicle = new { RegistrationNumber = "BA-8-PA-8008", Brand = "Tata", Model = "Punch", Year = 2023, Color = "Orange", FuelType = "Petrol" } },
        };

        var customerRecords = new List<(Customer Customer, Vehicle Vehicle)>();

        foreach (var seed in regularCustomerSeeds)
        {
            var user = await EnsureUserAsync(
                dbContext,
                passwordHasher,
                email: seed.Email,
                phoneNumber: seed.PhoneNumber,
                fullName: seed.FullName,
                role: UserRole.Customer,
                password: "Customer@12345");

            var customer = await EnsureCustomerAsync(dbContext, user.UserId, seed.CustomerCode, seed.Address, seed.DateJoined, seed.CreditBalance, seed.TotalSpent, seed.LoyaltyPoints);
            var vehicle = await EnsureVehicleAsync(dbContext, customer.CustomerId, seed.Vehicle.RegistrationNumber, seed.Vehicle.Brand, seed.Vehicle.Model, seed.Vehicle.Year, seed.Vehicle.Color, seed.Vehicle.FuelType);
            customerRecords.Add((customer, vehicle));
        }

        var staffLinkedCustomerSeeds = new[]
        {
            new { StaffIndex = 0, CustomerCode = "CUS-S-001", Address = "Kalanki, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-6), CreditBalance = 1450m, TotalSpent = 9400m, LoyaltyPoints = 160, Vehicle = new { RegistrationNumber = "BA-9-PA-3003", Brand = "Suzuki", Model = "Swift", Year = 2017, Color = "Grey", FuelType = "Petrol" } },
            new { StaffIndex = 1, CustomerCode = "CUS-S-002", Address = "Pepsicola, Kathmandu", DateJoined = DateTime.UtcNow.AddMonths(-5), CreditBalance = 0m, TotalSpent = 3100m, LoyaltyPoints = 55, Vehicle = new { RegistrationNumber = "BA-9-PA-3004", Brand = "Hyundai", Model = "Grand i10", Year = 2019, Color = "Red", FuelType = "Petrol" } },
        };

        foreach (var seed in staffLinkedCustomerSeeds)
        {
            var staffUser = staffUsers[seed.StaffIndex];
            var customer = await EnsureCustomerAsync(dbContext, staffUser.UserId, seed.CustomerCode, seed.Address, seed.DateJoined, seed.CreditBalance, seed.TotalSpent, seed.LoyaltyPoints);
            var vehicle = await EnsureVehicleAsync(dbContext, customer.CustomerId, seed.Vehicle.RegistrationNumber, seed.Vehicle.Brand, seed.Vehicle.Model, seed.Vehicle.Year, seed.Vehicle.Color, seed.Vehicle.FuelType);
            customerRecords.Add((customer, vehicle));
        }

        var staff = staffProfiles[0];
        var staffTwo = staffProfiles[1];
        var staffThree = staffProfiles[2];
        var staffFour = staffProfiles[3];
        var customerOne = customerRecords[0].Customer;
        var customerTwo = customerRecords[1].Customer;
        var vehicleOne = customerRecords[0].Vehicle;
        var vehicleTwo = customerRecords[1].Vehicle;
        var staffCustomerOne = customerRecords[8].Customer;
        var staffCustomerTwo = customerRecords[9].Customer;
        var staffVehicleOne = customerRecords[8].Vehicle;
        var staffVehicleTwo = customerRecords[9].Vehicle;
        var vendorA = await EnsureVendorAsync(dbContext, "Valley Auto Spares", "Prakash Karki", "9840000001", "sales@valleyautospares.local", "Teku, Kathmandu");
        var vendorB = await EnsureVendorAsync(dbContext, "Prime Automotive Mart", "Sita Lama", "9840000002", "hello@primeautomart.local", "Bhaktapur");

        var categoryEngine = await EnsureCategoryAsync(dbContext, "Engine", "Engine service and lubrication parts");
        var categoryElectrical = await EnsureCategoryAsync(dbContext, "Electrical", "Electrical and battery components");
        var categoryBraking = await EnsureCategoryAsync(dbContext, "Braking", "Brake and safety components");

        var engineOil = await EnsurePartAsync(dbContext, "ENG-OIL-001", "Engine Oil 5W-30", "Fully synthetic engine oil", 1800m, 1400m, 4, 10, vendorA.VendorId, categoryEngine.CategoryId);
        var oilFilter = await EnsurePartAsync(dbContext, "OIL-FLT-001", "Oil Filter", "Premium oil filter", 600m, 320m, 12, 10, vendorA.VendorId, categoryEngine.CategoryId);
        var battery = await EnsurePartAsync(dbContext, "BAT-001", "Car Battery 45Ah", "Maintenance-free battery", 8500m, 7200m, 3, 5, vendorB.VendorId, categoryElectrical.CategoryId);
        var brakePads = await EnsurePartAsync(dbContext, "BRK-PAD-001", "Brake Pad Set", "Front brake pad set", 3200m, 2500m, 16, 10, vendorB.VendorId, categoryBraking.CategoryId);

        var purchaseInvoice = await EnsurePurchaseInvoiceAsync(
            dbContext,
            invoiceNumber: "PINV-DEMO-001",
            vendorId: vendorA.VendorId,
            staffId: staff.StaffId,
            invoiceDate: DateTime.UtcNow.AddDays(-45),
            notes: "Initial stock purchase for demo data",
            items: new[]
            {
                new { Part = engineOil, Quantity = 8, UnitCost = 1400m },
                new { Part = oilFilter, Quantity = 15, UnitCost = 320m },
            });

        var purchaseInvoiceTwo = await EnsurePurchaseInvoiceAsync(
            dbContext,
            invoiceNumber: "PINV-DEMO-002",
            vendorId: vendorB.VendorId,
            staffId: staffTwo.StaffId,
            invoiceDate: DateTime.UtcNow.AddDays(-18),
            notes: "Second restock batch for demo data",
            items: new[]
            {
                new { Part = battery, Quantity = 5, UnitCost = 7200m },
                new { Part = brakePads, Quantity = 7, UnitCost = 2500m },
            });

        var delayedAppointmentOne = await EnsureAppointmentAsync(
            dbContext,
            staffCustomerOne.CustomerId,
            staffVehicleOne.VehicleId,
            staffTwo.StaffId,
            DateTime.UtcNow.AddDays(-41),
            "Engine Follow-up",
            "Waiting on part replacement and final inspection.",
            AppointmentStatus.Pending,
            "Customer waiting for callback.");

        var delayedAppointmentTwo = await EnsureAppointmentAsync(
            dbContext,
            staffCustomerTwo.CustomerId,
            staffVehicleTwo.VehicleId,
            staffThree.StaffId,
            DateTime.UtcNow.AddDays(-36),
            "Brake Service Delay",
            "Pending approval after inspection.",
            AppointmentStatus.Pending,
            "Delayed due to parts shortage.");

        var overdueInvoice = await EnsureSalesInvoiceAsync(
            dbContext,
            invoiceNumber: "SINV-DEMO-OVERDUE-001",
            customerId: customerOne.CustomerId,
            vehicleId: vehicleOne.VehicleId,
            staffId: staff.StaffId,
            invoiceDate: DateTime.UtcNow.AddDays(-42),
            amountPaid: 8100m,
            notes: "Demo overdue invoice",
            items: new[]
            {
                new { Part = engineOil, Quantity = 1, UnitPrice = 1800m, Discount = 0m },
                new { Part = battery, Quantity = 1, UnitPrice = 8500m, Discount = 0m },
            });

        var paidInvoice = await EnsureSalesInvoiceAsync(
            dbContext,
            invoiceNumber: "SINV-DEMO-PAID-001",
            customerId: customerTwo.CustomerId,
            vehicleId: vehicleTwo.VehicleId,
            staffId: staff.StaffId,
            invoiceDate: DateTime.UtcNow.AddDays(-8),
            amountPaid: 1200m,
            notes: "Demo paid invoice",
            items: new[]
            {
                new { Part = oilFilter, Quantity = 2, UnitPrice = 600m, Discount = 0m },
            });

        var overdueInvoiceTwo = await EnsureSalesInvoiceAsync(
            dbContext,
            invoiceNumber: "SINV-DEMO-OVERDUE-002",
            customerId: customerTwo.CustomerId,
            vehicleId: vehicleTwo.VehicleId,
            staffId: staff.StaffId,
            invoiceDate: DateTime.UtcNow.AddDays(-37),
            amountPaid: 500m,
            notes: "Second demo overdue invoice",
            items: new[]
            {
                new { Part = brakePads, Quantity = 1, UnitPrice = 3200m, Discount = 0m },
            });

        var appointmentOne = await EnsureAppointmentAsync(
            dbContext,
            customerOne.CustomerId,
            vehicleOne.VehicleId,
            staff.StaffId,
            DateTime.UtcNow.AddDays(2),
            "Engine Service",
            "Periodic service and oil change",
            AppointmentStatus.Pending,
            null);

        var appointmentTwo = await EnsureAppointmentAsync(
            dbContext,
            customerTwo.CustomerId,
            vehicleTwo.VehicleId,
            staff.StaffId,
            DateTime.UtcNow.AddDays(-5),
            "Brake Inspection",
            "Brake pad inspection and replacement",
            AppointmentStatus.Completed,
            "Completed successfully with new brake pads.");

        var review = await EnsureReviewAsync(
            dbContext,
            customerTwo.CustomerId,
            appointmentTwo?.AppointmentId,
            5,
            "Quick and professional service.",
            true,
            DateTime.UtcNow.AddDays(-4));

        var partRequest = await EnsurePartRequestAsync(
            dbContext,
            customerOne.CustomerId,
            "Windshield Wiper Blades",
            2,
            "Need replacement before monsoon season.",
            PartRequestStatus.Pending,
            DateTime.UtcNow.AddDays(-3));

        await dbContext.SaveChangesAsync();

        await notificationService.NotifyLowStockByThresholdAsync(10, 1);
        await notificationService.CreateOverdueCreditNotificationsAsync(30);

        await dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
    }

    private static async Task<User> EnsureUserAsync(
        AppDbContext dbContext,
        IPasswordHasher<User> passwordHasher,
        string email,
        string phoneNumber,
        string fullName,
        UserRole role,
        string password)
    {
        var user = await dbContext.Users.FirstOrDefaultAsync(x => x.Email == email || x.PhoneNumber == phoneNumber);
        if (user != null)
        {
            return user;
        }

        user = new User
        {
            FullName = fullName,
            Email = email,
            PhoneNumber = phoneNumber,
            Role = role,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };
        user.PasswordHash = passwordHasher.HashPassword(user, password);

        dbContext.Users.Add(user);
        await dbContext.SaveChangesAsync();
        return user;
    }

    private static async Task<Staff> EnsureStaffAsync(AppDbContext dbContext, int userId, string employeeCode, string jobTitle, DateTime hireDate, decimal salary)
    {
        var staff = await dbContext.Staffs.FirstOrDefaultAsync(x => x.EmployeeCode == employeeCode || x.UserId == userId);
        if (staff != null)
        {
            return staff;
        }

        staff = new Staff
        {
            UserId = userId,
            EmployeeCode = employeeCode,
            JobTitle = jobTitle,
            HireDate = hireDate,
            Salary = salary
        };

        dbContext.Staffs.Add(staff);
        await dbContext.SaveChangesAsync();
        return staff;
    }

    private static async Task<Customer> EnsureCustomerAsync(AppDbContext dbContext, int userId, string customerCode, string? address, DateTime dateJoined, decimal creditBalance, decimal totalSpent, int loyaltyPoints)
    {
        var customer = await dbContext.Customers.FirstOrDefaultAsync(x => x.CustomerCode == customerCode || x.UserId == userId);
        if (customer != null)
        {
            return customer;
        }

        customer = new Customer
        {
            UserId = userId,
            CustomerCode = customerCode,
            Address = address,
            DateJoined = dateJoined,
            CreditBalance = creditBalance,
            TotalSpent = totalSpent,
            LoyaltyPoints = loyaltyPoints
        };

        dbContext.Customers.Add(customer);
        await dbContext.SaveChangesAsync();
        return customer;
    }

    private static async Task<Vendor> EnsureVendorAsync(AppDbContext dbContext, string vendorName, string? contactPerson, string? phoneNumber, string? email, string? address)
    {
        var vendor = await dbContext.Vendors.FirstOrDefaultAsync(x => x.VendorName == vendorName);
        if (vendor != null)
        {
            return vendor;
        }

        vendor = new Vendor
        {
            VendorName = vendorName,
            ContactPerson = contactPerson,
            PhoneNumber = phoneNumber,
            Email = email,
            Address = address,
            IsActive = true
        };

        dbContext.Vendors.Add(vendor);
        await dbContext.SaveChangesAsync();
        return vendor;
    }

    private static async Task<Category> EnsureCategoryAsync(AppDbContext dbContext, string categoryName, string? description)
    {
        var category = await dbContext.Categories.FirstOrDefaultAsync(x => x.CategoryName == categoryName);
        if (category != null)
        {
            return category;
        }

        category = new Category
        {
            CategoryName = categoryName,
            Description = description,
            IsActive = true
        };

        dbContext.Categories.Add(category);
        await dbContext.SaveChangesAsync();
        return category;
    }

    private static async Task<Part> EnsurePartAsync(AppDbContext dbContext, string partCode, string partName, string? description, decimal unitPrice, decimal costPrice, int stockQuantity, int reorderLevel, int? vendorId, int? categoryId)
    {
        var part = await dbContext.Parts.FirstOrDefaultAsync(x => x.PartCode == partCode);
        if (part != null)
        {
            return part;
        }

        part = new Part
        {
            PartCode = partCode,
            PartName = partName,
            Description = description,
            UnitPrice = unitPrice,
            CostPrice = costPrice,
            StockQuantity = stockQuantity,
            ReorderLevel = reorderLevel,
            VendorId = vendorId,
            CategoryId = categoryId,
            IsActive = true
        };

        dbContext.Parts.Add(part);
        await dbContext.SaveChangesAsync();
        return part;
    }

    private static async Task<Vehicle> EnsureVehicleAsync(AppDbContext dbContext, int customerId, string registrationNumber, string brand, string model, int year, string? color, string? fuelType)
    {
        var vehicle = await dbContext.Vehicles.FirstOrDefaultAsync(x => x.RegistrationNumber == registrationNumber);
        if (vehicle != null)
        {
            return vehicle;
        }

        vehicle = new Vehicle
        {
            CustomerId = customerId,
            RegistrationNumber = registrationNumber,
            Brand = brand,
            Model = model,
            Year = year,
            Color = color,
            FuelType = fuelType
        };

        dbContext.Vehicles.Add(vehicle);
        await dbContext.SaveChangesAsync();
        return vehicle;
    }

    private static async Task<PurchaseInvoice> EnsurePurchaseInvoiceAsync(AppDbContext dbContext, string invoiceNumber, int vendorId, int? staffId, DateTime invoiceDate, string? notes, IEnumerable<dynamic> items)
    {
        var invoice = await dbContext.PurchaseInvoices.FirstOrDefaultAsync(x => x.InvoiceNumber == invoiceNumber);
        if (invoice != null)
        {
            return invoice;
        }

        var invoiceItems = new List<PurchaseInvoiceItem>();
        decimal subtotal = 0m;

        foreach (var item in items)
        {
            var quantity = (int)item.Quantity;
            var unitCost = (decimal)item.UnitCost;
            var lineTotal = quantity * unitCost;
            subtotal += lineTotal;

            invoiceItems.Add(new PurchaseInvoiceItem
            {
                PartId = item.Part.PartId,
                Quantity = quantity,
                UnitCost = unitCost,
                LineTotal = lineTotal
            });
        }

        var taxAmount = Math.Round(subtotal * 0.13m, 2, MidpointRounding.AwayFromZero);

        invoice = new PurchaseInvoice
        {
            InvoiceNumber = invoiceNumber,
            VendorId = vendorId,
            StaffId = staffId,
            InvoiceDate = invoiceDate,
            Subtotal = subtotal,
            TaxAmount = taxAmount,
            TotalAmount = subtotal + taxAmount,
            Notes = notes,
            Items = invoiceItems
        };

        dbContext.PurchaseInvoices.Add(invoice);
        await dbContext.SaveChangesAsync();
        return invoice;
    }

    private static async Task<SalesInvoice> EnsureSalesInvoiceAsync(AppDbContext dbContext, string invoiceNumber, int customerId, int? vehicleId, int? staffId, DateTime invoiceDate, decimal amountPaid, string? notes, IEnumerable<dynamic> items)
    {
        var invoice = await dbContext.SalesInvoices.FirstOrDefaultAsync(x => x.InvoiceNumber == invoiceNumber);
        if (invoice != null)
        {
            return invoice;
        }

        var invoiceItems = new List<SalesInvoiceItem>();
        decimal subtotal = 0m;
        decimal discountTotal = 0m;

        foreach (var item in items)
        {
            var quantity = (int)item.Quantity;
            var unitPrice = (decimal)item.UnitPrice;
            var discount = (decimal)item.Discount;
            var lineTotal = (quantity * unitPrice) - discount;

            subtotal += quantity * unitPrice;
            discountTotal += discount;

            invoiceItems.Add(new SalesInvoiceItem
            {
                PartId = item.Part.PartId,
                Quantity = quantity,
                UnitPrice = unitPrice,
                Discount = discount,
                LineTotal = lineTotal
            });
        }

        var totalAmount = subtotal - discountTotal;
        var balance = Math.Max(totalAmount - amountPaid, 0m);

        invoice = new SalesInvoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = customerId,
            VehicleId = vehicleId,
            StaffId = staffId,
            InvoiceDate = invoiceDate,
            Subtotal = subtotal,
            DiscountAmount = discountTotal,
            TotalAmount = totalAmount,
            AmountPaid = amountPaid,
            BalanceAmount = balance,
            Status = balance <= 0 ? InvoiceStatus.Paid : InvoiceStatus.PartiallyPaid,
            IsCreditSale = balance > 0,
            Notes = notes,
            Items = invoiceItems
        };

        dbContext.SalesInvoices.Add(invoice);

        var customer = await dbContext.Customers.FirstAsync(x => x.CustomerId == customerId);
        customer.TotalSpent += totalAmount;
        customer.CreditBalance += balance;

        await dbContext.SaveChangesAsync();
        return invoice;
    }

    private static async Task<Appointment> EnsureAppointmentAsync(AppDbContext dbContext, int customerId, int? vehicleId, int? staffId, DateTime appointmentDateTime, string serviceType, string? description, AppointmentStatus status, string? adminNotes)
    {
        var appointment = await dbContext.Appointments.FirstOrDefaultAsync(x => x.CustomerId == customerId && x.VehicleId == vehicleId && x.ServiceType == serviceType);
        if (appointment != null)
        {
            return appointment;
        }

        appointment = new Appointment
        {
            CustomerId = customerId,
            VehicleId = vehicleId,
            StaffId = staffId,
            AppointmentDateTime = appointmentDateTime,
            ServiceType = serviceType,
            Description = description,
            Status = status,
            AdminNotes = adminNotes,
            CreatedAt = DateTime.UtcNow
        };

        dbContext.Appointments.Add(appointment);
        await dbContext.SaveChangesAsync();
        return appointment;
    }

    private static async Task<Review?> EnsureReviewAsync(AppDbContext dbContext, int customerId, int? appointmentId, int rating, string? comment, bool isApproved, DateTime createdAt)
    {
        var review = await dbContext.Reviews.FirstOrDefaultAsync(x => x.CustomerId == customerId && x.AppointmentId == appointmentId);
        if (review != null)
        {
            return review;
        }

        review = new Review
        {
            CustomerId = customerId,
            AppointmentId = appointmentId,
            Rating = rating,
            Comment = comment,
            IsApproved = isApproved,
            CreatedAt = createdAt
        };

        dbContext.Reviews.Add(review);
        await dbContext.SaveChangesAsync();
        return review;
    }

    private static async Task<PartRequest> EnsurePartRequestAsync(AppDbContext dbContext, int customerId, string partName, int requestedQuantity, string? notes, PartRequestStatus status, DateTime requestedAt)
    {
        var partRequest = await dbContext.PartRequests.FirstOrDefaultAsync(x => x.CustomerId == customerId && x.PartName == partName);
        if (partRequest != null)
        {
            return partRequest;
        }

        partRequest = new PartRequest
        {
            CustomerId = customerId,
            PartName = partName,
            RequestedQuantity = requestedQuantity,
            Notes = notes,
            Status = status,
            RequestedAt = requestedAt
        };

        dbContext.PartRequests.Add(partRequest);
        await dbContext.SaveChangesAsync();
        return partRequest;
    }
}
