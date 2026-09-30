using System.Security.Claims;
using System.Text;
using InteliCRM.Application.Seguridad;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;

namespace InteliCRM.Api.Seguridad;

public class OpcionesJwt
{
    public const string Seccion = "Jwt";

    public string Emisor { get; set; } = "InteliCRM";
    public string Audiencia { get; set; } = "InteliCRM";

    /// <summary>Clave secreta (mínimo 32 caracteres). Nunca en el repositorio: user-secrets o variables de entorno.</summary>
    public string Clave { get; set; } = string.Empty;

    public int DuracionHoras { get; set; } = 8;

    public SymmetricSecurityKey LlaveFirma() => new(Encoding.UTF8.GetBytes(Clave));
}

public record TokenEmitido(string Token, DateTime Expira);

public class TokenService(OpcionesJwt opciones)
{
    public TokenEmitido Emitir(SesionDto sesion)
    {
        var expira = DateTime.UtcNow.AddHours(opciones.DuracionHoras);

        var claims = new List<Claim>
        {
            new(Claims.UsuarioId, sesion.UsuarioId.ToString()),
            new(Claims.CuentaId, sesion.CuentaId.ToString()),
            new(Claims.Nombre, sesion.Nombre),
            new(Claims.SelloSeguridad, sesion.SelloSeguridad),
        };
        claims.AddRange(sesion.Permisos.Select(p => new Claim(Claims.Permiso, p)));

        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Issuer = opciones.Emisor,
            Audience = opciones.Audiencia,
            Subject = new ClaimsIdentity(claims),
            Expires = expira,
            SigningCredentials = new SigningCredentials(opciones.LlaveFirma(), SecurityAlgorithms.HmacSha256),
        });

        return new TokenEmitido(token, expira);
    }
}
