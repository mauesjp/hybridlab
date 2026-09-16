using HybridLab.Application.Interfaces;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.Infrastructure.Services
{
    public class PlanningAccessService : IPlanningAccessService
    {
        private readonly AppDbContext _context;

        public PlanningAccessService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> StudentCanManagePlanningAsync(int studentId, TrainingModality modality)
        {
            return !await _context.CoachStudentLinks
                .AnyAsync(link =>
                    link.StudentId == studentId && 
                    link.Modality == modality && 
                    link.Status == LinkStatus.Accepted);
        }

        public async Task<bool> CoachCanManageStudentPlanningAsync(int coachId, int studentId, TrainingModality modality)
        {
            return await _context.CoachStudentLinks
                .AnyAsync(link => 
                    link.CoachId == coachId && 
                    link.StudentId == studentId && 
                    link.Modality == modality && 
                    link.Status == LinkStatus.Accepted);
        }
    }
}
