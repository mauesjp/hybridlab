using HybridLab.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.PhysicalAssessments;

public class PhysicalAssessmentTapeInputDto
{
    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? NeckCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? ShouldersCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? ChestCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? WaistCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? WaistAtNavelCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? AbdomenCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? HipCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? RightArmRelaxedCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? LeftArmRelaxedCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? RightArmFlexedCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? LeftArmFlexedCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? RightThighCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? LeftThighCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? RightCalfCm { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "300",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? LeftCalfCm { get; set; }
}

public class PhysicalAssessmentSkinfoldInputDto
{
    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? ChestMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? AbdomenMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? ThighMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? TricepsMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? SubscapularMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? SuprailiacMm { get; set; }

    [Range(
        typeof(decimal),
        "0.1",
        "200",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? MidaxillaryMm { get; set; }
}

public class CreatePhysicalAssessmentDto
{
    public DateOnly AssessmentDate { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "500",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal WeightKg { get; set; }

    [Range(
        typeof(decimal),
        "50",
        "260",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? HeightCm { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public PhysicalAssessmentTapeInputDto TapeMeasurements { get; set; } =
        new();

    public PhysicalAssessmentSkinfoldInputDto? SkinfoldMeasurements { get; set; }
}

public class UpdatePhysicalAssessmentDto
{
    public DateOnly AssessmentDate { get; set; }

    [Range(
        typeof(decimal),
        "1",
        "500",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal WeightKg { get; set; }

    [Range(
        typeof(decimal),
        "50",
        "260",
        ParseLimitsInInvariantCulture = true,
        ConvertValueInInvariantCulture = true
    )]
    public decimal? HeightCm { get; set; }

    [MaxLength(2000)]
    public string? Notes { get; set; }

    public PhysicalAssessmentTapeInputDto TapeMeasurements { get; set; } =
        new();

    public PhysicalAssessmentSkinfoldInputDto? SkinfoldMeasurements { get; set; }
}

public class PhysicalAssessmentTapeResponseDto
{
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
}

public class PhysicalAssessmentSkinfoldResponseDto
{
    public decimal? ChestMm { get; set; }

    public decimal? AbdomenMm { get; set; }

    public decimal? ThighMm { get; set; }

    public decimal? TricepsMm { get; set; }

    public decimal? SubscapularMm { get; set; }

    public decimal? SuprailiacMm { get; set; }

    public decimal? MidaxillaryMm { get; set; }
}

public class PhysicalAssessmentSummaryDto
{
    public int Id { get; set; }

    public DateOnly AssessmentDate { get; set; }

    public decimal WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    public decimal? WaistCm { get; set; }

    public decimal? AbdomenCm { get; set; }

    public bool HasSkinfoldMeasurements { get; set; }

    public int PhotoCount { get; set; }

    public DateTime CreatedAt { get; set; }
}

public class PhysicalAssessmentResponseDto
{
    public int Id { get; set; }

    public DateOnly AssessmentDate { get; set; }

    public decimal WeightKg { get; set; }

    public decimal? HeightCm { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; }

    public PhysicalAssessmentTapeResponseDto TapeMeasurements { get; set; } =
        new();

    public PhysicalAssessmentSkinfoldResponseDto? SkinfoldMeasurements { get; set; }

    public int PhotoCount { get; set; }
}

public class PhysicalAssessmentPhotoResponseDto
{
    public int Id { get; set; }

    public PhysicalAssessmentPhotoType Type { get; set; }

    public string? OriginalFileName { get; set; }

    public string ContentType { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    public DateTime CreatedAt { get; set; }

    public string Url { get; set; } = string.Empty;
}