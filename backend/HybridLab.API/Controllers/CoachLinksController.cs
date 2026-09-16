using HybridLab.Application.DTOs.CoachLinks;
using HybridLab.Infrastructure.Identity;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using HybridLab.Domain.Enums;
using HybridLab.Domain.Entities;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Student")]
    public class CoachLinksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public CoachLinksController(AppDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [HttpPost("request")]
        public async Task<ActionResult<CoachLinkResponseDto>> RequestLink(CreateCoachLinkRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado");
            }

            var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.CoachCode == dto.CoachCode);

            if (coach == null)
            {
                return NotFound("Perfil de professor não encontrado");
            }

            if (dto.Modality == TrainingModality.Strength && !coach.CanCoachStrength)
            {
                return BadRequest("Este professor não atende musculação");
            }

            if (dto.Modality == TrainingModality.Running && !coach.CanCoachRunning)
            {
                return BadRequest("Este professor não atende corrida");
            }

            var existingLink = await _context.CoachStudentLinks
                .FirstOrDefaultAsync(link =>
                    link.StudentId == student.Id &&
                    link.CoachId == coach.Id &&
                    link.Modality == dto.Modality &&
                    (link.Status == LinkStatus.Pending || link.Status == LinkStatus.Accepted)
                );

            if(existingLink != null)
            {
                return BadRequest("Já existe uma solicitação ou vínculo ativo para esta modalidade");
            }

            var coachStudentLink = new CoachStudentLink
            {
                StudentId = student.Id,
                CoachId = coach.Id,
                Modality = dto.Modality,
                Status = LinkStatus.Pending,
                RequestedAt = DateTime.UtcNow
            };

            _context.CoachStudentLinks.Add(coachStudentLink);
            await _context.SaveChangesAsync();

            var response = new CoachLinkResponseDto
            {
                Status = coachStudentLink.Status,
                CoachId = coachStudentLink.CoachId,
                CoachName = coach.DisplayName,
                Modality = coachStudentLink.Modality,
                Id = coachStudentLink.Id,
                RequestedAt = coachStudentLink.RequestedAt
            };

            return Ok(response);
        }
    }
}
