using System.ComponentModel.DataAnnotations;
using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.Running;

public class RunningWorkoutBlockInputDto
{
    [EnumDataType(typeof(RunningWorkoutBlockType))]
    public RunningWorkoutBlockType Type { get; set; }

    [Range(0.01, 1000)]
    public decimal? DistanceKm { get; set; }

    [Range(1, 86400)]
    public int? DurationSeconds { get; set; }

    [Range(120, 1200)]
    public int? TargetPaceSecondsPerKm { get; set; }

    [Range(1, 100)]
    public int Repetitions { get; set; } = 1;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class CreateRunningWorkoutDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public DateTime ScheduledDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MinLength(1)]
    public List<RunningWorkoutBlockInputDto> Blocks { get; set; } = [];
}

public class UpdateRunningWorkoutDto
{
    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    public DateTime ScheduledDate { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }

    [MinLength(1)]
    public List<RunningWorkoutBlockInputDto> Blocks { get; set; } = [];
}

public class RunningWorkoutBlockResponseDto
{
    public int Id { get; set; }

    public RunningWorkoutBlockType Type { get; set; }

    public int Sequence { get; set; }

    public decimal? DistanceKm { get; set; }

    public int? DurationSeconds { get; set; }

    public int? TargetPaceSecondsPerKm { get; set; }

    public int Repetitions { get; set; }

    public string? Notes { get; set; }
}

public class RunningWorkoutResponseDto
{
    public int Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime ScheduledDate { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<RunningWorkoutBlockResponseDto> Blocks { get; set; } = [];
}