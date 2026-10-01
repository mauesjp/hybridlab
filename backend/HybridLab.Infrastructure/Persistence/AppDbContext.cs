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
    public DbSet<RunningActivity> RunningActivities { get; set; } = null!;
    public DbSet<HybridTrainingPlan> HybridTrainingPlans { get; set; } = null!;
    public DbSet<HybridTrainingWeek> HybridTrainingWeeks { get; set; } = null!;
    public DbSet<HybridWeekSession> HybridWeekSessions { get; set; } = null!;

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

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => x.StudentId);

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

        builder.Entity<RunningActivity>(entity =>
        {
            entity.ToTable("RunningActivities");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.ActivityDate)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(x => x.DistanceKm)
                .HasPrecision(7, 2)
                .IsRequired();

            entity.Property(x => x.DurationSeconds)
                .IsRequired();

            entity.Property(x => x.AverageHeartRate);

            entity.Property(x => x.Rpe)
                .HasPrecision(3, 1);

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.Property(x => x.Source)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => new
            {
                x.StudentId,
                x.ActivityDate
            });

            entity.HasOne(x => x.Student)
                .WithMany(x => x.RunningActivities)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HybridTrainingPlan>(entity =>
        {
            entity.ToTable("HybridTrainingPlans");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Name)
                .HasMaxLength(150)
                .IsRequired();

            entity.Property(x => x.StartDate)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(x => x.IsActive)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => x.StudentId);

            entity.HasIndex(x => new
            {
                x.StudentId,
                x.IsActive
            });

            entity.HasOne(x => x.Student)
                .WithMany(x => x.HybridTrainingPlans)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Weeks)
                .WithOne(x => x.HybridTrainingPlan)
                .HasForeignKey(x => x.HybridTrainingPlanId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HybridTrainingWeek>(entity =>
        {
            entity.ToTable("HybridTrainingWeeks");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.WeekNumber)
                .IsRequired();

            entity.Property(x => x.Name)
                .HasMaxLength(150);

            entity.Property(x => x.Notes)
                .HasMaxLength(1000);

            entity.HasIndex(x => new
            {
                x.HybridTrainingPlanId,
                x.WeekNumber
            })
            .IsUnique();

            entity.HasMany(x => x.Sessions)
                .WithOne(x => x.HybridTrainingWeek)
                .HasForeignKey(x => x.HybridTrainingWeekId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<HybridWeekSession>(entity =>
        {
            entity.ToTable("HybridWeekSessions");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.DayOfWeek)
                .IsRequired();

            entity.Property(x => x.SessionType)
                .IsRequired();

            entity.Property(x => x.Period)
                .IsRequired();

            entity.Property(x => x.Sequence)
                .IsRequired();

            entity.Property(x => x.Notes)
                .HasMaxLength(500);

            entity.HasIndex(x => new
            {
                x.HybridTrainingWeekId,
                x.DayOfWeek,
                x.Sequence
            });

            entity.HasIndex(x => x.StrengthWorkoutDayId);

            entity.HasIndex(x => x.RunningWorkoutId);

            entity.HasOne(x => x.StrengthWorkoutDay)
                .WithMany()
                .HasForeignKey(x => x.StrengthWorkoutDayId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(x => x.RunningWorkout)
                .WithMany()
                .HasForeignKey(x => x.RunningWorkoutId)
                .OnDelete(DeleteBehavior.SetNull);
        });
    }
}