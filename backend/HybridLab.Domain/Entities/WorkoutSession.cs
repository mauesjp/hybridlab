namespace HybridLab.Domain.Entities
{
    public class WorkoutSession
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int StrengthPlanId { get; set; }
        public int StrengthWorkoutDayId { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? FinishedAt { get; set; }
        public bool IsCompleted { get; set; }
    }
}
