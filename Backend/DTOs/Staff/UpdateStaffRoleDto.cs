using Backend.Enums;

namespace Backend.DTOs.Staff;

public class UpdateStaffRoleDto
{
    public UserRole Role { get; set; } = UserRole.Staff;
}
