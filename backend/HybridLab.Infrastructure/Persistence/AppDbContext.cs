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
    public DbSet<PhysicalAssessment> PhysicalAssessments { get; set; } = null!;
    public DbSet<PhysicalAssessmentTapeMeasurements> PhysicalAssessmentTapeMeasurements { get; set; } = null!;
    public DbSet<PhysicalAssessmentSkinfoldMeasurements> PhysicalAssessmentSkinfoldMeasurements { get; set; } = null!;
    public DbSet<PhysicalAssessmentPhoto> PhysicalAssessmentPhotos { get; set; } = null!;

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

        builder.Entity<StudentProfile>(entity =>
        {
            entity.Property(student => student.GoalWeightKg)
                .HasPrecision(5, 2);

            entity.Property(student => student.BirthDate)
                .HasColumnType("date");

            entity.Property(student => student.BiologicalSex);
        });

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

        builder.Entity<PhysicalAssessment>(entity =>
        {
            entity.ToTable("PhysicalAssessments");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.AssessmentDate)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(x => x.WeightKg)
                .HasPrecision(6, 2)
                .IsRequired();

            entity.Property(x => x.HeightCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.Notes)
                .HasMaxLength(2000);

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => new
            {
                x.StudentId,
                x.AssessmentDate
            })
            .IsUnique();

            entity.HasOne(x => x.Student)
                .WithMany(x => x.PhysicalAssessments)
                .HasForeignKey(x => x.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.TapeMeasurements)
                .WithOne(x => x.PhysicalAssessment)
                .HasForeignKey<PhysicalAssessmentTapeMeasurements>(
                    x => x.PhysicalAssessmentId
                )
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(x => x.SkinfoldMeasurements)
                .WithOne(x => x.PhysicalAssessment)
                .HasForeignKey<PhysicalAssessmentSkinfoldMeasurements>(
                    x => x.PhysicalAssessmentId
                )
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(x => x.Photos)
                .WithOne(x => x.PhysicalAssessment)
                .HasForeignKey(x => x.PhysicalAssessmentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PhysicalAssessmentTapeMeasurements>(entity =>
        {
            entity.ToTable("PhysicalAssessmentTapeMeasurements");

            entity.HasKey(x => x.PhysicalAssessmentId);

            entity.Property(x => x.NeckCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.ShouldersCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.ChestCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.WaistCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.WaistAtNavelCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.AbdomenCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.HipCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.RightArmRelaxedCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.LeftArmRelaxedCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.RightArmFlexedCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.LeftArmFlexedCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.RightThighCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.LeftThighCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.RightCalfCm)
                .HasPrecision(6, 2);

            entity.Property(x => x.LeftCalfCm)
                .HasPrecision(6, 2);
        });

        builder.Entity<PhysicalAssessmentSkinfoldMeasurements>(entity =>
        {
            entity.ToTable("PhysicalAssessmentSkinfoldMeasurements");

            entity.HasKey(x => x.PhysicalAssessmentId);

            entity.Property(x => x.ChestMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.AbdomenMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.ThighMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.TricepsMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.SubscapularMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.SuprailiacMm)
                .HasPrecision(6, 2);

            entity.Property(x => x.MidaxillaryMm)
                .HasPrecision(6, 2);
        });

        builder.Entity<PhysicalAssessmentPhoto>(entity =>
        {
            entity.ToTable("PhysicalAssessmentPhotos");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.Type)
                .IsRequired();

            entity.Property(x => x.StorageKey)
                .HasMaxLength(500)
                .IsRequired();

            entity.Property(x => x.OriginalFileName)
                .HasMaxLength(255);

            entity.Property(x => x.ContentType)
                .HasMaxLength(100)
                .IsRequired();

            entity.Property(x => x.SizeBytes)
                .IsRequired();

            entity.Property(x => x.CreatedAt)
                .IsRequired();

            entity.HasIndex(x => x.PhysicalAssessmentId);

            entity.HasIndex(x => new
            {
                x.PhysicalAssessmentId,
                x.Type
            })
            .IsUnique();
        });
    }
}