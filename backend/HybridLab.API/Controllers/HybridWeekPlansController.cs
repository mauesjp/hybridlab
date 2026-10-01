using System.Security.Claims;
using HybridLab.Application.DTOs.HybridWeek;
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
public class HybridWeekPlansController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<HybridWeekPlanResponseDto>>> GetAll(
        CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plans = await QueryPlans()
            .AsNoTracking()
            .Where(x => x.StudentId == student.Id)
            .OrderByDescending(x => x.IsActive)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(
            plans.Select(MapPlan)
        );
    }

    [HttpGet("active")]
    public async Task<ActionResult<HybridWeekPlanResponseDto>> GetActive(CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await QueryPlans()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.StudentId == student.Id &&
                    x.IsActive,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        return Ok(
            MapPlan(plan)
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HybridWeekPlanResponseDto>> GetById(int id, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await QueryPlans()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        return Ok(
            MapPlan(plan)
        );
    }

    [HttpGet("today")]
    public async Task<ActionResult<TodayHybridPlanResponseDto>> GetToday([FromQuery] DateOnly? date, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var targetDate =
            date ??
            DateOnly.FromDateTime(DateTime.UtcNow);

        var dayOfWeek = targetDate.DayOfWeek;

        var plan = await QueryPlans()
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x =>
                    x.StudentId == student.Id &&
                    x.IsActive,
                cancellationToken
            );

        if (plan is null)
        {
            return Ok(
                new TodayHybridPlanResponseDto
                {
                    Date = targetDate,
                    DayOfWeek = dayOfWeek,
                    HasActivePlan = false,
                    IsRestDay = false,
                    Sessions = []
                }
            );
        }

        var sessions = plan.Sessions
            .Where(x => x.DayOfWeek == dayOfWeek)
            .OrderBy(x => x.Sequence)
            .Select(MapSession)
            .ToList();

        return Ok(
            new TodayHybridPlanResponseDto
            {
                Date = targetDate,
                DayOfWeek = dayOfWeek,
                HasActivePlan = true,
                PlanId = plan.Id,
                PlanName = plan.Name,
                IsRestDay = sessions.Count == 0,
                Sessions = sessions
            }
        );
    }

    [HttpPost]
    public async Task<ActionResult<HybridWeekPlanResponseDto>> Create(CreateHybridWeekPlanDto dto, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError =
            await ValidateSessions(
                student.Id,
                dto.Sessions,
                cancellationToken
            );

        if (validationError is not null)
            return BadRequest(validationError);

        if (dto.IsActive)
        {
            await DeactivateOtherPlans(
                student.Id,
                null,
                cancellationToken
            );
        }

        var plan = new HybridWeekPlan
        {
            StudentId = student.Id,
            Name = dto.Name.Trim(),
            IsActive = dto.IsActive,
            CreatedAt = DateTime.UtcNow,
            Sessions = dto.Sessions
                .Select(CreateSession)
                .ToList()
        };

        context.HybridWeekPlans.Add(plan);

        await context.SaveChangesAsync(cancellationToken);

        var created = await QueryPlans()
            .AsNoTracking()
            .FirstAsync(
                x => x.Id == plan.Id,
                cancellationToken
            );

        return CreatedAtAction(
            nameof(GetById),
            new { id = plan.Id },
            MapPlan(created)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HybridWeekPlanResponseDto>> Update(int id, UpdateHybridWeekPlanDto dto, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError =
            await ValidateSessions(
                student.Id,
                dto.Sessions,
                cancellationToken
            );

        if (validationError is not null)
            return BadRequest(validationError);

        var plan = await context.HybridWeekPlans
            .Include(x => x.Sessions)
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        if (dto.IsActive)
        {
            await DeactivateOtherPlans(
                student.Id,
                plan.Id,
                cancellationToken
            );
        }

        plan.Name = dto.Name.Trim();
        plan.IsActive = dto.IsActive;

        context.HybridWeekSessions.RemoveRange(
            plan.Sessions
        );

        plan.Sessions = dto.Sessions
            .Select(CreateSession)
            .ToList();

        await context.SaveChangesAsync(cancellationToken);

        var updated = await QueryPlans()
            .AsNoTracking()
            .FirstAsync(
                x => x.Id == plan.Id,
                cancellationToken
            );

        return Ok(
            MapPlan(updated)
        );
    }

    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult<HybridWeekPlanResponseDto>> Activate(int id, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await context.HybridWeekPlans
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        await DeactivateOtherPlans(
            student.Id,
            plan.Id,
            cancellationToken
        );

        plan.IsActive = true;

        await context.SaveChangesAsync(cancellationToken);

        var result = await QueryPlans()
            .AsNoTracking()
            .FirstAsync(
                x => x.Id == plan.Id,
                cancellationToken
            );

        return Ok(
            MapPlan(result)
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await context.HybridWeekPlans
            .FirstOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        context.HybridWeekPlans.Remove(plan);

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpGet("options")]
    public async Task<ActionResult<HybridWeekOptionsResponseDto>> GetOptions(CancellationToken cancellationToken)
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var strengthWorkouts =
            await (
                from day in context.StrengthWorkoutDays
                join plan in context.StrengthPlans
                    on day.StrengthPlanId equals plan.Id
                where
                    plan.StudentId == student.Id &&
                    plan.IsActive
                orderby day.Order
                select new HybridWeekWorkoutOptionDto
                {
                    Id = day.Id,
                    Name = day.Name
                }
            )
            .AsNoTracking()
            .ToListAsync(cancellationToken);

        var runningWorkouts =
            await context.RunningWorkouts
                .AsNoTracking()
                .Where(x => x.StudentId == student.Id)
                .OrderBy(x => x.Name)
                .Select(
                    x =>
                        new HybridWeekWorkoutOptionDto
                        {
                            Id = x.Id,
                            Name = x.Name
                        }
                )
                .ToListAsync(cancellationToken);

        return Ok(
            new HybridWeekOptionsResponseDto
            {
                StrengthWorkouts = strengthWorkouts,
                RunningWorkouts = runningWorkouts
            }
        );
    }

    private IQueryable<HybridWeekPlan> QueryPlans()
    {
        return context.HybridWeekPlans
            .Include(x => x.Sessions)
                .ThenInclude(x => x.StrengthWorkoutDay)
            .Include(x => x.Sessions)
                .ThenInclude(x => x.RunningWorkout);
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
                student =>
                    student.UserId == userId,
                cancellationToken
            );
    }

    private async Task<string?> ValidateSessions(int studentId, IEnumerable<HybridWeekSessionInputDto> sessions, CancellationToken cancellationToken)
    {
        var sessionList =
            sessions.ToList();

        foreach (var session in sessionList)
        {
            if (session.SessionType == HybridSessionType.Strength)
            {
                if (
                    session.StrengthWorkoutDayId is null ||
                    session.RunningWorkoutId is not null
                )
                {
                    return
                        "Sessões de musculação devem possuir somente StrengthWorkoutDayId.";
                }
            }

            if (session.SessionType == HybridSessionType.Running)
            {
                if (
                    session.RunningWorkoutId is null ||
                    session.StrengthWorkoutDayId is not null
                )
                {
                    return
                        "Sessões de corrida devem possuir somente RunningWorkoutId.";
                }
            }
        }

        var strengthIds = sessionList
            .Where(
                x =>
                    x.SessionType ==
                    HybridSessionType.Strength &&
                    x.StrengthWorkoutDayId.HasValue
            )
            .Select(x => x.StrengthWorkoutDayId!.Value)
            .Distinct()
            .ToList();

        if (strengthIds.Count > 0)
        {
            var ownedStrengthIds =
                await (
                    from day in context.StrengthWorkoutDays
                    join plan in context.StrengthPlans
                        on day.StrengthPlanId equals plan.Id
                    where
                        strengthIds.Contains(day.Id) &&
                        plan.StudentId == studentId
                    select day.Id
                )
                .Distinct()
                .ToListAsync(cancellationToken);

            if (ownedStrengthIds.Count != strengthIds.Count)
            {
                return
                    "Um ou mais treinos de musculação não pertencem ao usuário.";
            }
        }

        var runningIds = sessionList
            .Where(
                x =>
                    x.SessionType ==
                    HybridSessionType.Running &&
                    x.RunningWorkoutId.HasValue
            )
            .Select(x => x.RunningWorkoutId!.Value)
            .Distinct()
            .ToList();

        if (runningIds.Count > 0)
        {
            var ownedRunningIds =
                await context.RunningWorkouts
                    .Where(
                        workout =>
                            runningIds.Contains(workout.Id) &&
                            workout.StudentId == studentId
                    )
                    .Select(workout => workout.Id)
                    .Distinct()
                    .ToListAsync(cancellationToken);

            if (ownedRunningIds.Count != runningIds.Count)
            {
                return
                    "Um ou mais treinos de corrida não pertencem ao usuário.";
            }
        }

        return null;
    }

    private async Task DeactivateOtherPlans(int studentId, int? exceptPlanId, CancellationToken cancellationToken)
    {
        var activePlans =
            await context.HybridWeekPlans
                .Where(
                    plan =>
                        plan.StudentId == studentId &&
                        plan.IsActive &&
                        (
                            !exceptPlanId.HasValue ||
                            plan.Id != exceptPlanId.Value
                        )
                )
                .ToListAsync(cancellationToken);

        foreach (var plan in activePlans)
        {
            plan.IsActive = false;
        }
    }

    private static HybridWeekSession CreateSession(HybridWeekSessionInputDto dto)
    {
        return new HybridWeekSession
        {
            DayOfWeek = dto.DayOfWeek,
            SessionType = dto.SessionType,
            Period = dto.Period,
            Sequence = dto.Sequence,
            StrengthWorkoutDayId = dto.StrengthWorkoutDayId,
            RunningWorkoutId = dto.RunningWorkoutId,
            Notes = NormalizeText(dto.Notes)
        };
    }

    private static HybridWeekPlanResponseDto MapPlan(HybridWeekPlan plan)
    {
        return new HybridWeekPlanResponseDto
        {
            Id = plan.Id,
            Name = plan.Name,
            IsActive = plan.IsActive,
            CreatedAt = plan.CreatedAt,

            Sessions = plan.Sessions
                .OrderBy(x => x.DayOfWeek)
                .ThenBy(x => x.Sequence)
                .Select(MapSession)
                .ToList()
        };
    }

    private static HybridWeekSessionResponseDto MapSession(HybridWeekSession session)
    {
        var sessionName =
            session.SessionType == HybridSessionType.Strength
                ? session.StrengthWorkoutDay?.Name
                : session.RunningWorkout?.Name;

        return new HybridWeekSessionResponseDto
        {
            Id = session.Id,
            DayOfWeek = session.DayOfWeek,
            SessionType = session.SessionType,
            Period = session.Period,
            Sequence = session.Sequence,
            StrengthWorkoutDayId = session.StrengthWorkoutDayId,
            RunningWorkoutId = session.RunningWorkoutId,
            SessionName = sessionName,
            Notes = session.Notes
        };
    }

    private static string? NormalizeText(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;

        return value.Trim();
    }


}