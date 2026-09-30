using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<StudentProfile> Students { get; set; } = null!;
    public DbSet<RefreshToken> RefreshTokens { get; set; } = null!;

    public DbSet<StrengthPlan> StrengthPlans { get; set; } = null!;
    public DbSet<StrengthWorkoutDay> StrengthWorkoutDays { get; set; } = null!;
    public DbSet<PlannedExercise> PlannedExercises { get; set; } = null!;

    public DbSet<WorkoutSession> WorkoutSessions { get; set; } = null!;
    public DbSet<WorkoutExercise> WorkoutExercises { get; set; } = null!;
    public DbSet<WorkoutSet> WorkoutSets { get; set; } = null!;

    public DbSet<BodyWeightEntry> BodyWeightEntries { get; set; } = null!;

    public DbSet<RunningWorkout> RunningWorkouts { get; set; } = null!;
    public DbSet<RunningWorkoutBlock> RunningWorkoutBlocks { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<WorkoutSet>()
            .Property(set => set.Weight)
            .HasPrecision(8, 2);

        builder.Entity<WorkoutSet>()
            .Property(set => set.Rpe)
            .HasPrecision(3, 1);

        builder.Entity<BodyWeightEntry>()
            .Property(entry => entry.WeightKg)
            .HasPrecision(5, 2);

        builder.Entity<StudentProfile>()
            .Property(student => student.GoalWeightKg)
            .HasPrecision(5, 2);

        builder.Entity<BodyWeightEntry>()
            .Property(entry => entry.RecordedAt)
            .HasColumnType("date");

        builder.Entity<BodyWeightEntry>()
            .HasIndex(entry => new
            {
                entry.StudentId,
                entry.RecordedAt
            })
            .IsUnique();

        builder.Entity<BodyWeightEntry>()
            .HasOne<StudentProfile>()
            .WithMany()
            .HasForeignKey(entry => entry.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<RunningWorkout>(entity =>
        {
            entity.ToTable("RunningWorkouts");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.ScheduledDate)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => new
            {
                x.StudentId,
                x.ScheduledDate
            });

            entity.HasOne(x => x.Student)
                .WithMany(x => x.RunningWorkouts)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<RunningWorkoutBlock>(entity =>
        {
            entity.ToTable("RunningWorkoutBlocks");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type)
                .IsRequired();

            entity.Property(x => x.Sequence)
                .IsRequired();

            entity.Property(x => x.DistanceKm)
                .HasPrecision(7, 2);

            entity.Property(x => x.DurationSeconds);

            entity.Property(x => x.TargetPaceSecondsPerKm);

            entity.Property(x => x.Repetitions)
                .IsRequired();

            entity.Property(x => x.Notes)
                .HasMaxLength(500);

            entity.HasIndex(x => new
            {
                x.RunningWorkoutId,
                x.Sequence
            });

            entity.HasOne(x => x.RunningWorkout)
                .WithMany(x => x.Blocks)
                .HasForeignKey(x => x.RunningWorkoutId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}