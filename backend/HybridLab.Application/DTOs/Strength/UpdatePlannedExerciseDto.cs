using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.Strength
{
    public class UpdatePlannedExerciseDto : IValidatableObject
    {
        [Required(ErrorMessage = "O nome do exercício é obrigatório.")]
        [StringLength(100, ErrorMessage = "O nome do exercício deve ter no máximo 100 caracteres.")]
        public string Name { get; set; } = string.Empty;

        [Range(1, int.MaxValue, ErrorMessage = "A ordem deve ser maior que zero.")]
        public int Order { get; set; }

        [Range(1, 20, ErrorMessage = "A quantidade de séries deve estar entre 1 e 20.")]
        public int TargetSets { get; set; }

        [Range(1, 100, ErrorMessage = "O mínimo de repetições deve estar entre 1 e 100.")]
        public int MinReps { get; set; }

        [Range(1, 100, ErrorMessage = "O máximo de repetições deve estar entre 1 e 100.")]
        public int MaxReps { get; set; }

        [Range(0, 10, ErrorMessage = "O RIR deve estar entre 0 e 10.")]
        public int? TargetRir { get; set; }

        [StringLength(500, ErrorMessage = "A observação deve ter no máximo 500 caracteres.")]
        public string? Notes { get; set; }

        public IEnumerable<ValidationResult> Validate(
            ValidationContext validationContext)
        {
            if (MinReps > MaxReps)
            {
                yield return new ValidationResult(
                    "O mínimo de repetições não pode ser maior que o máximo.",
                    new[] { nameof(MinReps), nameof(MaxReps) }
                );
            }
        }
    }
}