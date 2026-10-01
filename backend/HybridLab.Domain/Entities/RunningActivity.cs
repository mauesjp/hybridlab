using HybridLab.Domain.Enums;

namespace HybridLab.Domain.Entities;

public class RunningActivity
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public DateTime ActivityDate { get; set; }

    public decimal DistanceKm { get; set; }

    public int DurationSeconds { get; set; }

    public int? AverageHeartRate { get; set; }

    public decimal? Rpe { get; set; }

    public string? Notes { get; set; }

    public RunningActivitySource Source { get; set; } =
        RunningActivitySource.Manual;

    public DateTime CreatedAt { get; set; } =
        DateTime.UtcNow;

    public StudentProfile Student { get; set; } = null!;
}