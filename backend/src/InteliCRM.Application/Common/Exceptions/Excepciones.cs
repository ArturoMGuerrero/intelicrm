namespace InteliCRM.Application.Common.Exceptions;

/// <summary>El recurso solicitado no existe. La API lo convierte en 404.</summary>
public class NoEncontradoException(string entidad, object id)
    : Exception($"{entidad} con id '{id}' no existe.");

/// <summary>Se violó una regla de negocio (p. ej. horario ocupado). La API lo convierte en 409.</summary>
public class ReglaNegocioException(string mensaje) : Exception(mensaje);
