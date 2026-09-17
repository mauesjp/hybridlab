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
using System.Reflection.Metadata.Ecma335;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CoachLinksController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public CoachLinksController(AppDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        [Authorize(Roles = "Student")]
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
                    link.Modality == dto.Modality &&
                    (link.Status == LinkStatus.Pending || link.Status == LinkStatus.Accepted)
                );

            if (existingLink != null)
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

        [Authorize(Roles = "Coach")]
        [HttpGet("pending")]
        public async Task<ActionResult> GetPendingRequests()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);

            if (coach == null)
            {
                return BadRequest("Perfil de professor não encontrado.");
            }

            var requests = await _context.CoachStudentLinks
                .Where(link =>
                    link.CoachId == coach.Id &&
                    link.Status == LinkStatus.Pending)
                .ToListAsync();

            return Ok(requests);
        }

        [Authorize(Roles = "Coach")]
        [HttpPut("{id}/respond")]
        public async Task<ActionResult> RespondToRequest(int id, RespondCoachLinkRequestDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);

            if (coach == null)
            {
                return BadRequest("Perfil de professor não encontrado.");
            }

            var link = await _context.CoachStudentLinks.FirstOrDefaultAsync(link => link.Id == id && link.CoachId == coach.Id);

            if (link == null)
            {
                return NotFound("Solicitação não encontrada.");
            }

            if (link.Status != LinkStatus.Pending)
            {
                return BadRequest("Esta solicitação já foi respondida.");
            }

            if (dto.Accept)
            {
                var alreadyHasCoach = await _context.CoachStudentLinks
                    .AnyAsync(existing =>
                    existing.Id != link.Id &&
                    existing.StudentId == link.StudentId &&
                    existing.Modality == link.Modality &&
                    existing.Status == LinkStatus.Accepted);

                if (alreadyHasCoach)
                {
                    return BadRequest("O aluno já possui um professor ativo nesta modalidade.");
                }
            }

            link.Status = dto.Accept ? LinkStatus.Accepted : LinkStatus.Rejected;

            link.RespondedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok();
        }

        [Authorize]
        [HttpPut("{id}/unlink")]
        public async Task<ActionResult> Unlink(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var link = await _context.CoachStudentLinks.FirstOrDefaultAsync(link => link.Id == id);

            if (link == null)
            {
                return NotFound("Vínculo não encontrado.");
            }

            if(link.Status != LinkStatus.Accepted)
            {
                return BadRequest("Este vínculo não está ativo.");
            }

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);
            var coach = await _context.Coaches.FirstOrDefaultAsync(c => c.UserId == userId);

            var isStudent = student != null && student.Id == link.StudentId;
            var isCoach = coach != null && coach.Id == link.CoachId;

            if(!isStudent && !isCoach)
            {
                return Forbid();
            }

            link.Status = LinkStatus.Unlinked;
            link.UnlinkedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok();
        }
    }
}
