using HybridLab.Domain.Enums;

namespace HybridLab.Application.DTOs.Planning
{
    public class PlanningAccessResponseDto
    {
        public TrainingModality Modality { get; set; }
        public bool CanManagePlanning { get; set; }
    }
}
