using HybridLab.Application.Interfaces;
using HybridLab.Domain.Entities;
using HybridLab.Infrastructure.Identity;
using HybridLab.Infrastructure.Persistence;
using HybridLab.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");

if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection");

var jwtKey = builder.Configuration["Jwt:Key"];
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
var jwtAudience = builder.Configuration["Jwt:Audience"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    throw new InvalidOperationException(
        "Database connection string is not configured."
    );
}

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT key is not configured."
    );
}

builder.Services
    .AddIdentityCore<ApplicationUser>()
    .AddRoles<IdentityRole>()
    .AddEntityFrameworkStores<AppDbContext>();

builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<ICoachCodeGenerator, CoachCodeGenerator>();
builder.Services.AddScoped<IPlanningAccessService, PlanningAccessService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Insira o token JWT"
        }
    );

    options.AddSecurityRequirement(document =>
        new OpenApiSecurityRequirement
        {
            [
                new OpenApiSecuritySchemeReference(
                    "Bearer",
                    document
                )
            ] = []
        }
    );
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)
    )
);

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme
    )
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)
                    )
            };
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy
            .WithOrigins(
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5174",
                "http://127.0.0.1:5174",
                "https://hybridlab.vercel.app"
            )
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    await dbContext.Database.MigrateAsync();

    var roleManager =
        scope.ServiceProvider
            .GetRequiredService<RoleManager<IdentityRole>>();

    string[] roles =
    {
        "Student",
        "Coach"
    };

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
        {
            await roleManager.CreateAsync(
                new IdentityRole(role)
            );
        }
    }

    if (app.Environment.IsDevelopment())
    {
        var userManager =
            scope.ServiceProvider
                .GetRequiredService<UserManager<ApplicationUser>>();

        var testStudent =
            await userManager.FindByNameAsync(
                "teststudent"
            );

        if (testStudent == null)
        {
            testStudent = new ApplicationUser
            {
                UserName = "teststudent",
                Email = "teststudent@hybridlab.local",
                EmailConfirmed = true
            };

            var result =
                await userManager.CreateAsync(
                    testStudent,
                    "Test@123456"
                );

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(
                    testStudent,
                    "Student"
                );
            }
        }

        var studentProfile =
            await dbContext.Students
                .FirstOrDefaultAsync(student =>
                    student.UserId == testStudent.Id
                );

        if (studentProfile == null)
        {
            studentProfile = new StudentProfile
            {
                BirthDate = new DateTime(2000, 1, 1),
                CreatedAt = DateTime.UtcNow,
                DisplayName = "Aluno Teste",
                UserId = testStudent.Id
            };

            dbContext.Students.Add(
                studentProfile
            );
        }

        var testCoach =
            await userManager.FindByNameAsync(
                "testcoach"
            );

        if (testCoach == null)
        {
            testCoach = new ApplicationUser
            {
                UserName = "testcoach",
                Email = "testcoach@hybridlab.local",
                EmailConfirmed = true
            };

            var result =
                await userManager.CreateAsync(
                    testCoach,
                    "Test@123456"
                );

            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(
                    testCoach,
                    "Coach"
                );
            }
        }

        var coachProfile =
            await dbContext.Coaches
                .FirstOrDefaultAsync(coach =>
                    coach.UserId == testCoach.Id
                );

        if (coachProfile == null)
        {
            coachProfile = new CoachProfile
            {
                UserId = testCoach.Id,
                DisplayName = "Professor Teste",
                CoachCode = "COACH001",
                CanCoachStrength = true,
                CanCoachRunning = true,
                CreatedAt = DateTime.UtcNow
            };

            dbContext.Coaches.Add(
                coachProfile
            );
        }

        await dbContext.SaveChangesAsync();
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();

    app.UseHttpsRedirection();
}

app.UseCors("Frontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();