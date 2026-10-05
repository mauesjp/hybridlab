using System.Security.Claims;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.API.Controllers;

// Apenas consultas: o usuário e o escopo são sempre resolvidos pelo token.
[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class DashboardController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken cancellationToken,
        [FromQuery] DateTimeOffset? dayStart = null, [FromQuery] DateTimeOffset? dayEnd = null)
    {
        if (dayStart.HasValue != dayEnd.HasValue ||
            (dayStart.HasValue && (dayEnd <= dayStart || dayEnd - dayStart > TimeSpan.FromHours(26))))
            return BadRequest("Informe um intervalo válido para o dia local.");
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var student = await context.Students.AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);
        if (student == null) return BadRequest("Perfil não encontrado.");
        var studentId = student.Id;

        var plans = await context.StrengthPlans.AsNoTracking()
            .Where(x => x.StudentId == studentId)
            .OrderByDescending(x => x.IsActive).ThenByDescending(x => x.CreatedAt)
            .Select(x => new {
                x.Id, x.StudentId, x.Name, x.IsActive, x.CreatedAt,
                x.VersionNumber, x.PreviousVersionId, x.IsPublished, x.PublishedAt
            }).ToListAsync(cancellationToken);

        var sessionsQuery = context.WorkoutSessions.AsNoTracking()
            .Where(x => x.StudentId == studentId);
        var completedSessions = await sessionsQuery.CountAsync(
            x => x.Status == WorkoutSessionStatus.Completed,
            cancellationToken
        );

        var partialSessions = await sessionsQuery.CountAsync(
            x => x.Status == WorkoutSessionStatus.Partial,
            cancellationToken
        );

        var finishedSessions = await sessionsQuery.CountAsync(
            x => x.IsCompleted,
            cancellationToken
        );

        var sessionDetails = (
            from session in sessionsQuery
            join day in context.StrengthWorkoutDays on session.StrengthWorkoutDayId equals day.Id
            orderby session.StartedAt descending
            select new {
                session.Id,
                session.StrengthPlanId,
                session.StrengthWorkoutDayId,
                DayName = day.Name,
                session.StartedAt,
                session.FinishedAt,
                session.IsCompleted,
                session.Status
            });
        var recentSessions = await sessionDetails.Take(20).ToListAsync(cancellationToken);
        // The daily check must not depend on the 20-record history window.
        var todaySessions = dayStart.HasValue && dayEnd.HasValue
            ? await sessionDetails.Where(x => x.StartedAt >= dayStart.Value.UtcDateTime &&
                x.StartedAt < dayEnd.Value.UtcDateTime).ToListAsync(cancellationToken)
            : null;

        return Ok(new {
            Profile = new {
                Id = studentId,
                DisplayName = student.DisplayName,
                Role = "Student"
            },
            Plans = plans,
            RecentSessions = recentSessions,
            TodaySessions = todaySessions,
            FinishedSessions = finishedSessions,
            CompletedSessions = completedSessions,
            PartialSessions = partialSessions
        });
    }
}
