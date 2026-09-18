using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.Auth
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "O nome é obrigatório.")]
        [StringLength(100, ErrorMessage = "O nome deve ter no máximo 100 caracteres.")]
        public string DisplayName { get; set; } = string.Empty;

        [Required(ErrorMessage = "O nome de usuário é obrigatório.")]
        [StringLength(50, MinimumLength = 3,
            ErrorMessage = "O nome de usuário deve ter entre 3 e 50 caracteres.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "O e-mail é obrigatório.")]
        [EmailAddress(ErrorMessage = "Informe um e-mail válido.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "A senha é obrigatória.")]
        [MinLength(6, ErrorMessage = "A senha deve ter pelo menos 6 caracteres.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "O tipo de conta é obrigatório.")]
        public string AccountType { get; set; } = string.Empty;

        public DateTime? BirthDate { get; set; }

        public bool CanCoachStrength { get; set; }

        public bool CanCoachRunning { get; set; }
    }
}