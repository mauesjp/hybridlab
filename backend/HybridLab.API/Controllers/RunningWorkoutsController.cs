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
            .OrderBy(x => x.Name)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(
            workouts.Select(MapWorkout)
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RunningWorkoutResponseDto>> GetById(
        int id,
        CancellationToken cancellationToken)
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
    public async Task<ActionResult<RunningWorkoutResponseDto>> Create(
        CreateRunningWorkoutDto dto,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError = ValidateBlocks(dto.Blocks);

        if (validationError is not null)
            return BadRequest(validationError);

        var workout = new RunningWorkout
        {
            StudentId = student.Id,
            Name = dto.Name.Trim(),
            Notes = NormalizeText(dto.Notes),
            CreatedAt = DateTime.UtcNow,
            Blocks = dto.Blocks
                .Select(
                    (block, index) =>
                        CreateBlock(
                            block,
                            index
                        )
                )
                .ToList()
        };

        context.RunningWorkouts.Add(workout);

        await context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetById),
            new { id = workout.Id },
            MapWorkout(workout)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RunningWorkoutResponseDto>> Update(
        int id,
        UpdateRunningWorkoutDto dto,
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError = ValidateBlocks(dto.Blocks);

        if (validationError is not null)
            return BadRequest(validationError);

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
        workout.Notes = NormalizeText(dto.Notes);

        context.RunningWorkoutBlocks.RemoveRange(
            workout.Blocks
        );

        workout.Blocks = dto.Blocks
            .Select(
                (block, index) =>
                    CreateBlock(
                        block,
                        index
                    )
            )
            .ToList();

        await context.SaveChangesAsync(cancellationToken);

        return Ok(
            MapWorkout(workout)
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

    private static RunningWorkoutBlock CreateBlock(
        RunningWorkoutBlockInputDto dto,
        int index)
    {
        return new RunningWorkoutBlock
        {
            Type = dto.Type,
            Sequence = index,
            DistanceKm = dto.DistanceKm,
            DurationSeconds = dto.DurationSeconds,
            TargetPaceSecondsPerKm = dto.TargetPaceSecondsPerKm,
            Repetitions = dto.Repetitions,
            Notes = NormalizeText(dto.Notes)
        };
    }

    private static string? ValidateBlocks(
        IEnumerable<RunningWorkoutBlockInputDto> blocks)
    {
        foreach (var block in blocks)
        {
            if (
                block.DistanceKm is null &&
                block.DurationSeconds is null
            )
            {
                return
                    "Cada bloco precisa possuir uma distância ou duração.";
            }
        }

        return null;
    }

    private static RunningWorkoutResponseDto MapWorkout(
        RunningWorkout workout)
    {
        return new RunningWorkoutResponseDto
        {
            Id = workout.Id,
            Name = workout.Name,
            Notes = workout.Notes,
            CreatedAt = workout.CreatedAt,

            Blocks = workout.Blocks
                .OrderBy(x => x.Sequence)
                .Select(
                    block =>
                        new RunningWorkoutBlockResponseDto
                        {
                            Id = block.Id,
                            Type = block.Type,
                            Sequence = block.Sequence,
                            DistanceKm = block.DistanceKm,
                            DurationSeconds = block.DurationSeconds,
                            TargetPaceSecondsPerKm =
                                block.TargetPaceSecondsPerKm,
                            Repetitions = block.Repetitions,
                            Notes = block.Notes
                        }
                )
                .ToList()
        };
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }
}