using HybridLab.Application.Abstractions.Storage;
using HybridLab.Application.DTOs.PhysicalAssessments;
using HybridLab.Domain.Entities;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HybridLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class PhysicalAssessmentsController(
    AppDbContext context,
    IFileStorage fileStorage,
    ILogger<PhysicalAssessmentsController> logger
) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<PhysicalAssessmentSummaryDto>>> GetAll(
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var assessments =
            await context.PhysicalAssessments
                .AsNoTracking()
                .Include(x => x.TapeMeasurements)
                .Include(x => x.SkinfoldMeasurements)
                .Include(x => x.Photos)
                .Where(x => x.StudentId == student.Id)
                .OrderByDescending(x => x.AssessmentDate)
                .ThenByDescending(x => x.Id)
                .ToListAsync(cancellationToken);

        return Ok(
            assessments
                .Select(MapSummary)
                .ToList()
        );
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<PhysicalAssessmentResponseDto>> GetById(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var assessment =
            await QueryAssessment()
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        return Ok(
            MapAssessment(assessment)
        );
    }

    [HttpPost]
    public async Task<ActionResult<PhysicalAssessmentResponseDto>> Create(
        CreatePhysicalAssessmentDto dto,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError =
            ValidateAssessmentDate(dto.AssessmentDate);

        if (validationError is not null)
            return BadRequest(validationError);

        var alreadyExists =
            await context.PhysicalAssessments
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.StudentId == student.Id &&
                        x.AssessmentDate == dto.AssessmentDate,
                    cancellationToken
                );

        if (alreadyExists)
        {
            return Conflict(
                "Já existe uma avaliação física registrada nesta data."
            );
        }

        var assessment =
            new PhysicalAssessment
            {
                StudentId = student.Id,

                AssessmentDate =
                    dto.AssessmentDate,

                WeightKg =
                    dto.WeightKg,

                HeightCm =
                    dto.HeightCm,

                Notes =
                    NormalizeText(dto.Notes),

                CreatedAt =
                    DateTime.UtcNow,

                TapeMeasurements =
                    CreateTapeMeasurements(
                        dto.TapeMeasurements
                    )
            };

        if (
            dto.SkinfoldMeasurements is not null &&
            HasAnySkinfoldMeasurement(
                dto.SkinfoldMeasurements
            )
        )
        {
            assessment.SkinfoldMeasurements =
                CreateSkinfoldMeasurements(
                    dto.SkinfoldMeasurements
                );
        }

        context.PhysicalAssessments.Add(
            assessment
        );

        await SyncBodyWeightAsync(student.Id, dto.AssessmentDate, dto.WeightKg, cancellationToken);

        await context.SaveChangesAsync(
            cancellationToken
        );

        var created =
            await QueryAssessment()
                .SingleAsync(
                    x => x.Id == assessment.Id,
                    cancellationToken
                );

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = assessment.Id
            },
            MapAssessment(created)
        );
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<PhysicalAssessmentResponseDto>> Update(
        int id,
        UpdatePhysicalAssessmentDto dto,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var validationError =
            ValidateAssessmentDate(dto.AssessmentDate);

        if (validationError is not null)
            return BadRequest(validationError);

        var assessment =
            await context.PhysicalAssessments
                .Include(x => x.TapeMeasurements)
                .Include(x => x.SkinfoldMeasurements)
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        var dateConflict =
            await context.PhysicalAssessments
                .AsNoTracking()
                .AnyAsync(
                    x =>
                        x.StudentId == student.Id &&
                        x.AssessmentDate == dto.AssessmentDate &&
                        x.Id != assessment.Id,
                    cancellationToken
                );

        if (dateConflict)
        {
            return Conflict(
                "Já existe outra avaliação física registrada nesta data."
            );
        }

        assessment.AssessmentDate =
            dto.AssessmentDate;

        assessment.WeightKg =
            dto.WeightKg;

        assessment.HeightCm =
            dto.HeightCm;

        assessment.Notes =
            NormalizeText(dto.Notes);

        if (assessment.TapeMeasurements is null)
        {
            assessment.TapeMeasurements =
                CreateTapeMeasurements(
                    dto.TapeMeasurements
                );
        }
        else
        {
            UpdateTapeMeasurements(
                assessment.TapeMeasurements,
                dto.TapeMeasurements
            );
        }

        if (
            dto.SkinfoldMeasurements is null ||
            !HasAnySkinfoldMeasurement(
                dto.SkinfoldMeasurements
            )
        )
        {
            if (
                assessment.SkinfoldMeasurements is not null
            )
            {
                context
                    .PhysicalAssessmentSkinfoldMeasurements
                    .Remove(
                        assessment.SkinfoldMeasurements
                    );

                assessment.SkinfoldMeasurements =
                    null;
            }
        }
        else if (
            assessment.SkinfoldMeasurements is null
        )
        {
            assessment.SkinfoldMeasurements =
                CreateSkinfoldMeasurements(
                    dto.SkinfoldMeasurements
                );
        }
        else
        {
            UpdateSkinfoldMeasurements(
                assessment.SkinfoldMeasurements,
                dto.SkinfoldMeasurements
            );
        }

        await SyncBodyWeightAsync(
            student.Id,
            dto.AssessmentDate,
            dto.WeightKg,
            cancellationToken
        );

        await context.SaveChangesAsync(
            cancellationToken
        );

        var updated =
            await QueryAssessment()
                .SingleAsync(
                    x => x.Id == assessment.Id,
                    cancellationToken
                );

        return Ok(
            MapAssessment(updated)
        );
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student = await GetCurrentStudent(cancellationToken);

        if (student is null)
            return Unauthorized();

        var assessment =
            await context.PhysicalAssessments
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        context.PhysicalAssessments.Remove(
            assessment
        );

        await context.SaveChangesAsync(
            cancellationToken
        );

        return NoContent();
    }

    [HttpPost("{id:int}/photos/{type}")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhysicalAssessmentPhotoResponseDto>> UploadPhoto(
        int id,
        PhysicalAssessmentPhotoType type,
        IFormFile file,
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var assessment =
            await context.PhysicalAssessments
                .Include(x => x.Photos)
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        if (file is null || file.Length == 0)
        {
            return BadRequest(
                "Selecione uma imagem."
            );
        }

        const long maxFileSize =
            10 * 1024 * 1024;

        if (file.Length > maxFileSize)
        {
            return BadRequest(
                "A imagem deve ter no máximo 10 MB."
            );
        }

        var extension =
            GetImageExtension(
                file.ContentType
            );

        if (extension is null)
        {
            return BadRequest(
                "Formato não permitido. Utilize JPEG, PNG ou WebP."
            );
        }

        var existingPhoto =
            assessment.Photos
                .SingleOrDefault(
                    x => x.Type == type
                );

        var newStorageKey =
            $"students/{student.Id}/physical-assessments/{assessment.Id}/{type.ToString().ToLowerInvariant()}-{Guid.NewGuid():N}{extension}";

        await using var stream =
            file.OpenReadStream();

        await fileStorage.UploadAsync(
            newStorageKey,
            stream,
            file.ContentType,
            cancellationToken
        );

        string? oldStorageKey =
            existingPhoto?.StorageKey;

        try
        {
            if (existingPhoto is null)
            {
                existingPhoto =
                    new PhysicalAssessmentPhoto
                    {
                        PhysicalAssessmentId =
                            assessment.Id,

                        Type =
                            type,

                        StorageKey =
                            newStorageKey,

                        OriginalFileName =
                            Path.GetFileName(
                                file.FileName
                            ),

                        ContentType =
                            file.ContentType,

                        SizeBytes =
                            file.Length,

                        CreatedAt =
                            DateTime.UtcNow
                    };

                context
                    .PhysicalAssessmentPhotos
                    .Add(existingPhoto);
            }
            else
            {
                existingPhoto.StorageKey =
                    newStorageKey;

                existingPhoto.OriginalFileName =
                    Path.GetFileName(
                        file.FileName
                    );

                existingPhoto.ContentType =
                    file.ContentType;

                existingPhoto.SizeBytes =
                    file.Length;

                existingPhoto.CreatedAt =
                    DateTime.UtcNow;
            }

            await context.SaveChangesAsync(
                cancellationToken
            );
        }
        catch
        {
            await fileStorage.DeleteAsync(
                newStorageKey,
                cancellationToken
            );

            throw;
        }

        if (
            !string.IsNullOrWhiteSpace(oldStorageKey) &&
            oldStorageKey != newStorageKey
        )
        {
            try
            {
                await fileStorage.DeleteAsync(
                    oldStorageKey,
                    cancellationToken
                );
            }
            catch (Exception ex)
            {
                logger.LogWarning(
                    ex,
                    "Não foi possível remover o arquivo antigo {StorageKey}.",
                    oldStorageKey
                );
            }
        }

        var url =
            await fileStorage.GetReadUrlAsync(
                existingPhoto.StorageKey,
                TimeSpan.FromMinutes(10)
            );

        return Ok(
            MapPhoto(
                existingPhoto,
                url
            )
        );
    }

    [HttpGet("{id:int}/photos")]
    public async Task<ActionResult<List<PhysicalAssessmentPhotoResponseDto>>> GetPhotos(
        int id,
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var assessment =
            await context.PhysicalAssessments
                .AsNoTracking()
                .Include(x => x.Photos)
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        var result =
            new List<PhysicalAssessmentPhotoResponseDto>();

        foreach (
            var photo in assessment.Photos
                .OrderBy(x => x.Type)
        )
        {
            var url =
                await fileStorage.GetReadUrlAsync(
                    photo.StorageKey,
                    TimeSpan.FromMinutes(10)
                );

            result.Add(
                MapPhoto(
                    photo,
                    url
                )
            );
        }

        return Ok(result);
    }

    [HttpDelete("{id:int}/photos/{type}")]
    public async Task<IActionResult> DeletePhoto(
        int id,
        PhysicalAssessmentPhotoType type,
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var photo =
            await context.PhysicalAssessmentPhotos
                .Include(x => x.PhysicalAssessment)
                .SingleOrDefaultAsync(
                    x =>
                        x.PhysicalAssessmentId == id &&
                        x.Type == type &&
                        x.PhysicalAssessment.StudentId == student.Id,
                    cancellationToken
                );

        if (photo is null)
            return NotFound();

        var storageKey =
            photo.StorageKey;

        context
            .PhysicalAssessmentPhotos
            .Remove(photo);

        await context.SaveChangesAsync(
            cancellationToken
        );

        try
        {
            await fileStorage.DeleteAsync(
                storageKey,
                cancellationToken
            );
        }
        catch (Exception ex)
        {
            logger.LogWarning(
                ex,
                "Foto removida do banco, mas não foi possível remover {StorageKey} do storage.",
                storageKey
            );
        }

        return NoContent();
    }

    private IQueryable<PhysicalAssessment> QueryAssessment()
    {
        return context.PhysicalAssessments
            .AsNoTracking()
            .Include(x => x.TapeMeasurements)
            .Include(x => x.SkinfoldMeasurements)
            .Include(x => x.Photos);
    }

    private async Task<StudentProfile?> GetCurrentStudent(
        CancellationToken cancellationToken
    )
    {
        var userId =
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            )
            ??
            User.FindFirstValue("sub");

        if (string.IsNullOrWhiteSpace(userId))
            return null;

        return await context.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x => x.UserId == userId,
                cancellationToken
            );
    }

    private static string? ValidateAssessmentDate(
        DateOnly date
    )
    {
        if (date == default)
            return "Informe a data da avaliação.";

        var today =
            DateOnly.FromDateTime(
                DateTime.UtcNow
            );

        if (date > today)
            return "A avaliação física não pode estar no futuro.";

        return null;
    }

    private static PhysicalAssessmentTapeMeasurements CreateTapeMeasurements(
        PhysicalAssessmentTapeInputDto dto
    )
    {
        var entity =
            new PhysicalAssessmentTapeMeasurements();

        UpdateTapeMeasurements(
            entity,
            dto
        );

        return entity;
    }

    private static void UpdateTapeMeasurements(
        PhysicalAssessmentTapeMeasurements entity,
        PhysicalAssessmentTapeInputDto dto
    )
    {
        entity.NeckCm =
            dto.NeckCm;

        entity.ShouldersCm =
            dto.ShouldersCm;

        entity.ChestCm =
            dto.ChestCm;

        entity.WaistCm =
            dto.WaistCm;

        entity.WaistAtNavelCm =
            dto.WaistAtNavelCm;

        entity.AbdomenCm =
            dto.AbdomenCm;

        entity.HipCm =
            dto.HipCm;

        entity.RightArmRelaxedCm =
            dto.RightArmRelaxedCm;

        entity.LeftArmRelaxedCm =
            dto.LeftArmRelaxedCm;

        entity.RightArmFlexedCm =
            dto.RightArmFlexedCm;

        entity.LeftArmFlexedCm =
            dto.LeftArmFlexedCm;

        entity.RightThighCm =
            dto.RightThighCm;

        entity.LeftThighCm =
            dto.LeftThighCm;

        entity.RightCalfCm =
            dto.RightCalfCm;

        entity.LeftCalfCm =
            dto.LeftCalfCm;
    }

    private static PhysicalAssessmentSkinfoldMeasurements CreateSkinfoldMeasurements(
        PhysicalAssessmentSkinfoldInputDto dto
    )
    {
        var entity =
            new PhysicalAssessmentSkinfoldMeasurements();

        UpdateSkinfoldMeasurements(
            entity,
            dto
        );

        return entity;
    }

    private static void UpdateSkinfoldMeasurements(
        PhysicalAssessmentSkinfoldMeasurements entity,
        PhysicalAssessmentSkinfoldInputDto dto
    )
    {
        entity.ChestMm =
            dto.ChestMm;

        entity.AbdomenMm =
            dto.AbdomenMm;

        entity.ThighMm =
            dto.ThighMm;

        entity.TricepsMm =
            dto.TricepsMm;

        entity.SubscapularMm =
            dto.SubscapularMm;

        entity.SuprailiacMm =
            dto.SuprailiacMm;

        entity.MidaxillaryMm =
            dto.MidaxillaryMm;
    }

    private static bool HasAnySkinfoldMeasurement(
        PhysicalAssessmentSkinfoldInputDto dto
    )
    {
        return
            dto.ChestMm is not null ||
            dto.AbdomenMm is not null ||
            dto.ThighMm is not null ||
            dto.TricepsMm is not null ||
            dto.SubscapularMm is not null ||
            dto.SuprailiacMm is not null ||
            dto.MidaxillaryMm is not null;
    }

    private static PhysicalAssessmentSummaryDto MapSummary(
        PhysicalAssessment assessment
    )
    {
        return new PhysicalAssessmentSummaryDto
        {
            Id =
                assessment.Id,

            AssessmentDate =
                assessment.AssessmentDate,

            WeightKg =
                assessment.WeightKg,

            HeightCm =
                assessment.HeightCm,

            WaistCm =
                assessment.TapeMeasurements?.WaistCm,

            AbdomenCm =
                assessment.TapeMeasurements?.AbdomenCm,

            HasSkinfoldMeasurements =
                assessment.SkinfoldMeasurements is not null,

            PhotoCount =
                assessment.Photos.Count,

            CreatedAt =
                assessment.CreatedAt
        };
    }

    private static PhysicalAssessmentResponseDto MapAssessment(
        PhysicalAssessment assessment
    )
    {
        return new PhysicalAssessmentResponseDto
        {
            Id =
                assessment.Id,

            AssessmentDate =
                assessment.AssessmentDate,

            WeightKg =
                assessment.WeightKg,

            HeightCm =
                assessment.HeightCm,

            Notes =
                assessment.Notes,

            CreatedAt =
                assessment.CreatedAt,

            TapeMeasurements =
                MapTapeMeasurements(
                    assessment.TapeMeasurements
                ),

            SkinfoldMeasurements =
                assessment.SkinfoldMeasurements is null
                    ? null
                    : MapSkinfoldMeasurements(
                        assessment.SkinfoldMeasurements
                    ),

            PhotoCount =
                assessment.Photos.Count
        };
    }

    private static PhysicalAssessmentTapeResponseDto MapTapeMeasurements(
        PhysicalAssessmentTapeMeasurements? measurements
    )
    {
        if (measurements is null)
            return new();

        return new PhysicalAssessmentTapeResponseDto
        {
            NeckCm =
                measurements.NeckCm,

            ShouldersCm =
                measurements.ShouldersCm,

            ChestCm =
                measurements.ChestCm,

            WaistCm =
                measurements.WaistCm,

            WaistAtNavelCm =
                measurements.WaistAtNavelCm,

            AbdomenCm =
                measurements.AbdomenCm,

            HipCm =
                measurements.HipCm,

            RightArmRelaxedCm =
                measurements.RightArmRelaxedCm,

            LeftArmRelaxedCm =
                measurements.LeftArmRelaxedCm,

            RightArmFlexedCm =
                measurements.RightArmFlexedCm,

            LeftArmFlexedCm =
                measurements.LeftArmFlexedCm,

            RightThighCm =
                measurements.RightThighCm,

            LeftThighCm =
                measurements.LeftThighCm,

            RightCalfCm =
                measurements.RightCalfCm,

            LeftCalfCm =
                measurements.LeftCalfCm
        };
    }

    private static PhysicalAssessmentSkinfoldResponseDto MapSkinfoldMeasurements(
        PhysicalAssessmentSkinfoldMeasurements measurements
    )
    {
        return new PhysicalAssessmentSkinfoldResponseDto
        {
            ChestMm =
                measurements.ChestMm,

            AbdomenMm =
                measurements.AbdomenMm,

            ThighMm =
                measurements.ThighMm,

            TricepsMm =
                measurements.TricepsMm,

            SubscapularMm =
                measurements.SubscapularMm,

            SuprailiacMm =
                measurements.SuprailiacMm,

            MidaxillaryMm =
                measurements.MidaxillaryMm
        };
    }

    private async Task SyncBodyWeightAsync(
        int studentId,
        DateOnly assessmentDate,
        decimal weightKg,
        CancellationToken cancellationToken
    )
    {
        var recordedAt =
            assessmentDate.ToDateTime(
                TimeOnly.MinValue
            );

        var bodyWeightEntry =
            await context.BodyWeightEntries
                .SingleOrDefaultAsync(
                    x =>
                        x.StudentId == studentId &&
                        x.RecordedAt == recordedAt,
                    cancellationToken
                );

        if (bodyWeightEntry is null)
        {
            context.BodyWeightEntries.Add(
                new BodyWeightEntry
                {
                    StudentId = studentId,
                    WeightKg = weightKg,
                    RecordedAt = recordedAt,
                    CreatedAt = DateTime.UtcNow
                }
            );

            return;
        }

        bodyWeightEntry.WeightKg =
            weightKg;
    }

    private static string? NormalizeText(
        string? value
    )
    {
        return string.IsNullOrWhiteSpace(value)
            ? null
            : value.Trim();
    }

    private static string? GetImageExtension(
        string contentType
    )
    {
        return contentType.ToLowerInvariant() switch
        {
            "image/jpeg" => ".jpg",
            "image/png" => ".png",
            "image/webp" => ".webp",
            _ => null
        };
    }

    private static PhysicalAssessmentPhotoResponseDto MapPhoto(
        PhysicalAssessmentPhoto photo,
        string url
    )
    {
        return new PhysicalAssessmentPhotoResponseDto
        {
            Id =
                photo.Id,

            Type =
                photo.Type,

            OriginalFileName =
                photo.OriginalFileName,

            ContentType =
                photo.ContentType,

            SizeBytes =
                photo.SizeBytes,

            CreatedAt =
                photo.CreatedAt,

            Url =
                url
        };
    }
}