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
public class HybridTrainingPlansController(
    AppDbContext context
) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<HybridTrainingPlanResponseDto>>> GetAll(
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plans = await QueryPlans()
            .Where(x => x.StudentId == student.Id)
            .OrderByDescending(x => x.IsActive)
            .ThenByDescending(x => x.CreatedAt)
            .ToListAsync(cancellationToken);

        return Ok(
            plans
                .Select(MapPlan)
                .ToList()
        );
    }

    [HttpGet("active")]
    public async Task<ActionResult<HybridTrainingPlanResponseDto>> GetActive(
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await QueryPlans()
            .SingleOrDefaultAsync(
                x =>
                    x.StudentId == student.Id &&
                    x.IsActive,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        return Ok(MapPlan(plan));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<HybridTrainingPlanResponseDto>> GetById(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan = await QueryPlans()
            .SingleOrDefaultAsync(
                x =>
                    x.Id == id &&
                    x.StudentId == student.Id,
                cancellationToken
            );

        if (plan is null)
            return NotFound();

        return Ok(MapPlan(plan));
    }

    [HttpGet("options")]
    public async Task<ActionResult<HybridWeekOptionsResponseDto>> GetOptions(
        CancellationToken cancellationToken
    )
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
                .Select(x => new HybridWeekWorkoutOptionDto
                {
                    Id = x.Id,
                    Name = x.Name
                })
                .ToListAsync(cancellationToken);

        return Ok(
            new HybridWeekOptionsResponseDto
            {
                StrengthWorkouts = strengthWorkouts,
                RunningWorkouts = runningWorkouts
            }
        );
    }

    [HttpGet("today")]
    public async Task<ActionResult<TodayHybridPlanResponseDto>> GetToday(
        [FromQuery] DateOnly? date,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var targetDate =
            date ??
            DateOnly.FromDateTime(DateTime.UtcNow);

        var plan = await QueryPlans()
            .SingleOrDefaultAsync(
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
                    DayOfWeek = targetDate.DayOfWeek,
                    HasActivePlan = false,
                    IsRestDay = false
                }
            );
        }

        var totalWeeks = plan.Weeks.Count;

        var planEndDate =
            plan.StartDate.AddDays(
                totalWeeks * 7 - 1
            );

        if (targetDate < plan.StartDate)
        {
            return Ok(
                new TodayHybridPlanResponseDto
                {
                    Date = targetDate,
                    DayOfWeek = targetDate.DayOfWeek,

                    HasActivePlan = true,

                    PlanId = plan.Id,
                    PlanName = plan.Name,

                    PlanStartDate = plan.StartDate,
                    PlanEndDate = planEndDate,

                    TotalWeeks = totalWeeks,

                    IsBeforePlan = true,
                    IsAfterPlan = false,
                    IsRestDay = false
                }
            );
        }

        if (targetDate > planEndDate)
        {
            return Ok(
                new TodayHybridPlanResponseDto
                {
                    Date = targetDate,
                    DayOfWeek = targetDate.DayOfWeek,

                    HasActivePlan = true,

                    PlanId = plan.Id,
                    PlanName = plan.Name,

                    PlanStartDate = plan.StartDate,
                    PlanEndDate = planEndDate,

                    TotalWeeks = totalWeeks,

                    IsBeforePlan = false,
                    IsAfterPlan = true,
                    IsRestDay = false
                }
            );
        }

        var daysFromStart =
            targetDate.DayNumber -
            plan.StartDate.DayNumber;

        var weekNumber =
            daysFromStart / 7 + 1;

        var week =
            plan.Weeks.SingleOrDefault(
                x =>
                    x.WeekNumber ==
                    weekNumber
            );

        if (week is null)
        {
            return Ok(
                new TodayHybridPlanResponseDto
                {
                    Date = targetDate,
                    DayOfWeek = targetDate.DayOfWeek,

                    HasActivePlan = true,

                    PlanId = plan.Id,
                    PlanName = plan.Name,

                    PlanStartDate = plan.StartDate,
                    PlanEndDate = planEndDate,

                    WeekNumber = weekNumber,
                    TotalWeeks = totalWeeks,

                    IsRestDay = true
                }
            );
        }

        var sessions =
            week.Sessions
                .Where(
                    x =>
                        x.DayOfWeek ==
                        targetDate.DayOfWeek
                )
                .OrderBy(x => x.Sequence)
                .Select(MapSession)
                .ToList();

        return Ok(
            new TodayHybridPlanResponseDto
            {
                Date = targetDate,
                DayOfWeek = targetDate.DayOfWeek,

                HasActivePlan = true,

                PlanId = plan.Id,
                PlanName = plan.Name,

                PlanStartDate = plan.StartDate,
                PlanEndDate = planEndDate,

                WeekId = week.Id,
                WeekNumber = weekNumber,
                TotalWeeks = totalWeeks,

                IsBeforePlan = false,
                IsAfterPlan = false,

                IsRestDay =
                    sessions.Count == 0,

                Sessions = sessions
            }
        );
    }

    [HttpPost]
    public async Task<ActionResult<HybridTrainingPlanResponseDto>> Create(
        CreateHybridTrainingPlanDto dto,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError =
            await ValidatePlan(
                student.Id,
                dto.Name,
                dto.StartDate,
                dto.Weeks,
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

        var plan =
            new HybridTrainingPlan
            {
                StudentId = student.Id,

                Name =
                    dto.Name.Trim(),

                StartDate =
                    dto.StartDate,

                IsActive =
                    dto.IsActive,

                CreatedAt =
                    DateTime.UtcNow
            };

        AddWeeks(
            plan,
            dto.Weeks
        );

        context.HybridTrainingPlans.Add(plan);

        await context.SaveChangesAsync(cancellationToken);

        var created =
            await QueryPlans()
                .SingleAsync(
                    x => x.Id == plan.Id,
                    cancellationToken
                );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = plan.Id
            },
            MapPlan(created)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<HybridTrainingPlanResponseDto>> Update(
        int id,
        UpdateHybridTrainingPlanDto dto,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan =
            await context.HybridTrainingPlans
                .Include(x => x.Weeks)
                    .ThenInclude(x => x.Sessions)
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (plan is null)
            return NotFound();

        var validationError =
            await ValidatePlan(
                student.Id,
                dto.Name,
                dto.StartDate,
                dto.Weeks,
                cancellationToken
            );

        if (validationError is not null)
            return BadRequest(validationError);

        if (dto.IsActive)
        {
            await DeactivateOtherPlans(
                student.Id,
                plan.Id,
                cancellationToken
            );
        }

        plan.Name =
            dto.Name.Trim();

        plan.StartDate =
            dto.StartDate;

        plan.IsActive =
            dto.IsActive;

        var existingWeeks =
            plan.Weeks.ToList();

        context.HybridTrainingWeeks.RemoveRange(
            existingWeeks
        );

        plan.Weeks =
            new List<HybridTrainingWeek>();

        AddWeeks(
            plan,
            dto.Weeks
        );

        await context.SaveChangesAsync(cancellationToken);

        var updated =
            await QueryPlans()
                .SingleAsync(
                    x => x.Id == plan.Id,
                    cancellationToken
                );

        return Ok(
            MapPlan(updated)
        );
    }

    [HttpPost("{id:int}/activate")]
    public async Task<ActionResult<HybridTrainingPlanResponseDto>> Activate(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan =
            await context.HybridTrainingPlans
                .SingleOrDefaultAsync(
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

        var updated =
            await QueryPlans()
                .SingleAsync(
                    x => x.Id == plan.Id,
                    cancellationToken
                );

        return Ok(
            MapPlan(updated)
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var plan =
            await context.HybridTrainingPlans
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (plan is null)
            return NotFound();

        context.HybridTrainingPlans.Remove(plan);

        await context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private IQueryable<HybridTrainingPlan> QueryPlans()
    {
        return context.HybridTrainingPlans
            .AsNoTracking()
            .Include(x => x.Weeks)
                .ThenInclude(x => x.Sessions)
                    .ThenInclude(x => x.StrengthWorkoutDay)
            .Include(x => x.Weeks)
                .ThenInclude(x => x.Sessions)
                    .ThenInclude(x => x.RunningWorkout);
    }

    private async Task<StudentProfile?> GetCurrentStudent(
        CancellationToken cancellationToken
    )
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            )
            ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await context.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x =>
                    x.UserId ==
                    userId,
                cancellationToken
            );
    }

    private async Task<string?> ValidatePlan(
        int studentId,
        string name,
        DateOnly startDate,
        IReadOnlyCollection<HybridTrainingWeekInputDto> weeks,
        CancellationToken cancellationToken
    )
    {
        if (string.IsNullOrWhiteSpace(name))
            return "O planejamento precisa ter um nome.";

        if (startDate.DayOfWeek != DayOfWeek.Monday)
        {
            return "A data inicial do planejamento precisa ser uma segunda-feira.";
        }

        if (weeks.Count == 0)
        {
            return "O planejamento precisa ter pelo menos uma semana.";
        }

        var weekNumbers =
            weeks
                .Select(x => x.WeekNumber)
                .OrderBy(x => x)
                .ToList();

        for (
            var expected = 1;
            expected <= weekNumbers.Count;
            expected++
        )
        {
            if (
                weekNumbers[expected - 1] !=
                expected
            )
            {
                return "As semanas precisam ser numeradas em sequência começando pela Semana 1.";
            }
        }

        var sessions =
            weeks
                .SelectMany(x => x.Sessions)
                .ToList();

        foreach (var session in sessions)
        {
            if (
                session.SessionType ==
                HybridSessionType.Strength
            )
            {
                if (
                    session.StrengthWorkoutDayId is null ||
                    session.RunningWorkoutId is not null
                )
                {
                    return "Uma sessão de musculação deve possuir apenas um treino de musculação.";
                }
            }
            else if (
                session.SessionType ==
                HybridSessionType.Running
            )
            {
                if (
                    session.RunningWorkoutId is null ||
                    session.StrengthWorkoutDayId is not null
                )
                {
                    return "Uma sessão de corrida deve possuir apenas um treino de corrida.";
                }
            }
            else
            {
                return "Tipo de sessão inválido.";
            }
        }

        var strengthIds =
            sessions
                .Where(
                    x =>
                        x.StrengthWorkoutDayId
                        is not null
                )
                .Select(
                    x =>
                        x.StrengthWorkoutDayId!.Value
                )
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

            if (
                ownedStrengthIds.Count !=
                strengthIds.Count
            )
            {
                return "Um ou mais treinos de musculação são inválidos.";
            }
        }

        var runningIds =
            sessions
                .Where(
                    x =>
                        x.RunningWorkoutId
                        is not null
                )
                .Select(
                    x =>
                        x.RunningWorkoutId!.Value
                )
                .Distinct()
                .ToList();

        if (runningIds.Count > 0)
        {
            var ownedRunningCount =
                await context.RunningWorkouts
                    .AsNoTracking()
                    .CountAsync(
                        x =>
                            runningIds.Contains(x.Id) &&
                            x.StudentId == studentId,
                        cancellationToken
                    );

            if (
                ownedRunningCount !=
                runningIds.Count
            )
            {
                return "Um ou mais treinos de corrida são inválidos.";
            }
        }

        return null;
    }

    private async Task DeactivateOtherPlans(
        int studentId,
        int? exceptPlanId,
        CancellationToken cancellationToken
    )
    {
        var plans =
            await context.HybridTrainingPlans
                .Where(
                    x =>
                        x.StudentId == studentId &&
                        x.IsActive &&
                        (
                            exceptPlanId == null ||
                            x.Id != exceptPlanId
                        )
                )
                .ToListAsync(cancellationToken);

        foreach (var plan in plans)
        {
            plan.IsActive = false;
        }
    }

    private static void AddWeeks(
        HybridTrainingPlan plan,
        IEnumerable<HybridTrainingWeekInputDto> weeks
    )
    {
        foreach (
            var weekDto in weeks
                .OrderBy(x => x.WeekNumber)
        )
        {
            var week =
                new HybridTrainingWeek
                {
                    WeekNumber =
                        weekDto.WeekNumber,

                    Name =
                        NormalizeText(
                            weekDto.Name
                        ),

                    Notes =
                        NormalizeText(
                            weekDto.Notes
                        )
                };

            foreach (
                var sessionDto in
                weekDto.Sessions
                    .OrderBy(x => x.DayOfWeek)
                    .ThenBy(x => x.Sequence)
            )
            {
                week.Sessions.Add(
                    CreateSession(
                        sessionDto
                    )
                );
            }

            plan.Weeks.Add(week);
        }
    }

    private static HybridWeekSession CreateSession(
        HybridWeekSessionInputDto dto
    )
    {
        return new HybridWeekSession
        {
            DayOfWeek =
                dto.DayOfWeek,

            SessionType =
                dto.SessionType,

            Period =
                dto.Period,

            Sequence =
                dto.Sequence,

            StrengthWorkoutDayId =
                dto.StrengthWorkoutDayId,

            RunningWorkoutId =
                dto.RunningWorkoutId,

            Notes =
                NormalizeText(
                    dto.Notes
                )
        };
    }

    private static HybridTrainingPlanResponseDto MapPlan(
        HybridTrainingPlan plan
    )
    {
        var totalWeeks =
            plan.Weeks.Count;

        var endDate =
            plan.StartDate.AddDays(
                totalWeeks * 7 - 1
            );

        return new HybridTrainingPlanResponseDto
        {
            Id = plan.Id,

            Name = plan.Name,

            StartDate =
                plan.StartDate,

            EndDate =
                endDate,

            TotalWeeks =
                totalWeeks,

            IsActive =
                plan.IsActive,

            CreatedAt =
                plan.CreatedAt,

            Weeks =
                plan.Weeks
                    .OrderBy(x => x.WeekNumber)
                    .Select(
                        week =>
                        {
                            var weekStart =
                                plan.StartDate.AddDays(
                                    (week.WeekNumber - 1) * 7
                                );

                            return new HybridTrainingWeekResponseDto
                            {
                                Id =
                                    week.Id,

                                WeekNumber =
                                    week.WeekNumber,

                                Name =
                                    week.Name,

                                Notes =
                                    week.Notes,

                                StartDate =
                                    weekStart,

                                EndDate =
                                    weekStart.AddDays(6),

                                Sessions =
                                    week.Sessions
                                        .OrderBy(x => x.DayOfWeek)
                                        .ThenBy(x => x.Sequence)
                                        .Select(MapSession)
                                        .ToList()
                            };
                        }
                    )
                    .ToList()
        };
    }

    private static HybridWeekSessionResponseDto MapSession(
        HybridWeekSession session
    )
    {
        return new HybridWeekSessionResponseDto
        {
            Id =
                session.Id,

            DayOfWeek =
                session.DayOfWeek,

            SessionType =
                session.SessionType,

            Period =
                session.Period,

            Sequence =
                session.Sequence,

            StrengthWorkoutDayId =
                session.StrengthWorkoutDayId,

            RunningWorkoutId =
                session.RunningWorkoutId,

            SessionName =
                session.SessionType ==
                HybridSessionType.Strength
                    ? session.StrengthWorkoutDay?.Name
                    : session.RunningWorkout?.Name,

            Notes =
                session.Notes
        };
    }

    private static string? NormalizeText(
        string? value
    )
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }
}