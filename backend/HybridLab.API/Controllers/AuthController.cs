using HybridLab.Application.DTOs;
using HybridLab.Application.Interfaces;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Identity;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly ITokenService _tokenService;
        private readonly AppDbContext _context;

        public AuthController(UserManager<ApplicationUser> userManager, ITokenService tokenService, AppDbContext context)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _context = context;
        }

        [HttpPost("login")]
        public async Task<ActionResult<LoginResponseDto>> Login(LoginRequestDto dto)
        {
            ApplicationUser? user;
            if (dto.Login.Contains('@'))
            {
                user = await _userManager.FindByEmailAsync(dto.Login);
            }
            else
            {
                user = await _userManager.FindByNameAsync(dto.Login);
            }

            if (user == null)
            {
                return Unauthorized();
            }

            var passwordIsValid = await _userManager.CheckPasswordAsync(user, dto.Password);

            if (!passwordIsValid)
            {
                return Unauthorized();
            }

            var roles = await _userManager.GetRolesAsync(user);
            var userRole = roles.FirstOrDefault() ?? string.Empty;

            var accessToken = _tokenService
                .GenerateAccessToken
                (user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                roles);

            var refreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var refreshToken = new RefreshToken
            {
                Token = refreshTokenValue,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(refreshToken);
            await _context.SaveChangesAsync();

            var loginResponse = new LoginResponseDto
            {
                Email = user.Email ?? string.Empty,
                Role = userRole,
                UserId = user.Id,
                UserName = user.UserName ?? string.Empty,
                AccessToken = accessToken,
                RefreshToken = refreshTokenValue
            };

            return Ok(loginResponse);
        }

        [HttpPost("refresh")]
        public async Task<ActionResult> Refresh(RefreshTokenRequestDto dto)
        {
            var refreshToken = await _context.RefreshTokens.FirstOrDefaultAsync(rt => rt.Token == dto.RefreshToken);

            if (refreshToken == null || !refreshToken.IsActive)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(refreshToken.UserId);

            if (user == null)
            {
                return Unauthorized();
            }

            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _tokenService
                .GenerateAccessToken
                (user.Id,
                user.UserName ?? string.Empty,
                user.Email ?? string.Empty,
                roles);

            refreshToken.RevokedAt = DateTime.UtcNow;

            var newRefreshTokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));

            var newRefreshToken = new RefreshToken
            {
                Token = newRefreshTokenValue,
                UserId = user.Id,
                CreatedAt = DateTime.UtcNow,
                ExpiresAt = DateTime.UtcNow.AddDays(7)
            };

            _context.RefreshTokens.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                AccessToken = accessToken,
                RefreshToken = newRefreshTokenValue
            });
        }

        [Authorize]
        [HttpGet("me")]
        public IActionResult Me()
        {
            return Ok("Authenticated");
        }
    }
}
