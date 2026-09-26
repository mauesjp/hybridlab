using System.ComponentModel.DataAnnotations;

namespace HybridLab.Application.DTOs.BodyWeight
{
    public class UpdateBodyWeightEntryDto
    {
        [Range(typeof(decimal),"30", "400", ErrorMessage = "Insira um valor entre 30kg e 400kg.")]
        public decimal WeightKg { get; set; }
        public DateTime RecordedAt { get; set; }
    }
}
