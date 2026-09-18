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
[Authorize(Roles = "Student,Coach")]
public class DashboardController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrWhiteSpace(userId)) return Unauthorized();

        var student = User.IsInRole("Student")
            ? await context.Students.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            : null;
        var coach = User.IsInRole("Coach")
            ? await context.Coaches.AsNoTracking().FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken)
            : null;
        if (student == null && coach == null) return BadRequest("Perfil não encontrado.");

        var studentId = student?.Id ?? 0;
        var coachId = coach?.Id ?? 0;
        var isStudent = student != null;
        var linksQuery = context.CoachStudentLinks.AsNoTracking()
            .Where(x => isStudent ? x.StudentId == studentId : x.CoachId == coachId);

        var links = await (
            from link in linksQuery
            join s in context.Students on link.StudentId equals s.Id
            join c in context.Coaches on link.CoachId equals c.Id
            orderby link.RequestedAt descending
            select new {
                link.Id, link.StudentId, StudentName = s.DisplayName,
                link.CoachId, CoachName = c.DisplayName, link.Modality,
                link.Status, link.RequestedAt, link.RespondedAt, link.UnlinkedAt
            }).ToListAsync(cancellationToken);

        // Mesma regra de leitura dos planos: dono ou professor ativo em musculação.
        var allowedStudents = linksQuery
            .Where(x => x.Status == LinkStatus.Accepted && x.Modality == TrainingModality.Strength)
            .Select(x => x.StudentId);
        var plans = await context.StrengthPlans.AsNoTracking()
            .Where(x => isStudent ? x.StudentId == studentId : allowedStudents.Contains(x.StudentId))
            .OrderByDescending(x => x.IsActive).ThenByDescending(x => x.CreatedAt)
            .Select(x => new {
                x.Id, x.StudentId, x.Name, x.IsActive, x.CreatedAt,
                x.VersionNumber, x.PreviousVersionId, x.IsPublished, x.PublishedAt
            }).ToListAsync(cancellationToken);

        // O professor não recebe execuções: hoje esse acesso pertence apenas ao aluno.
        var sessionsQuery = context.WorkoutSessions.AsNoTracking()
            .Where(x => isStudent && x.StudentId == studentId);
        var completedSessions = await sessionsQuery.CountAsync(x => x.IsCompleted, cancellationToken);
        var recentSessions = await (
            from session in sessionsQuery
            join day in context.StrengthWorkoutDays on session.StrengthWorkoutDayId equals day.Id
            orderby session.StartedAt descending
            select new {
                session.Id, session.StrengthPlanId, session.StrengthWorkoutDayId,
                DayName = day.Name, session.StartedAt, session.FinishedAt, session.IsCompleted
            }).Take(20).ToListAsync(cancellationToken);

        return Ok(new {
            Profile = new {
                Id = isStudent ? studentId : coachId,
                DisplayName = student?.DisplayName ?? coach!.DisplayName,
                Role = isStudent ? "Student" : "Coach",
                CoachCode = coach?.CoachCode,
                CanCoachStrength = coach?.CanCoachStrength ?? false,
                CanCoachRunning = coach?.CanCoachRunning ?? false
            },
            Links = links, Plans = plans, RecentSessions = recentSessions, CompletedSessions = completedSessions
        });
    }
}
