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

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<CoachProfile>()
            .HasIndex(coach => coach.CoachCode)
            .IsUnique();
    }
}