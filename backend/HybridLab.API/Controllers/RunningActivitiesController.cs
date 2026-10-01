using System.Security.Claims;
using HybridLab.Application.DTOs.Running;
using HybridLab.Domain.Entities;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class RunningActivitiesController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RunningActivityResponseDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var activities = await context.RunningActivities
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id)
            .OrderByDescending(x => x.ActivityDate)
            .ThenByDescending(x => x.Id)
            .ToListAsync(cancellationToken);

        return Ok(
            activities.Select(MapActivity)
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RunningActivityResponseDto>> GetById(
        int id,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var activity = await context.RunningActivities
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (activity is null)
            return NotFound();

        return Ok(
            MapActivity(activity)
        );
    }

    [HttpPost]
    public async Task<ActionResult<RunningActivityResponseDto>> Create(
        CreateRunningActivityDto dto,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        if (dto.ActivityDate.Date > DateTime.UtcNow.Date)
        {
            return BadRequest(
                "A data da corrida não pode estar no futuro."
            );
        }

        var activity = new RunningActivity
        {
            StudentId = student.Id,
            ActivityDate = dto.ActivityDate.Date,
            DistanceKm = dto.DistanceKm,
            DurationSeconds = dto.DurationSeconds,
            AverageHeartRate = dto.AverageHeartRate,
            Rpe = dto.Rpe,
            Notes = NormalizeText(dto.Notes),
            Source = RunningActivitySource.Manual,
            CreatedAt = DateTime.UtcNow
        };

        context.RunningActivities.Add(activity);

        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = activity.Id },
            MapActivity(activity)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RunningActivityResponseDto>> Update(
        int id,
        UpdateRunningActivityDto dto,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        if (dto.ActivityDate.Date > DateTime.UtcNow.Date)
        {
            return BadRequest(
                "A data da corrida não pode estar no futuro."
            );
        }

        var activity = await context.RunningActivities
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (activity is null)
            return NotFound();

        if (activity.Source != RunningActivitySource.Manual)
        {
            return BadRequest(
                "Apenas atividades registradas manualmente podem ser editadas."
            );
        }

        activity.ActivityDate = dto.ActivityDate.Date;
        activity.DistanceKm = dto.DistanceKm;
        activity.DurationSeconds = dto.DurationSeconds;
        activity.AverageHeartRate = dto.AverageHeartRate;
        activity.Rpe = dto.Rpe;
        activity.Notes = NormalizeText(dto.Notes);

        await context.SaveChangesAsync(cancellationToken);

        return Ok(
            MapActivity(activity)
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var activity = await context.RunningActivities
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (activity is null)
            return NotFound();

        if (activity.Source != RunningActivitySource.Manual)
        {
            return BadRequest(
                "Apenas atividades registradas manualmente podem ser excluídas."
            );
        }

        context.RunningActivities.Remove(activity);

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<StudentProfile?> GetCurrentStudent(
        CancellationToken cancellationToken)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await context.Students
            .FirstOrDefaultAsync(
                student =>
                    student.UserId == userId,
                cancellationToken
            );
    }

    private static RunningActivityResponseDto MapActivity(
        RunningActivity activity)
    {
        var pace =
            activity.DistanceKm > 0
                ? (int)Math.Round(
                    activity.DurationSeconds /
                    activity.DistanceKm
                )
                : 0;

        return new RunningActivityResponseDto
        {
            Id = activity.Id,
            ActivityDate = activity.ActivityDate,
            DistanceKm = activity.DistanceKm,
            DurationSeconds = activity.DurationSeconds,
            AveragePaceSecondsPerKm = pace,
            AverageHeartRate = activity.AverageHeartRate,
            Rpe = activity.Rpe,
            Notes = activity.Notes,
            Source = activity.Source,
            CreatedAt = activity.CreatedAt
        };
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}