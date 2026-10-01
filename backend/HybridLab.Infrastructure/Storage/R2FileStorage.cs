using Amazon.S3;
using Amazon.S3.Model;
using HybridLab.Application.Abstractions.Storage;
using Microsoft.Extensions.Options;

namespace HybridLab.Infrastructure.Storage;

public class R2FileStorage(
    IAmazonS3 s3Client,
    IOptions<R2StorageOptions> options
) : IFileStorage
{
    private readonly R2StorageOptions _options = options.Value;

    public async Task UploadAsync(
        string key,
        Stream stream,
        string contentType,
        CancellationToken cancellationToken = default
    )
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType,

            // Necessário para compatibilidade do AWSSDK.S3 com Cloudflare R2.
            DisablePayloadSigning = true,
            DisableDefaultChecksumValidation = true,

            AutoCloseStream = false
        };

        await s3Client.PutObjectAsync(
            request,
            cancellationToken
        );
    }

    public async Task DeleteAsync(
        string key,
        CancellationToken cancellationToken = default
    )
    {
        await s3Client.DeleteObjectAsync(
            new DeleteObjectRequest
            {
                BucketName = _options.BucketName,
                Key = key
            },
            cancellationToken
        );
    }

    public async Task<string> GetReadUrlAsync(
        string key,
        TimeSpan expiresIn
    )
    {
        var request = new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = key,
            Verb = HttpVerb.GET,
            Expires = DateTime.UtcNow.Add(expiresIn)
        };

        return await s3Client.GetPreSignedURLAsync(
            request
        );
    }
}