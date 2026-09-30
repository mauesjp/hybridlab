namespace HybridLab.Domain.Entities;

public class RunningWorkout
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public string Name { get; set; } = string.Empty;

    public DateTime ScheduledDate { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudentProfile Student { get; set; } = null!;

    public ICollection<RunningWorkoutBlock> Blocks { get; set; } = new List<RunningWorkoutBlock>();
}