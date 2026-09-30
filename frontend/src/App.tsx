import type { ReactNode } from 'react'
import { Route, Routes } from 'react-router'
import Layout from './components/Layout'
import { Vacio } from './components/ui'
import CatalogoSimple from './pages/CatalogoSimple'
import Citas from './pages/Citas'
import Clientes from './pages/Clientes'
import CotizacionEditor from './pages/CotizacionEditor'
import Cotizaciones from './pages/Cotizaciones'
import Empleados from './pages/Empleados'
import Inicio from './pages/Inicio'
import Login from './pages/Login'
import Productos from './pages/Productos'
import ProspectoDetalle from './pages/ProspectoDetalle'
import Prospectos from './pages/Prospectos'
import Roles from './pages/Roles'
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
          <Route path="usuarios" element={conPermiso('usuarios.ver', <Usuarios />)} />
          <Route path="roles" element={conPermiso('roles.ver', <Roles />)} />
          <Route path="*" element={<Vacio mensaje="Página no encontrada." />} />
        </Route>
      </Route>
    </Routes>
  )
}
