using HybridLab.Application.DTOs.BodyWeight;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Student")]
    public class BodyWeightController : ControllerBase
    {
        private readonly AppDbContext _context;

        public BodyWeightController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<ActionResult<BodyWeightEntryResponseDto>> Create(CreateBodyWeightEntryDto dto)
        {
            var student = await GetCurrentStudentAsync();

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            if (dto.RecordedAt == default)
            {
                return BadRequest("Informe a data da pesagem.");
            }

            if (dto.RecordedAt > DateTime.UtcNow)
            {
                return BadRequest(
                    "A data da pesagem não pode estar no futuro."
                );
            }

            var entry = new BodyWeightEntry
            {
                StudentId = student.Id,
                WeightKg = dto.WeightKg,
                RecordedAt = dto.RecordedAt,
                CreatedAt = DateTime.UtcNow
            };

            _context.BodyWeightEntries.Add(entry);
            await _context.SaveChangesAsync();

            return StatusCode(
                StatusCodes.Status201Created,
                ToResponse(entry)
            );
        }

        [HttpGet]
        public async Task<ActionResult<List<BodyWeightEntryResponseDto>>> GetAll()
        {
            var student = await GetCurrentStudentAsync();

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var entries = await _context.BodyWeightEntries
                .Where(entry =>
                    entry.StudentId == student.Id
                )
                .OrderByDescending(entry =>
                    entry.RecordedAt
                )
                .Select(entry =>
                    new BodyWeightEntryResponseDto
                    {
                        Id = entry.Id,
                        WeightKg = entry.WeightKg,
                        RecordedAt = entry.RecordedAt,
                        CreatedAt = entry.CreatedAt
                    }
                )
                .ToListAsync();

            return Ok(entries);
        }

        [HttpPut("{id:int}")]
        public async Task<ActionResult<BodyWeightEntryResponseDto>> Update(int id, UpdateBodyWeightEntryDto dto)
        {
            var student = await GetCurrentStudentAsync();

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            if (dto.RecordedAt == default)
            {
                return BadRequest("Informe a data da pesagem.");
            }

            if (dto.RecordedAt > DateTime.UtcNow)
            {
                return BadRequest(
                    "A data da pesagem não pode estar no futuro."
                );
            }

            var entry = await _context.BodyWeightEntries
                .FirstOrDefaultAsync(entry =>
                    entry.Id == id &&
                    entry.StudentId == student.Id
                );

            if (entry == null)
            {
                return NotFound(
                    "Registro de peso não encontrado."
                );
            }

            entry.WeightKg = dto.WeightKg;
            entry.RecordedAt = dto.RecordedAt;

            await _context.SaveChangesAsync();

            return Ok(ToResponse(entry));
        }

        [HttpDelete("{id:int}")]
        public async Task<ActionResult> Delete(int id)
        {
            var student = await GetCurrentStudentAsync();

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var entry = await _context.BodyWeightEntries
                .FirstOrDefaultAsync(entry =>
                    entry.Id == id &&
                    entry.StudentId == student.Id
                );

            if (entry == null)
            {
                return NotFound(
                    "Registro de peso não encontrado."
                );
            }

            _context.BodyWeightEntries.Remove(entry);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private async Task<StudentProfile?> GetCurrentStudentAsync()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return null;
            }

            return await _context.Students
                .FirstOrDefaultAsync(student =>
                    student.UserId == userId
                );
        }

        private static BodyWeightEntryResponseDto ToResponse(BodyWeightEntry entry)
        {
            return new BodyWeightEntryResponseDto
            {
                Id = entry.Id,
                WeightKg = entry.WeightKg,
                RecordedAt = entry.RecordedAt,
                CreatedAt = entry.CreatedAt
            };
        }
    }
}