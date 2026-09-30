using HybridLab.Domain.Enums;

namespace HybridLab.Domain.Entities;

public class RunningWorkoutBlock
{
    public int Id { get; set; }

    public int RunningWorkoutId { get; set; }

    public RunningWorkoutBlockType Type { get; set; }

    public int Sequence { get; set; }

    public decimal? DistanceKm { get; set; }

    public int? DurationSeconds { get; set; }

    public int? TargetPaceSecondsPerKm { get; set; }

    public int Repetitions { get; set; } = 1;

    public string? Notes { get; set; }

    public RunningWorkout RunningWorkout { get; set; } = null!;
}