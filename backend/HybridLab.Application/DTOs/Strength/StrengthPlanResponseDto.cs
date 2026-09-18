namespace HybridLab.Application.DTOs.Strength
{
    public class StrengthPlanResponseDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int VersionNumber { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }
    }
}