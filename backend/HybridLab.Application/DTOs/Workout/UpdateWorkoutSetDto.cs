using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.Workout
{
    public class UpdateWorkoutSetDto
    {
        [Range(0, 10000, ErrorMessage = "A carga deve ser maior ou igual a zero.")]
        public decimal? Weight { get; set; }

        [Range(1, 100, ErrorMessage = "As repetições devem estar entre 1 e 100.")]
        public int Reps { get; set; }

        [Range(0, 10, ErrorMessage = "O RIR deve estar entre 0 e 10.")]
        public int? Rir { get; set; }

        [Range(0, 10, ErrorMessage = "O RPE deve estar entre 0 e 10.")]
        public decimal? Rpe { get; set; }
    }
}
