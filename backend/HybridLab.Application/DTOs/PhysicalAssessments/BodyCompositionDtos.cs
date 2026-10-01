using System.ComponentModel.DataAnnotations;
using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.PhysicalAssessments;

public class BodyCompositionProfileDto
{
    public DateOnly? BirthDate { get; set; }

    public BiologicalSex? BiologicalSex { get; set; }
}

public class UpdateBodyCompositionProfileDto
{
    public DateOnly BirthDate { get; set; }

    [EnumDataType(typeof(BiologicalSex))]
    public BiologicalSex BiologicalSex { get; set; }
}

public class BodyCompositionResultDto
{
    public int AssessmentId { get; set; }

    public DateOnly AssessmentDate { get; set; }

    public int? AgeYears { get; set; }

    public decimal WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    public decimal? Bmi { get; set; }

    public decimal? SevenSkinfoldSumMm { get; set; }

    public decimal? BodyDensity { get; set; }

    public decimal? BodyFatPercentage { get; set; }

    public decimal? FatMassKg { get; set; }

    public decimal? LeanMassKg { get; set; }

    public bool HasCompleteSkinfoldProtocol { get; set; }

    public bool IsWithinProtocolAgeRange { get; set; }

    public string? Protocol { get; set; }
}

public class BodyCompositionComparisonDto
{
    public BodyCompositionResultDto First { get; set; } = new();

    public BodyCompositionResultDto Second { get; set; } = new();

    // Sempre: segunda avaliação - primeira avaliação.
    public decimal WeightChangeKg { get; set; }

    public decimal? BodyFatChangePercentagePoints { get; set; }

    public decimal? FatMassChangeKg { get; set; }

    public decimal? LeanMassChangeKg { get; set; }

    public decimal? SevenSkinfoldSumChangeMm { get; set; }
}

public class PhysicalAssessmentEvolutionPointDto
{
    public int AssessmentId { get; set; }

    public DateOnly AssessmentDate { get; set; }

    public decimal WeightKg { get; set; }

    public decimal? WaistCm { get; set; }

    public decimal? AbdomenCm { get; set; }

    public decimal? ChestCm { get; set; }

    public decimal? HipCm { get; set; }

    public decimal? SevenSkinfoldSumMm { get; set; }

    public decimal? BodyFatPercentage { get; set; }

    public decimal? FatMassKg { get; set; }

    public decimal? LeanMassKg { get; set; }
}

public class PhysicalAssessmentEvolutionDto
{
    public BodyCompositionProfileDto Profile { get; set; } =
        new();

    public List<PhysicalAssessmentEvolutionPointDto> Points { get; set; } =
        new();
}