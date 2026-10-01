using HybridLab.Domain.Enums;

namespace HybridLab.Domain.Entities;

public class PhysicalAssessmentPhoto
{
    public int Id { get; set; }

    public int PhysicalAssessmentId { get; set; }

    public PhysicalAssessmentPhotoType Type { get; set; }

    public string StorageKey { get; set; } = string.Empty;

    public string? OriginalFileName { get; set; }

    public string ContentType { get; set; } = string.Empty;

    public long SizeBytes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public PhysicalAssessment PhysicalAssessment { get; set; } = null!;
}