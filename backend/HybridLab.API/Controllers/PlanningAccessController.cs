using HybridLab.Application.DTOs.Planning;
using HybridLab.Application.Interfaces;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class PlanningAccessController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPlanningAccessService _planningAccessService;

        public PlanningAccessController(AppDbContext context, IPlanningAccessService planningAccessService)
        {
            _context = context;
            _planningAccessService = planningAccessService;
        }

        [Authorize(Roles = "Student")]
        [HttpGet("{modality}")]
        public async Task<ActionResult<PlanningAccessResponseDto>> GetStudentAccess(TrainingModality modality)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students.FirstOrDefaultAsync(s => s.UserId == userId);

            if(student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var canManagePlanning = await _planningAccessService.StudentCanManagePlanningAsync(student.Id, modality);

            var response = new PlanningAccessResponseDto
            {
                CanManagePlanning = canManagePlanning,
                Modality = modality
            };

            return Ok(response);
        }
    }
}
