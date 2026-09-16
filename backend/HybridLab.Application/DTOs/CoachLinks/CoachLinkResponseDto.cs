using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.CoachLinks
{
    public class CoachLinkResponseDto
    {
        public int Id { get; set; }
        public int CoachId { get; set; }
        public string CoachName { get; set; } = string.Empty;
        public TrainingModality Modality { get; set; }
        public LinkStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
    }
}
