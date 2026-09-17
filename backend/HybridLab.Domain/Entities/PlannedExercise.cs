namespace HybridLab.Domain.Entities
{
    public class PlannedExercise
    {
        public int Id { get; set; }
        public int StrengthWorkoutDayId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; }
        public int TargetSets { get; set; }
        public int MinReps { get; set; }
        public int MaxReps { get; set; }
        public int? TargetRir { get; set; }
        public string? Notes { get; set; }
    }
}
