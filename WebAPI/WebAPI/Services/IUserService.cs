﻿using System.Collections.Generic;
using WebAPI.DTOs;
using WebAPI.Models;

namespace WebAPI.Services
{
    public interface IUserService
    {
        User? GetById(int id);
        User? GetByEmail(string email);
        IEnumerable<User> GetAll();
        bool Exists(int userId);

        User Register(RegisterRequestDTO dto);
        User? Authenticate(string email, string password);

        void Update(int id, UpdateUserDTO dto, int currentUserId);
        void Update(User user);
        void Delete(int id, int currentUserId);
        User RegisterAdmin(RegisterRequestDTO dto);
        
        string SendPasswordResetOtp(string email);
        string VerifyOtp(string email, string otpCode);
        string ResetPassword(string email, string resetToken, string newPassword);
        string ChangePassword(int userId, string currentPassword, string newPassword);
        
        // Moderator methods
        IEnumerable<UserStatsDTO> GetUsersWithStats(int page, int limit);
        UserStatsDTO? GetUserStats(int userId);
        
        // User profile methods
        UserProfileStatsDTO? GetUserProfileStats(int userId);
    }
}
