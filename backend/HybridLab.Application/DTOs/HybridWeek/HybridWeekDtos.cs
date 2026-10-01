using System.ComponentModel.DataAnnotations;
using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.HybridWeek;

public class HybridWeekSessionInputDto
{
    [EnumDataType(typeof(DayOfWeek))]
    public DayOfWeek DayOfWeek { get; set; }

    [EnumDataType(typeof(HybridSessionType))]
    public HybridSessionType SessionType { get; set; }

    [EnumDataType(typeof(TrainingPeriod))]
    public TrainingPeriod Period { get; set; } = TrainingPeriod.Unspecified;

    [Range(0, 100)]
    public int Sequence { get; set; }

    public int? StrengthWorkoutDayId { get; set; }

    public int? RunningWorkoutId { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class HybridTrainingWeekInputDto
{
    [Range(1, 260)]
    public int WeekNumber { get; set; }

    [MaxLength(150)]
    public string? Name { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    public List<HybridWeekSessionInputDto> Sessions { get; set; } = [];
}

public class CreateHybridTrainingPlanDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public bool IsActive { get; set; } = true;

    public List<HybridTrainingWeekInputDto> Weeks { get; set; } = [];
}

public class UpdateHybridTrainingPlanDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public bool IsActive { get; set; }

    public List<HybridTrainingWeekInputDto> Weeks { get; set; } = [];
}

public class HybridWeekSessionResponseDto
{
    public int Id { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public HybridSessionType SessionType { get; set; }

    public TrainingPeriod Period { get; set; }

    public int Sequence { get; set; }

    public int? StrengthWorkoutDayId { get; set; }

    public int? RunningWorkoutId { get; set; }

    public string? SessionName { get; set; }

    public string? Notes { get; set; }
}

public class HybridTrainingWeekResponseDto
{
    public int Id { get; set; }

    public int WeekNumber { get; set; }

    public string? Name { get; set; }

    public string? Notes { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public List<HybridWeekSessionResponseDto> Sessions { get; set; } = [];
}

public class HybridTrainingPlanResponseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public int TotalWeeks { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<HybridTrainingWeekResponseDto> Weeks { get; set; } = [];
}

public class TodayHybridPlanResponseDto
{
    public DateOnly Date { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public bool HasActivePlan { get; set; }

    public int? PlanId { get; set; }

    public string? PlanName { get; set; }

    public DateOnly? PlanStartDate { get; set; }

    public DateOnly? PlanEndDate { get; set; }

    public int? WeekId { get; set; }

    public int? WeekNumber { get; set; }

    public int TotalWeeks { get; set; }

    public bool IsBeforePlan { get; set; }

    public bool IsAfterPlan { get; set; }

    public bool IsRestDay { get; set; }

    public List<HybridWeekSessionResponseDto> Sessions { get; set; } = [];
}

public class HybridWeekWorkoutOptionDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;
}

public class HybridWeekOptionsResponseDto
{
    public List<HybridWeekWorkoutOptionDto> StrengthWorkouts { get; set; } = [];

    public List<HybridWeekWorkoutOptionDto> RunningWorkouts { get; set; } = [];
}