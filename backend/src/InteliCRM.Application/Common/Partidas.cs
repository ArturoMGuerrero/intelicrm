using InteliCRM.Application.Common.Exceptions;
using InteliCRM.Application.Common.Interfaces;
using InteliCRM.Application.Cotizaciones;
using InteliCRM.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InteliCRM.Application.Common;

/// <summary>Partida ya validada, lista para copiarse a una cotización o a un cargo.</summary>
public record PartidaValidada(int? ProductoId, string Descripcion, decimal Cantidad, decimal PrecioUnitario, decimal DescuentoPorcentaje);

public static class Partidas
{
    /// <summary>
    /// Valida las partidas capturadas: los productos deben existir y cada partida necesita
    /// descripción. Si faltan descripción o precio se toman del producto.
    /// </summary>
    public static async Task<List<PartidaValidada>> ValidarAsync(
        IAppDbContext db, IEnumerable<GuardarPartidaRequest> partidas, CancellationToken ct)
    {
        var lista = partidas.ToList();

        // Cargar de una vez los productos referenciados por las partidas.
        var productoIds = lista.Where(p => p.ProductoId is not null).Select(p => p.ProductoId!.Value).Distinct().ToList();
        var productos = await db.Productos.AsNoTracking()
            .Where(p => productoIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id, ct);

        var resultado = new List<PartidaValidada>();
        foreach (var partida in lista)
        {
            Producto? producto = null;
            if (partida.ProductoId is { } prodId && !productos.TryGetValue(prodId, out producto))
                throw new NoEncontradoException("Producto", prodId);

            var descripcion = !string.IsNullOrWhiteSpace(partida.Descripcion) ? partida.Descripcion.Trim() : producto?.Nombre;
            if (string.IsNullOrWhiteSpace(descripcion))
                throw new ReglaNegocioException("Cada partida necesita un producto o una descripción.");

            resultado.Add(new PartidaValidada(
                partida.ProductoId, descripcion, partida.Cantidad,
                partida.PrecioUnitario ?? producto?.Precio ?? 0, partida.DescuentoPorcentaje));
        }
        return resultado;
    }
}
