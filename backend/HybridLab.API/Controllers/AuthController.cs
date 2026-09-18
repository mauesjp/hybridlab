using HybridLab.Application.DTOs;
using HybridLab.Application.DTOs.Auth;
using HybridLab.Application.Interfaces;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Identity;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
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
        private readonly ICoachCodeGenerator _coachCodeGenerator;

        public AuthController(UserManager<ApplicationUser> userManager, ITokenService tokenService, AppDbContext context, ICoachCodeGenerator coachCodeGenerator)
        {
            _userManager = userManager;
            _tokenService = tokenService;
            _context = context;
            _coachCodeGenerator = coachCodeGenerator;
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

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<ActionResult> Register(RegisterDto dto)
        {
            var accountType = dto.AccountType.Trim();

            if (accountType != "Student" && accountType != "Coach")
            {
                return BadRequest("O tipo de conta deve ser Student ou Coach.");
            }

            if (accountType == "Student" && dto.BirthDate == null)
            {
                return BadRequest("A data de nascimento é obrigatória para alunos.");
            }

            if (accountType == "Coach" &&
                !dto.CanCoachStrength &&
                !dto.CanCoachRunning)
            {
                return BadRequest(
                    "O treinador deve atuar em pelo menos uma modalidade."
                );
            }

            var existingUsername = await _userManager
                .FindByNameAsync(dto.Username);

            if (existingUsername != null)
            {
                return Conflict("Este nome de usuário já está em uso.");
            }

            var existingEmail = await _userManager
                .FindByEmailAsync(dto.Email);

            if (existingEmail != null)
            {
                return Conflict("Este e-mail já está cadastrado.");
            }

            var user = new ApplicationUser
            {
                UserName = dto.Username.Trim(),
                Email = dto.Email.Trim()
            };

            var result = await _userManager.CreateAsync(
                user,
                dto.Password
            );

            if (!result.Succeeded)
            {
                var errors = result.Errors
                    .Select(error => error.Description)
                    .ToList();

                return BadRequest(new
                {
                    Message = "Não foi possível criar a conta.",
                    Errors = errors
                });
            }

            var roleResult = await _userManager
                .AddToRoleAsync(user, accountType);

            if (!roleResult.Succeeded)
            {
                await _userManager.DeleteAsync(user);

                return BadRequest(
                    "Não foi possível definir o tipo da conta."
                );
            }

            if (accountType == "Student")
            {
                var student = new StudentProfile
                {
                    UserId = user.Id,
                    DisplayName = dto.DisplayName.Trim(),
                    BirthDate = dto.BirthDate!.Value,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Students.Add(student);
            }

            if (accountType == "Coach")
            {
                var coach = new CoachProfile
                {
                    UserId = user.Id,
                    DisplayName = dto.DisplayName.Trim(),
                    CoachCode = await _coachCodeGenerator.GenerateAsync(),
                    CanCoachStrength = dto.CanCoachStrength,
                    CanCoachRunning = dto.CanCoachRunning,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Coaches.Add(coach);
            }

            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                await _userManager.DeleteAsync(user);

                return StatusCode(
                    StatusCodes.Status500InternalServerError,
                    "Não foi possível concluir a criação da conta."
                );
            }

            return StatusCode(
                StatusCodes.Status201Created,
                new
                {
                    Message = "Conta criada com sucesso.",
                    AccountType = accountType
                }
            );
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<ActionResult> Me()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);

            if (user == null)
            {
                return Unauthorized();
            }

            var roles = await _userManager.GetRolesAsync(user);
            var role = roles.FirstOrDefault() ?? string.Empty;

            string displayName = user.UserName ?? string.Empty;

            if (role == "Student")
            {
                var student = await _context.Students
                    .FirstOrDefaultAsync(student => student.UserId == user.Id);

                if (student != null)
                {
                    displayName = student.DisplayName;
                }
            }

            if (role == "Coach")
            {
                var coach = await _context.Coaches
                    .FirstOrDefaultAsync(coach => coach.UserId == user.Id);

                if (coach != null)
                {
                    displayName = coach.DisplayName;
                }
            }

            return Ok(new
            {
                userId = user.Id,
                username = user.UserName,
                email = user.Email,
                displayName,
                role
            });
        }
        
    }
}
