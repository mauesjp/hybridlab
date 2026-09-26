namespace HybridLab.Domain.Entities
{
    public class BodyWeightEntry
    {
        public int Id { get; set; }
        public int StudentId { get; set; }
        public decimal WeightKg { get; set; }
        public DateTime RecordedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
