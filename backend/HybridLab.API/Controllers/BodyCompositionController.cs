using System.Security.Claims;
using HybridLab.Application.DTOs.PhysicalAssessments;
using HybridLab.Application.Services;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace HybridLab.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Student")]
public class BodyCompositionController(
    AppDbContext context
) : ControllerBase
{
    [HttpGet("profile")]
    public async Task<ActionResult<BodyCompositionProfileDto>> GetProfile(
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        return Ok(
            new BodyCompositionProfileDto
            {
                BirthDate =
                    student.BirthDate,

                BiologicalSex =
                    student.BiologicalSex
            }
        );
    }

    [HttpPut("profile")]
    public async Task<ActionResult<BodyCompositionProfileDto>> UpdateProfile(
        UpdateBodyCompositionProfileDto dto,
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudentTracked(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var today =
            DateOnly.FromDateTime(
                DateTime.UtcNow
            );

        if (
            dto.BirthDate >
            today
        )
        {
            return BadRequest(
                "A data de nascimento não pode estar no futuro."
            );
        }

        student.BirthDate =
            dto.BirthDate;

        student.BiologicalSex =
            dto.BiologicalSex;

        await context.SaveChangesAsync(
            cancellationToken
        );

        return Ok(
            new BodyCompositionProfileDto
            {
                BirthDate =
                    student.BirthDate,

                BiologicalSex =
                    student.BiologicalSex
            }
        );
    }

    [HttpGet("assessments/{id:int}")]
    public async Task<ActionResult<BodyCompositionResultDto>> GetAssessmentComposition(
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
            await AssessmentQuery()
                .SingleOrDefaultAsync(
                    x =>
                        x.Id == id &&
                        x.StudentId == student.Id,
                    cancellationToken
                );

        if (assessment is null)
            return NotFound();

        return Ok(
            BodyCompositionCalculator.Calculate(
                assessment,
                student.BirthDate,
                student.BiologicalSex
            )
        );
    }

    [HttpGet("evolution")]
    public async Task<ActionResult<PhysicalAssessmentEvolutionDto>> GetEvolution(
        CancellationToken cancellationToken
    )
    {
        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var assessments =
            await AssessmentQuery()
                .Where(
                    x =>
                        x.StudentId ==
                        student.Id
                )
                .OrderBy(
                    x =>
                        x.AssessmentDate
                )
                .ThenBy(
                    x =>
                        x.Id
                )
                .ToListAsync(
                    cancellationToken
                );

        var result =
            new PhysicalAssessmentEvolutionDto
            {
                Profile =
                    new BodyCompositionProfileDto
                    {
                        BirthDate =
                            student.BirthDate,

                        BiologicalSex =
                            student.BiologicalSex
                    }
            };

        foreach (
            var assessment in assessments
        )
        {
            var composition =
                BodyCompositionCalculator.Calculate(
                    assessment,
                    student.BirthDate,
                    student.BiologicalSex
                );

            result.Points.Add(
                new PhysicalAssessmentEvolutionPointDto
                {
                    AssessmentId =
                        assessment.Id,

                    AssessmentDate =
                        assessment.AssessmentDate,

                    WeightKg =
                        assessment.WeightKg,

                    WaistCm =
                        assessment
                            .TapeMeasurements?
                            .WaistCm,

                    AbdomenCm =
                        assessment
                            .TapeMeasurements?
                            .AbdomenCm,

                    ChestCm =
                        assessment
                            .TapeMeasurements?
                            .ChestCm,

                    HipCm =
                        assessment
                            .TapeMeasurements?
                            .HipCm,

                    SevenSkinfoldSumMm =
                        composition
                            .SevenSkinfoldSumMm,

                    BodyFatPercentage =
                        composition
                            .BodyFatPercentage,

                    FatMassKg =
                        composition
                            .FatMassKg,

                    LeanMassKg =
                        composition
                            .LeanMassKg
                }
            );
        }

        return Ok(result);
    }

    [HttpGet("compare")]
    public async Task<ActionResult<BodyCompositionComparisonDto>> Compare(
        [FromQuery] int firstAssessmentId,
        [FromQuery] int secondAssessmentId,
        CancellationToken cancellationToken
    )
    {
        if (
            firstAssessmentId ==
            secondAssessmentId
        )
        {
            return BadRequest(
                "Selecione duas avaliações diferentes."
            );
        }

        var student =
            await GetCurrentStudent(
                cancellationToken
            );

        if (student is null)
            return Unauthorized();

        var assessments =
            await AssessmentQuery()
                .Where(
                    x =>
                        x.StudentId ==
                            student.Id &&
                        (
                            x.Id ==
                                firstAssessmentId ||
                            x.Id ==
                                secondAssessmentId
                        )
                )
                .ToListAsync(
                    cancellationToken
                );

        var first =
            assessments.SingleOrDefault(
                x =>
                    x.Id ==
                    firstAssessmentId
            );

        var second =
            assessments.SingleOrDefault(
                x =>
                    x.Id ==
                    secondAssessmentId
            );

        if (
            first is null ||
            second is null
        )
        {
            return NotFound(
                "Uma ou mais avaliações não foram encontradas."
            );
        }

        var firstComposition =
            BodyCompositionCalculator.Calculate(
                first,
                student.BirthDate,
                student.BiologicalSex
            );

        var secondComposition =
            BodyCompositionCalculator.Calculate(
                second,
                student.BirthDate,
                student.BiologicalSex
            );

        var result =
            new BodyCompositionComparisonDto
            {
                First =
                    firstComposition,

                Second =
                    secondComposition,

                WeightChangeKg =
                    Round(
                        second.WeightKg -
                        first.WeightKg
                    ),

                BodyFatChangePercentagePoints =
                    Difference(
                        firstComposition.BodyFatPercentage,
                        secondComposition.BodyFatPercentage
                    ),

                FatMassChangeKg =
                    Difference(
                        firstComposition.FatMassKg,
                        secondComposition.FatMassKg
                    ),

                LeanMassChangeKg =
                    Difference(
                        firstComposition.LeanMassKg,
                        secondComposition.LeanMassKg
                    ),

                SevenSkinfoldSumChangeMm =
                    Difference(
                        firstComposition.SevenSkinfoldSumMm,
                        secondComposition.SevenSkinfoldSumMm
                    )
            };

        return Ok(result);
    }

    private IQueryable<PhysicalAssessment> AssessmentQuery()
    {
        return context.PhysicalAssessments
            .AsNoTracking()
            .Include(
                x =>
                    x.TapeMeasurements
            )
            .Include(
                x =>
                    x.SkinfoldMeasurements
            );
    }

    private async Task<StudentProfile?> GetCurrentStudent(
        CancellationToken cancellationToken
    )
    {
        var userId =
            GetUserId();

        if (
            string.IsNullOrWhiteSpace(
                userId
            )
        )
        {
            return null;
        }

        return await context.Students
            .AsNoTracking()
            .SingleOrDefaultAsync(
                x =>
                    x.UserId ==
                    userId,
                cancellationToken
            );
    }

    private async Task<StudentProfile?> GetCurrentStudentTracked(
        CancellationToken cancellationToken
    )
    {
        var userId =
            GetUserId();

        if (
            string.IsNullOrWhiteSpace(
                userId
            )
        )
        {
            return null;
        }

        return await context.Students
            .SingleOrDefaultAsync(
                x =>
                    x.UserId ==
                    userId,
                cancellationToken
            );
    }

    private string? GetUserId()
    {
        return
            User.FindFirstValue(
                ClaimTypes.NameIdentifier
            )
            ??
            User.FindFirstValue(
                "sub"
            );
    }

    private static decimal? Difference(
        decimal? first,
        decimal? second
    )
    {
        if (
            first is null ||
            second is null
        )
        {
            return null;
        }

        return Round(
            second.Value -
            first.Value
        );
    }

    private static decimal Round(
        decimal value
    )
    {
        return Math.Round(
            value,
            2,
            MidpointRounding.AwayFromZero
        );
    }
}