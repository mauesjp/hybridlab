using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.CoachLinks
{
    public class CreateCoachLinkRequestDto
    {
        public string CoachCode { get; set; } = string.Empty;
        public TrainingModality Modality { get; set; }
    }
}
