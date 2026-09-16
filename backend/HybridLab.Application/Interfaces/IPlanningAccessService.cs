using HybridLab.Domain.Enums;

namespace HybridLab.Application.Interfaces
{
    public interface IPlanningAccessService
    {
        Task<bool> StudentCanManagePlanningAsync(int studentId, TrainingModality modality);
        Task<bool> CoachCanManageStudentPlanningAsync(int coachId,int studentId, TrainingModality modality);
    }
}
