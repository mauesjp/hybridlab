namespace HybridLab.Domain.Entities;

public class HybridTrainingPlan
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateOnly StartDate { get; set; }

    public bool IsActive { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudentProfile Student { get; set; } = null!;

    public ICollection<HybridTrainingWeek> Weeks { get; set; } =
        new List<HybridTrainingWeek>();
}