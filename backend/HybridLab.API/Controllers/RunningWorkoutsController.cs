using System.Security.Claims;
using HybridLab.Application.DTOs.Running;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class RunningWorkoutsController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RunningWorkoutResponseDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var workouts = await context.RunningWorkouts
            .AsNoTracking()
            .Include(x => x.Blocks)
            .Where(x => x.StudentId == student.Id)
            .OrderBy(x => x.ScheduledDate)
            .ToListAsync(cancellationToken);

        return Ok(
            workouts.Select(MapWorkout)
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RunningWorkoutResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var workout = await context.RunningWorkouts
            .AsNoTracking()
            .Include(x => x.Blocks)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (workout is null)
            return NotFound();

        return Ok(
            MapWorkout(workout)
        );
    }

    [HttpPost]
    public async Task<ActionResult<RunningWorkoutResponseDto>> Create(CreateRunningWorkoutDto dto, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var blockValidation = ValidateBlocks(dto.Blocks);

        if (blockValidation is not null)
            return BadRequest(blockValidation);

        var workout = new RunningWorkout
        {
            StudentId = student.Id,
            Name = dto.Name.Trim(),
            ScheduledDate = dto.ScheduledDate.Date,
            Notes = NormalizeText(dto.Notes),
            CreatedAt = DateTime.UtcNow
        };

        for (var index = 0; index < dto.Blocks.Count; index++)
        {
            workout.Blocks.Add(
                CreateBlock(
                    dto.Blocks[index],
                    index + 1
                )
            );
        }

        context.RunningWorkouts.Add(workout);

        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = workout.Id },
            MapWorkout(workout)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RunningWorkoutResponseDto>> Update(int id, UpdateRunningWorkoutDto dto, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var blockValidation = ValidateBlocks(dto.Blocks);

        if (blockValidation is not null)
            return BadRequest(blockValidation);

        var workout = await context.RunningWorkouts
            .Include(x => x.Blocks)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (workout is null)
            return NotFound();

        workout.Name = dto.Name.Trim();
        workout.ScheduledDate = dto.ScheduledDate.Date;
        workout.Notes = NormalizeText(dto.Notes);

        context.RunningWorkoutBlocks.RemoveRange(
            workout.Blocks
        );

        workout.Blocks.Clear();

        for (var index = 0; index < dto.Blocks.Count; index++)
        {
            workout.Blocks.Add(
                CreateBlock(
                    dto.Blocks[index],
                    index + 1
                )
            );
        }

        await context.SaveChangesAsync(cancellationToken);

        return Ok(
            MapWorkout(workout)
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var workout = await context.RunningWorkouts
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (workout is null)
            return NotFound();

        context.RunningWorkouts.Remove(workout);

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<StudentProfile?> GetCurrentStudent(CancellationToken cancellationToken)
    {
        var userId =
            User.FindFirstValue(ClaimTypes.NameIdentifier) ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await context.Students
            .FirstOrDefaultAsync(
                student => student.UserId == userId,
                cancellationToken
            );
    }

    private static RunningWorkoutBlock CreateBlock(RunningWorkoutBlockInputDto dto, int sequence)
    {
        return new RunningWorkoutBlock
        {
            Type = dto.Type,
            Sequence = sequence,
            DistanceKm = dto.DistanceKm,
            DurationSeconds = dto.DurationSeconds,
            TargetPaceSecondsPerKm = dto.TargetPaceSecondsPerKm,
            Repetitions = dto.Repetitions,
            Notes = NormalizeText(dto.Notes)
        };
    }

    private static string? ValidateBlocks(IEnumerable<RunningWorkoutBlockInputDto> blocks)
    {
        foreach (var block in blocks)
        {
            if (
                block.DistanceKm is null &&
                block.DurationSeconds is null
            )
            {
                return
                    "Cada bloco precisa possuir uma distância ou uma duração.";
            }
        }

        return null;
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }

    private static RunningWorkoutResponseDto MapWorkout(RunningWorkout workout)
    {
        return new RunningWorkoutResponseDto
        {
            Id = workout.Id,
            Name = workout.Name,
            ScheduledDate = workout.ScheduledDate,
            Notes = workout.Notes,
            CreatedAt = workout.CreatedAt,

            Blocks = workout.Blocks
                .OrderBy(x => x.Sequence)
                .Select(x => new RunningWorkoutBlockResponseDto
                {
                    Id = x.Id,
                    Type = x.Type,
                    Sequence = x.Sequence,
                    DistanceKm = x.DistanceKm,
                    DurationSeconds = x.DurationSeconds,
                    TargetPaceSecondsPerKm = x.TargetPaceSecondsPerKm,
                    Repetitions = x.Repetitions,
                    Notes = x.Notes
                })
                .ToList()
        };
    }
}