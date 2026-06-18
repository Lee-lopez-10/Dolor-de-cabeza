/* ============================================================
   COMERCIALIZADORA ROSALES — app.js
   SPA Controller · API Integration · Data Management
   ============================================================ */

const API_BASE = "http://localhost:8080/api";

/* ============================================================
   LOCAL DATA (seed/fallback — synced with backend)
   ============================================================ */
const DB = {
  categorias: [
    { id: 1, nombre: "Productos de Limpieza",  tipo: "Limpieza"   },
    { id: 2, nombre: "Productos Desechables", tipo: "Desechable" },
  ],
  proveedores: [
    {
      id: 1,
      nombre: "QuimicaLimpia S.A.",
      direccion: "Parque Industrial Quito, Bodega 12",
      telefono: "0991100001",
      correo: "ventas@quimicalimpia.ec",
      estado: "Activo",
    },
  ],
  productos: [],
  inventario: [],
  defectuosos: [],
  clientes: [
    {
      id: 1,
      nombre: "Carlos",
      apellido: "Mendoza",
      direccion: "Av. Republica 120, Quito",
      telefono: "0991001001",
      email: "carlos.mendoza@gmail.com",
      estado: "Activo",
    },
    {
      id: 2,
      nombre: "Maria",
      apellido: "Suarez",
      direccion: "Calle Bolivar 45, Guayaquil",
      telefono: "0992002002",
      email: "maria.suarez@hotmail.com",
      estado: "Activo",
    },
    {
      id: 3,
      nombre: "Pedro",
      apellido: "Jimenez",
      direccion: "Av. Colon 789, Cuenca",
      telefono: "0993003003",
      email: "pedro.jimenez@yahoo.com",
      estado: "Activo",
    },
    {
      id: 4,
      nombre: "Ana",
      apellido: "Torres",
      direccion: "Calle Eloy Alfaro 23, Loja",
      telefono: "0994004004",
      email: "ana.torres@gmail.com",
      estado: "Activo",
    },
    {
      id: 5,
      nombre: "Luis",
      apellido: "Vega",
      direccion: "Av. Amazonas 456, Quito",
      telefono: "0995005005",
      email: "luis.vega@outlook.com",
      estado: "Activo",
    },
    {
      id: 6,
      nombre: "Sofia",
      apellido: "Castro",
      direccion: "Calle Olmedo 12, Ibarra",
      telefono: "0996006006",
      email: "sofia.castro@gmail.com",
      estado: "Activo",
    },
    {
      id: 7,
      nombre: "Jorge",
      apellido: "Mora",
      direccion: "Av. Las Americas 88, Guayaquil",
      telefono: "0997007007",
      email: "jorge.mora@gmail.com",
      estado: "Activo",
    },
    {
      id: 8,
      nombre: "Lucia",
      apellido: "Ramos",
      direccion: "Calle Salinas 34, Riobamba",
      telefono: "0998008008",
      email: "lucia.ramos@hotmail.com",
      estado: "Activo",
    },
    {
      id: 9,
      nombre: "Andres",
      apellido: "Pena",
      direccion: "Av. Universitaria 10, Ambato",
      telefono: "0999009009",
      email: "andres.pena@gmail.com",
      estado: "Activo",
    },
    {
      id: 10,
      nombre: "Valentina",
      apellido: "Ortega",
      direccion: "Calle Principal 77, Latacunga",
      telefono: "0990010010",
      email: "valentina.o@gmail.com",
      estado: "Activo",
    },
  ],
  empleados: [
    {
      id: 1,
      nombre: "Roberto",
      apellido: "Lara",
      correo: "roberto.lara@rosales.ec",
      ruta: "Ruta Norte Quito",
      estado: "Activo",
    },
    {
      id: 2,
      nombre: "Patricia",
      apellido: "Nunez",
      correo: "patricia.nunez@rosales.ec",
      ruta: "Ruta Sur Quito",
      estado: "Activo",
    },
    {
      id: 3,
      nombre: "Eduardo",
      apellido: "Salcedo",
      correo: "eduardo.salcedo@rosales.ec",
      ruta: "Ruta Centro Quito",
      estado: "Activo",
    },
    {
      id: 4,
      nombre: "Monica",
      apellido: "Quispe",
      correo: "monica.quispe@rosales.ec",
      ruta: "Ruta Valles",
      estado: "Activo",
    },
    {
      id: 5,
      nombre: "Felipe",
      apellido: "Beltran",
      correo: "felipe.beltran@rosales.ec",
      ruta: "Ruta Guayaquil Norte",
      estado: "Activo",
    },
  ],
  facturas: [],
  detalles: [],
  caja: null,
  movimientos_caja: [],
};

/* ============================================================
   HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);
const fmt = (n) => "$" + parseFloat(n || 0).toFixed(2);
const fmtDate = (d) => (d ? String(d).split("T")[0] : "—");

function getNextId(arr) {
  if (!arr.length) return 1;
  const usedIds = arr.map((x) => x.id).sort((a, b) => a - b);
  for (let i = 0; i < usedIds.length; i++) {
    if (usedIds[i] !== i + 1) return i + 1;
  }
  return usedIds.length + 1;
}

// Arrays de fallback para filtrado offline (cuando cat_tipo no está disponible)
// Solo 2 categorias: 1=Limpieza, 2=Desechable
// El filtrado real usa cat_tipo del backend; estos arrays son fallback offline
const CATS_LIMPIEZA   = [1];
const CATS_DESECHABLES = [2];

/* ============================================================
   CONTROL DE ACCESO - RESPONSABLE DE CAJA
   ============================================================ */
async function verificarAccesoCaja() {
  const cajaData = await apiCall("GET", "/caja/actual");
  if (!cajaData || cajaData.estado !== "Abierta") {
    return { permitido: false, mensaje: "⚠️ No hay caja abierta. Debes abrir la caja primero.", responsable: null };
  }
  return {
    permitido: true,
    responsable: {
      id: cajaData.id_empleado,
      nombre: cajaData.empleado_nombre || "Desconocido"
    },
    caja: cajaData
  };
}

function verificarEmpleadoResponsable(idEmpleadoIntento, responsable) {
  if (parseInt(idEmpleadoIntento) !== parseInt(responsable.id)) {
    return {
      permitido: false,
      mensaje: `❌ Acceso denegado.\n\nSolo ${responsable.nombre} (quien abrió la caja) puede realizar esta operación.`
    };
  }
  return { permitido: true };
}

function getProductoNombre(id) {
  const p = DB.productos.find((x) => x.id === id);
  return p ? p.nombre : "—";
}
function getClienteNombre(id) {
  const c = DB.clientes.find((x) => x.id === id);
  return c ? `${c.nombre} ${c.apellido}` : "—";
}
function getEmpleadoNombre(id) {
  const e = DB.empleados.find((x) => x.id === id);
  return e ? `${e.nombre} ${e.apellido}` : "—";
}
function getCategoriaNombre(id) {
  const c = DB.categorias.find((x) => x.id === id);
  return c ? c.nombre : "—";
}
function getProveedorNombre(id) {
  const p = DB.proveedores.find((x) => x.id === id);
  return p ? p.nombre : "—";
}

/* Stock total en unidades para un producto (suma de cantidad de todos los registros) */
function getStockForProduct(id) {
  return DB.inventario
    .filter((i) => i.id_prod === id)
    .reduce((s, m) => s + (parseInt(m.cantidad) || 0), 0);
}

/* Devuelve {paquetes, unidades_sueltas, total, unidades_paquete} para mostrar en tabla */
function getStockDisplay(id_prod) {
  const prod = DB.productos.find((p) => p.id === id_prod);
  const unidades_paquete = prod ? parseInt(prod.unidades_paquete) || 1 : 1;
  let paquetes = 0,
    unidades_sueltas = 0;
  DB.inventario
    .filter((i) => i.id_prod === id_prod)
    .forEach((i) => {
      paquetes += parseInt(i.paquetes) || 0;
      unidades_sueltas += parseInt(i.unidades_sueltas) || 0;
    });
  const total = paquetes * unidades_paquete + unidades_sueltas;
  return { paquetes, unidades_sueltas, total, unidades_paquete };
}

function getUnidadesPorPaquete(id_prod) {
  const prod = DB.productos.find((p) => p.id === id_prod);
  const u = prod && parseInt(prod.unidades_paquete);
  return u > 0 ? u : 1;
}

function reduceInventoryForProduct(id_prod, qty_units) {
  // qty_units: siempre en unidades individuales
  let remaining = qty_units;
  const uPaq = getUnidadesPorPaquete(id_prod);

  const invItems = DB.inventario
    .filter((i) => i.id_prod === id_prod && i.estado === "Disponible")
    .sort((a, b) => a.id - b.id);

  for (const inv of invItems) {
    if (remaining <= 0) break;

    const paquetes = parseInt(inv.paquetes) || 0;
    const sueltas = parseInt(inv.unidades_sueltas) || 0;
    const totalDisp = paquetes * uPaq + sueltas;
    if (totalDisp <= 0) continue;

    const take = Math.min(totalDisp, remaining);

    // 1. Consumir primero unidades sueltas
    const deSueltas = Math.min(sueltas, take);
    let nuevosSueltos = sueltas - deSueltas;
    let aunNecesito = take - deSueltas;

    // 2. Si faltan, romper paquetes completos
    let nuevosPaquetes = paquetes;
    if (aunNecesito > 0) {
      const paqARomper = Math.ceil(aunNecesito / uPaq);
      const udsDeRomper = paqARomper * uPaq;
      nuevosPaquetes = Math.max(0, paquetes - paqARomper);
      // Unidades sobrantes del paquete roto → sueltas
      nuevosSueltos += udsDeRomper - aunNecesito;
    }

    const nuevaCantidad = nuevosPaquetes * uPaq + nuevosSueltos;

    inv.paquetes = nuevosPaquetes;
    inv.unidades_sueltas = nuevosSueltos;
    inv.cantidad = nuevaCantidad;

    if (nuevaCantidad <= 0) {
      inv.estado = "Agotado";
      inv.paquetes = 0;
      inv.unidades_sueltas = 0;
      inv.cantidad = 0;
    }

    remaining -= take;

    apiCall("PUT", `/inventario/${inv.id}`, {
      id_prod: inv.id_prod,
      paquetes: Math.max(0, inv.paquetes),
      unidades_sueltas: Math.max(0, inv.unidades_sueltas),
      fecha: inv.fecha,
      estado: inv.estado,
    });
  }

  if (remaining > 0) {
    showToast("⚠️ Stock insuficiente al procesar la venta", "error");
  }
}

function increaseInventoryForProduct(id_prod, qty, fecha) {
  const inv = DB.inventario.find(
    (i) => i.id_prod === id_prod && i.estado === "Disponible",
  );
  if (inv) {
    inv.cantidad = (parseInt(inv.cantidad) || 0) + qty;
    inv.unidades_sueltas = (parseInt(inv.unidades_sueltas) || 0) + qty;
    apiCall("PUT", `/inventario/${inv.id}`, inv);
  } else {
    const newId = getNextId(DB.inventario);
    const nuevo = {
      id: newId,
      id_prod,
      paquetes: 0,
      unidades_sueltas: qty,
      cantidad: qty,
      fecha: fecha || new Date().toISOString().split("T")[0],
      estado: "Disponible",
    };
    DB.inventario.push(nuevo);
    apiCall("POST", "/inventario", nuevo);
  }
}

/* ============================================================
   ROUTER — SPA navigation
   ============================================================ */
function navigate(page) {
  document
    .querySelectorAll(".page")
    .forEach((p) => p.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((n) => n.classList.remove("active"));

  const pageEl = $("page-" + page);
  if (pageEl) pageEl.classList.add("active");

  const navEl = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navEl) navEl.classList.add("active");

  const renders = {
    dashboard: renderDashboard,
    productos: () => renderProductos("limpieza"),
    clientes: renderClientes,
    empleados: renderEmpleados,
    inventario: renderInventario,
    proveedores: renderProveedores,
    ventas: renderVentas,
    reportes: () => {},
    defectuosos: renderDefectuosos,
    caja: renderCaja,
  };
  if (renders[page]) renders[page]();
}

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => navigate(item.dataset.page));
});

/* ============================================================
   DASHBOARD
   ============================================================ */
async function renderDashboard() {
  // Mostrar datos inmediatamente (placeholder mientras carga)
  $("dash-ventas-hoy").textContent = "...";
  $("dash-monto-hoy").textContent = "$...";
  $("dash-ganancia-mes").textContent = "$...";
  $("dash-productos-total").textContent = DB.productos.length || "...";
  $("dash-bajo-stock").textContent = "...";
  $("dash-clientes-activos").textContent = DB.clientes.length || "...";
  $("dash-empleados-activos").textContent = DB.empleados.length || "...";
  if ($("dash-inventario-paquetes")) $("dash-inventario-paquetes").textContent = "...";
  if ($("dash-inventario-unidades")) $("dash-inventario-unidades").textContent = "...";
  if ($("dash-inventario-total")) $("dash-inventario-total").textContent = "...";
  $("dash-caja-estado").textContent = "...";
  $("dash-caja-monto").textContent = "$0.00";
  
  // Cargar datos reales del backend
  try {
    const [dashData, cajaData] = await Promise.all([
      apiCall("GET", "/dashboard"),
      apiCall("GET", "/caja/actual"),
    ]);

    if (dashData && typeof dashData === "object" && !Array.isArray(dashData)) {
      // --- Stat Cards desde API ---
      $("dash-ventas-hoy").textContent = dashData.ventasHoy ?? 0;
      $("dash-monto-hoy").textContent = fmt(dashData.montoVentasHoy ?? 0);
      
      // Ganancia mensual con color según valor
      const gananciaMes = dashData.gananciaMes ?? 0;
      $("dash-ganancia-mes").textContent = fmt(gananciaMes);
      const gananciaEl = $("dash-ganancia-mes");
      if (gananciaMes < 0) {
        gananciaEl.style.color = "var(--danger)";
      } else if (gananciaMes > 0) {
        gananciaEl.style.color = "var(--accent)";
      } else {
        gananciaEl.style.color = "";
      }
      
      $("dash-productos-total").textContent = dashData.productosTotal ?? 0;
      $("dash-bajo-stock").textContent = dashData.productosBajoStock ?? 0;
      $("dash-clientes-activos").textContent = dashData.clientesActivos ?? 0;
      $("dash-empleados-activos").textContent = dashData.empleadosActivos ?? 0;
      if ($("dash-inventario-paquetes"))
        $("dash-inventario-paquetes").textContent = (
          dashData.totalPaquetes ?? 0
        ).toLocaleString();
      if ($("dash-inventario-unidades"))
        $("dash-inventario-unidades").textContent = (
          dashData.totalUnidadesSueltas ?? 0
        ).toLocaleString();
      if ($("dash-inventario-total"))
        $("dash-inventario-total").textContent = (
          dashData.totalInventario ?? 0
        ).toLocaleString();

      // Estado de caja
      const cajaCard = $("stat-caja");
      const estadoCaja = dashData.cajaEstado || "Cerrada";
      $("dash-caja-estado").textContent = estadoCaja;
      $("dash-caja-monto").textContent = fmt(dashData.cajaMonto ?? 0);
      cajaCard.className =
        "stat-card " +
        (estadoCaja === "Abierta" ? "caja-abierta" : "caja-cerrada");

      // Últimas ventas
      renderUltimasVentas(dashData.ultimasVentas || []);
    } else {
      // --- Fallback con datos locales ---
      const totalInv = DB.inventario.reduce(
        (s, i) => s + (parseInt(i.cantidad) || 0),
        0,
      );
      const totalMonto = DB.facturas.reduce(
        (s, f) => s + (parseFloat(f.total) || 0),
        0,
      );

      $("dash-ventas-hoy").textContent = DB.facturas.length;
      $("dash-monto-hoy").textContent = fmt(totalMonto);
      $("dash-ganancia-mes").textContent = fmt(0);
      $("dash-productos-total").textContent = DB.productos.length;
      $("dash-bajo-stock").textContent = 0;
      $("dash-clientes-activos").textContent = DB.clientes.filter(
        (c) => !c.estado || c.estado === "Activo",
      ).length;
      $("dash-empleados-activos").textContent = DB.empleados.filter(
        (e) => !e.estado || e.estado === "Activo",
      ).length;
      if ($("dash-inventario-paquetes"))
        $("dash-inventario-paquetes").textContent = "0";
      if ($("dash-inventario-unidades"))
        $("dash-inventario-unidades").textContent = "0";
      if ($("dash-inventario-total"))
        $("dash-inventario-total").textContent = totalInv.toLocaleString();
      $("dash-caja-estado").textContent = "Cerrada";
      $("dash-caja-monto").textContent = fmt(0);
      $("stat-caja").className = "stat-card caja-cerrada";

      renderUltimasVentas([]);
    }

    // --- Resumen de Caja en Dashboard ---
    const cajaBox = $("dash-caja-resumen-box");
    if (cajaData && cajaData.estado === "Abierta") {
      const montoInicial = parseFloat(cajaData.monto_inicial || 0);
      const totalVentas = parseFloat(cajaData.total_ventas || 0);
      const totalIngresos = parseFloat(cajaData.total_ingresos || 0);
      const totalEgresos = parseFloat(cajaData.total_egresos || 0);
      const montoFinal =
        montoInicial + totalVentas + totalIngresos - totalEgresos;
      const ganancia = totalVentas + totalIngresos - totalEgresos;

      cajaBox.innerHTML = `
        <h2 class="section-title">💵 Resumen de Caja — Hoy</h2>
        <div class="caja-resumen-grid" style="padding:0 20px 20px">
          <div class="caja-metric">
            <span class="caja-metric-label">Monto Inicial</span>
            <span class="caja-metric-value">${fmt(montoInicial)}</span>
          </div>
          <div class="caja-metric">
            <span class="caja-metric-label">Total Ventas</span>
            <span class="caja-metric-value">${fmt(totalVentas)}</span>
          </div>
          <div class="caja-metric">
            <span class="caja-metric-label">Ingresos Extra</span>
            <span class="caja-metric-value">${fmt(totalIngresos)}</span>
          </div>
          <div class="caja-metric">
            <span class="caja-metric-label">Egresos</span>
            <span class="caja-metric-value" style="color:var(--danger)">${fmt(totalEgresos)}</span>
          </div>
          <div class="caja-metric highlight">
            <span class="caja-metric-label">Monto Final Estimado</span>
            <span class="caja-metric-value">${fmt(montoFinal)}</span>
          </div>
          <div class="caja-metric highlight">
            <span class="caja-metric-label">Ganancia del Día</span>
            <span class="caja-metric-value" style="color:var(--accent)">${fmt(ganancia)}</span>
          </div>
        </div>
      `;
      cajaBox.style.display = "";
    } else {
      cajaBox.style.display = "none";
    }
  } catch (error) {
    console.error("Error renderizando dashboard:", error);
    // Mostrar datos locales si hay error
    $("dash-ventas-hoy").textContent = "0";
    $("dash-monto-hoy").textContent = "$0.00";
    $("dash-productos-total").textContent = DB.productos.length;
    $("dash-clientes-activos").textContent = DB.clientes.length;
    $("dash-empleados-activos").textContent = DB.empleados.length;
  }
}

function renderUltimasVentas(ventas) {
  const tbody = $("dash-ventas-table");
  // Si se recibieron ventas del backend, usarlas directamente
  if (ventas && ventas.length > 0) {
    tbody.innerHTML = ventas
      .map(
        (v) => `
      <tr>
        <td class="muted">${v.id}</td>
        <td>${v.cliente_nombre || getClienteNombre(v.id_cli) || "—"}</td>
        <td class="muted">${v.empleado_nombre || getEmpleadoNombre(v.id_emp) || "—"}</td>
        <td class="muted">${fmtDate(v.fecha)}</td>
        <td><span class="badge badge-green">${fmt(v.total)}</span></td>
      </tr>
    `,
      )
      .join("");
    return;
  }
  // Fallback: últimas del DB local
  const ultimas = [...DB.facturas].slice(-7).reverse();
  if (ultimas.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">No hay ventas registradas</td></tr>';
    return;
  }
  tbody.innerHTML = ultimas
    .map(
      (f) => `
    <tr>
      <td class="muted">${f.id}</td>
      <td>${getClienteNombre(f.id_cli)}</td>
      <td class="muted">${getEmpleadoNombre(f.id_emp)}</td>
      <td class="muted">${fmtDate(f.fecha)}</td>
      <td><span class="badge badge-green">${fmt(f.total)}</span></td>
    </tr>
  `,
    )
    .join("");
}

/* ============================================================
   PRODUCTOS
   ============================================================ */
let currentTab = "limpieza";
let searchTerm = "";

function filterProductos(tab, btn) {
  currentTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderProductos(tab);
}

function searchProductos(val) {
  searchTerm = val.toLowerCase();
  renderProductos(currentTab);
}

function renderProductos(tab) {
  const tipo = tab === "limpieza" ? "Limpieza" : "Desechable";
  let items = DB.productos.filter((p) => {
    // Usar cat_tipo del producto si viene del backend
    if (p.cat_tipo) return p.cat_tipo === tipo;
    // Fallback para datos offline
    const cats = tab === "limpieza" ? CATS_LIMPIEZA : CATS_DESECHABLES;
    return cats.includes(p.id_cat);
  });

  if (searchTerm) {
    items = items.filter(
      (p) =>
        p.nombre.toLowerCase().includes(searchTerm) ||
        (p.cat_nombre || getCategoriaNombre(p.id_cat))
          .toLowerCase()
          .includes(searchTerm),
    );
  }

  const tbody = $("productos-table");
  if (items.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="9">No hay productos en esta categoría</td></tr>';
    return;
  }
  tbody.innerHTML = items
    .map((p) => {
      const stock = getStockDisplay(p.id);
      const stockTxt = `${stock.paquetes} paq + ${stock.unidades_sueltas} uds (=${stock.total} uds)`;
      const catNombre = p.cat_nombre || getCategoriaNombre(p.id_cat);
      return `
    <tr>
      <td class="muted">#${p.id}</td>
      <td><strong>${p.nombre}</strong><br><small style="color:var(--text-muted)">${p.descripcion || ""}</small></td>
      <td><span class="badge badge-blue">${catNombre}</span></td>
      <td>${fmt(p.precio_unit)}</td>
      <td>${fmt(p.precio_may)}</td>
      <td class="muted">${fmt(p.precio_venta_paq || 0)}/paq</td>
      <td class="muted" style="white-space:nowrap;font-size:0.8rem">${stockTxt}</td>
      <td class="muted">${getProveedorNombre(p.id_prov)}</td>
      <td>
        <button class="btn-icon" onclick="editProducto(${p.id})" title="Editar">✏️</button>
        <button class="btn-icon danger" onclick="deleteProducto(${p.id})" title="Eliminar">🗑️</button>
      </td>
    </tr>`;
    })
    .join("");
}

function editProducto(id) {
  const p = DB.productos.find((x) => x.id === id);
  if (!p) return;
  $("prod-id").value = p.id;
  $("prod-nombre").value = p.nombre;
  $("prod-desc").value = p.descripcion || "";
  $("prod-precio-unit").value = p.precio_unit;
  $("prod-precio-may").value = p.precio_may;
  $("prod-unidades-paquete").value = p.unidades_paquete || 1;
  $("prod-precio-compra-paq").value = p.precio_compra_paq || "";
  $("prod-precio-venta-paq").value = p.precio_venta_paq || "";

  // Ocultar campo cantidad de paquetes al editar
  $("prod-cantidad-paquetes-group").style.display = "none";

  // Poblar selects
  $("prod-categoria").innerHTML =
    '<option value="">Seleccionar...</option>' +
    DB.categorias
      .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
      .join("");
  // Solo proveedores activos
  $("prod-proveedor").innerHTML =
    '<option value="">Seleccionar...</option>' +
    DB.proveedores
      .filter((pr) => !pr.estado || pr.estado === "Activo")
      .map((pr) => `<option value="${pr.id}">${pr.nombre}</option>`)
      .join("");
  // Solo empleados activos
  if ($("prod-empleado")) {
    $("prod-empleado").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.empleados
        .filter((e) => !e.estado || e.estado === "Activo")
        .map(
          (e) => `<option value="${e.id}">${e.nombre} ${e.apellido}</option>`,
        )
        .join("");
  }

  $("prod-categoria").value = p.id_cat;
  $("prod-proveedor").value = p.id_prov;
  if ($("prod-empleado"))
    $("prod-empleado").value = p.id_empleado_registro || "";
  if ($("prod-fecha-ingreso"))
    $("prod-fecha-ingreso").value = p.fecha_ingreso
      ? String(p.fecha_ingreso).split("T")[0]
      : "";

  $("modal-producto-title").textContent = "✏️ Editar Producto";
  openModal("modal-producto");
}

async function deleteProducto(id) {
  if (!confirm("¿Eliminar este producto?")) return;
  const res = await apiCall("DELETE", `/productos/${id}`);
  if (res === false) {
    showToast("❌ Error al eliminar producto", "error");
    return;
  }
  DB.productos = DB.productos.filter((p) => p.id !== id);
  renderProductos(currentTab);
  showToast("🗑️ Producto eliminado", "success");
}

/* Calcular Total a Pagar al Proveedor */
function calcularTotalPagar() {
  const cantidadPaquetes = parseFloat($("prod-cantidad-paquetes").value) || 0;
  const precioCompraPaquete = parseFloat($("prod-precio-compra-paq").value) || 0;
  const totalPagar = cantidadPaquetes * precioCompraPaquete;
  $("prod-total-pagar").value = totalPagar.toFixed(2);
}

async function saveProducto() {
  const idStr = $("prod-id").value;
  const nombre = $("prod-nombre").value.trim();
  const desc = $("prod-desc").value.trim();
  const precioUnit = parseFloat($("prod-precio-unit").value);
  const precioMay = parseFloat($("prod-precio-may").value);
  const idCat = parseInt($("prod-categoria").value);
  const idProv = parseInt($("prod-proveedor").value);
  const unidadesPaq = parseInt($("prod-unidades-paquete").value) || 1;
  const precioCompraPaq = parseFloat($("prod-precio-compra-paq").value) || 0;
  const precioVentaPaq = parseFloat($("prod-precio-venta-paq").value) || 0;
  const cantPaquetes = parseInt($("prod-cantidad-paquetes").value) || 0;
  const idEmpleadoReg =
    parseInt($("prod-empleado") ? $("prod-empleado").value : "") || null;
  const fechaIngreso = $("prod-fecha-ingreso")
    ? $("prod-fecha-ingreso").value
    : new Date().toISOString().split("T")[0];
  // precio_may = precio_venta_paq (compatibilidad con BD)
  const precioMayFinal = precioVentaPaq || precioUnit;

  if (!nombre || isNaN(precioUnit) || !idCat || !idProv) {
    showToast("⚠️ Completa todos los campos obligatorios", "error");
    return;
  }
  
  // SI ES NUEVO PRODUCTO CON PAQUETES (compra), verificar acceso de caja
  if (!idStr && cantPaquetes > 0) {
    const acceso = await verificarAccesoCaja();
    if (!acceso.permitido) {
      showToast(acceso.mensaje, "error");
      return;
    }
    
    // Verificar que sea el empleado responsable
    if (idEmpleadoReg) {
      const verificacion = verificarEmpleadoResponsable(idEmpleadoReg, acceso.responsable);
      if (!verificacion.permitido) {
        showToast(verificacion.mensaje, "error");
        return;
      }
    }
  }

  if (idStr) {
    // === EDITAR ===
    const id = parseInt(idStr);
    const p = DB.productos.find((x) => x.id === id);
    if (p) {
      const payload = {
        nombre,
        descripcion: desc,
        precio_unit: precioUnit,
        precio_may: precioMayFinal,
        id_cat: idCat,
        id_prov: idProv,
        paquetes: cantPaquetes,
        unidades_paquete: unidadesPaq,
        precio_compra_paq: precioCompraPaq,
        precio_venta_paq: precioVentaPaq,
        id_empleado_registro: idEmpleadoReg,
        fecha_ingreso: fechaIngreso,
      };
      const res = await apiCall("PUT", `/productos/${id}`, payload);
      if (res === false) {
        showToast("❌ Error al actualizar producto", "error");
        return;
      }
      Object.assign(p, payload);
      showToast("✅ Producto actualizado", "success");
    }
  } else {
    // === NUEVO ===
    const payload = {
      nombre,
      descripcion: desc,
      precio_unit: precioUnit,
      precio_may: precioMayFinal,
      id_cat: idCat,
      id_prov: idProv,
      paquetes: cantPaquetes,
      unidades_paquete: unidadesPaq,
      precio_compra_paq: precioCompraPaq,
      precio_venta_paq: precioVentaPaq,
      id_empleado_registro: idEmpleadoReg,
      fecha_ingreso: fechaIngreso || new Date().toISOString().split("T")[0],
    };
    const res = await apiCall("POST", "/productos", payload);
    if (res === false) {
      showToast("❌ Error al guardar producto", "error");
      return;
    }
    const nuevo = {
      id: res && res.id ? res.id : getNextId(DB.productos),
      ...payload,
    };
    DB.productos.push(nuevo);

    // Sincronizar inventario si se ingresaron paquetes
    if (cantPaquetes > 0) {
      const invData = await apiCall("GET", "/inventario");
      if (Array.isArray(invData)) {
        invData.forEach((item) => {
          if (item.fecha && String(item.fecha).includes("T"))
            item.fecha = item.fecha.split("T")[0];
        });
        DB.inventario = invData;
      } else {
        // Fallback local
        DB.inventario.push({
          id: getNextId(DB.inventario),
          id_prod: nuevo.id,
          paquetes: cantPaquetes,
          unidades_sueltas: 0,
          cantidad: cantPaquetes * unidadesPaq,
          fecha: new Date().toISOString().split("T")[0],
          estado: "Disponible",
        });
      }
    }
    showToast("✅ Producto guardado", "success");
  }

  closeModal("modal-producto");
  renderProductos(currentTab);
}

/* ============================================================
   CLIENTES (soft delete)
   ============================================================ */
let searchCliente = "";

function searchClientes(val) {
  searchCliente = val.toLowerCase();
  renderClientes();
}

function renderClientes() {
  let items = DB.clientes;
  if (searchCliente) {
    items = items.filter(
      (c) =>
        `${c.nombre} ${c.apellido}`.toLowerCase().includes(searchCliente) ||
        (c.email || "").toLowerCase().includes(searchCliente),
    );
  }
  const tbody = $("clientes-table");
  if (items.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="8">No hay clientes</td></tr>';
    return;
  }
  tbody.innerHTML = items
    .map((c) => {
      const activo = !c.estado || c.estado === "Activo";
      const badge = activo
        ? '<span class="badge badge-green">Activo</span>'
        : '<span class="badge badge-red">Inactivo</span>';
      const toggleBtn = activo
        ? `<button class="btn-icon btn-danger-icon" onclick="toggleEstadoCliente(${c.id},'Activo')" title="Desactivar">🔴</button>`
        : `<button class="btn-icon btn-success-icon" onclick="toggleEstadoCliente(${c.id},'Inactivo')" title="Activar">🟢</button>`;
      return `
    <tr>
      <td class="muted">#${c.id}</td>
      <td>${c.nombre}</td>
      <td>${c.apellido}</td>
      <td class="muted">${c.direccion || "—"}</td>
      <td>${c.telefono || "—"}</td>
      <td class="muted">${c.email || "—"}</td>
      <td>${badge}</td>
      <td>
        <button class="btn-icon" onclick="editCliente(${c.id})" title="Editar">✏️</button>
        ${toggleBtn}
      </td>
    </tr>`;
    })
    .join("");
}

async function toggleEstadoCliente(id, estadoActual) {
  const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
  const res = await apiCall("PATCH", `/clientes/${id}/estado`, {
    estado: nuevoEstado,
  });
  if (res === false) {
    showToast("❌ Error al cambiar estado del cliente", "error");
    return;
  }
  const c = DB.clientes.find((x) => x.id === id);
  if (c) c.estado = nuevoEstado;
  renderClientes();
  showToast(
    `✅ Cliente ${nuevoEstado === "Activo" ? "activado" : "desactivado"}`,
    "success",
  );
}

function editCliente(id) {
  const c = DB.clientes.find((x) => x.id === id);
  if (!c) return;
  $("cli-id").value = c.id;
  $("cli-nombre").value = c.nombre;
  $("cli-apellido").value = c.apellido;
  $("cli-dir").value = c.direccion || "";
  $("cli-tel").value = c.telefono || "";
  $("cli-email").value = c.email || "";
  $("modal-cliente-title").textContent = "✏️ Editar Cliente";
  openModal("modal-cliente");
}

async function saveCliente() {
  const idStr = $("cli-id").value;
  const nombre = $("cli-nombre").value.trim();
  const apellido = $("cli-apellido").value.trim();
  const dir = $("cli-dir").value.trim();
  const tel = $("cli-tel").value.trim();
  const email = $("cli-email").value.trim();

  if (!nombre || !apellido) {
    showToast("⚠️ Nombre y apellido obligatorios", "error");
    return;
  }

  if (idStr) {
    const id = parseInt(idStr);
    const c = DB.clientes.find((x) => x.id === id);
    if (c) {
      const payload = {
        nombre,
        apellido,
        direccion: dir,
        telefono: tel,
        email,
      };
      const res = await apiCall("PUT", `/clientes/${id}`, payload);
      if (res === false) {
        showToast("❌ Error al actualizar cliente", "error");
        return;
      }
      Object.assign(c, payload);
      showToast("✅ Cliente actualizado", "success");
    }
  } else {
    const nuevo = {
      id: getNextId(DB.clientes),
      nombre,
      apellido,
      direccion: dir,
      telefono: tel,
      email,
      estado: "Activo",
    };
    const res = await apiCall("POST", "/clientes", nuevo);
    if (res === false) {
      showToast("❌ Error al guardar cliente", "error");
      return;
    }
    if (res && res.id) nuevo.id = res.id;
    DB.clientes.push(nuevo);
    showToast("✅ Cliente guardado", "success");
  }

  closeModal("modal-cliente");
  renderClientes();
}

/* ============================================================
   EMPLEADOS (soft delete)
   ============================================================ */
function renderEmpleados() {
  const tbody = $("empleados-table");
  if (DB.empleados.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="7">No hay empleados registrados</td></tr>';
    return;
  }
  tbody.innerHTML = DB.empleados
    .map((e) => {
      const activo = !e.estado || e.estado === "Activo";
      const badge = activo
        ? '<span class="badge badge-green">Activo</span>'
        : '<span class="badge badge-red">Inactivo</span>';
      const toggleBtn = activo
        ? `<button class="btn-icon btn-danger-icon" onclick="toggleEstadoEmpleado(${e.id},'Activo')" title="Desactivar">🔴</button>`
        : `<button class="btn-icon btn-success-icon" onclick="toggleEstadoEmpleado(${e.id},'Inactivo')" title="Activar">🟢</button>`;
      return `
    <tr>
      <td class="muted">#${e.id}</td>
      <td>${e.nombre}</td>
      <td>${e.apellido}</td>
      <td class="muted">${e.correo || "—"}</td>
      <td class="muted">${e.ruta || "—"}</td>
      <td>${badge}</td>
      <td>
        <button class="btn-icon" onclick="editEmpleado(${e.id})" title="Editar">✏️</button>
        ${toggleBtn}
      </td>
    </tr>`;
    })
    .join("");
}

async function toggleEstadoEmpleado(id, estadoActual) {
  const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
  const res = await apiCall("PATCH", `/empleados/${id}/estado`, {
    estado: nuevoEstado,
  });
  if (res === false) {
    showToast("❌ Error al cambiar estado del empleado", "error");
    return;
  }
  const e = DB.empleados.find((x) => x.id === id);
  if (e) e.estado = nuevoEstado;
  renderEmpleados();
  showToast(
    `✅ Empleado ${nuevoEstado === "Activo" ? "activado" : "desactivado"}`,
    "success",
  );
}

function editEmpleado(id) {
  const e = DB.empleados.find((x) => x.id === id);
  if (!e) return;
  $("emp-id").value = e.id;
  $("emp-nombre").value = e.nombre;
  $("emp-apellido").value = e.apellido;
  $("emp-correo").value = e.correo || "";
  $("emp-ruta").value = e.ruta || "";
  $("modal-empleado-title").textContent = "✏️ Editar Empleado";
  openModal("modal-empleado");
}

async function saveEmpleado() {
  const idStr = $("emp-id").value;
  const nombre = $("emp-nombre").value.trim();
  const apellido = $("emp-apellido").value.trim();
  const correo = $("emp-correo").value.trim();
  const ruta = $("emp-ruta").value.trim();

  if (!nombre || !apellido || !ruta) {
    showToast("⚠️ Completa los campos requeridos", "error");
    return;
  }

  if (idStr) {
    const id = parseInt(idStr);
    const e = DB.empleados.find((x) => x.id === id);
    if (e) {
      const payload = { nombre, apellido, correo, ruta };
      const res = await apiCall("PUT", `/empleados/${id}`, payload);
      if (res === false) {
        showToast("❌ Error al actualizar empleado", "error");
        return;
      }
      Object.assign(e, payload);
      showToast("✅ Empleado actualizado", "success");
    }
  } else {
    const nuevo = {
      id: getNextId(DB.empleados),
      nombre,
      apellido,
      correo,
      ruta,
      estado: "Activo",
    };
    const res = await apiCall("POST", "/empleados", nuevo);
    if (res === false) {
      showToast("❌ Error al guardar empleado", "error");
      return;
    }
    if (res && res.id) nuevo.id = res.id;
    DB.empleados.push(nuevo);
    showToast("✅ Empleado guardado", "success");
  }

  closeModal("modal-empleado");
  renderEmpleados();
}

/* ============================================================
   INVENTARIO - Dividido por Categorías
   ============================================================ */
function renderInventario() {
  console.log("🏭 Renderizando inventario...");
  console.log("Productos:", DB.productos.length);
  console.log("Inventario:", DB.inventario.length);
  
  // Agrupar inventario por producto para consolidar registros
  const inventarioPorProducto = {};
  
  DB.inventario.forEach(inv => {
    const idProd = inv.id_prod;
    if (!inventarioPorProducto[idProd]) {
      inventarioPorProducto[idProd] = {
        id_prod: idProd,
        paquetes: 0,
        unidades_sueltas: 0,
        cantidad: 0,
        fecha: inv.fecha,
        estado: inv.estado
      };
    }
    inventarioPorProducto[idProd].paquetes += parseInt(inv.paquetes) || 0;
    inventarioPorProducto[idProd].unidades_sueltas += parseInt(inv.unidades_sueltas) || 0;
    inventarioPorProducto[idProd].cantidad += parseInt(inv.cantidad) || 0;
  });
  
  console.log("Productos en inventario:", Object.keys(inventarioPorProducto).length);
  
  // Renderizar inventario de Limpieza
  const tbodyLimpieza = $("inventario-limpieza-table");
  const itemsLimpieza = Object.values(inventarioPorProducto).filter(inv => {
    const prod = DB.productos.find(p => p.id === inv.id_prod);
    return prod && (prod.cat_tipo === "Limpieza" || CATS_LIMPIEZA.includes(prod.id_cat));
  });
  
  console.log("Items Limpieza:", itemsLimpieza.length);
  
  if (itemsLimpieza.length === 0) {
    tbodyLimpieza.innerHTML = '<tr class="empty-row"><td colspan="9">No hay productos de limpieza en inventario</td></tr>';
  } else {
    tbodyLimpieza.innerHTML = itemsLimpieza.map(inv => {
      const prod = DB.productos.find(p => p.id === inv.id_prod);
      if (!prod) return '';
      
      const estadoBadge = inv.estado === "Disponible"
        ? '<span class="badge badge-green">Disponible</span>'
        : '<span class="badge badge-red">Agotado</span>';
      
      return `
        <tr>
          <td><strong>${prod.nombre}</strong><br><small style="color:var(--text-muted)">${prod.descripcion || ''}</small></td>
          <td><span class="badge badge-blue">${prod.cat_nombre || getCategoriaNombre(prod.id_cat)}</span></td>
          <td><strong>${inv.paquetes}</strong></td>
          <td>${prod.unidades_paquete || 1}</td>
          <td><strong>${inv.cantidad}</strong></td>
          <td>${fmt(prod.precio_unit || 0)}</td>
          <td class="muted">${getProveedorNombre(prod.id_prov)}</td>
          <td class="muted">${fmtDate(prod.fecha_ingreso)}</td>
          <td>${estadoBadge}</td>
        </tr>
      `;
    }).join('');
  }
  
  // Renderizar inventario de Desechables
  const tbodyDesechables = $("inventario-desechables-table");
  const itemsDesechables = Object.values(inventarioPorProducto).filter(inv => {
    const prod = DB.productos.find(p => p.id === inv.id_prod);
    return prod && (prod.cat_tipo === "Desechable" || CATS_DESECHABLES.includes(prod.id_cat));
  });
  
  console.log("Items Desechables:", itemsDesechables.length);
  
  if (itemsDesechables.length === 0) {
    tbodyDesechables.innerHTML = '<tr class="empty-row"><td colspan="9">No hay productos desechables en inventario</td></tr>';
  } else {
    tbodyDesechables.innerHTML = itemsDesechables.map(inv => {
      const prod = DB.productos.find(p => p.id === inv.id_prod);
      if (!prod) return '';
      
      const estadoBadge = inv.estado === "Disponible"
        ? '<span class="badge badge-green">Disponible</span>'
        : '<span class="badge badge-red">Agotado</span>';
      
      return `
        <tr>
          <td><strong>${prod.nombre}</strong><br><small style="color:var(--text-muted)">${prod.descripcion || ''}</small></td>
          <td><span class="badge badge-blue">${prod.cat_nombre || getCategoriaNombre(prod.id_cat)}</span></td>
          <td><strong>${inv.paquetes}</strong></td>
          <td>${prod.unidades_paquete || 1}</td>
          <td><strong>${inv.cantidad}</strong></td>
          <td>${fmt(prod.precio_unit || 0)}</td>
          <td class="muted">${getProveedorNombre(prod.id_prov)}</td>
          <td class="muted">${fmtDate(prod.fecha_ingreso)}</td>
          <td>${estadoBadge}</td>
        </tr>
      `;
    }).join('');
  }
}

/* Inventario es solo lectura - Los productos se agregan desde "Productos" */

/* ============================================================
   PROVEEDORES (soft delete)
   ============================================================ */
function renderProveedores() {
  const tbody = $("proveedores-table");
  if (DB.proveedores.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="7">No hay proveedores registrados</td></tr>';
    return;
  }
  tbody.innerHTML = DB.proveedores
    .map((p) => {
      const activo = !p.estado || p.estado === "Activo";
      const badge = activo
        ? '<span class="badge badge-green">Activo</span>'
        : '<span class="badge badge-red">Inactivo</span>';
      const toggleBtn = activo
        ? `<button class="btn-icon btn-danger-icon" onclick="toggleEstadoProveedor(${p.id},'Activo')" title="Desactivar">🔴</button>`
        : `<button class="btn-icon btn-success-icon" onclick="toggleEstadoProveedor(${p.id},'Inactivo')" title="Activar">🟢</button>`;
      return `
    <tr>
      <td class="muted">#${p.id}</td>
      <td><strong>${p.nombre}</strong></td>
      <td class="muted">${p.direccion || "—"}</td>
      <td>${p.telefono || "—"}</td>
      <td class="muted">${p.correo || "—"}</td>
      <td>${badge}</td>
      <td>
        <button class="btn-icon" onclick="editProveedor(${p.id})" title="Editar">✏️</button>
        ${toggleBtn}
      </td>
    </tr>`;
    })
    .join("");
}

async function toggleEstadoProveedor(id, estadoActual) {
  const nuevoEstado = estadoActual === "Activo" ? "Inactivo" : "Activo";
  const res = await apiCall("PATCH", `/proveedores/${id}/estado`, {
    estado: nuevoEstado,
  });
  if (res === false) {
    showToast("❌ Error al cambiar estado del proveedor", "error");
    return;
  }
  const p = DB.proveedores.find((x) => x.id === id);
  if (p) p.estado = nuevoEstado;
  renderProveedores();
  showToast(
    `✅ Proveedor ${nuevoEstado === "Activo" ? "activado" : "desactivado"}`,
    "success",
  );
}

function editProveedor(id) {
  const p = DB.proveedores.find((x) => x.id === id);
  if (!p) return;
  $("prov-id").value = p.id;
  $("prov-nombre").value = p.nombre;
  $("prov-dir").value = p.direccion || "";
  $("prov-tel").value = p.telefono || "";
  $("prov-correo").value = p.correo || "";
  $("modal-proveedor-title").textContent = "✏️ Editar Proveedor";
  openModal("modal-proveedor");
}

async function saveProveedor() {
  const idStr = $("prov-id").value;
  const nombre = $("prov-nombre").value.trim();
  const direccion = $("prov-dir").value.trim();
  const telefono = $("prov-tel").value.trim();
  const correo = $("prov-correo").value.trim();

  if (!nombre) {
    showToast("⚠️ El nombre es obligatorio", "error");
    return;
  }

  if (idStr) {
    const id = parseInt(idStr);
    const p = DB.proveedores.find((x) => x.id === id);
    if (p) {
      const payload = { nombre, direccion, telefono, correo };
      const res = await apiCall("PUT", `/proveedores/${id}`, payload);
      if (res === false) {
        showToast("❌ Error al actualizar proveedor", "error");
        return;
      }
      Object.assign(p, payload);
      showToast("✅ Proveedor actualizado", "success");
    }
  } else {
    const nuevo = {
      id: getNextId(DB.proveedores),
      nombre,
      direccion,
      telefono,
      correo,
      estado: "Activo",
    };
    const res = await apiCall("POST", "/proveedores", nuevo);
    if (res === false) {
      showToast("❌ Error al guardar proveedor", "error");
      return;
    }
    if (res && res.id) nuevo.id = res.id;
    DB.proveedores.push(nuevo);
    showToast("✅ Proveedor guardado", "success");
  }

  closeModal("modal-proveedor");
  renderProveedores();
}

/* ============================================================
   VENTAS
   ============================================================ */
function renderVentas() {
  const tbody = $("ventas-table");
  const sorted = [...DB.facturas].reverse();
  if (sorted.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="6">No hay ventas registradas</td></tr>';
    return;
  }
  tbody.innerHTML = sorted
    .map(
      (f) => `
    <tr>
      <td class="muted">#${f.id}</td>
      <td>${getClienteNombre(f.id_cli)}</td>
      <td class="muted">${getEmpleadoNombre(f.id_emp)}</td>
      <td class="muted">${fmtDate(f.fecha)}</td>
      <td><span class="badge badge-green">${fmt(f.total)}</span></td>
      <td>
        <button class="btn-icon" onclick="verDetalle(${f.id})" title="Ver detalle">👁️</button>
        <button class="btn-icon danger" onclick="deleteVenta(${f.id})" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function verDetalle(id) {
  const detalles = DB.detalles.filter((d) => d.id_fac === id);
  const factura = DB.facturas.find((f) => f.id === id);
  if (!factura) return;

  const cliente = DB.clientes.find((c) => c.id === factura.id_cli) || {};
  const empleado = DB.empleados.find((e) => e.id === factura.id_emp) || {};

  $("factura-numero").textContent = `FACTURA #${String(id).padStart(5, "0")}`;
  $("factura-fecha").textContent = `Fecha: ${fmtDate(factura.fecha)}`;
  $("factura-cliente-nombre").textContent =
    `${cliente.nombre || ""} ${cliente.apellido || ""}`;
  $("factura-cliente-email").textContent = `📧 ${cliente.email || "N/A"}`;
  $("factura-cliente-tel").textContent = `📱 ${cliente.telefono || "N/A"}`;
  $("factura-cliente-dir").textContent = `📍 ${cliente.direccion || "N/A"}`;
  $("factura-vendedor-nombre").textContent =
    `${empleado.nombre || ""} ${empleado.apellido || ""}`;
  $("factura-vendedor-ruta").textContent = `📍 ${empleado.ruta || "N/A"}`;

  let subtotal = 0;
  $("factura-items-table").innerHTML = detalles
    .map((d) => {
      const prod = DB.productos.find((p) => p.id === d.id_prod) || {};
      const cat = getCategoriaNombre(prod.id_cat);
      subtotal += parseFloat(d.total) || 0;
      return `
    <tr>
      <td style="text-align:center">${d.cantidad}</td>
      <td><strong>${prod.nombre || "Producto"}</strong></td>
      <td>${cat}</td>
      <td>${fmt(d.precio_unit)}</td>
      <td><strong>${fmt(d.total)}</strong></td>
    </tr>`;
    })
    .join("");

  $("factura-subtotal").textContent = fmt(factura.total);
  $("factura-iva").textContent = "$0.00";
  $("factura-total").textContent = fmt(factura.total);
  openModal("modal-factura");
}

async function deleteVenta(id) {
  if (!confirm("¿Eliminar esta venta?")) return;
  const res = await apiCall("DELETE", `/ventas/${id}`);
  if (res === false) {
    showToast("❌ Error al eliminar venta", "error");
    return;
  }
  const factura = DB.facturas.find((f) => f.id === id);
  const detalles = DB.detalles.filter((d) => d.id_fac === id);
  detalles.forEach((d) => {
    increaseInventoryForProduct(
      d.id_prod,
      d.cantidad,
      factura ? factura.fecha : undefined,
    );
  });
  DB.facturas = DB.facturas.filter((f) => f.id !== id);
  DB.detalles = DB.detalles.filter((d) => d.id_fac !== id);
  renderVentas();
  renderInventario();
  renderProductos(currentTab);
  renderDashboard();
  showToast("🗑️ Venta eliminada y stock restaurado", "success");
}

/* ---- NUEVA VENTA ---- */
let ventaItems = [];

function addVentaItem() {
  const idx = ventaItems.length;
  ventaItems.push({ id_prod: "", cantidad: 1, tipo: "unidad" });

  const options = DB.productos
    .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
    .join("");

  const div = document.createElement("div");
  div.className = "venta-item";
  div.dataset.idx = idx;
  div.innerHTML = `
    <select onchange="updateVentaItem(${idx},'prod',this.value)">
      <option value="">Seleccionar producto...</option>${options}
    </select>
    <select onchange="updateVentaItem(${idx},'tipo',this.value)">
      <option value="unidad">Por Unidad</option>
      <option value="paquete">Por Paquete</option>
    </select>
    <input type="number" min="1" value="1" placeholder="Cant."
      onchange="updateVentaItem(${idx},'cant',this.value)" />
    <span id="venta-precio-${idx}" style="color:var(--accent);font-size:0.8rem;white-space:nowrap">—</span>
    <button class="btn-icon danger" onclick="removeVentaItem(${idx}, this.closest('.venta-item'))">✕</button>
  `;
  $("venta-items").appendChild(div);
}

function updateVentaItem(idx, field, val) {
  const item = ventaItems[idx];
  if (!item) return;
  if (field === "prod") item.id_prod = parseInt(val) || "";
  if (field === "cant") item.cantidad = parseInt(val) || 1;
  if (field === "tipo") item.tipo = val;
  recalcVentaTotal();
  // Actualizar etiqueta de precio
  if (item.id_prod) {
    const prod = DB.productos.find((p) => p.id === item.id_prod);
    if (prod) {
      const precioEl = $(`venta-precio-${idx}`);
      if (precioEl) {
        precioEl.textContent =
          item.tipo === "paquete"
            ? `${fmt(prod.precio_venta_paq || 0)}/paq`
            : `${fmt(prod.precio_unit)}/ud`;
      }
    }
  }
}

function removeVentaItem(idx, el) {
  ventaItems[idx] = null;
  el.remove();
  recalcVentaTotal();
}

function recalcVentaTotal() {
  const total = ventaItems.reduce((s, item) => {
    if (!item || !item.id_prod) return s;
    const prod = DB.productos.find((p) => p.id === item.id_prod);
    if (!prod) return s;
    if (item.tipo === "paquete") {
      return s + (parseFloat(prod.precio_venta_paq) || 0) * item.cantidad;
    }
    const precio = item.cantidad >= 5 ? prod.precio_may : prod.precio_unit;
    return s + precio * item.cantidad;
  }, 0);
  $("venta-total-display").textContent = fmt(total);
}

async function saveVenta() {
  const id_cli = parseInt($("venta-cliente").value);
  const id_emp = parseInt($("venta-empleado").value);
  const fecha = $("venta-fecha").value;
  const items = ventaItems.filter((i) => i && i.id_prod);

  if (!id_cli || !id_emp || !fecha || items.length === 0) {
    showToast("⚠️ Completa todos los campos y agrega productos", "error");
    return;
  }

  // Calcular unidades reales necesarias por producto
  const needByProd = {};
  items.forEach((item) => {
    const prod = DB.productos.find((p) => p.id === item.id_prod);
    const unidadesPaq = prod ? parseInt(prod.unidades_paquete) || 1 : 1;
    const cantReal =
      item.tipo === "paquete" ? item.cantidad * unidadesPaq : item.cantidad;
    needByProd[item.id_prod] = (needByProd[item.id_prod] || 0) + cantReal;
  });

  // Verificar stock disponible
  for (const pid of Object.keys(needByProd)) {
    const avail = getStockForProduct(parseInt(pid));
    if (avail < needByProd[pid]) {
      showToast(
        `⚠️ Stock insuficiente para el producto #${pid} (disponible: ${avail} uds)`,
        "error",
      );
      return;
    }
  }

  // Calcular total de la factura
  const total = items.reduce((s, item) => {
    const prod = DB.productos.find((p) => p.id === item.id_prod);
    if (!prod) return s;
    if (item.tipo === "paquete") {
      return s + (parseFloat(prod.precio_venta_paq) || 0) * item.cantidad;
    }
    // Por unidad siempre usa precio_unit (precio de venta por unidad)
    return s + (parseFloat(prod.precio_unit) || 0) * item.cantidad;
  }, 0);

  const payload = { id_cli, id_emp, fecha, total };
  const res = await apiCall("POST", "/ventas", payload);
  if (res === false) {
    showToast("❌ Error al registrar venta", "error");
    return;
  }

  let newFactId = res && res.id ? res.id : getNextId(DB.facturas);
  DB.facturas.push({ id: newFactId, id_cli, id_emp, fecha, total });

  for (const item of items) {
    const prod = DB.productos.find((p) => p.id === item.id_prod);
    if (!prod) continue;
    const unidadesPaq = parseInt(prod.unidades_paquete) || 1;
    let cantReal, precioAplicado, detalleTotal;

    if (item.tipo === "paquete") {
      cantReal = item.cantidad * unidadesPaq;
      precioAplicado = prod.precio_unit;
      detalleTotal = (parseFloat(prod.precio_venta_paq) || 0) * item.cantidad;
    } else {
      cantReal = item.cantidad;
      precioAplicado = parseFloat(prod.precio_unit) || 0;
      detalleTotal = precioAplicado * cantReal;
    }

    const detPayload = {
      id_fac: newFactId,
      id_prod: item.id_prod,
      cantidad: cantReal,
      precio_unit: precioAplicado,
      total: detalleTotal,
    };
    const detRes = await apiCall("POST", "/detalles", detPayload);
    const newDetId = detRes && detRes.id ? detRes.id : getNextId(DB.detalles);
    DB.detalles.push({ id: newDetId, ...detPayload });

    reduceInventoryForProduct(item.id_prod, cantReal);
  }

  // Sincronizar inventario con backend
  const invData = await apiCall("GET", "/inventario");
  if (Array.isArray(invData)) {
    invData.forEach((item) => {
      if (item.fecha && String(item.fecha).includes("T"))
        item.fecha = item.fecha.split("T")[0];
    });
    DB.inventario = invData;
  }

  closeModal("modal-venta");
  renderVentas();
  renderInventario();
  renderDashboard();
  renderProductos(currentTab);
  showToast("✅ Venta registrada correctamente", "success");
}

/* ============================================================
   REPORTES — tabs + compras
   ============================================================ */
function switchReporteTab(tab, btn) {
  document
    .querySelectorAll("[data-tab-rep]")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const secVentas = $("seccion-reporte-ventas");
  const secCompras = $("seccion-reporte-compras");
  if (tab === "ventas") {
    if (secVentas) secVentas.style.display = "";
    if (secCompras) secCompras.style.display = "none";
  } else {
    if (secVentas) secVentas.style.display = "none";
    if (secCompras) secCompras.style.display = "";
    // Generar automáticamente al abrir si no hay datos
    const tbody = $("reporte-compras-table");
    if (tbody && tbody.innerHTML.trim() === "") generarReporteCompras();
  }
}

async function generarReporteCompras() {
  const desde = $("compras-desde") ? $("compras-desde").value : "";
  const hasta = $("compras-hasta") ? $("compras-hasta").value : "";
  let url = "/reportes/compras";
  if (desde && hasta) url += `?desde=${desde}&hasta=${hasta}`;
  else if (desde) url += `?desde=${desde}`;

  const data = await apiCall("GET", url);
  const tbody = $("reporte-compras-table");
  if (!tbody) return;

  if (!Array.isArray(data) || data.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="15">Sin registros en el período seleccionado</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (d) => `
    <tr>
      <td class="muted">${fmtDate(d.fecha_ingreso) || "—"}</td>
      <td><strong>${d.nombre}</strong><br><small style="color:var(--text-muted)">${d.descripcion || ""}</small></td>
      <td><span class="badge badge-blue">${d.categoria || "—"}</span></td>
      <td style="text-align:center"><strong>${d.cantidad || 0}</strong> uds</td>
      <td style="text-align:center"><span class="badge badge-green">${d.stock_paquetes || 0} paq</span></td>
      <td style="text-align:center"><span class="badge badge-blue">${d.stock_unidades || 0} uds</span></td>
      <td style="text-align:center">${d.unidades_paquete || 1}</td>
      <td><strong style="color:var(--danger)">${fmt(d.precio_compra_paq)}</strong></td>
      <td style="color:var(--danger)">${fmt(d.precio_compra_uni)}</td>
      <td><strong style="color:var(--danger);font-size:1.05rem">${fmt(d.precio_total)}</strong></td>
      <td style="color:var(--accent)">${fmt(d.precio_venta_paq)}</td>
      <td style="color:var(--accent)">${fmt(d.precio_unit)}</td>
      <td class="muted">${d.proveedor || "—"}</td>
      <td class="muted">${d.empleado_registro || "—"}</td>
      <td style="text-align:center"><span class="badge badge-green">${d.stock_total || 0} uds</span></td>
    </tr>`,
    )
    .join("");
}

function generarReporte() {
  const desde = $("fecha-desde").value;
  const hasta = $("fecha-hasta").value;

  const facturasFiltradas = DB.facturas.filter(
    (f) => f.fecha >= desde && f.fecha <= hasta,
  );
  const facIds = facturasFiltradas.map((f) => f.id);
  const detallesFiltrados = DB.detalles.filter((d) =>
    facIds.includes(d.id_fac),
  );

  // Ventas por producto
  const porProducto = {};
  detallesFiltrados.forEach((d) => {
    const n = getProductoNombre(d.id_prod);
    porProducto[n] = (porProducto[n] || 0) + d.total;
  });

  // Ventas por categoría
  const porCategoria = {};
  detallesFiltrados.forEach((d) => {
    const prod = DB.productos.find((p) => p.id === d.id_prod);
    if (!prod) return;
    const cat = getCategoriaNombre(prod.id_cat);
    porCategoria[cat] = (porCategoria[cat] || 0) + d.total;
  });

  renderBarChart("chart-productos", porProducto);
  renderBarChart("chart-categorias", porCategoria);

  const tbody = $("reporte-detalle-table");
  if (detallesFiltrados.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">No hay ventas en este rango</td></tr>';
    return;
  }
  tbody.innerHTML = detallesFiltrados
    .map(
      (d) => `
    <tr>
      <td class="muted">#${d.id_fac}</td>
      <td>${getProductoNombre(d.id_prod)}</td>
      <td>${d.cantidad}</td>
      <td>${fmt(d.precio_unit)}</td>
      <td><span class="badge badge-green">${fmt(d.total)}</span></td>
    </tr>
  `,
    )
    .join("");
}

function renderBarChart(containerId, data) {
  const container = $(containerId);
  const sorted = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const max = sorted.length ? sorted[0][1] : 1;

  if (sorted.length === 0) {
    container.innerHTML =
      '<p style="color:var(--text-muted);text-align:center;padding:20px">Sin datos</p>';
    return;
  }
  container.innerHTML = sorted
    .map(
      ([label, val]) => `
    <div class="chart-row">
      <span class="chart-label" title="${label}">${label}</span>
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="width:${((val / max) * 100).toFixed(1)}%"></div>
      </div>
      <span class="chart-val">${fmt(val)}</span>
    </div>
  `,
    )
    .join("");
}

/* Exportar Excel */
function exportarExcel(tipo) {
  let desde = "";
  let hasta = "";
  
  // Usar diferentes campos de fecha según el tipo de reporte
  if (tipo === "compras") {
    desde = $("compras-desde") ? $("compras-desde").value : "";
    hasta = $("compras-hasta") ? $("compras-hasta").value : "";
  } else {
    desde = $("fecha-desde") ? $("fecha-desde").value : "";
    hasta = $("fecha-hasta") ? $("fecha-hasta").value : "";
  }
  
  let url = `${API_BASE}/exportar/excel/${tipo}`;
  if (desde && hasta) url += `?desde=${desde}&hasta=${hasta}`;
  else if (desde) url += `?desde=${desde}`;
  else if (hasta) url += `?hasta=${hasta}`;
  
  window.open(url, "_blank");
}

/* Exportar PDF */
function exportarPDF(tipo) {
  let desde = "";
  let hasta = "";
  
  // Usar diferentes campos de fecha según el tipo de reporte
  if (tipo === "compras") {
    desde = $("compras-desde") ? $("compras-desde").value : "";
    hasta = $("compras-hasta") ? $("compras-hasta").value : "";
  } else {
    desde = $("fecha-desde") ? $("fecha-desde").value : "";
    hasta = $("fecha-hasta") ? $("fecha-hasta").value : "";
  }
  
  let url = `${API_BASE}/exportar/pdf/${tipo}`;
  if (desde && hasta) url += `?desde=${desde}&hasta=${hasta}`;
  else if (desde) url += `?desde=${desde}`;
  else if (hasta) url += `?hasta=${hasta}`;
  
  window.open(url, "_blank");
}

/* ============================================================
   DEFECTUOSOS
   ============================================================ */
function renderDefectuosos() {
  const tbody = $("defectuosos-table");
  if (DB.defectuosos.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="7">No hay registros defectuosos</td></tr>';
    return;
  }
  tbody.innerHTML = DB.defectuosos
    .map(
      (d) => `
    <tr>
      <td class="muted">#${d.id}</td>
      <td><strong>${getProductoNombre(d.id_prod)}</strong></td>
      <td class="muted">#${d.id_inv}</td>
      <td><span class="badge badge-red">${d.cantidad} uds</span></td>
      <td class="muted">${fmtDate(d.fecha)}</td>
      <td style="max-width:280px;font-size:0.82rem;color:var(--text-secondary)">${d.descripcion}</td>
      <td>
        <button class="btn-icon" onclick="editDefectuoso(${d.id})" title="Editar">✏️</button>
        <button class="btn-icon danger" onclick="deleteDefectuoso(${d.id})" title="Eliminar">🗑️</button>
      </td>
    </tr>
  `,
    )
    .join("");
}

function editDefectuoso(id) {
  const d = DB.defectuosos.find((x) => x.id === id);
  if (!d) return;
  $("def-id").value = d.id;

  $("def-producto").innerHTML =
    '<option value="">Seleccionar...</option>' +
    DB.productos
      .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
      .join("");

  $("def-producto").value = d.id_prod;
  $("def-inv-id").value = d.id_inv;
  $("def-cantidad").value = d.cantidad;
  $("def-fecha").value = fmtDate(d.fecha);
  $("def-desc").value = d.descripcion;

  $("modal-defectuoso-title").textContent = "✏️ Editar Registro Defectuoso";
  openModal("modal-defectuoso");
}

async function deleteDefectuoso(id) {
  if (!confirm("¿Eliminar este registro defectuoso?")) return;
  const res = await apiCall("DELETE", `/defectuosos/${id}`);
  if (res === false) {
    showToast("❌ Error al eliminar registro", "error");
    return;
  }
  DB.defectuosos = DB.defectuosos.filter((d) => d.id !== id);
  renderDefectuosos();
  showToast("🗑️ Registro eliminado", "success");
}

async function saveDefectuoso() {
  const idStr = $("def-id").value;
  const idProd = parseInt($("def-producto").value);
  const idInv = parseInt($("def-inv-id").value);
  const cant = parseInt($("def-cantidad").value);
  const fecha = $("def-fecha").value;
  const desc = $("def-desc").value.trim();

  if (!idProd || !idInv || !cant || !fecha || !desc) {
    showToast("⚠️ Completa todos los campos", "error");
    return;
  }

  if (idStr) {
    const id = parseInt(idStr);
    const d = DB.defectuosos.find((x) => x.id === id);
    if (d) {
      const payload = {
        id_prod: idProd,
        id_inv: idInv,
        cantidad: cant,
        fecha,
        descripcion: desc,
      };
      const res = await apiCall("PUT", `/defectuosos/${id}`, payload);
      if (res === false) {
        showToast("❌ Error al actualizar registro", "error");
        return;
      }
      Object.assign(d, payload);
      showToast("✅ Registro actualizado", "success");
    }
  } else {
    const nuevo = {
      id: getNextId(DB.defectuosos),
      id_prod: idProd,
      id_inv: idInv,
      cantidad: cant,
      fecha,
      descripcion: desc,
    };
    const res = await apiCall("POST", "/defectuosos", nuevo);
    if (res === false) {
      showToast("❌ Error al guardar registro", "error");
      return;
    }
    if (res && res.id) nuevo.id = res.id;
    DB.defectuosos.push(nuevo);
    showToast("✅ Registro guardado", "success");
  }

  closeModal("modal-defectuoso");
  renderDefectuosos();
}

/* ============================================================
   CAJA DIARIA
   ============================================================ */
async function renderCaja() {
  // Cargar estado actual de caja y movimientos en paralelo
  const [cajaData, movData] = await Promise.all([
    apiCall("GET", "/caja/actual"),
    apiCall("GET", "/caja/movimientos"),
  ]);

  DB.caja = cajaData || null;
  if (Array.isArray(movData)) DB.movimientos_caja = movData;

  const estadoCard = $("caja-estado-card");
  const resumenCard = $("caja-resumen-card");
  const botonesMovimientos = $("caja-botones-movimientos");

  if (DB.caja && DB.caja.estado === "Abierta") {
    // === CAJA ABIERTA ===
    estadoCard.innerHTML = `
      <div style="padding:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div style="display:flex;align-items:center;gap:14px">
          <span class="caja-status abierta">🟢 ABIERTA</span>
          <span style="color:var(--text-secondary);font-size:0.85rem">
            Apertura: ${fmtDate(DB.caja.fecha_apertura)}
            ${DB.caja.hora_apertura ? "· " + DB.caja.hora_apertura : ""}
          </span>
        </div>
        <button class="btn-secondary" style="border-color:var(--danger);color:var(--danger)"
          onclick="openModal('modal-caja-cierre')">
          🔴 Cerrar Caja
        </button>
      </div>`;

    const montoInicial = parseFloat(DB.caja.monto_inicial || 0);
    const totalVentas = parseFloat(DB.caja.total_ventas || 0);
    const totalIngresos = parseFloat(DB.caja.total_ingresos || 0);
    const totalEgresos = parseFloat(DB.caja.total_egresos || 0);
    const montoFinal =
      montoInicial + totalVentas + totalIngresos - totalEgresos;
    const ganancia = totalVentas + totalIngresos - totalEgresos;

    resumenCard.innerHTML = `
      <h2 class="section-title">📊 Resumen de Caja Actual</h2>
      <div class="caja-resumen-grid" style="padding:0 20px 20px">
        <div class="caja-metric">
          <span class="caja-metric-label">Monto Inicial</span>
          <span class="caja-metric-value">${fmt(montoInicial)}</span>
        </div>
        <div class="caja-metric">
          <span class="caja-metric-label">Total Ventas</span>
          <span class="caja-metric-value">${fmt(totalVentas)}</span>
        </div>
        <div class="caja-metric">
          <span class="caja-metric-label">Ingresos Extra</span>
          <span class="caja-metric-value">${fmt(totalIngresos)}</span>
        </div>
        <div class="caja-metric">
          <span class="caja-metric-label">Egresos</span>
          <span class="caja-metric-value" style="color:var(--danger)">${fmt(totalEgresos)}</span>
        </div>
        <div class="caja-metric highlight">
          <span class="caja-metric-label">Monto Final Estimado</span>
          <span class="caja-metric-value">${fmt(montoFinal)}</span>
        </div>
        <div class="caja-metric highlight">
          <span class="caja-metric-label">Ganancia del Día</span>
          <span class="caja-metric-value" style="color:var(--accent)">${fmt(ganancia)}</span>
        </div>
      </div>`;

    botonesMovimientos.style.display = "flex";
  } else {
    // === CAJA CERRADA ===
    estadoCard.innerHTML = `
      <div style="padding:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <span class="caja-status cerrada">🔴 CERRADA</span>
        <button class="btn-primary" onclick="openModal('modal-caja-apertura')">
          💵 Abrir Caja
        </button>
      </div>`;

    resumenCard.innerHTML = `
      <div style="padding:40px;text-align:center;color:var(--text-muted)">
        <p style="font-size:1.05rem">No hay caja abierta. Abre la caja para registrar movimientos.</p>
      </div>`;

    botonesMovimientos.style.display = "none";
  }

  // Tabla de movimientos
  const tbody = $("caja-movimientos-table");
  if (!DB.movimientos_caja || DB.movimientos_caja.length === 0) {
    tbody.innerHTML =
      '<tr class="empty-row"><td colspan="5">No hay movimientos registrados hoy</td></tr>';
    return;
  }
  tbody.innerHTML = DB.movimientos_caja
    .map(
      (m) => `
    <tr>
      <td>
        <span class="badge ${m.tipo === "Ingreso" ? "badge-green" : "badge-red"}">${m.tipo}</span>
      </td>
      <td>${m.descripcion || "—"}</td>
      <td>${fmt(m.monto || 0)}</td>
      <td class="muted">${fmtDate(m.fecha)}</td>
      <td class="muted">${m.hora || "—"}</td>
    </tr>
  `,
    )
    .join("");
}

async function abrirCaja() {
  const id_empleado = parseInt($("caja-apertura-empleado").value);
  const monto_inicial = parseFloat($("caja-apertura-monto").value) || 0;

  if (!id_empleado) {
    showToast("⚠️ Selecciona un empleado responsable", "error");
    return;
  }

  const res = await apiCall("POST", "/caja/apertura", {
    id_empleado,
    monto_inicial,
  });
  if (res === false) {
    showToast("❌ Error al abrir caja", "error");
    return;
  }

  closeModal("modal-caja-apertura");
  showToast("✅ Caja abierta correctamente", "success");
  renderCaja();
  renderDashboard();
}

async function cerrarCaja() {
  const monto_final = parseFloat($("caja-cierre-monto").value) || 0;

  const res = await apiCall("POST", "/caja/cierre", { monto_final });
  if (res === false) {
    showToast("❌ Error al cerrar caja", "error");
    return;
  }

  DB.caja = null;
  DB.movimientos_caja = [];
  closeModal("modal-caja-cierre");
  showToast("✅ Caja cerrada correctamente", "success");
  renderCaja();
  renderDashboard();
}

function abrirModalMovimiento(tipo) {
  $("caja-mov-tipo").value = tipo;
  $("modal-caja-mov-title").textContent =
    tipo === "Ingreso" ? "💚 Registrar Ingreso" : "🔴 Registrar Egreso";
  $("caja-mov-desc").value = "";
  $("caja-mov-monto").value = "";
  openModal("modal-caja-movimiento");
}

async function agregarMovimientoCaja() {
  const tipo = $("caja-mov-tipo").value;
  const descripcion = $("caja-mov-desc").value.trim();
  const monto = parseFloat($("caja-mov-monto").value) || 0;

  if (!descripcion || monto <= 0) {
    showToast("⚠️ Completa descripción y monto", "error");
    return;
  }

  const res = await apiCall("POST", "/caja/movimientos", {
    tipo,
    descripcion,
    monto,
  });
  if (res === false) {
    showToast("❌ Error al registrar movimiento", "error");
    return;
  }

  DB.movimientos_caja.push({
    id: res && res.id ? res.id : Date.now(),
    tipo,
    descripcion,
    monto,
    fecha: new Date().toISOString().split("T")[0],
    hora: new Date().toTimeString().split(" ")[0],
  });

  closeModal("modal-caja-movimiento");
  showToast(`✅ ${tipo} registrado correctamente`, "success");
  renderCaja();
}

/* ============================================================
   MODALES UTILS
   ============================================================ */
function openModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.add("open");

  if (id === "modal-producto") {
    if (!$("prod-id").value) {
      $("prod-nombre").value = "";
      $("prod-desc").value = "";
      $("prod-precio-unit").value = "";
      $("prod-precio-may").value = "";
      $("prod-unidades-paquete").value = "1";
      $("prod-precio-compra-paq").value = "";
      $("prod-precio-venta-paq").value = "";
      $("prod-cantidad-paquetes").value = "";
      $("prod-cantidad-paquetes-group").style.display = "";
      $("modal-producto-title").textContent = "➕ Nuevo Producto";
    }
    $("prod-categoria").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.categorias
        .map((c) => `<option value="${c.id}">${c.nombre}</option>`)
        .join("");
    // Solo proveedores activos
    $("prod-proveedor").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.proveedores
        .filter((p) => !p.estado || p.estado === "Activo")
        .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
        .join("");
    // Solo empleados activos
    if ($("prod-empleado")) {
      $("prod-empleado").innerHTML =
        '<option value="">Seleccionar...</option>' +
        DB.empleados
          .filter((e) => !e.estado || e.estado === "Activo")
          .map(
            (e) => `<option value="${e.id}">${e.nombre} ${e.apellido}</option>`,
          )
          .join("");
    }
    // Fecha de ingreso por defecto = hoy (solo si es nuevo)
    if (!$("prod-id").value && $("prod-fecha-ingreso")) {
      $("prod-fecha-ingreso").value = new Date().toISOString().split("T")[0];
    }
  }

  if (id === "modal-cliente") {
    if (!$("cli-id").value) {
      $("cli-nombre").value = "";
      $("cli-apellido").value = "";
      $("cli-dir").value = "";
      $("cli-tel").value = "";
      $("cli-email").value = "";
      $("modal-cliente-title").textContent = "➕ Nuevo Cliente";
    }
  }

  if (id === "modal-empleado") {
    if (!$("emp-id").value) {
      $("emp-nombre").value = "";
      $("emp-apellido").value = "";
      $("emp-correo").value = "";
      $("emp-ruta").value = "";
      $("modal-empleado-title").textContent = "➕ Nuevo Empleado";
    }
  }

  if (id === "modal-inventario") {
    $("inv-producto").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.productos
        .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
        .join("");
    if (!$("inv-id").value) {
      $("inv-paquetes").value = "";
      $("inv-unidades-sueltas").value = "";
      $("inv-estado").value = "Disponible";
      $("inv-fecha").value = new Date().toISOString().split("T")[0];
      $("modal-inventario-title").textContent =
        "➕ Nuevo Movimiento Inventario";
    }
  }

  if (id === "modal-defectuoso") {
    $("def-producto").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.productos
        .map((p) => `<option value="${p.id}">${p.nombre}</option>`)
        .join("");
    if (!$("def-id").value) {
      $("def-inv-id").value = "";
      $("def-cantidad").value = "";
      $("def-desc").value = "";
      $("def-fecha").value = new Date().toISOString().split("T")[0];
      $("modal-defectuoso-title").textContent = "➕ Reportar Defectuoso";
    }
  }

  if (id === "modal-proveedor") {
    if (!$("prov-id").value) {
      $("prov-nombre").value = "";
      $("prov-dir").value = "";
      $("prov-tel").value = "";
      $("prov-correo").value = "";
      $("modal-proveedor-title").textContent = "➕ Nuevo Proveedor";
    }
  }

  if (id === "modal-venta") {
    ventaItems = [];
    $("venta-items").innerHTML = "";
    $("venta-total-display").textContent = "$0.00";

    $("venta-cliente").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.clientes
        .filter((c) => !c.estado || c.estado === "Activo")
        .map(
          (c) => `<option value="${c.id}">${c.nombre} ${c.apellido}</option>`,
        )
        .join("");
    $("venta-empleado").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.empleados
        .filter((e) => !e.estado || e.estado === "Activo")
        .map(
          (e) => `<option value="${e.id}">${e.nombre} ${e.apellido}</option>`,
        )
        .join("");
    $("venta-fecha").value = new Date().toISOString().split("T")[0];
  }

  if (id === "modal-caja-apertura") {
    $("caja-apertura-empleado").innerHTML =
      '<option value="">Seleccionar...</option>' +
      DB.empleados
        .filter((e) => !e.estado || e.estado === "Activo")
        .map(
          (e) => `<option value="${e.id}">${e.nombre} ${e.apellido}</option>`,
        )
        .join("");
    $("caja-apertura-monto").value = "";
  }

  if (id === "modal-caja-cierre") {
    $("caja-cierre-monto").value = "";
  }

  // Cerrar al clic en el overlay
  m.addEventListener("click", function onOverlay(e) {
    if (e.target === m) {
      closeModal(id);
      m.removeEventListener("click", onOverlay);
    }
  });
}

function closeModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.remove("open");

  // Limpiar hidden IDs al cerrar
  const hiddenIds = {
    "modal-producto": "prod-id",
    "modal-cliente": "cli-id",
    "modal-empleado": "emp-id",
    "modal-inventario": "inv-id",
    "modal-proveedor": "prov-id",
    "modal-defectuoso": "def-id",
  };
  if (hiddenIds[id]) $(hiddenIds[id]).value = "";
}

/* ============================================================
   TOAST NOTIFICATIONS
   ============================================================ */
let toastTimer;
function showToast(msg, type = "success") {
  const toast = $("toast");
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = "toast";
  }, 3200);
}

/* ============================================================
   API CALLS (conecta con Spring Boot backend)
   ============================================================ */
async function apiCall(method, endpoint, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
  
  try {
    const opts = { 
      method, 
      headers: { "Content-Type": "application/json" },
      signal: controller.signal
    };
    if (body) opts.body = JSON.stringify(body);
    
    const res = await fetch(API_BASE + endpoint, opts);
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`API ${method} ${endpoint}: ${res.status}`);
      return false;
    }
    const data = await res.json().catch(() => null);
    return data !== null ? data : true;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e.name === 'AbortError') {
      console.warn(`API ${method} ${endpoint}: Timeout (10s)`);
    } else {
      console.warn("Backend offline:", e.message);
    }
    return false;
  }
}

/* ============================================================
   CARGA INICIAL DESDE BACKEND
   ============================================================ */
async function loadFromBackend() {
  console.log("🔄 Cargando datos desde el backend...");
  
  const endpoints = [
    ["categorias", "/categorias"],
    ["productos", "/productos"],
    ["clientes", "/clientes"],
    ["empleados", "/empleados"],
    ["inventario", "/inventario"],
    ["proveedores", "/proveedores"],
    ["facturas", "/ventas"],
    ["detalles", "/detalles"],
    ["defectuosos", "/defectuosos"],
  ];

  // Cargar todos los endpoints en PARALELO para mayor velocidad
  const promises = endpoints.map(async ([key, ep]) => {
    try {
      const data = await apiCall("GET", ep);
      if (Array.isArray(data)) {
        data.forEach((item) => {
          if (
            item.fecha &&
            typeof item.fecha === "string" &&
            item.fecha.includes("T")
          )
            item.fecha = item.fecha.split("T")[0];
        });
        DB[key] = data;
        console.log(`✅ ${key}: ${data.length} registros cargados`);
        return true;
      }
    } catch (error) {
      console.warn(`⚠️ Error cargando ${key}:`, error.message);
      return false;
    }
    return false;
  });

  // Cargar caja actual en paralelo también
  const cajaPromise = apiCall("GET", "/caja/actual").then(cajaData => {
    if (cajaData && typeof cajaData === "object" && !Array.isArray(cajaData)) {
      DB.caja = cajaData;
      console.log("✅ Caja actual cargada");
      return true;
    }
    return false;
  }).catch(() => false);

  // Esperar a que todas las promesas se resuelvan
  const results = await Promise.all([...promises, cajaPromise]);
  const backendOnline = results.some(r => r === true);
  
  console.log(backendOnline ? "✅ Datos cargados exitosamente" : "⚠️ Backend offline");
  return backendOnline;
}

/* ============================================================
   INIT
   ============================================================ */
window.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Inicializando aplicación...");
  
  // Ocultar loader inmediatamente
  const loader = document.getElementById('app-loader');
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = '0';
      loader.style.transition = 'opacity 0.3s';
      setTimeout(() => loader.remove(), 300);
    }, 500);
  }
  
  // Cargar dashboard primero, luego datos en background
  navigate("dashboard");
  console.log("✅ Aplicación iniciada");
  
  // Cargar datos en segundo plano SIN bloquear la UI
  loadFromBackend().then(backendOnline => {
    if (backendOnline) {
      console.log("✅ Datos cargados desde la base de datos");
      // Refrescar dashboard con los datos nuevos
      if (document.getElementById('page-dashboard').classList.contains('active')) {
        renderDashboard();
      }
    } else {
      console.warn("⚠️ Backend offline — usando datos locales");
    }
  }).catch(error => {
    console.error("❌ Error al cargar datos:", error);
  });
});


/* ============================================================
   REPORTES DE GANANCIAS
   ============================================================ */

function cambiarTipoReporteGanancia() {
  const tipo = $("tipo-reporte-ganancia").value;
  
  // Ocultar todos los campos
  $("ganancia-fecha-unica").style.display = "none";
  $("ganancia-rango-inicio").style.display = "none";
  $("ganancia-rango-fin").style.display = "none";
  $("ganancia-mes-field").style.display = "none";
  $("ganancia-anio-field").style.display = "none";
  
  // Mostrar campos según el tipo
  if (tipo === "diario") {
    $("ganancia-fecha-unica").style.display = "block";
    // Fecha por defecto hoy
    $("ganancia-fecha").value = new Date().toISOString().split("T")[0];
  } else if (tipo === "semanal") {
    $("ganancia-rango-inicio").style.display = "block";
    $("ganancia-rango-fin").style.display = "block";
  } else if (tipo === "mensual") {
    $("ganancia-mes-field").style.display = "block";
    $("ganancia-anio-field").style.display = "block";
    // Mes y año actual por defecto
    const hoy = new Date();
    $("ganancia-mes").value = hoy.getMonth() + 1;
    $("ganancia-anio").value = hoy.getFullYear();
  }
}

async function generarReporteGanancias() {
  const tipo = $("tipo-reporte-ganancia").value;
  let url = "";
  
  if (tipo === "diario") {
    const fecha = $("ganancia-fecha").value;
    if (!fecha) {
      showToast("⚠️ Selecciona una fecha", "error");
      return;
    }
    url = `/reportes/ganancias/diarias?fecha=${fecha}`;
  } else if (tipo === "semanal") {
    const inicio = $("ganancia-fecha-inicio").value;
    const fin = $("ganancia-fecha-fin").value;
    if (!inicio || !fin) {
      showToast("⚠️ Selecciona el rango de fechas", "error");
      return;
    }
    url = `/reportes/ganancias/semanales?fecha_inicio=${inicio}&fecha_fin=${fin}`;
  } else if (tipo === "mensual") {
    const mes = $("ganancia-mes").value;
    const anio = $("ganancia-anio").value;
    url = `/reportes/ganancias/mensuales?mes=${mes}&anio=${anio}`;
  }
  
  const data = await apiCall("GET", url);
  
  if (!data) {
    showToast("❌ Error al cargar reporte de ganancias", "error");
    return;
  }
  
  // Actualizar resumen
  $("ganancia-total-ventas").textContent = fmt(data.total_ventas);
  $("ganancia-total-compras").textContent = fmt(data.total_compras);
  $("ganancia-neta").textContent = fmt(data.ganancia_neta);
  
  // Cambiar color según ganancia
  const gananciaNeta = parseFloat(data.ganancia_neta);
  const gananciaEl = $("ganancia-neta");
  if (gananciaNeta > 0) {
    gananciaEl.style.color = "var(--accent)";
  } else if (gananciaNeta < 0) {
    gananciaEl.style.color = "var(--danger)";
  } else {
    gananciaEl.style.color = "#666";
  }
  
  showToast("✅ Reporte generado", "success");
  
  // Cargar historial detallado (opcional - si quieres mostrar el desglose)
  await cargarHistorialGanancias(tipo, data);
}

async function cargarHistorialGanancias(tipo, datosResumen) {
  // Aquí podrías cargar el detalle de ventas y compras del período
  const tbody = $("ganancia-historial-table");
  tbody.innerHTML = `
    <tr class="empty-row">
      <td colspan="4">
        Período: ${tipo}<br>
        Total Ventas: ${fmt(datosResumen.total_ventas)}<br>
        Total Compras: ${fmt(datosResumen.total_compras)}<br>
        <strong>Ganancia Neta: ${fmt(datosResumen.ganancia_neta)}</strong>
      </td>
    </tr>
  `;
}

function switchReporteTab(tab, btn) {
  // Ocultar todas las secciones
  document.getElementById("seccion-reporte-ventas").style.display = "none";
  document.getElementById("seccion-reporte-compras").style.display = "none";
  document.getElementById("seccion-reporte-ganancias").style.display = "none";
  
  // Remover clase active de todos los botones
  document.querySelectorAll('[data-tab-rep]').forEach(b => b.classList.remove("active"));
  
  // Mostrar sección correspondiente
  if (tab === "ventas") {
    document.getElementById("seccion-reporte-ventas").style.display = "block";
  } else if (tab === "compras") {
    document.getElementById("seccion-reporte-compras").style.display = "block";
  } else if (tab === "ganancias") {
    document.getElementById("seccion-reporte-ganancias").style.display = "block";
    // Inicializar campos
    cambiarTipoReporteGanancia();
  }
  
  // Activar botón
  btn.classList.add("active");
}

/* ============================================================
   SISTEMA DE CONTROL DE ACCESO DE CAJA
   ============================================================ */

// Variable global para almacenar el responsable de la caja
let cajaResponsable = null;

async function verificarCajaYResponsable() {
  const cajaData = await apiCall("GET", "/caja/actual");
  if (cajaData && cajaData.estado === "Abierta") {
    cajaResponsable = {
      id: cajaData.id_empleado,
      nombre: cajaData.empleado_nombre
    };
    return cajaResponsable;
  }
  cajaResponsable = null;
  return null;
}

// Modificar la función que abre el modal de ventas para verificar permisos
const _openModalOriginal = window.openModal || openModal;
async function openModalConVerificacion(id) {
  if (id === "modal-venta") {
    // Verificar caja y responsable
    const responsable = await verificarCajaYResponsable();
    
    if (!responsable) {
      showToast("⚠️ No hay caja abierta. Debes abrir la caja antes de vender.", "error");
      return;
    }
    
    // Aquí podrías agregar lógica adicional si quieres restringir
    // por ahora solo verificamos que haya caja abierta
  }
  
  // Llamar a la función original
  if (typeof _openModalOriginal === 'function') {
    _openModalOriginal(id);
  } else if (typeof openModal === 'function') {
    openModal(id);
  }
}

// Sobrescribir openModal global si existe
if (typeof window !== 'undefined') {
  window.openModalConVerificacion = openModalConVerificacion;
}

