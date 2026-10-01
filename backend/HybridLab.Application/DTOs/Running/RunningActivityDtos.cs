using System.ComponentModel.DataAnnotations;
using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.Running;

public class CreateRunningActivityDto
{
    public DateTime ActivityDate { get; set; }

    [Range(0.01, 1000)]
    public decimal DistanceKm { get; set; }

    [Range(1, 864000)]
    public int DurationSeconds { get; set; }

    [Range(30, 250)]
    public int? AverageHeartRate { get; set; }

    [Range(1, 10)]
    public decimal? Rpe { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class UpdateRunningActivityDto
{
    public DateTime ActivityDate { get; set; }

    [Range(0.01, 1000)]
    public decimal DistanceKm { get; set; }

    [Range(1, 864000)]
    public int DurationSeconds { get; set; }

    [Range(30, 250)]
    public int? AverageHeartRate { get; set; }

    [Range(1, 10)]
    public decimal? Rpe { get; set; }

    [MaxLength(1000)]
    public string? Notes { get; set; }
}

public class RunningActivityResponseDto
{
    public int Id { get; set; }

    public DateTime ActivityDate { get; set; }

    public decimal DistanceKm { get; set; }

    public int DurationSeconds { get; set; }

    public int AveragePaceSecondsPerKm { get; set; }

    public int? AverageHeartRate { get; set; }

    public decimal? Rpe { get; set; }

    public string? Notes { get; set; }

    public RunningActivitySource Source { get; set; }

    public DateTime CreatedAt { get; set; }
}