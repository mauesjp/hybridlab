using System.Security.Claims;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class StrengthAnalyticsController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult> Get(CancellationToken cancellationToken)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
            return Unauthorized();

        var student = await context.Students
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken
            );

        if (student == null)
            return BadRequest("Perfil não encontrado.");

        var now = DateTime.UtcNow;
        var last30Days = now.AddDays(-30);
        var last7Days = now.AddDays(-7);

        var sessions = context.WorkoutSessions
            .AsNoTracking()
            .Where(session =>
                session.StudentId == student.Id &&
                session.IsCompleted
            );

        var workoutsLast30Days =
            await sessions.CountAsync(
                session => session.StartedAt >= last30Days,
                cancellationToken
            );

        var workoutsLast7Days =
            await sessions.CountAsync(
                session => session.StartedAt >= last7Days,
                cancellationToken
            );

        var rows = await (
            from set in context.WorkoutSets.AsNoTracking()

            join exercise in context.WorkoutExercises.AsNoTracking()
                on set.WorkoutExerciseId equals exercise.Id

            join session in context.WorkoutSessions.AsNoTracking()
                on exercise.WorkoutSessionId equals session.Id

            where
                session.StudentId == student.Id &&
                session.IsCompleted

            select new
            {
                SessionId = session.Id,
                session.StartedAt,
                exercise.ExerciseName,
                set.SetNumber,
                set.Weight,
                set.Reps
            }
        ).ToListAsync(cancellationToken);

        var rowsLast30Days = rows
            .Where(row => row.StartedAt >= last30Days)
            .ToList();

        var setsLast30Days = rowsLast30Days.Count;

        var volumeLast30Days = rowsLast30Days.Sum(
            row => (row.Weight ?? 0m) * row.Reps
        );

        var exercises = rows
            .Where(row =>
                !string.IsNullOrWhiteSpace(row.ExerciseName)
            )
            .GroupBy(
                row => row.ExerciseName.Trim(),
                StringComparer.OrdinalIgnoreCase
            )
            .Select(group =>
            {
                var weights = group
                    .Where(row => row.Weight.HasValue)
                    .Select(row => row.Weight!.Value)
                    .ToList();

                decimal? maxWeight =
                    weights.Count > 0
                        ? weights.Max()
                        : null;

                var history = group
                    .GroupBy(row => new
                    {
                        row.SessionId,
                        row.StartedAt
                    })
                    .Select(sessionGroup =>
                        sessionGroup
                            .OrderByDescending(row =>
                                row.Weight ?? 0m
                            )
                            .ThenByDescending(row =>
                                row.Reps
                            )
                            .ThenBy(row =>
                                row.SetNumber
                            )
                            .First()
                    )
                    .OrderByDescending(row =>
                        row.StartedAt
                    )
                    .Take(12)
                    .OrderBy(row =>
                        row.StartedAt
                    )
                    .Select(row => new
                    {
                        row.SessionId,
                        row.StartedAt,
                        row.Weight,
                        row.Reps
                    })
                    .ToList();

                return new
                {
                    Name = group.Key,
                    MaxWeight = maxWeight,
                    History = history
                };
            })
            .OrderBy(exercise => exercise.Name)
            .ToList();

        return Ok(new
        {
            WorkoutsLast30Days = workoutsLast30Days,
            WorkoutsLast7Days = workoutsLast7Days,
            SetsLast30Days = setsLast30Days,
            VolumeLast30Days = volumeLast30Days,
            Exercises = exercises
        });
    }
}