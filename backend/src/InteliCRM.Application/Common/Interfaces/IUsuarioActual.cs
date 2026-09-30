namespace InteliCRM.Application.Common.Interfaces;

/// <summary>
/// Usuario que hizo la petición actual (tomado del token). Es null cuando no hay sesión,
/// por ejemplo en el login o al cargar datos de ejemplo.
/// </summary>
public interface IUsuarioActual
{
    int? UsuarioId { get; }
    int? CuentaId { get; }
}
