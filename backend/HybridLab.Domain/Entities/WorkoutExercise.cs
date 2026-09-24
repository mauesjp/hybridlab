namespace HybridLab.Domain.Entities
{
    public class WorkoutExercise
    {
        public int WorkoutSessionId { get; set; }
        public int Id { get; set; }
        public int PlannedExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
