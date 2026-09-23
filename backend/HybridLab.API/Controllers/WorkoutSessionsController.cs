using HybridLab.Application.DTOs.Workout;
using HybridLab.Domain.Entities;
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
    public class WorkoutSessionsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WorkoutSessionsController(AppDbContext context)
        {
            _context = context;
        }

        [Authorize(Roles = "Student")]
        [HttpPost("days/{dayId}/start")]
        public async Task<ActionResult> Start(int dayId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students.FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var workoutDay = await _context.StrengthWorkoutDays.FirstOrDefaultAsync(day => day.Id == dayId);

            if (workoutDay == null)
            {
                return NotFound("Dia de treino não encontrado.");
            }

            var plan = await _context.StrengthPlans
                .FirstOrDefaultAsync(plan =>
                    plan.Id == workoutDay.StrengthPlanId &&
                    plan.StudentId == student.Id
                );

            if (plan == null)
            {
                return Forbid();
            }

            if (!plan.IsPublished || !plan.IsActive)
            {
                return BadRequest(
                    "Este treino não pertence ao plano ativo do aluno."
                );
            }

            var hasOpenSession = await _context.WorkoutSessions
                .AnyAsync(session =>
                    session.StudentId == student.Id &&
                    session.FinishedAt == null
                );

            if (hasOpenSession)
            {
                return BadRequest(
                    "Já existe um treino em andamento."
                );
            }

            var plannedExercises = await _context.PlannedExercises
                .Where(exercise =>
                    exercise.StrengthWorkoutDayId == workoutDay.Id
                )
                .OrderBy(exercise => exercise.Order)
                .ToListAsync();

            if (plannedExercises.Count == 0)
            {
                return BadRequest(
                    "Este dia de treino não possui exercícios cadastrados."
                );
            }

            var session = new WorkoutSession
            {
                StudentId = student.Id,
                StrengthPlanId = plan.Id,
                StrengthWorkoutDayId = workoutDay.Id,
                StartedAt = DateTime.UtcNow,
                FinishedAt = null,
                IsCompleted = false
            };

            _context.WorkoutSessions.Add(session);
            await _context.SaveChangesAsync();

            var workoutExercises = plannedExercises
                .Select(plannedExercise => new WorkoutExercise
                {
                    WorkoutSessionId = session.Id,
                    PlannedExerciseId = plannedExercise.Id,
                    ExerciseName = plannedExercise.Name,
                    Order = plannedExercise.Order
                })
                .ToList();

            _context.WorkoutExercises.AddRange(workoutExercises);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                session.Id,
                session.StrengthPlanId,
                session.StrengthWorkoutDayId,
                session.StartedAt,

                Exercises = workoutExercises
                    .OrderBy(exercise => exercise.Order)
                    .Select(exercise => new
                    {
                        exercise.Id,
                        exercise.PlannedExerciseId,
                        exercise.ExerciseName,
                        exercise.Order
                    })
            });
        }

        [Authorize(Roles = "Student")]
        [HttpPost("exercises/{workoutExerciseId}/sets")]
        public async Task<ActionResult> AddSet(int workoutExerciseId, CreateWorkoutSetDto dto)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var workoutExercise = await _context.WorkoutExercises
                .FirstOrDefaultAsync(exercise =>
                    exercise.Id == workoutExerciseId
                );

            if (workoutExercise == null)
            {
                return NotFound("Exercício do treino não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.Id == workoutExercise.WorkoutSessionId
                );

            if (session == null)
            {
                return NotFound("Sessão de treino não encontrada.");
            }

            if (session.StudentId != student.Id)
            {
                return Forbid();
            }

            if (session.FinishedAt != null)
            {
                return BadRequest(
                    "Não é possível adicionar séries a um treino finalizado."
                );
            }

            var setNumber = await _context.WorkoutSets
                .CountAsync(set =>
                    set.WorkoutExerciseId == workoutExercise.Id
                ) + 1;

            var workoutSet = new WorkoutSet
            {
                WorkoutExerciseId = workoutExercise.Id,
                SetNumber = setNumber,
                Weight = dto.Weight,
                Reps = dto.Reps,
                Rir = dto.Rir,
                Rpe = dto.Rpe,
                RecordedAt = DateTime.UtcNow
            };

            _context.WorkoutSets.Add(workoutSet);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                workoutSet.Id,
                workoutSet.WorkoutExerciseId,
                workoutSet.SetNumber,
                workoutSet.Weight,
                workoutSet.Reps,
                workoutSet.Rir,
                workoutSet.Rpe,
                workoutSet.RecordedAt
            });
        }

        [Authorize(Roles = "Student")]
        [HttpPut("sets/{setId:int}")]
        public async Task<ActionResult> UpdateSet(int setId, UpdateWorkoutSetDto dto)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var workoutSet = await _context.WorkoutSets
                .FirstOrDefaultAsync(set => set.Id == setId);

            if (workoutSet == null)
            {
                return NotFound("Série não encontrada.");
            }

            var workoutExercise = await _context.WorkoutExercises
                .FirstOrDefaultAsync(exercise =>
                    exercise.Id == workoutSet.WorkoutExerciseId
                );

            if (workoutExercise == null)
            {
                return NotFound("Exercício do treino não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.Id == workoutExercise.WorkoutSessionId
                );

            if (session == null)
            {
                return NotFound("Sessão de treino não encontrada.");
            }

            if (session.StudentId != student.Id)
            {
                return Forbid();
            }

            if (session.FinishedAt != null)
            {
                return BadRequest(
                    "Não é possível editar séries de um treino finalizado."
                );
            }

            workoutSet.Weight = dto.Weight;
            workoutSet.Reps = dto.Reps;
            workoutSet.Rir = dto.Rir;
            workoutSet.Rpe = dto.Rpe;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                workoutSet.Id,
                workoutSet.WorkoutExerciseId,
                workoutSet.SetNumber,
                workoutSet.Weight,
                workoutSet.Reps,
                workoutSet.Rir,
                workoutSet.Rpe,
                workoutSet.RecordedAt
            });

        }

        [Authorize(Roles = "Student")]
        [HttpDelete("sets/{setId:int}")]
        public async Task<ActionResult> DeleteSet(int setId)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var workoutSet = await _context.WorkoutSets
                .FirstOrDefaultAsync(set => set.Id == setId);

            if (workoutSet == null)
            {
                return NotFound("Série não encontrada.");
            }

            var workoutExercise = await _context.WorkoutExercises
                .FirstOrDefaultAsync(exercise =>
                    exercise.Id == workoutSet.WorkoutExerciseId
                );

            if (workoutExercise == null)
            {
                return NotFound("Exercício do treino não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.Id == workoutExercise.WorkoutSessionId
                );

            if (session == null)
            {
                return NotFound("Sessão de treino não encontrada.");
            }

            if (session.StudentId != student.Id)
            {
                return Forbid();
            }

            if (session.FinishedAt != null)
            {
                return BadRequest(
                    "Não é possível remover séries de um treino finalizado."
                );
            }

            var remainingSets = await _context.WorkoutSets
                .Where(set =>
                    set.WorkoutExerciseId == workoutExercise.Id &&
                    set.Id != workoutSet.Id
                )
                .OrderBy(set => set.SetNumber)
                .ToListAsync();

            _context.WorkoutSets.Remove(workoutSet);

            for (var index = 0; index < remainingSets.Count; index++)
            {
                remainingSets[index].SetNumber = index + 1;
            }

            await _context.SaveChangesAsync();

            return NoContent();
        }

        [Authorize(Roles = "Student")]
        [HttpPut("{sessionId}/finish")]
        public async Task<ActionResult> Finish(int sessionId)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.Id == sessionId
                );

            if (session == null)
            {
                return NotFound("Sessão de treino não encontrada.");
            }

            if (session.StudentId != student.Id)
            {
                return Forbid();
            }

            if (session.FinishedAt != null)
            {
                return BadRequest("Este treino já foi finalizado.");
            }

            session.FinishedAt = DateTime.UtcNow;
            session.IsCompleted = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                session.Id,
                session.StartedAt,
                session.FinishedAt,
                session.IsCompleted
            });
        }

        [Authorize(Roles = "Student")]
        [HttpGet("{sessionId:int}")]
        public async Task<ActionResult<WorkoutSessionDetailsDto>> GetById(int sessionId)
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.Id == sessionId
                );

            if (session == null)
            {
                return NotFound("Sessão de treino não encontrada.");
            }

            if (session.StudentId != student.Id)
            {
                return Forbid();
            }

            var workoutExercises = await _context.WorkoutExercises
                .Where(exercise =>
                    exercise.WorkoutSessionId == session.Id
                )
                .OrderBy(exercise => exercise.Order)
                .ToListAsync();

            var workoutExerciseIds = workoutExercises
                .Select(exercise => exercise.Id)
                .ToList();

            var sets = await _context.WorkoutSets
                .Where(set =>
                    workoutExerciseIds.Contains(set.WorkoutExerciseId)
                )
                .OrderBy(set => set.SetNumber)
                .ToListAsync();

            var plannedExerciseIds = workoutExercises
                .Select(exercise => exercise.PlannedExerciseId)
                .ToList();

            var plannedExercises = await _context.PlannedExercises
                .Where(exercise =>
                    plannedExerciseIds.Contains(exercise.Id)
                )
                .ToListAsync();

            var response = new WorkoutSessionDetailsDto
            {
                Id = session.Id,
                StrengthPlanId = session.StrengthPlanId,
                StrengthWorkoutDayId = session.StrengthWorkoutDayId,
                StartedAt = session.StartedAt,
                FinishedAt = session.FinishedAt,
                IsCompleted = session.IsCompleted,

                Exercises = workoutExercises
                    .Select(workoutExercise =>
                    {
                        var plannedExercise = plannedExercises
                            .First(exercise =>
                                exercise.Id == workoutExercise.PlannedExerciseId
                            );

                        return new WorkoutExerciseDetailsDto
                        {
                            Id = workoutExercise.Id,
                            PlannedExerciseId = workoutExercise.PlannedExerciseId,
                            ExerciseName = workoutExercise.ExerciseName,
                            Order = workoutExercise.Order,

                            TargetSets = plannedExercise.TargetSets,
                            MinReps = plannedExercise.MinReps,
                            MaxReps = plannedExercise.MaxReps,
                            TargetRir = plannedExercise.TargetRir,
                            Notes = plannedExercise.Notes,

                            Sets = sets
                                .Where(set =>
                                    set.WorkoutExerciseId == workoutExercise.Id
                                )
                                .Select(set => new WorkoutSetDetailsDto
                                {
                                    Id = set.Id,
                                    SetNumber = set.SetNumber,
                                    Weight = set.Weight,
                                    Reps = set.Reps,
                                    Rir = set.Rir,
                                    Rpe = set.Rpe,
                                    RecordedAt = set.RecordedAt
                                })
                                .ToList()
                        };
                    })
                    .ToList()
            };

            return Ok(response);
        }

        [Authorize(Roles = "Student")]
        [HttpGet("active")]
        public async Task<ActionResult> GetActiveSession()
        {
            var userId =
                User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");

            if (string.IsNullOrWhiteSpace(userId))
            {
                return Unauthorized();
            }

            var student = await _context.Students
                .FirstOrDefaultAsync(student => student.UserId == userId);

            if (student == null)
            {
                return BadRequest("Perfil de aluno não encontrado.");
            }

            var session = await _context.WorkoutSessions
                .FirstOrDefaultAsync(session =>
                    session.StudentId == student.Id &&
                    session.FinishedAt == null
                );

            if (session == null)
            {
                return Ok(new
                {
                    HasActiveSession = false
                });
            }

            return Ok(new
            {
                HasActiveSession = true,
                SessionId = session.Id,
                session.StrengthPlanId,
                session.StrengthWorkoutDayId,
                session.StartedAt
            });
        }

    }
}
