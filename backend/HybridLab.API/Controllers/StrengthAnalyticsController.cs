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

        var setsLast30Days =
            rowsLast30Days.Count;

        var volumeLast30Days =
            rowsLast30Days.Sum(
                row =>
                    (row.Weight ?? 0m) *
                    row.Reps
            );

        var exercises = rows
            .Where(row =>
                !string.IsNullOrWhiteSpace(
                    row.ExerciseName
                )
            )
            .GroupBy(
                row => row.ExerciseName.Trim(),
                StringComparer.OrdinalIgnoreCase
            )
            .Select(group =>
            {
                var weightedSets = group
                    .Where(row =>
                        row.Weight.HasValue &&
                        row.Weight.Value > 0
                    )
                    .ToList();

                var maxWeightSet = weightedSets
                    .OrderByDescending(row =>
                        row.Weight
                    )
                    .ThenByDescending(row =>
                        row.Reps
                    )
                    .FirstOrDefault();

                var bestRepsSet = group
                    .OrderByDescending(row =>
                        row.Reps
                    )
                    .ThenByDescending(row =>
                        row.Weight ?? 0m
                    )
                    .First();

                var exerciseVolumeLast30Days =
                    group
                        .Where(row =>
                            row.StartedAt >=
                            last30Days
                        )
                        .Sum(row =>
                            (row.Weight ?? 0m) *
                            row.Reps
                        );

                var estimatedOneRepMax =
                    weightedSets
                        .Where(row =>
                            row.Reps > 0 &&
                            row.Reps <= 12
                        )
                        .Select(row =>
                            row.Weight!.Value *
                            (
                                1m +
                                row.Reps / 30m
                            )
                        )
                        .DefaultIfEmpty(0m)
                        .Max();

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

                    MaxWeight =
                        maxWeightSet?.Weight,

                    MaxWeightReps =
                        maxWeightSet?.Reps,

                    BestReps =
                        bestRepsSet.Reps,

                    BestRepsWeight =
                        bestRepsSet.Weight,

                    VolumeLast30Days =
                        exerciseVolumeLast30Days,

                    EstimatedOneRepMax =
                        estimatedOneRepMax > 0
                            ? Math.Round(
                                estimatedOneRepMax,
                                1
                            )
                            : (decimal?)null,

                    History = history
                };
            })
            .OrderBy(exercise =>
                exercise.Name
            )
            .ToList();

        return Ok(new
        {
            WorkoutsLast30Days =
                workoutsLast30Days,

            WorkoutsLast7Days =
                workoutsLast7Days,

            SetsLast30Days =
                setsLast30Days,

            VolumeLast30Days =
                volumeLast30Days,

            Exercises =
                exercises
        });
    }
}