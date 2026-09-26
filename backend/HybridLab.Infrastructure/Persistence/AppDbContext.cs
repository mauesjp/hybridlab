using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<StudentProfile> Students { get; set; } = null!;
    public DbSet<CoachProfile> Coaches { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;
    public DbSet<CoachStudentLink> CoachStudentLinks { get; set; } = null!;
    public DbSet<StrengthPlan> StrengthPlans { get; set; } = null!;
    public DbSet<StrengthWorkoutDay> StrengthWorkoutDays { get; set; } = null!;
    public DbSet<PlannedExercise> PlannedExercises { get; set; } = null!;
    public DbSet<WorkoutSession> WorkoutSessions { get; set; } = null!;
    public DbSet<WorkoutExercise> WorkoutExercises { get; set; } = null!;
    public DbSet<WorkoutSet> WorkoutSets { get; set; } = null!;
    public DbSet<BodyWeightEntry> BodyWeightEntries { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<WorkoutSet>()
            .Property(set => set.Weight)
            .HasPrecision(8, 2);

        builder.Entity<WorkoutSet>()
            .Property(set => set.Rpe)
            .HasPrecision(3, 1);

        builder.Entity<CoachProfile>()
            .HasIndex(coach => coach.CoachCode)
            .IsUnique();

        builder.Entity<BodyWeightEntry>()
            .Property(entry => entry.WeightKg)
            .HasPrecision(5, 2);

        builder.Entity<BodyWeightEntry>()
            .HasIndex(entry => new
            {
                entry.StudentId,
                entry.RecordedAt
            });

        builder.Entity<BodyWeightEntry>()
            .HasOne<StudentProfile>()
            .WithMany()
            .HasForeignKey(entry => entry.StudentId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}