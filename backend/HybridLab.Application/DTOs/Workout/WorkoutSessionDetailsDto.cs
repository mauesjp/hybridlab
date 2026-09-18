namespace HybridLab.Application.DTOs.Workout
{
    public class WorkoutSessionDetailsDto
    {
        public int Id { get; set; }
        public int StrengthPlanId { get; set; }
        public int StrengthWorkoutDayId { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public bool IsCompleted { get; set; }

        public List<WorkoutExerciseDetailsDto> Exercises { get; set; } = new();
    }

    public class WorkoutExerciseDetailsDto
    {
        public int Id { get; set; }
        public int PlannedExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public int Order { get; set; }

        public int TargetSets { get; set; }
        public int MinReps { get; set; }
        public int MaxReps { get; set; }
        public int? TargetRir { get; set; }
        public string? Notes { get; set; }

        public List<WorkoutSetDetailsDto> Sets { get; set; } = new();
    }

    public class WorkoutSetDetailsDto
    {
        public int Id { get; set; }
        public int SetNumber { get; set; }
        public decimal? Weight { get; set; }
        public int Reps { get; set; }
        public int? Rir { get; set; }
        public decimal? Rpe { get; set; }
        public DateTime RecordedAt { get; set; }
    }
}