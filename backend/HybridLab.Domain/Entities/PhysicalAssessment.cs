namespace HybridLab.Domain.Entities;

public class PhysicalAssessment
{
    public int Id { get; set; }

    public int StudentId { get; set; }

    public DateOnly AssessmentDate { get; set; }

    public decimal WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public StudentProfile Student { get; set; } = null!;

    public PhysicalAssessmentTapeMeasurements TapeMeasurements { get; set; } = null!;

    public PhysicalAssessmentSkinfoldMeasurements? SkinfoldMeasurements { get; set; }

    public ICollection<PhysicalAssessmentPhoto> Photos { get; set; } = new List<PhysicalAssessmentPhoto>();
}