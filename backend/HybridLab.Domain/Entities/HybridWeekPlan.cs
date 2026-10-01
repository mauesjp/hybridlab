namespace HybridLab.Domain.Entities;

public class HybridWeekPlan
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string Name { get; set; } = string.Empty;

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudentProfile Student { get; set; } = null!;

    public ICollection<HybridWeekSession> Sessions { get; set; } = new List<HybridWeekSession>();
}