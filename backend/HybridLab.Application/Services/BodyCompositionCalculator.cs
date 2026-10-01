using HybridLab.Application.DTOs.PhysicalAssessments;
using HybridLab.Domain.Entities;
using HybridLab.Domain.Enums;

namespace HybridLab.Application.Services;

public static class BodyCompositionCalculator
{
    public const string ProtocolName =
        "Jackson-Pollock 7 dobras + Siri";

    public static BodyCompositionResultDto Calculate(
        PhysicalAssessment assessment,
        DateOnly? birthDate,
        BiologicalSex? biologicalSex
    )
    {
        var result =
            new BodyCompositionResultDto
            {
                AssessmentId =
                    assessment.Id,

                AssessmentDate =
                    assessment.AssessmentDate,

                WeightKg =
                    assessment.WeightKg,

                HeightCm =
                    assessment.HeightCm,

                Bmi =
                    CalculateBmi(
                        assessment.WeightKg,
                        assessment.HeightCm
                    )
            };

        var skinfold =
            assessment.SkinfoldMeasurements;

        if (skinfold is null)
            return result;

        var values =
            new decimal?[]
            {
                skinfold.ChestMm,
                skinfold.MidaxillaryMm,
                skinfold.TricepsMm,
                skinfold.SubscapularMm,
                skinfold.AbdomenMm,
                skinfold.SuprailiacMm,
                skinfold.ThighMm
            };

        if (
            values.Any(
                value =>
                    value is null
            )
        )
        {
            return result;
        }

        var sum =
            values.Sum(
                value =>
                    value!.Value
            );

        result.HasCompleteSkinfoldProtocol =
            true;

        result.SevenSkinfoldSumMm =
            Round(sum);

        if (
            birthDate is null ||
            biologicalSex is null
        )
        {
            return result;
        }

        var age =
            CalculateAge(
                birthDate.Value,
                assessment.AssessmentDate
            );

        result.AgeYears =
            age;

        var withinAgeRange =
            biologicalSex.Value switch
            {
                BiologicalSex.Male =>
                    age is >= 18 and <= 61,

                BiologicalSex.Female =>
                    age is >= 18 and <= 55,

                _ =>
                    false
            };

        result.IsWithinProtocolAgeRange =
            withinAgeRange;

        if (!withinAgeRange)
            return result;

        var skinfoldSum =
            (double)sum;

        var bodyDensity =
            biologicalSex.Value switch
            {
                BiologicalSex.Male =>
                    1.112
                    -
                    (
                        0.00043499 *
                        skinfoldSum
                    )
                    +
                    (
                        0.00000055 *
                        Math.Pow(
                            skinfoldSum,
                            2
                        )
                    )
                    -
                    (
                        0.00028826 *
                        age
                    ),

                BiologicalSex.Female =>
                    1.097
                    -
                    (
                        0.00046971 *
                        skinfoldSum
                    )
                    +
                    (
                        0.00000056 *
                        Math.Pow(
                            skinfoldSum,
                            2
                        )
                    )
                    -
                    (
                        0.00012828 *
                        age
                    ),

                _ =>
                    0
            };

        if (bodyDensity <= 0)
            return result;

        var bodyFatPercentage =
            (
                495.0 /
                bodyDensity
            )
            - 450.0;

        if (
            bodyFatPercentage <= 0 ||
            bodyFatPercentage >= 100
        )
        {
            return result;
        }

        var weight =
            (double)assessment.WeightKg;

        var fatMass =
            weight *
            (
                bodyFatPercentage /
                100.0
            );

        var leanMass =
            weight -
            fatMass;

        result.BodyDensity =
            Round(
                (decimal)bodyDensity,
                4
            );

        result.BodyFatPercentage =
            Round(
                (decimal)bodyFatPercentage
            );

        result.FatMassKg =
            Round(
                (decimal)fatMass
            );

        result.LeanMassKg =
            Round(
                (decimal)leanMass
            );

        result.Protocol =
            ProtocolName;

        return result;
    }

    private static decimal? CalculateBmi(
        decimal weightKg,
        decimal? heightCm
    )
    {
        if (
            heightCm is null ||
            heightCm <= 0
        )
        {
            return null;
        }

        var heightMeters =
            heightCm.Value /
            100m;

        return Round(
            weightKg /
            (
                heightMeters *
                heightMeters
            )
        );
    }

    private static int CalculateAge(
        DateOnly birthDate,
        DateOnly assessmentDate
    )
    {
        var age =
            assessmentDate.Year -
            birthDate.Year;

        if (
            assessmentDate <
            birthDate.AddYears(
                age
            )
        )
        {
            age--;
        }

        return age;
    }

    private static decimal Round(
        decimal value,
        int decimals = 2
    )
    {
        return Math.Round(
            value,
            decimals,
            MidpointRounding.AwayFromZero
        );
    }
}