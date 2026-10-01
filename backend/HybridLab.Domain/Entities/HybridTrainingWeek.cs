namespace HybridLab.Domain.Entities;

public class HybridTrainingWeek
{
    public int Id { get; set; }

    public int HybridTrainingPlanId { get; set; }

    public int WeekNumber { get; set; }

    public string? Name { get; set; }

    public string? Notes { get; set; }

    public HybridTrainingPlan HybridTrainingPlan { get; set; } = null!;

    public ICollection<HybridWeekSession> Sessions { get; set; } =
        new List<HybridWeekSession>();
}