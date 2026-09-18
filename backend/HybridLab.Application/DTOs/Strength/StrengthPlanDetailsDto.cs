namespace HybridLab.Application.DTOs.Strength
{
    public class StrengthPlanDetailsDto
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public string Name { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime CreatedAt { get; set; }
        public int VersionNumber { get; set; }
        public int? PreviousVersionId { get; set; }
        public bool IsPublished { get; set; }
        public DateTime? PublishedAt { get; set; }

        public List<StrengthWorkoutDayDetailsDto> Days { get; set; } = new();
    }

    public class StrengthWorkoutDayDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; }

        public List<PlannedExerciseDetailsDto> Exercises { get; set; } = new();
    }

    public class PlannedExerciseDetailsDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int Order { get; set; }
        public int TargetSets { get; set; }
        public int MinReps { get; set; }
        public int MaxReps { get; set; }
        public int? TargetRir { get; set; }
        public string? Notes { get; set; }
    }
}
