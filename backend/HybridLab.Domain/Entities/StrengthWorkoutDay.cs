namespace HybridLab.Domain.Entities
{
    public class StrengthWorkoutDay
    {
        public int Id { get; set; }
        public int StrengthPlanId { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; }
    }
}
