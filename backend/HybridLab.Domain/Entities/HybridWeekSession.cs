using HybridLab.Domain.Enums;

namespace HybridLab.Domain.Entities;

public class HybridWeekSession
{
    public int Id { get; set; }

    public int HybridTrainingWeekId { get; set; }

    public DayOfWeek DayOfWeek { get; set; }

    public HybridSessionType SessionType { get; set; }

    public TrainingPeriod Period { get; set; } =
        TrainingPeriod.Unspecified;

    public int Sequence { get; set; }

    public int? StrengthWorkoutDayId { get; set; }

    public int? RunningWorkoutId { get; set; }

    public string? Notes { get; set; }

    public HybridTrainingWeek HybridTrainingWeek { get; set; } = null!;

    public StrengthWorkoutDay? StrengthWorkoutDay { get; set; }

    public RunningWorkout? RunningWorkout { get; set; }
}