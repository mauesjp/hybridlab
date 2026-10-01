namespace HybridLab.Domain.Entities
{
    public class StudentProfile
    {
        public int Id { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public DateTime BirthDate { get; set; }
        public decimal? GoalWeightKg { get; set; }
        public DateTime CreatedAt { get; set; }
        public ICollection<RunningWorkout> RunningWorkouts { get; set; } = new List<RunningWorkout>();
        public ICollection<RunningActivity> RunningActivities { get; set; } = new List<RunningActivity>();
        public ICollection<HybridTrainingPlan> HybridTrainingPlans { get; set; } = new List<HybridTrainingPlan>();
        public ICollection<PhysicalAssessment> PhysicalAssessments { get; set; } = new List<PhysicalAssessment>();
    }
}
