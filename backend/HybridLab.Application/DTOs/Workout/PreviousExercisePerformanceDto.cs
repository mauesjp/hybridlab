namespace HybridLab.Application.DTOs.Workout
{
    public class PreviousExercisePerformanceDto
    {
        public int WorkoutExerciseId { get; set; }

        public string ExerciseName { get; set; } = string.Empty;

        public DateTime? PreviousSessionStartedAt { get; set; }

        public List<PreviousWorkoutSetDto> Sets { get; set; } = new();
    }

    public class PreviousWorkoutSetDto
    {
        public int SetNumber { get; set; }

        public decimal? Weight { get; set; }

        public int Reps { get; set; }

        public int? Rir { get; set; }

        public decimal? Rpe { get; set; }
    }
}