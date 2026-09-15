namespace HybridLab.Application.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(string userId, string userName, string email, IEnumerable<string> roles);
    }
}
