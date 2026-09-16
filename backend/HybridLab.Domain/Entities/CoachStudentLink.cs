using HybridLab.Domain.Enums;

namespace HybridLab.Domain.Entities
{
    public class CoachStudentLink
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public int CoachId { get; set; }
        public TrainingModality Modality { get; set; }
        public LinkStatus Status { get; set; }
        public DateTime RequestedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public DateTime? UnlinkedAt { get; set; }
    }
}
