using HybridLab.Application.Interfaces;
using HybridLab.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;

namespace HybridLab.Infrastructure.Services
{
    public class CoachCodeGenerator : ICoachCodeGenerator
    {
        private readonly AppDbContext _context;

        private const string Characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

        public CoachCodeGenerator(AppDbContext context)
        {
            _context = context;
        }

        public async Task<string> GenerateAsync()
        {
            string code;

            do
            {
                code = GenerateCode();
            }
            while (await _context.Coaches.AnyAsync(c => c.CoachCode == code));

            return code;
        }

        private static string GenerateCode()
        {
            var characters = new char[6];

            for(var i = 0; i < characters.Length; i++)
            {
                var index = RandomNumberGenerator.GetInt32(Characters.Length);
                characters[i] = Characters[index];
            }

            return new string(characters);
        }
    }
}
