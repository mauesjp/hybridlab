namespace HybridLab.Application.Abstractions.Storage;

public interface IFileStorage
{
    Task UploadAsync(
        string key,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default
    );

    Task DeleteAsync(
        string key,
        CancellationToken cancellationToken = default
    );

    Task<string> GetReadUrlAsync(
        string key,
        TimeSpan expiresIn
    );
}