# What the .NET 10 Web API setup gives a beginner

Research for [#3](https://github.com/wkimdkim-nz/learn-todo/issues/3) (part of map [#1](https://github.com/wkimdkim-nz/learn-todo/issues/1)). Researched 2026-09-26.

This note records facts only. The decisions belong to the downstream tickets:
[#8](https://github.com/wkimdkim-nz/learn-todo/issues/8) (minimal APIs or controllers),
[#9](https://github.com/wkimdkim-nz/learn-todo/issues/9) (database),
[#10](https://github.com/wkimdkim-nz/learn-todo/issues/10) (auth-ready structure),
[#11](https://github.com/wkimdkim-nz/learn-todo/issues/11) (API contract) and
[#12](https://github.com/wkimdkim-nz/learn-todo/issues/12) (backend tests).
Each section ends with the trade-offs those tickets need to weigh.

**Sources.** "Local probe" means I ran the command myself on this machine
(macOS, Apple M1 Pro, `arm64`, .NET SDK 10.0.300, Docker 29.6.1) and read the generated files.
Package versions marked "NuGet" come from the nuget.org flat-container API (`https://api.nuget.org/v3-flatcontainer/<id>/index.json`), read on 2026-09-26.

---

## TL;DR

- `dotnet new webapi` gives a **minimal API** project by default (`--use-controllers` switches to controllers). It includes a built-in **OpenAPI 3.1** JSON document at `/openapi/v1.json` (Development only) and a **`.http` file**, but **no UI** such as Swagger UI or Scalar. You add one yourself.
- Microsoft says: **"For new projects, we recommend using Minimal APIs."** Microsoft's own beginner tutorial for minimal APIs builds a **Todo API**.
- **EF Core 10** (10.0.12) is the current LTS release, supported until November 10, 2028. EF Core 11 is due November 2026.
- **SQLite** works with no install. **PostgreSQL** (Npgsql provider 10.0.3) runs natively on Apple Silicon through Docker. **SQL Server containers are x86-64 only, and Microsoft does not support running them under emulation (Rosetta 2).** Azure SQL Edge, the old ARM workaround, retired in 2025.
- The SDK's test templates are **xUnit v2** (2.9.3), **NUnit 4.3.2** and **MSTest 4.0.2**. xUnit **v3** (4.0.1) needs a separate template package. `WebApplicationFactory` comes from `Microsoft.AspNetCore.Mvc.Testing`. In .NET 10 you **no longer need `public partial class Program`**.
- The installed SDK (10.0.300, runtime 10.0.8) is a few patches behind the latest (SDK 10.0.401, runtime 10.0.12, released 2026-09-08).

---

## 1. Environment baseline

| Item | Installed | Latest (2026-09-26) | Source |
|---|---|---|---|
| .NET SDK | 10.0.300 | 10.0.401 | local `dotnet --list-sdks`; [release metadata](https://builds.dotnet.microsoft.com/dotnet/release-metadata/10.0/releases.json) |
| ASP.NET Core / .NET runtime | 10.0.8 | 10.0.12 (2026-09-08) | local `dotnet --list-runtimes`; same metadata |
| .NET 10 support | LTS, `active`, EOL 2028-11-14 | | same metadata |
| `dotnet-ef` global tool | 10.0.8 (already installed) | 10.0.12 | local `dotnet tool list -g`; NuGet |
| VS Code extensions | `ms-dotnettools.csdevkit`, `ms-dotnettools.csharp` installed | | local `code --list-extensions` |

- Templates pin packages to the **installed** runtime patch. For example, the generated project references `Microsoft.AspNetCore.OpenApi` **10.0.8**, but NuGet has 10.0.12 (local probe; NuGet).
- EF Core guidance: "Always use the latest patch of a given release" ([EF Core releases](https://learn.microsoft.com/en-us/ef/core/what-is-new/)).
- `dotnet new sln` on this SDK creates **`Probe.slnx`**, the XML solution format, not a classic `.sln` (local probe).

## 2. What `dotnet new webapi` generates

### Options (`dotnet new webapi --help`, local probe)

| Option | Default | Meaning |
|---|---|---|
| `-controllers`, `--use-controllers` | `false` | "Whether to use controllers instead of minimal APIs." |
| `--no-openapi` | `false` | "Disable OpenAPI (Swagger) support" |
| `--use-program-main` | `false` | Explicit `Program` class and `Main` method instead of top-level statements |
| `-au`, `--auth` | `None` | Choices: `None`, `IndividualB2C`, `SingleOrg`, `Windows`. All except `None` are Microsoft Entra or Windows options. |
| `--no-https` | `false` | Turn off HTTPS |
| `--exclude-launch-settings` | `false` | Skip `Properties/launchSettings.json` |
| `-f`, `--framework` | `net10.0` | The only choice |

The `--auth` choices offer **no local-account or JWT option**. Only cloud or Windows identity is available, so none of them suits a local-only app (local probe).

### Files: minimal API (default)

`dotnet new webapi -n MinApi` (local probe) produces:

```
MinApi.csproj          Sdk="Microsoft.NET.Sdk.Web", net10.0, Nullable+ImplicitUsings on,
                       one package: Microsoft.AspNetCore.OpenApi 10.0.8
Program.cs             top-level statements; AddOpenApi(); MapOpenApi() inside IsDevelopment();
                       UseHttpsRedirection(); one MapGet("/weatherforecast", ...).WithName(...);
                       a WeatherForecast record at the bottom
MinApi.http            @MinApi_HostAddress = http://localhost:5197 + one GET request
appsettings.json / appsettings.Development.json   logging levels only
Properties/launchSettings.json   "http" (5197) and "https" (7263) profiles, launchBrowser: false
```

### Files: `--use-controllers`

It produces the same `.csproj`, `.http`, `appsettings*` and `launchSettings.json`, plus `Controllers/WeatherForecastController.cs` (`[ApiController]`, `[Route("[controller]")]`, `ControllerBase`) and `WeatherForecast.cs`. `Program.cs` adds `AddControllers()`, `UseAuthorization()` and `MapControllers()` (local probe).

### What runs

- `dotnet run --launch-profile http` serves `http://localhost:5197/openapi/v1.json`. The document begins `"openapi": "3.1.1"` (local probe).
- `/swagger` and `/scalar` both return **404** because the template ships no UI (local probe).

## 3. OpenAPI, Scalar, Swagger

- The first-party package is `Microsoft.AspNetCore.OpenApi`. `AddOpenApi` registers the generator. `MapOpenApi` exposes the JSON and is "restricted to the `Development` environment to minimize the risk of exposing sensitive information" ([OpenAPI overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/overview?view=aspnetcore-10.0)).
- ASP.NET Core 10 generates **OpenAPI 3.1** by default ([What's new in ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0)). It can also serve YAML (`MapOpenApi("/openapi/{documentName}.yaml")`) and read XML doc comments into the document when `GenerateDocumentationFile` is set (same page).
- The underlying `Microsoft.OpenApi` library moved to **2.0**, which has breaking API changes, so pre-.NET 10 blog posts about document transformers can be out of date (same page).
- **No UI by default.** In Microsoft's words, the package "doesn't ship with built-in support for visualizing or interacting with the OpenAPI document" ([Use the generated OpenAPI documents](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/openapi/using-openapi-documents?view=aspnetcore-10.0)). The docs show two add-ons:
  - **Swagger UI**: package `Swashbuckle.AspNetCore.SwaggerUi`, then `app.UseSwaggerUI(o => o.SwaggerEndpoint("/openapi/v1.json", "v1"))`, served at `/swagger`.
  - **Scalar**: package `Scalar.AspNetCore` (NuGet 2.17.10), then `app.MapScalarApiReference()`, served at `/scalar`.
  - Both pages advise enabling these UIs only in Development (same page).
- Microsoft's minimal API **Todo tutorial**, VS Code tab, adds **Scalar** to test the endpoints. The Visual Studio tab uses Endpoints Explorer and `.http` files instead ([Minimal API tutorial](https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api?view=aspnetcore-10.0&tabs=visual-studio-code)).
- Swashbuckle is **no longer in the template**. It is still maintained on NuGet (`Swashbuckle.AspNetCore` 10.2.3), but the docs now use it only for the Swagger **UI** assets, not for generating the document.

## 4. `.http` files

- The template creates `<Project>.http` with a host-address variable and one request (local probe).
- The syntax covers `@var = value`, `{{var}}`, `###` between requests, headers and body. Environments go in `http-client.env.json`, and secrets in a `.user` file or user-secrets ([Use .http files](https://learn.microsoft.com/en-us/aspnet/core/test/http-files?view=aspnetcore-10.0)).
- **That doc targets Visual Studio 2022.** It says the format "was inspired by the Visual Studio Code REST Client extension" (`humao.rest-client`) and lists features that only the VS Code extension has (same page). The REST Client extension is **not** installed on this machine (local probe). I did not verify whether C# Dev Kit can send `.http` requests itself.
- Request variables (`# @name login` … `{{login.response.body.$.token}}`) let one request reuse a token from another. That becomes relevant once auth arrives (same page).

## 5. Minimal APIs vs controllers: Microsoft's guidance

From [APIs overview](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/apis?view=aspnetcore-10.0), updated 2026-05-04:

- "**For new projects, we recommend using Minimal APIs** as they provide a simplified, high-performance approach…"
- The page frames controllers as the "Alternative approach". They "may be preferred for: large applications with complex business logic; teams familiar with the MVC pattern; applications requiring specific MVC features."
- It lists what minimal APIs offer: simpler syntax, better performance, **easier testing**, modern approach.
- Consider controllers if you need model-binding extensibility (`IModelBinder`), advanced validation (`IModelValidator`), application parts or the application model, or OData. The page adds: "Most of these features can be implemented in Minimal APIs with custom solutions, but controllers provide them out of the box."

The ASP.NET Core 10 changes below narrow the gap further ([What's new in ASP.NET Core 10](https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-10.0?view=aspnetcore-10.0)):

- **Built-in validation for minimal APIs.** `builder.Services.AddValidation()` checks DataAnnotations on query, header and body parameters and returns 400 on failure. `.DisableValidation()` turns it off per endpoint.
- **Auth-related.** Unauthenticated or unauthorized calls to API endpoints (`[ApiController]`, minimal APIs with JSON, or `TypedResults`) now return **401/403** instead of redirecting to a login page.

Microsoft's minimal API tutorial, [Tutorial: Create a Minimal API](https://learn.microsoft.com/en-us/aspnet/core/tutorials/min-web-api?view=aspnetcore-10.0&tabs=visual-studio-code), builds a **Todo** CRUD API, which is almost this project. It uses:

- `dotnet new webapi -o TodoApi`
- `MapGroup("/todoitems")` to group routes
- `TypedResults`, "including testability and automatically returning the response type metadata for OpenAPI"
- DTOs to prevent over-posting
- **`Microsoft.EntityFrameworkCore.InMemory`** as its database. EF's own testing docs discourage that provider (see section 7).

**Trade-offs for #8**

- Minimal APIs follow Microsoft's recommendation and the default template, and they come with a ready-made Todo tutorial to learn from. Handlers can be unit-tested directly when they return `TypedResults` (section 8).
- Controllers are the more explicit class-per-resource style. They offer more built-ins, but Microsoft names none of those built-ins as needed for a Todo API.
- Both support `[Authorize]` / `RequireAuthorization()` and route groups. Being auth-ready does not force either choice.
- Minimal API code can grow into one long `Program.cs` unless endpoints are split into files or extension methods (for example, one `MapGroup` per resource). That structure question belongs to #10.

## 6. EF Core version and providers

### Version and support ([EF Core releases](https://learn.microsoft.com/en-us/ef/core/what-is-new/))

| Release | Target | Supported until |
|---|---|---|
| **EF Core 10.0** | .NET 10 | **November 10, 2028** |
| EF Core 9.0 / 8.0 | .NET 8 | November 10, 2026 |
| EF Core 11.0 | | "scheduled for November 2026" (NuGet has `11.0.0-rc.1`) |

- The latest stable patch is **10.0.12** for `Microsoft.EntityFrameworkCore`, `.Sqlite`, `.SqlServer`, `.InMemory` and `dotnet-ef` (NuGet).
- "EF Core providers typically do not work across major versions" ([Database providers](https://learn.microsoft.com/en-us/ef/core/providers/)). In practice, keep every EF package on 10.x.

### Local provider options

| Provider package | Latest | Maintainer | Runs on this Mac? |
|---|---|---|---|
| `Microsoft.EntityFrameworkCore.Sqlite` | 10.0.12 | Microsoft (EF Core project) | Yes. In-process, a single file, no server or Docker. |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | 10.0.3 | Npgsql team | Yes, via Docker. The official `postgres:18` image publishes an `arm64` build ([Docker Hub tag API](https://hub.docker.com/v2/repositories/library/postgres/tags/18)). |
| `Microsoft.EntityFrameworkCore.SqlServer` | 10.0.12 | Microsoft | **Not supported.** See below. |
| `Microsoft.EntityFrameworkCore.InMemory` | 10.0.12 | Microsoft | Runs, but it is not a real database. EF docs discourage it (section 7). |

Sources: provider table in [Database providers](https://learn.microsoft.com/en-us/ef/core/providers/) and NuGet versions.

- Microsoft's provider table still lists Npgsql as "8, 9". It is out of date: NuGet has Npgsql 10.0.3, and Npgsql publishes [10.0 release notes](https://www.npgsql.org/efcore/release-notes/10.0.html) targeting EF 10.
- Microsoft recommends adding the latest `Microsoft.EntityFrameworkCore.Relational` patch as a direct dependency when a provider ships independently of EF Core, which is the case for Npgsql ([Database providers](https://learn.microsoft.com/en-us/ef/core/providers/)).

### SQL Server on Apple Silicon

- "SQL Server container images are supported only on Linux hosts running on Intel and AMD x86-64 CPUs. Emulation or translation environments (for example, Rosetta 2, Prism, or QEMU) aren't tested or supported." ([SQL Server Docker quickstart](https://learn.microsoft.com/en-us/sql/linux/quickstart-install-connect-docker?view=sql-server-ver17))
- The `mcr.microsoft.com/mssql/server:2025-latest` manifest is single-architecture `amd64`/`linux` (local probe of the MCR registry API).
- The container also needs at least 2 GB of RAM (same quickstart).
- **Azure SQL Edge**, formerly the ARM-friendly alternative, retired on 2025-09-30 ([Microsoft lifecycle: Azure SQL Edge](https://learn.microsoft.com/en-us/lifecycle/products/azure-sql-edge)).
- LocalDB, the SQL Server option used in many docs samples (for example `UseSqlServer(@"Server=(localdb)\mssqllocaldb;…")`), runs only on Windows ([Database providers](https://learn.microsoft.com/en-us/ef/core/providers/); [EF testing strategy](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy) calls it "LocalDB on Windows").

**Trade-offs for #9**

- **SQLite:** nothing to install, and migrations and the database file live in the repo folder. It is the "fake" EF's docs suggest when a test double is unavoidable. However, it behaves differently from server databases: for example, it is case-sensitive where SQL Server is not.
- **PostgreSQL in Docker:** a real server database of the kind used in jobs. It runs natively on arm64 and can be tested against the real engine with Testcontainers (NuGet `Testcontainers.PostgreSql` 4.15.0). The cost is one more moving part (Docker) for a beginner.
- **SQL Server:** the most common pairing in Microsoft docs, but it cannot be run in a supported way on this machine.

## 7. EF Core testing guidance

From [Choosing a testing strategy](https://learn.microsoft.com/en-us/ef/core/testing/choosing-a-testing-strategy):

- "We recommend that developers have good test coverage of their application running against their actual production database system." Docker and Testcontainers are named as making this easy.
- If you use a test double, EF recommends a **repository layer**. The next choice is "consider using SQLite in-memory databases".
- "Avoid the in-memory provider for testing purposes - this is discouraged and only supported for legacy applications."
- "Avoid mocking `DbSet` for querying purposes."
- The ASP.NET Core integration-test doc says the same: the SQLite provider "is the recommended choice for in-memory testing" over EF InMemory. It shows how to swap the app's `DbContext` for SQLite `:memory:` inside `WebApplicationFactory` ([Integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)).

## 8. Test templates and integration testing

### Built-in templates in SDK 10.0.300 (local probe: `dotnet new list`, generated `.csproj` files)

| Template | Framework package (template) | Latest stable on NuGet | Other packages in the template | Notes |
|---|---|---|---|---|
| `xunit` | `xunit` **2.9.3** (v2) | 2.9.3 (v2 is final); **`xunit.v3` 4.0.1** | `xunit.runner.visualstudio` 3.1.4, `Microsoft.NET.Test.Sdk` 17.14.1, `coverlet.collector` 6.0.4 | VSTest. Options: `--framework net10.0` and `--enable-pack` only. |
| `nunit` | `NUnit` **4.3.2** | 4.6.1 | `NUnit3TestAdapter` 5.0.0, `NUnit.Analyzers` 4.7.0, `Microsoft.NET.Test.Sdk` 17.14.0, `coverlet.collector` 6.0.4 | VSTest |
| `mstest` | `MSTest` **4.0.2** (meta-package) | 4.4.1 | none besides `MSTest` | Default `--test-runner VSTest`, which can be switched to `Microsoft.Testing.Platform`. `--sdk` gives the MSTest.Sdk project style. Adds `MSTestSettings.cs` with method-level parallelism. |

- **xUnit v3** is a separate install: `dotnet new install xunit.v3.templates`, then `dotnet new xunit3`. v3 test projects "are stand-alone executables", and the template turns on Microsoft Testing Platform support ([xUnit v3 getting started](https://xunit.net/docs/getting-started/v3/getting-started)).
- Microsoft lists MSTest, NUnit, TUnit and xUnit.net as "the popular test frameworks" and does not recommend one ([Testing in .NET](https://learn.microsoft.com/en-us/dotnet/core/testing/)).
- **Test platforms.** VSTest is the default mode of `dotnet test`. "Native MTP mode is available in .NET 10 SDK and later." Don't mix VSTest and MTP projects in one solution ([MTP vs VSTest](https://learn.microsoft.com/en-us/dotnet/core/testing/test-platforms-overview)).

### ASP.NET Core integration tests

- `WebApplicationFactory<Program>` and the in-memory `TestServer` come from **`Microsoft.AspNetCore.Mvc.Testing`** (NuGet 10.0.12). The test project must use `Sdk="Microsoft.NET.Sdk.Web"` ([Integration tests](https://learn.microsoft.com/en-us/aspnet/core/test/integration-tests?view=aspnetcore-10.0)).
- That doc has **xUnit, MSTest and NUnit** tabs for every example (same page).
- **No more `public partial class Program`.** In .NET 10 the generated `Program` class is public, and analyzer **ASP0027** flags the old declaration as "no longer required" ([ASP0027](https://learn.microsoft.com/en-us/aspnet/core/diagnostics/asp0027?view=aspnetcore-10.0)).
- Minimal API handlers written as named methods that return `TypedResults` can be **unit-tested without HTTP** by asserting on `Ok<T>` or `NotFound`. The docs' examples use xUnit. They also advise: "Separate unit tests from integration tests into different projects" ([Test Minimal API apps](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis/test-min-api?view=aspnetcore-10.0)).

**Trade-offs for #12**

- **xUnit** has the most Microsoft doc samples. But the SDK template is v2, and v3 means installing one extra template plus using MTP.
- **MSTest** is Microsoft's own framework, and its SDK template is already on the current major version (4.x).
- **NUnit** is also a current major version, with tabs in the integration-test docs.
- Whichever is chosen, older patch versions in the templates are normal and can be bumped on day one.
- Pick VSTest or MTP once for the whole solution.
- Unit vs integration: `TypedResults` handlers allow quick unit tests, and `WebApplicationFactory` plus a real or SQLite database covers HTTP behaviour. The database choice in #9 decides what the integration tests run against.

## 9. VS Code + C# Dev Kit

- C# Dev Kit builds on the base C# extension: "C# Dev Kit does not replace the existing C# extension but adds on top of the great language service features it provides" ([C# Dev Kit FAQ](https://code.visualstudio.com/docs/csharp/cs-dev-kit-faq)).
- **Licence:** "For personal, academic, and open-source projects, C# Dev Kit can be used at no cost." Commercial teams of up to 5 are also free, and teams of 6 or more need a Visual Studio Professional subscription (same FAQ). The getting-started page says you must sign in to a Visual Studio subscription to use C# Dev Kit ([Get started with C#](https://code.visualstudio.com/docs/csharp/get-started)). For a personal learning project this means a free sign-in, not a purchase.
- Test Explorer discovers tests only after a successful build (same FAQ).
- On macOS, the first debug run (F5) may prompt for a password. The FAQ fixes this by enabling Developer Mode (same FAQ).
- Both `ms-dotnettools.csdevkit` and `ms-dotnettools.csharp` are already installed (local probe).

## 10. Gaps and caveats

- I did not verify whether C# Dev Kit can run `.http` files natively in VS Code or whether the REST Client extension is needed. Microsoft's `.http` doc covers only Visual Studio.
- Microsoft's EF provider table is stale for Npgsql (it says "8, 9"). The 10.x support claim rests on NuGet and Npgsql's own release notes.
- NuGet version numbers change every month. Re-check them when the roadmap step is built.
