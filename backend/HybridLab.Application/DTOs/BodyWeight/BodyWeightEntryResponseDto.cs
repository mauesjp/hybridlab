namespace HybridLab.Application.DTOs.BodyWeight
{
    public class BodyWeightEntryResponseDto
    {
        public int Id { get; set; }
        public decimal WeightKg { get; set; }
        public DateTime RecordedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
