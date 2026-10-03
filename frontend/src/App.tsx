import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { Vacio } from './components/ui'
import CargoDetalle from './pages/CargoDetalle'
import CargoNuevo from './pages/CargoNuevo'
import Cargos from './pages/Cargos'
import CatalogoSimple from './pages/CatalogoSimple'
import Citas from './pages/Citas'
import Clientes from './pages/Clientes'
import Compras from './pages/Compras'
import Cobranza from './pages/Cobranza'
import CotizacionEditor from './pages/CotizacionEditor'
import Cotizaciones from './pages/Cotizaciones'
import CuentasPorPagar from './pages/CuentasPorPagar'
import Empleados from './pages/Empleados'
import Faltantes from './pages/Faltantes'
import Formatos from './pages/Formatos'
import Inicio from './pages/Inicio'
import Inventario from './pages/Inventario'
import ListasPrecios from './pages/ListasPrecios'
import Mensajes from './pages/Mensajes'
import Login from './pages/Login'
import MiEmpresa from './pages/MiEmpresa'
import OrdenCompra from './pages/OrdenCompra'
import Promociones from './pages/Promociones'
import Productos from './pages/Productos'
import ProspectoDetalle from './pages/ProspectoDetalle'
import Prospectos from './pages/Prospectos'
import Proveedores from './pages/Proveedores'
import Roles from './pages/Roles'
import Soporte from './pages/Soporte'
import Sucursales from './pages/Sucursales'
import Usuarios from './pages/Usuarios'
import { RequierePermiso, RequiereSesion } from './sesion/Rutas'

const conPermiso = (permiso: string, pagina: ReactNode) => <RequierePermiso permiso={permiso}>{pagina}</RequierePermiso>

export default function App() {
  return (
    <Routes>
      <Route path="login" element={<Login />} />
      <Route element={<RequiereSesion />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="prospectos" element={conPermiso('prospectos.ver', <Prospectos />)} />
          <Route path="prospectos/:id" element={conPermiso('prospectos.ver', <ProspectoDetalle />)} />
          <Route path="citas" element={conPermiso('citas.ver', <Citas />)} />
          <Route path="cotizaciones" element={conPermiso('cotizaciones.ver', <Cotizaciones />)} />
          <Route path="cotizaciones/nueva" element={conPermiso('cotizaciones.editar', <CotizacionEditor />)} />
          <Route path="cotizaciones/:id" element={conPermiso('cotizaciones.ver', <CotizacionEditor />)} />
          <Route path="cargos" element={conPermiso('cargos.ver', <Cargos />)} />
          <Route path="cargos/nuevo" element={conPermiso('cargos.editar', <CargoNuevo />)} />
          <Route path="cargos/:id" element={conPermiso('cargos.ver', <CargoDetalle />)} />
          <Route path="cobranza" element={conPermiso('cobranza.ver', <Cobranza />)} />
          <Route path="cuentas-pagar" element={conPermiso('cuentas-pagar.ver', <CuentasPorPagar />)} />
          <Route path="compras" element={conPermiso('compras.ver', <Compras />)} />
          <Route path="compras/nueva" element={conPermiso('compras.editar', <OrdenCompra />)} />
          <Route path="compras/faltantes" element={conPermiso('compras.ver', <Faltantes />)} />
          <Route path="compras/:id" element={conPermiso('compras.ver', <OrdenCompra />)} />
          <Route path="inventario" element={conPermiso('inventario.ver', <Inventario />)} />
          <Route path="listas-precios" element={conPermiso('listas-precios.ver', <ListasPrecios />)} />
          <Route path="empresa" element={<MiEmpresa />} />
          <Route path="mensajes" element={conPermiso('mensajes.ver', <Mensajes />)} />
          <Route path="promociones" element={conPermiso('promociones.ver', <Promociones />)} />
          <Route path="formatos" element={conPermiso('formatos.ver', <Formatos />)} />
          <Route path="soporte" element={<Soporte />} />
          <Route path="clientes" element={conPermiso('clientes.ver', <Clientes />)} />
          <Route path="productos" element={conPermiso('productos.ver', <Productos />)} />
          <Route path="empleados" element={conPermiso('empleados.ver', <Empleados />)} />
          <Route path="catalogos/puestos" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="puestos" titulo="Puestos" descripcion="Puestos de los empleados." />)} />
          <Route path="catalogos/unidades-negocio" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="unidades-negocio" titulo="Unidades de negocio" descripcion="Divisiones comerciales de la empresa." />)} />
          <Route path="catalogos/acciones-actividades" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="acciones-actividades" titulo="Acciones y actividades"
              descripcion="Tipos de actividad comercial: llamadas, visitas, demostraciones…" conDuracion />)} />
          <Route path="catalogos/descripciones-servicio" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="descripciones-servicio" titulo="Descripción de servicios" descripcion="Servicios que ofrece la empresa y su alcance." />)} />
          <Route path="catalogos/tipos-contacto" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="tipos-contacto" titulo="Tipos de contacto" descripcion="Áreas de contacto con proveedores y clientes: ventas, cobranza, soporte…" />)} />
          <Route path="catalogos/instrumentos-pago" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="instrumentos-pago" titulo="Instrumentos de pago" descripcion="Medios de pago aceptados: efectivo, transferencia, tarjeta…" />)} />
          <Route path="catalogos/condiciones-pago" element={conPermiso('catalogos.ver',
            <CatalogoSimple ruta="condiciones-pago" titulo="Condiciones de pago" descripcion="Contado o crédito y sus días de plazo." conDiasCredito />)} />
          <Route path="proveedores" element={conPermiso('proveedores.ver', <Proveedores />)} />
          <Route path="sucursales" element={conPermiso('sucursales.ver', <Sucursales />)} />
          <Route path="usuarios" element={conPermiso('usuarios.ver', <Usuarios />)} />
          <Route path="roles" element={conPermiso('roles.ver', <Roles />)} />
          <Route path="*" element={<Vacio mensaje="Página no encontrada." />} />
        </Route>
      </Route>
    </Routes>
  )
}
