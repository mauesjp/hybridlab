namespace HybridLab.Domain.Entities
{
    public class CoachProfile
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string CoachCode { get; set; } = string.Empty;
        public bool CanCoachStrength { get; set; }
        public bool CanCoachRunning { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
