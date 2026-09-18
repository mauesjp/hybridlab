using HybridLab.Application.DTOs.Strength;
using HybridLab.Application.Interfaces;
using HybridLab.Domain.Entities;
using HybridLab.Domain.Enums;
using HybridLab.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace HybridLab.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class StrengthPlansController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IPlanningAccessService _planningAccessService;

        public StrengthPlansController(AppDbContext context, IPlanningAccessService planningAccessService)
        {
            _context = context;
            _planningAccessService = planningAccessService;
        }

        [Authorize(Roles = "Student")]
        [HttpPost]
        public async Task<ActionResult<StrengthPlanResponseDto>> Create(CreateStrengthPlanDto dto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (userId == null)
            {
                return Unauthorized();
            }

            var student = await _context.Students.FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var canManagePlanning = await _planningAccessService
                .StudentCanManagePlanningAsync(student.Id, TrainingModality.Strength);

            if (!canManagePlanning)
            {
                return Forbid();
            }

            var plan = new StrengthPlan
            {
                StudentId = student.Id,
                Name = dto.Name,
                VersionNumber = 1,
                PreviousVersionId = null,
                IsPublished = false,
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                PublishedAt = null
            };

            _context.StrengthPlans.Add(plan);
            await _context.SaveChangesAsync();

            var response = new StrengthPlanResponseDto
            {
                StudentId = plan.StudentId,
                Id = plan.Id,
                CreatedAt = plan.CreatedAt,
                IsActive = plan.IsActive,
                Name = plan.Name,
                VersionNumber = plan.VersionNumber,
                IsPublished = plan.IsPublished,
                PublishedAt = plan.PublishedAt
            };

            return CreatedAtAction(nameof(GetById), new { id = plan.Id }, response);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StrengthPlanResponseDto>> GetById(int id)
        {
            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == id);

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            var canView =
                await CanViewStudentStrengthPlanAsync(plan.StudentId);

            if (!canView)
            {
                return Forbid();
            }

            var response = new StrengthPlanResponseDto
            {
                Id = plan.Id,
                StudentId = plan.StudentId,
                Name = plan.Name,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt,
                VersionNumber = plan.VersionNumber,
                IsPublished = plan.IsPublished,
                PublishedAt = plan.PublishedAt
            };

            return Ok(response);
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPost("{planId}/days")]
        public async Task<ActionResult> AddDay(int planId, CreateStrengthWorkoutDayDto dto)
        {
            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == planId);

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            var workoutDay = new StrengthWorkoutDay
            {
                StrengthPlanId = plan.Id,
                Name = dto.Name,
                Order = dto.Order
            };

            _context.StrengthWorkoutDays.Add(workoutDay);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                workoutDay.Id,
                workoutDay.StrengthPlanId,
                workoutDay.Name,
                workoutDay.Order
            });
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPut("days/{dayId}")]
        public async Task<ActionResult> UpdateDay(int dayId, UpdateStrengthWorkoutDayDto dto)
        {
            var workoutDay = await _context.StrengthWorkoutDays
                .FirstOrDefaultAsync(day => day.Id == dayId);

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId
                );

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            workoutDay.Name = dto.Name;
            workoutDay.Order = dto.Order;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                workoutDay.Id,
                workoutDay.StrengthPlanId,
                workoutDay.Name,
                workoutDay.Order
            });
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPost("days/{dayId}/exercises")]
        public async Task<ActionResult> AddExercise(int dayId, CreatePlannedExerciseDto dto)
        {
            var workoutDay = await _context.StrengthWorkoutDays
                .FirstOrDefaultAsync(day => day.Id == dayId);

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId
                );

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            var exercise = new PlannedExercise
            {
                StrengthWorkoutDayId = workoutDay.Id,
                Name = dto.Name,
                Order = dto.Order,
                TargetSets = dto.TargetSets,
                MinReps = dto.MinReps,
                MaxReps = dto.MaxReps,
                TargetRir = dto.TargetRir,
                Notes = dto.Notes
            };

            _context.PlannedExercises.Add(exercise);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                exercise.Id,
                exercise.StrengthWorkoutDayId,
                exercise.Name,
                exercise.Order,
                exercise.TargetSets,
                exercise.MinReps,
                exercise.MaxReps,
                exercise.TargetRir,
                exercise.Notes
            });
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPut("exercises/{exerciseId}")]
        public async Task<ActionResult> UpdateExercise(int exerciseId, UpdatePlannedExerciseDto dto)
        {
            var exercise = await _context.PlannedExercises
                .FirstOrDefaultAsync(exercise => exercise.Id == exerciseId);

            if (exercise == null)
            {
                return NotFound("Exercício não encontrado.");
            }

            var workoutDay = await _context.StrengthWorkoutDays
                .FirstOrDefaultAsync(day =>
                    day.Id == exercise.StrengthWorkoutDayId
                );

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId
                );

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            exercise.Name = dto.Name;
            exercise.Order = dto.Order;
            exercise.TargetSets = dto.TargetSets;
            exercise.MinReps = dto.MinReps;
            exercise.MaxReps = dto.MaxReps;
            exercise.TargetRir = dto.TargetRir;
            exercise.Notes = dto.Notes;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                exercise.Id,
                exercise.StrengthWorkoutDayId,
                exercise.Name,
                exercise.Order,
                exercise.TargetSets,
                exercise.MinReps,
                exercise.MaxReps,
                exercise.TargetRir,
                exercise.Notes
            });
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpDelete("exercises/{exerciseId}")]
        public async Task<ActionResult> DeleteExercise(int exerciseId)
        {
            var exercise = await _context.PlannedExercises
                .FirstOrDefaultAsync(exercise => exercise.Id == exerciseId);

            if (exercise == null)
            {
                return NotFound("Exercício não encontrado.");
            }

            var workoutDay = await _context.StrengthWorkoutDays
                .FirstOrDefaultAsync(day =>
                    day.Id == exercise.StrengthWorkoutDayId
                );

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId
                );

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            _context.PlannedExercises.Remove(exercise);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpDelete("days/{dayId}")]
        public async Task<ActionResult> DeleteDay(int dayId)
        {
            var workoutDay = await _context.StrengthWorkoutDays
                .FirstOrDefaultAsync(day => day.Id == dayId);

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId
                );

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            if (plan.IsPublished)
            {
                return BadRequest("Planos publicados não podem ser alterados. Crie uma nova versão.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            var exercises = await _context.PlannedExercises
                .Where(exercise =>
                    exercise.StrengthWorkoutDayId == workoutDay.Id
                )
                .ToListAsync();

            _context.PlannedExercises.RemoveRange(exercises);
            _context.StrengthWorkoutDays.Remove(workoutDay);

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}/full")]
        public async Task<ActionResult<StrengthPlanDetailsDto>> GetFullPlan(int id)
        {
            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == id);

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            var canView =
                await CanViewStudentStrengthPlanAsync(plan.StudentId);

            if (!canView)
            {
                return Forbid();
            }

            var days = await _context.StrengthWorkoutDays
                .Where(day => day.StrengthPlanId == plan.Id)
                .OrderBy(day => day.Order)
                .ToListAsync();

            var dayIds = days
                .Select(day => day.Id)
                .ToList();

            var exercises = await _context.PlannedExercises
                .Where(exercise =>
                    dayIds.Contains(exercise.StrengthWorkoutDayId)
                )
                .OrderBy(exercise => exercise.Order)
                .ToListAsync();

            var response = new StrengthPlanDetailsDto
            {
                Id = plan.Id,
                StudentId = plan.StudentId,
                Name = plan.Name,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt,
                Days = days.Select(day => new StrengthWorkoutDayDetailsDto
                {
                    Id = day.Id,
                    Name = day.Name,
                    Order = day.Order,
                    Exercises = exercises
                        .Where(exercise =>
                            exercise.StrengthWorkoutDayId == day.Id
                        )
                        .Select(exercise => new PlannedExerciseDetailsDto
                        {
                            Id = exercise.Id,
                            Name = exercise.Name,
                            Order = exercise.Order,
                            TargetSets = exercise.TargetSets,
                            MinReps = exercise.MinReps,
                            MaxReps = exercise.MaxReps,
                            TargetRir = exercise.TargetRir,
                            Notes = exercise.Notes
                        })
                        .ToList()
                }).ToList(),
                VersionNumber = plan.VersionNumber,
                PreviousVersionId = plan.PreviousVersionId,
                IsPublished = plan.IsPublished,
                PublishedAt = plan.PublishedAt,
            };

            return Ok(response);
        }

        [Authorize(Roles = "Coach")]
        [HttpPost("students/{studentId}")]
        public async Task<ActionResult<StrengthPlanResponseDto>> CreateForStudent(int studentId, CreateStrengthPlanDto dto)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var coach = await _context.Coaches
                .FirstOrDefaultAsync(coach => coach.UserId == userId);

            if (coach == null)
            {
                return BadRequest("Perfil de professor não encontrado.");
            }

            var studentExists = await _context.Students
                .AnyAsync(student => student.Id == studentId);

            if (!studentExists)
            {
                return NotFound("Aluno não encontrado.");
            }

            var canManage =
                await _planningAccessService.CoachCanManageStudentPlanningAsync(
                    coach.Id,
                    studentId,
                    TrainingModality.Strength
                );

            if (!canManage)
            {
                return Forbid();
            }

            var plan = new StrengthPlan
            {
                StudentId = studentId,
                Name = dto.Name,
                VersionNumber = 1,
                PreviousVersionId = null,
                IsPublished = false,
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                PublishedAt = null
            };

            _context.StrengthPlans.Add(plan);
            await _context.SaveChangesAsync();

            var response = new StrengthPlanResponseDto
            {
                Id = plan.Id,
                StudentId = plan.StudentId,
                Name = plan.Name,
                IsActive = plan.IsActive,
                CreatedAt = plan.CreatedAt,
                VersionNumber = plan.VersionNumber,
                IsPublished = plan.IsPublished,
                PublishedAt = plan.PublishedAt
            };

            return CreatedAtAction(
                nameof(GetById),
                new { id = plan.Id },
                response
            );
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPut("{id}/publish")]
        public async Task<ActionResult> Publish(int id)
        {
            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == id);

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(plan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            if (plan.IsPublished)
            {
                return BadRequest("Este plano já foi publicado.");
            }

            var activePlans = await _context.StrengthPlans
                .Where(existingPlan =>
                    existingPlan.StudentId == plan.StudentId &&
                    existingPlan.IsActive)
                .ToListAsync();

            foreach (var activePlan in activePlans)
            {
                activePlan.IsActive = false;
            }

            plan.IsPublished = true;
            plan.IsActive = true;
            plan.PublishedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                plan.Id,
                plan.StudentId,
                plan.Name,
                plan.VersionNumber,
                plan.IsPublished,
                plan.IsActive,
                plan.PublishedAt
            });
        }

        [Authorize(Roles = "Student,Coach")]
        [HttpPost("{id}/new-version")]
        public async Task<ActionResult<StrengthPlanResponseDto>> CreateNewVersion(int id)
        {
            var currentPlan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == id);

            if (currentPlan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            var canManage =
                await CanManageStudentStrengthPlanningAsync(currentPlan.StudentId);

            if (!canManage)
            {
                return Forbid();
            }

            if (!currentPlan.IsPublished)
            {
                return BadRequest(
                    "Somente planos publicados podem gerar uma nova versão."
                );
            }

            var existingDraft = await _context.StrengthPlans
                .AnyAsync(plan =>
                    plan.StudentId == currentPlan.StudentId &&
                    !plan.IsPublished &&
                    plan.PreviousVersionId == currentPlan.Id
                );

            if (existingDraft)
            {
                return BadRequest(
                    "Já existe uma nova versão em rascunho deste plano."
                );
            }

            var newPlan = new StrengthPlan
            {
                StudentId = currentPlan.StudentId,
                Name = currentPlan.Name,
                VersionNumber = currentPlan.VersionNumber + 1,
                PreviousVersionId = currentPlan.Id,
                IsPublished = false,
                IsActive = false,
                CreatedAt = DateTime.UtcNow,
                PublishedAt = null
            };

            _context.StrengthPlans.Add(newPlan);
            await _context.SaveChangesAsync();

            var currentDays = await _context.StrengthWorkoutDays
                .Where(day => day.StrengthPlanId == currentPlan.Id)
                .OrderBy(day => day.Order)
                .ToListAsync();

            foreach (var currentDay in currentDays)
            {
                var newDay = new StrengthWorkoutDay
                {
                    StrengthPlanId = newPlan.Id,
                    Name = currentDay.Name,
                    Order = currentDay.Order
                };

                _context.StrengthWorkoutDays.Add(newDay);
                await _context.SaveChangesAsync();

                var currentExercises = await _context.PlannedExercises
                    .Where(exercise =>
                        exercise.StrengthWorkoutDayId == currentDay.Id
                    )
                    .OrderBy(exercise => exercise.Order)
                    .ToListAsync();

                foreach (var currentExercise in currentExercises)
                {
                    var newExercise = new PlannedExercise
                    {
                        StrengthWorkoutDayId = newDay.Id,
                        Name = currentExercise.Name,
                        Order = currentExercise.Order,
                        TargetSets = currentExercise.TargetSets,
                        MinReps = currentExercise.MinReps,
                        MaxReps = currentExercise.MaxReps,
                        TargetRir = currentExercise.TargetRir,
                        Notes = currentExercise.Notes
                    };

                    _context.PlannedExercises.Add(newExercise);
                }
            }

            await _context.SaveChangesAsync();

            var response = new StrengthPlanResponseDto
            {
                Id = newPlan.Id,
                StudentId = newPlan.StudentId,
                Name = newPlan.Name,
                VersionNumber = newPlan.VersionNumber,
                IsPublished = newPlan.IsPublished,
                IsActive = newPlan.IsActive,
                CreatedAt = newPlan.CreatedAt,
                PublishedAt = newPlan.PublishedAt
            };

            return CreatedAtAction(
                nameof(GetById),
                new { id = newPlan.Id },
                response
            );
        }

        [HttpGet("{id}/versions")]
        public async Task<ActionResult> GetVersions(int id)
        {
            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan => plan.Id == id);

            if (plan == null)
            {
                return NotFound("Plano de musculação não encontrado.");
            }

            var canView =
                await CanViewStudentStrengthPlanAsync(plan.StudentId);

            if (!canView)
            {
                return Forbid();
            }

            var rootPlan = plan;

            while (rootPlan.PreviousVersionId != null)
            {
                var previousPlan = await _context.StrengthPlans
                    .FirstOrDefaultAsync(previous =>
                        previous.Id == rootPlan.PreviousVersionId
                    );

                if (previousPlan == null)
                {
                    break;
                }

                rootPlan = previousPlan;
            }

            var versions = new List<StrengthPlan>();
            var currentVersion = rootPlan;

            while (currentVersion != null)
            {
                versions.Add(currentVersion);

                currentVersion = await _context.StrengthPlans
                    .FirstOrDefaultAsync(next =>
                        next.PreviousVersionId == currentVersion.Id
                    );
            }

            var response = versions.Select(version => new
            {
                version.Id,
                version.Name,
                version.VersionNumber,
                version.PreviousVersionId,
                version.IsPublished,
                version.IsActive,
                version.CreatedAt,
                version.PublishedAt
            });

            return Ok(response);
        }

        private async Task<bool> CanManageStudentStrengthPlanningAsync(int studentId)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return false;
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student != null)
            {
                if (student.Id != studentId)
                {
                    return false;
                }

                return await _planningAccessService
                    .StudentCanManagePlanningAsync(
                        student.Id,
                        TrainingModality.Strength
                    );
            }

            var coach = await _context.Coaches
                .FirstOrDefaultAsync(coach => coach.UserId == userId);

            if (coach == null)
            {
                return false;
            }

            return await _planningAccessService
                .CoachCanManageStudentPlanningAsync(
                    coach.Id,
                    studentId,
                    TrainingModality.Strength
                );
        }

        private async Task<bool> CanViewStudentStrengthPlanAsync(int studentId)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return false;
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student != null)
            {
                return student.Id == studentId;
            }

            var coach = await _context.Coaches
                .FirstOrDefaultAsync(coach => coach.UserId == userId);

            if (coach == null)
            {
                return false;
            }

            return await _planningAccessService
                .CoachCanManageStudentPlanningAsync(
                    coach.Id,
                    studentId,
                    TrainingModality.Strength
                );
        }
    }
}
