using System.ComponentModel.DataAnnotations;
using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Empresa;

public record CuentaBancariaDto(int Id, string Banco, string? NumeroCuenta, string? Clabe, string? Descripcion);

public record ConfiguracionEmpresaDto(
    string RazonSocial, string? NombreComercial, string? Rfc, string? RegimenFiscal, string? CodigoPostal,
    string? Direccion, string? Telefono, string? Correo, string? SitioWeb, string? Logo,
    string? SerieFactura, string? PieDocumentos, List<CuentaBancariaDto> CuentasBancarias);

public class GuardarCuentaBancariaRequest
{
    [Required, StringLength(100)]
    public string Banco { get; set; } = string.Empty;

    [StringLength(30)]
    public string? NumeroCuenta { get; set; }

    [RegularExpression("^[0-9]{18}$", ErrorMessage = "La CLABE debe tener 18 dígitos.")]
    public string? Clabe { get; set; }

    [StringLength(200)]
    public string? Descripcion { get; set; }
}

public class GuardarEmpresaRequest
{
    [Required, StringLength(250)]
    public string RazonSocial { get; set; } = string.Empty;

    [StringLength(200)]
    public string? NombreComercial { get; set; }

    [RegularExpression("^[A-ZÑ&]{3,4}[0-9]{6}[A-Z0-9]{3}$", ErrorMessage = "El RFC no tiene un formato válido.")]
    public string? Rfc { get; set; }

    [RegularExpression("^[0-9]{3}$", ErrorMessage = "El régimen fiscal es una clave de 3 dígitos del SAT.")]
    public string? RegimenFiscal { get; set; }

    [RegularExpression("^[0-9]{5}$", ErrorMessage = "El código postal debe tener 5 dígitos.")]
    public string? CodigoPostal { get; set; }

    [StringLength(500)]
    public string? Direccion { get; set; }

    [Phone, StringLength(20)]
    public string? Telefono { get; set; }

    [EmailAddress, StringLength(150)]
    public string? Correo { get; set; }

    [StringLength(200)]
    public string? SitioWeb { get; set; }

    /// <summary>Data URL de una imagen PNG o JPEG (máx. ~300 KB).</summary>
    [StringLength(420_000, ErrorMessage = "El logo es demasiado grande (máximo 300 KB).")]
    public string? Logo { get; set; }

    [StringLength(10)]
    public string? SerieFactura { get; set; }

    [StringLength(1000)]
    public string? PieDocumentos { get; set; }

    public List<GuardarCuentaBancariaRequest> CuentasBancarias { get; set; } = [];
}

/// <summary>Datos de la empresa (antes "Mi empresa"). Hay un solo registro por cuenta.</summary>
public class EmpresaService(IAppDbContext db, IUsuarioActual usuario)
{
    public async Task<ConfiguracionEmpresaDto> ObtenerAsync(CancellationToken ct)
    {
        var config = await db.ConfiguracionesEmpresa.AsNoTracking().Include(c => c.CuentasBancarias).FirstOrDefaultAsync(ct);
        if (config is null)
        {
            // Sin configurar: se propone el nombre de la cuenta como razón social.
            var nombre = await db.Cuentas.AsNoTracking().Where(c => c.Id == usuario.CuentaId).Select(c => c.Nombre).FirstOrDefaultAsync(ct) ?? "";
            return new ConfiguracionEmpresaDto(nombre, null, null, null, null, null, null, null, null, null, null, null, []);
        }
        return ADto(config);
    }

    public async Task<ConfiguracionEmpresaDto> GuardarAsync(GuardarEmpresaRequest req, CancellationToken ct)
    {
        if (req.Logo is { Length: > 0 } logo &&
            !(logo.StartsWith("data:image/png;base64,") || logo.StartsWith("data:image/jpeg;base64,")))
            throw new ReglaNegocioException("El logo debe ser una imagen PNG o JPEG.");

        var config = await db.ConfiguracionesEmpresa.Include(c => c.CuentasBancarias).FirstOrDefaultAsync(ct);
        if (config is null)
        {
            config = new ConfiguracionEmpresa();
            db.ConfiguracionesEmpresa.Add(config);
        }

        config.RazonSocial = req.RazonSocial.Trim();
        config.NombreComercial = req.NombreComercial?.Trim();
        config.Rfc = string.IsNullOrWhiteSpace(req.Rfc) ? null : req.Rfc.Trim().ToUpper();
        config.RegimenFiscal = req.RegimenFiscal?.Trim();
        config.CodigoPostal = req.CodigoPostal?.Trim();
        config.Direccion = req.Direccion?.Trim();
        config.Telefono = req.Telefono?.Trim();
        config.Correo = req.Correo?.Trim();
        config.SitioWeb = req.SitioWeb?.Trim();
        config.Logo = string.IsNullOrWhiteSpace(req.Logo) ? null : req.Logo;
        config.SerieFactura = req.SerieFactura?.Trim().ToUpper();
        config.PieDocumentos = req.PieDocumentos?.Trim();

        // Las cuentas bancarias se reemplazan completas.
        config.CuentasBancarias.Clear();
        foreach (var c in req.CuentasBancarias)
            config.CuentasBancarias.Add(new CuentaBancariaEmpresa
            {
                Banco = c.Banco.Trim(), NumeroCuenta = c.NumeroCuenta?.Trim(),
                Clabe = string.IsNullOrWhiteSpace(c.Clabe) ? null : c.Clabe.Trim(), Descripcion = c.Descripcion?.Trim(),
            });

        await db.SaveChangesAsync(ct);
        return await ObtenerAsync(ct);
    }

    private static ConfiguracionEmpresaDto ADto(ConfiguracionEmpresa c) => new(
        c.RazonSocial, c.NombreComercial, c.Rfc, c.RegimenFiscal, c.CodigoPostal, c.Direccion, c.Telefono,
        c.Correo, c.SitioWeb, c.Logo, c.SerieFactura, c.PieDocumentos,
        c.CuentasBancarias.OrderBy(b => b.Id).Select(b => new CuentaBancariaDto(b.Id, b.Banco, b.NumeroCuenta, b.Clabe, b.Descripcion)).ToList());
}
