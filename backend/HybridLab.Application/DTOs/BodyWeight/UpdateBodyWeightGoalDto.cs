using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.BodyWeight
{
    public class UpdateBodyWeightGoalDto
    {
        [Range(30, 400)]
        public decimal? GoalWeightKg { get; set; }
    }
}