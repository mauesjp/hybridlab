namespace HybridLab.Domain.Entities;

public class PhysicalAssessmentSkinfoldMeasurements
{
    public int PhysicalAssessmentId { get; set; }

    public decimal? ChestMm { get; set; }

    public decimal? AbdomenMm { get; set; }

    public decimal? ThighMm { get; set; }

    public decimal? TricepsMm { get; set; }

    public decimal? SubscapularMm { get; set; }

    public decimal? SuprailiacMm { get; set; }

    public decimal? MidaxillaryMm { get; set; }

    public PhysicalAssessment PhysicalAssessment { get; set; } = null!;
}