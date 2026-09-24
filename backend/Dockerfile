FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY HybridLab.API/HybridLab.API.csproj HybridLab.API/
COPY HybridLab.Application/HybridLab.Application.csproj HybridLab.Application/
COPY HybridLab.Domain/HybridLab.Domain.csproj HybridLab.Domain/
COPY HybridLab.Infrastructure/HybridLab.Infrastructure.csproj HybridLab.Infrastructure/

RUN dotnet restore HybridLab.API/HybridLab.API.csproj

COPY . .

RUN dotnet publish HybridLab.API/HybridLab.API.csproj \
    -c Release \
    -o /app/publish \
    --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final

WORKDIR /app

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "HybridLab.API.dll"]