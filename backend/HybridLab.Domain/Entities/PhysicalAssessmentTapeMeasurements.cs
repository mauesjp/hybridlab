namespace HybridLab.Domain.Entities;

public class PhysicalAssessmentTapeMeasurements
{
    public int PhysicalAssessmentId { get; set; }

    public decimal? NeckCm { get; set; }

    public decimal? ShouldersCm { get; set; }

    public decimal? ChestCm { get; set; }

    public decimal? WaistCm { get; set; }

    public decimal? WaistAtNavelCm { get; set; }

    public decimal? AbdomenCm { get; set; }

    public decimal? HipCm { get; set; }

    public decimal? RightArmRelaxedCm { get; set; }

    public decimal? LeftArmRelaxedCm { get; set; }

    public decimal? RightArmFlexedCm { get; set; }

    public decimal? LeftArmFlexedCm { get; set; }

    public decimal? RightThighCm { get; set; }

    public decimal? LeftThighCm { get; set; }

    public decimal? RightCalfCm { get; set; }

    public decimal? LeftCalfCm { get; set; }

    public PhysicalAssessment PhysicalAssessment { get; set; } = null!;
}