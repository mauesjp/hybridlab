namespace HybridLab.Domain.Entities
{
    public class WorkoutSet
    {
        public int Id { get; set; }
        public int WorkoutExerciseId { get; set; }
        public int SetNumber { get; set; }
        public decimal? Weight { get; set; }
        public int Reps { get; set; }
        public int? Rir { get; set; }
        public decimal? Rpe { get; set; }
        public DateTime RecordedAt { get; set; }
    }
}
