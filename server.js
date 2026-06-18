/* ============================================================
   server.js — API REST para Comercializadora Rosales
   Versión 2 — con caja, movimientos, exportaciones, dashboard
   ============================================================ */

const express = require("express");
const cors = require("cors");
const path = require("path");
const ExcelJS = require("exceljs");
const { getPool, sql } = require("./db");

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, ".")));

/* ============================================================
   HELPER: query genérico
   ============================================================ */
async function query(q, params = []) {
  const pool = await getPool();
  const request = pool.request();
  params.forEach(({ name, type, value }) => request.input(name, type, value));
  return request.query(q);
}

/* ============================================================
   CATEGORÍAS
   Tabla: CATEGORIA | PK: id_categoria
   Cols: Nombre_categoria, Tipo
   ============================================================ */
app.get("/api/categorias", async (req, res) => {
  try {
    const r = await query(
      `SELECT id_categoria AS id,
              Nombre_categoria AS nombre,
              Tipo AS tipo
       FROM CATEGORIA
       ORDER BY Nombre_categoria`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/categorias", async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const r = await query(
      `INSERT INTO CATEGORIA (Nombre_categoria, Tipo)
       OUTPUT INSERTED.id_categoria AS id,
              INSERTED.Nombre_categoria AS nombre,
              INSERTED.Tipo AS tipo
       VALUES (@nombre, @tipo)`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "tipo", type: sql.NVarChar, value: tipo },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/categorias/:id", async (req, res) => {
  try {
    const { nombre, tipo } = req.body;
    const r = await query(
      `UPDATE CATEGORIA
       SET Nombre_categoria = @nombre, Tipo = @tipo
       OUTPUT INSERTED.id_categoria AS id,
              INSERTED.Nombre_categoria AS nombre,
              INSERTED.Tipo AS tipo
       WHERE id_categoria = @id`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "tipo", type: sql.NVarChar, value: tipo },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/categorias/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const param = [{ name: "id", type: sql.Int, value: id }];

    const prods = await query(
      "SELECT id_producto FROM PRODUCTO WHERE id_categoria = @id",
      param,
    );
    for (const p of prods.recordset) {
      const pp = [{ name: "pid", type: sql.Int, value: p.id_producto }];
      await query(
        "DELETE FROM DETALLE_VENTA       WHERE id_producto = @pid",
        pp,
      );
      await query(
        "DELETE FROM PRODUCTO_DEFECTUOSO WHERE id_producto = @pid",
        pp,
      );
      await query(
        "DELETE FROM INVENTARIO          WHERE id_producto = @pid",
        pp,
      );
    }
    await query("DELETE FROM PRODUCTO  WHERE id_categoria = @id", param);
    await query("DELETE FROM CATEGORIA WHERE id_categoria = @id", param);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   PROVEEDORES — soft delete (PATCH /estado)
   Tabla: PROVEEDOR | PK: id_proveedor
   Cols: Nombre, Direccion, Telefono, Correo, Estado
   ============================================================ */
app.get("/api/proveedores", async (req, res) => {
  try {
    const r = await query(
      `SELECT id_proveedor AS id,
              Nombre       AS nombre,
              Direccion    AS direccion,
              Telefono     AS telefono,
              Correo       AS correo,
              Estado       AS estado
       FROM PROVEEDOR
       ORDER BY Nombre`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/proveedores", async (req, res) => {
  try {
    const { nombre, direccion, telefono, correo } = req.body;
    const r = await query(
      `INSERT INTO PROVEEDOR (Nombre, Direccion, Telefono, Correo, Estado, fecha_creacion, fecha_actualizacion)
       OUTPUT INSERTED.id_proveedor AS id,
              INSERTED.Nombre       AS nombre,
              INSERTED.Direccion    AS direccion,
              INSERTED.Telefono     AS telefono,
              INSERTED.Correo       AS correo,
              INSERTED.Estado       AS estado
       VALUES (@nombre, @direccion, @telefono, @correo, 'Activo', GETDATE(), GETDATE())`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "direccion", type: sql.NVarChar, value: direccion },
        { name: "telefono", type: sql.NVarChar, value: telefono },
        { name: "correo", type: sql.NVarChar, value: correo },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/proveedores/:id", async (req, res) => {
  try {
    const { nombre, direccion, telefono, correo } = req.body;
    const r = await query(
      `UPDATE PROVEEDOR
       SET Nombre = @nombre, Direccion = @direccion,
           Telefono = @telefono, Correo = @correo,
           fecha_actualizacion = GETDATE()
       OUTPUT INSERTED.id_proveedor AS id,
              INSERTED.Nombre       AS nombre,
              INSERTED.Direccion    AS direccion,
              INSERTED.Telefono     AS telefono,
              INSERTED.Correo       AS correo,
              INSERTED.Estado       AS estado
       WHERE id_proveedor = @id`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "direccion", type: sql.NVarChar, value: direccion },
        { name: "telefono", type: sql.NVarChar, value: telefono },
        { name: "correo", type: sql.NVarChar, value: correo },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/proveedores/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    await query(
      `UPDATE PROVEEDOR
       SET Estado = @estado, fecha_actualizacion = GETDATE()
       WHERE id_proveedor = @id`,
      [
        { name: "estado", type: sql.NVarChar, value: estado },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   PRODUCTOS
   Tabla: PRODUCTO | PK: id_producto
   Cols: Nombre, Descripcion, Precio_unitario, Precio_mayorista,
         id_categoria, id_proveedor, Unidades_por_paquete,
         Precio_compra_paquete, Precio_venta_paquete,
         fecha_creacion, fecha_actualizacion
   ============================================================ */
app.get("/api/productos", async (req, res) => {
  try {
    const r = await query(
      `SELECT p.id_producto                        AS id,
              p.Nombre                             AS nombre,
              p.Descripcion                        AS descripcion,
              p.Precio_unitario                    AS precio_unit,
              p.Precio_mayorista                   AS precio_may,
              p.id_categoria                       AS id_cat,
              p.id_proveedor                       AS id_prov,
              c.Nombre_categoria                   AS cat_nombre,
              c.Tipo                               AS cat_tipo,
              p.Paquetes                           AS paquetes,
              p.Unidades_por_paquete               AS unidades_paquete,
              p.Precio_compra_paquete              AS precio_compra_paq,
              p.Precio_venta_paquete               AS precio_venta_paq,
              p.id_empleado_registro               AS id_empleado_registro,
              ISNULL(e.Nombre + ' ' + e.Apellido, '—') AS empleado_registro,
              p.fecha_ingreso                      AS fecha_ingreso
       FROM PRODUCTO p
       LEFT JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
       LEFT JOIN EMPLEADO  e ON p.id_empleado_registro = e.id_empleado
       ORDER BY p.Nombre`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/productos", async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio_unit,
      precio_may,
      id_cat,
      id_prov,
      paquetes = 0,
      unidades_paquete = 1,
      precio_compra_paq = 0,
      precio_compra_uni = null,
      precio_venta_paq = 0,
      id_empleado_registro = null,
      fecha_ingreso = null,
    } = req.body;

    const paq = parseInt(paquetes) || 0;
    const uPaq = parseInt(unidades_paquete) || 1;
    const cantidadTotal = paq * uPaq;

    // Calcular o usar el precio de compra unitario
    const pCompraPaq = parseFloat(precio_compra_paq) || 0;
    let pCompraUni = parseFloat(precio_compra_uni);
    if (isNaN(pCompraUni) || pCompraUni === null) {
      pCompraUni = uPaq > 0 ? (pCompraPaq / uPaq) : 0;
    }

    const r = await query(
      `INSERT INTO PRODUCTO
         (Nombre, Descripcion, Precio_unitario, Precio_mayorista,
          id_categoria, id_proveedor,
          Paquetes, Unidades_por_paquete, Precio_compra_paquete, Precio_compra_unidad, Precio_venta_paquete,
          id_empleado_registro, fecha_ingreso,
          fecha_creacion, fecha_actualizacion)
       OUTPUT INSERTED.id_producto             AS id,
              INSERTED.Nombre                  AS nombre,
              INSERTED.Descripcion             AS descripcion,
              INSERTED.Precio_unitario         AS precio_unit,
              INSERTED.Precio_mayorista        AS precio_may,
              INSERTED.id_categoria            AS id_cat,
              INSERTED.id_proveedor            AS id_prov,
              INSERTED.Paquetes                AS paquetes,
              INSERTED.Unidades_por_paquete    AS unidades_paquete,
              INSERTED.Precio_compra_paquete   AS precio_compra_paq,
              INSERTED.Precio_compra_unidad    AS precio_compra_uni,
              INSERTED.Precio_venta_paquete    AS precio_venta_paq,
              INSERTED.id_empleado_registro    AS id_empleado_registro,
              INSERTED.fecha_ingreso           AS fecha_ingreso
       VALUES (@nombre, @desc, @pu, @pm, @icat, @iprov, @paq, @upaq, @cpaq, @cuni, @vpaq,
               @iemp, @fingreso, GETDATE(), GETDATE())`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "desc", type: sql.NVarChar, value: descripcion },
        { name: "pu", type: sql.Decimal, value: precio_unit },
        { name: "pm", type: sql.Decimal, value: precio_may },
        { name: "icat", type: sql.Int, value: parseInt(id_cat) },
        { name: "iprov", type: sql.Int, value: parseInt(id_prov) },
        { name: "paq", type: sql.Int, value: paq },
        { name: "upaq", type: sql.Int, value: uPaq },
        { name: "cpaq", type: sql.Decimal, value: pCompraPaq },
        { name: "cuni", type: sql.Decimal, value: pCompraUni },
        { name: "vpaq", type: sql.Decimal, value: precio_venta_paq },
        {
          name: "iemp",
          type: sql.Int,
          value: id_empleado_registro ? parseInt(id_empleado_registro) : null,
        },
        {
          name: "fingreso",
          type: sql.Date,
          value: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
        },
      ],
    );

    const prod = r.recordset[0];

    // Crear registro en INVENTARIO automáticamente si hay stock inicial
    if (paq > 0) {
      await query(
        `INSERT INTO INVENTARIO
           (id_producto, Cantidad, Paquetes, Unidades_sueltas, Estado, Fecha_movimiento)
         VALUES (@idp, @cant, @paq, 0, 'Disponible', GETDATE())`,
        [
          { name: "idp", type: sql.Int, value: prod.id },
          { name: "cant", type: sql.Int, value: cantidadTotal },
          { name: "paq", type: sql.Int, value: paq },
        ],
      );

      // Registrar también en la tabla COMPRA como egreso de inventario
      const precioTotalCompra = paq * pCompraPaq;
      try {
        await query(
          `INSERT INTO COMPRA (id_producto, Cantidad, Paquetes, Unidades_sueltas, Precio_compra_paquete, Precio_compra_unidad, Precio_total, id_proveedor, id_empleado, Fecha)
           VALUES (@idp, @cant, @paq, 0, @pcpaq, @pcuni, @ptotal, @iprov, @iemp, @fecha)`,
          [
            { name: "idp", type: sql.Int, value: prod.id },
            { name: "cant", type: sql.Int, value: cantidadTotal },
            { name: "paq", type: sql.Int, value: paq },
            { name: "pcpaq", type: sql.Decimal, value: pCompraPaq },
            { name: "pcuni", type: sql.Decimal, value: pCompraUni },
            { name: "ptotal", type: sql.Decimal, value: precioTotalCompra },
            { name: "iprov", type: sql.Int, value: parseInt(id_prov) },
            { name: "iemp", type: sql.Int, value: id_empleado_registro ? parseInt(id_empleado_registro) : null },
            { name: "fecha", type: sql.DateTime, value: fecha_ingreso ? new Date(fecha_ingreso) : new Date() }
          ]
        );
      } catch (compraError) {
        console.error("❌ Error registrando compra inicial:", compraError.message);
      }
    }

    res.status(201).json(prod);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/productos/:id", async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      precio_unit,
      precio_may,
      id_cat,
      id_prov,
      paquetes = 0,
      unidades_paquete = 1,
      precio_compra_paq = 0,
      precio_compra_uni = null,
      precio_venta_paq = 0,
      id_empleado_registro = null,
      fecha_ingreso = null,
    } = req.body;

    const uPaq = parseInt(unidades_paquete) || 1;
    const pCompraPaq = parseFloat(precio_compra_paq) || 0;
    let pCompraUni = parseFloat(precio_compra_uni);
    if (isNaN(pCompraUni) || pCompraUni === null) {
      pCompraUni = uPaq > 0 ? (pCompraPaq / uPaq) : 0;
    }

    const r = await query(
      `UPDATE PRODUCTO
       SET Nombre                = @nombre,
           Descripcion           = @desc,
           Precio_unitario       = @pu,
           Precio_mayorista      = @pm,
           id_categoria          = @icat,
           id_proveedor          = @iprov,
           Paquetes              = @paq,
           Unidades_por_paquete  = @upaq,
           Precio_compra_paquete = @cpaq,
           Precio_compra_unidad  = @cuni,
           Precio_venta_paquete  = @vpaq,
           id_empleado_registro  = @iemp,
           fecha_ingreso         = @fingreso,
           fecha_actualizacion   = GETDATE()
       OUTPUT INSERTED.id_producto             AS id,
              INSERTED.Nombre                  AS nombre,
              INSERTED.Descripcion             AS descripcion,
              INSERTED.Precio_unitario         AS precio_unit,
              INSERTED.Precio_mayorista        AS precio_may,
              INSERTED.id_categoria            AS id_cat,
              INSERTED.id_proveedor            AS id_prov,
              INSERTED.Paquetes                AS paquetes,
              INSERTED.Unidades_por_paquete    AS unidades_paquete,
              INSERTED.Precio_compra_paquete   AS precio_compra_paq,
              INSERTED.Precio_compra_unidad    AS precio_compra_uni,
              INSERTED.Precio_venta_paquete    AS precio_venta_paq,
              INSERTED.id_empleado_registro    AS id_empleado_registro,
              INSERTED.fecha_ingreso           AS fecha_ingreso
       WHERE id_producto = @id`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "desc", type: sql.NVarChar, value: descripcion },
        { name: "pu", type: sql.Decimal, value: precio_unit },
        { name: "pm", type: sql.Decimal, value: precio_may },
        { name: "icat", type: sql.Int, value: parseInt(id_cat) },
        { name: "iprov", type: sql.Int, value: parseInt(id_prov) },
        { name: "paq", type: sql.Int, value: parseInt(paquetes) },
        { name: "upaq", type: sql.Int, value: uPaq },
        { name: "cpaq", type: sql.Decimal, value: pCompraPaq },
        { name: "cuni", type: sql.Decimal, value: pCompraUni },
        { name: "vpaq", type: sql.Decimal, value: precio_venta_paq },
        {
          name: "iemp",
          type: sql.Int,
          value: id_empleado_registro ? parseInt(id_empleado_registro) : null,
        },
        {
          name: "fingreso",
          type: sql.Date,
          value: fecha_ingreso ? new Date(fecha_ingreso) : new Date(),
        },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/productos/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pp = [{ name: "id", type: sql.Int, value: id }];
    await query("DELETE FROM DETALLE_VENTA       WHERE id_producto = @id", pp);
    await query("DELETE FROM PRODUCTO_DEFECTUOSO WHERE id_producto = @id", pp);
    await query("DELETE FROM INVENTARIO          WHERE id_producto = @id", pp);
    await query("DELETE FROM COMPRA              WHERE id_producto = @id", pp);
    await query("DELETE FROM PRODUCTO            WHERE id_producto = @id", pp);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   CLIENTES — soft delete (PATCH /estado)
   Tabla: CLIENTE | PK: id_cliente
   Cols: Nombre, Apellido, Direccion, Telefono, Email, Estado
   ============================================================ */
app.get("/api/clientes", async (req, res) => {
  try {
    const r = await query(
      `SELECT id_cliente AS id,
              Nombre     AS nombre,
              Apellido   AS apellido,
              Direccion  AS direccion,
              Telefono   AS telefono,
              Email      AS email,
              Estado     AS estado
       FROM CLIENTE
       ORDER BY Nombre, Apellido`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/clientes", async (req, res) => {
  try {
    const { nombre, apellido, direccion, telefono, email } = req.body;
    const r = await query(
      `INSERT INTO CLIENTE (Nombre, Apellido, Direccion, Telefono, Email, Estado, fecha_creacion, fecha_actualizacion)
       OUTPUT INSERTED.id_cliente AS id,
              INSERTED.Nombre     AS nombre,
              INSERTED.Apellido   AS apellido,
              INSERTED.Direccion  AS direccion,
              INSERTED.Telefono   AS telefono,
              INSERTED.Email      AS email,
              INSERTED.Estado     AS estado
       VALUES (@nombre, @apellido, @direccion, @telefono, @email, 'Activo', GETDATE(), GETDATE())`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "apellido", type: sql.NVarChar, value: apellido },
        { name: "direccion", type: sql.NVarChar, value: direccion },
        { name: "telefono", type: sql.NVarChar, value: telefono },
        { name: "email", type: sql.NVarChar, value: email },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/clientes/:id", async (req, res) => {
  try {
    const { nombre, apellido, direccion, telefono, email } = req.body;
    const r = await query(
      `UPDATE CLIENTE
       SET Nombre = @nombre, Apellido = @apellido, Direccion = @direccion,
           Telefono = @telefono, Email = @email,
           fecha_actualizacion = GETDATE()
       OUTPUT INSERTED.id_cliente AS id,
              INSERTED.Nombre     AS nombre,
              INSERTED.Apellido   AS apellido,
              INSERTED.Direccion  AS direccion,
              INSERTED.Telefono   AS telefono,
              INSERTED.Email      AS email,
              INSERTED.Estado     AS estado
       WHERE id_cliente = @id`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "apellido", type: sql.NVarChar, value: apellido },
        { name: "direccion", type: sql.NVarChar, value: direccion },
        { name: "telefono", type: sql.NVarChar, value: telefono },
        { name: "email", type: sql.NVarChar, value: email },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/clientes/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    await query(
      `UPDATE CLIENTE
       SET Estado = @estado, fecha_actualizacion = GETDATE()
       WHERE id_cliente = @id`,
      [
        { name: "estado", type: sql.NVarChar, value: estado },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   EMPLEADOS — soft delete (PATCH /estado)
   Tabla: EMPLEADO | PK: id_empleado
   Cols: Nombre, Apellido, Correo, Ruta, Estado
   ============================================================ */
app.get("/api/empleados", async (req, res) => {
  try {
    const r = await query(
      `SELECT id_empleado AS id,
              Nombre      AS nombre,
              Apellido    AS apellido,
              Correo      AS correo,
              Ruta        AS ruta,
              Estado      AS estado
       FROM EMPLEADO
       ORDER BY Nombre, Apellido`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/empleados", async (req, res) => {
  try {
    const { nombre, apellido, correo, ruta } = req.body;
    const r = await query(
      `INSERT INTO EMPLEADO (Nombre, Apellido, Correo, Ruta, Estado, fecha_creacion, fecha_actualizacion)
       OUTPUT INSERTED.id_empleado AS id,
              INSERTED.Nombre      AS nombre,
              INSERTED.Apellido    AS apellido,
              INSERTED.Correo      AS correo,
              INSERTED.Ruta        AS ruta,
              INSERTED.Estado      AS estado
       VALUES (@nombre, @apellido, @correo, @ruta, 'Activo', GETDATE(), GETDATE())`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "apellido", type: sql.NVarChar, value: apellido },
        { name: "correo", type: sql.NVarChar, value: correo },
        { name: "ruta", type: sql.NVarChar, value: ruta },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/empleados/:id", async (req, res) => {
  try {
    const { nombre, apellido, correo, ruta } = req.body;
    const r = await query(
      `UPDATE EMPLEADO
       SET Nombre = @nombre, Apellido = @apellido, Correo = @correo, Ruta = @ruta,
           fecha_actualizacion = GETDATE()
       OUTPUT INSERTED.id_empleado AS id,
              INSERTED.Nombre      AS nombre,
              INSERTED.Apellido    AS apellido,
              INSERTED.Correo      AS correo,
              INSERTED.Ruta        AS ruta,
              INSERTED.Estado      AS estado
       WHERE id_empleado = @id`,
      [
        { name: "nombre", type: sql.NVarChar, value: nombre },
        { name: "apellido", type: sql.NVarChar, value: apellido },
        { name: "correo", type: sql.NVarChar, value: correo },
        { name: "ruta", type: sql.NVarChar, value: ruta },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.patch("/api/empleados/:id/estado", async (req, res) => {
  try {
    const { estado } = req.body;
    await query(
      `UPDATE EMPLEADO
       SET Estado = @estado, fecha_actualizacion = GETDATE()
       WHERE id_empleado = @id`,
      [
        { name: "estado", type: sql.NVarChar, value: estado },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   INVENTARIO
   Tabla: INVENTARIO | PK: id_inventario
   Cols: id_producto, Cantidad, Paquetes, Unidades_sueltas,
         Estado, Fecha_movimiento
   ============================================================ */
app.get("/api/inventario", async (req, res) => {
  try {
    const r = await query(
      `SELECT i.id_inventario       AS id,
              i.id_producto         AS id_prod,
              p.Nombre     AS nombre_prod,
              i.Cantidad            AS cantidad,
              i.Paquetes            AS paquetes,
              i.Unidades_sueltas    AS unidades_sueltas,
              i.Fecha_movimiento    AS fecha,
              i.Estado              AS estado
       FROM INVENTARIO i
       LEFT JOIN PRODUCTO p ON i.id_producto = p.id_producto
       ORDER BY i.Fecha_movimiento DESC`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* POST de INVENTARIO — Agregar stock (compras/ingresos) */
app.post("/api/inventario", async (req, res) => {
  try {
    const {
      id_producto,
      paquetes = 0,
      unidades_sueltas = 0,
      precio_compra_paq = 0,
      precio_compra_uni = 0,
      precio_total = 0,
      id_proveedor = null,
      id_empleado = null,
      fecha = null
    } = req.body;
    
    // Obtener datos del producto
    const prodResult = await query(
      `SELECT Nombre, id_proveedor, Unidades_por_paquete FROM PRODUCTO WHERE id_producto = @id`,
      [{ name: "id", type: sql.Int, value: parseInt(id_producto) }]
    );
    
    if (!prodResult.recordset.length) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    
    const prodData = prodResult.recordset[0];
    const unidadesPorPaquete = prodData.Unidades_por_paquete || 1;
    const paq = parseInt(paquetes) || 0;
    const sueltas = parseInt(unidades_sueltas) || 0;
    const cantidadTotal = (paq * unidadesPorPaquete) + sueltas;
    
    if (cantidadTotal <= 0) {
      return res.status(400).json({ error: "Debe ingresar al menos 1 unidad o paquete" });
    }
    
    const fechaMov = fecha ? new Date(fecha) : new Date();
    
    // Crear nuevo registro de inventario
    const r = await query(
      `INSERT INTO INVENTARIO (id_producto, Cantidad, Paquetes, Unidades_sueltas, Estado, Fecha_movimiento)
       OUTPUT INSERTED.id_inventario AS id,
              INSERTED.id_producto AS id_prod,
              INSERTED.Cantidad AS cantidad,
              INSERTED.Paquetes AS paquetes,
              INSERTED.Unidades_sueltas AS unidades_sueltas,
              INSERTED.Estado AS estado,
              INSERTED.Fecha_movimiento AS fecha
       VALUES (@idp, @cant, @paq, @sueltas, 'Disponible', @fecha)`,
      [
        { name: "idp", type: sql.Int, value: parseInt(id_producto) },
        { name: "cant", type: sql.Int, value: cantidadTotal },
        { name: "paq", type: sql.Int, value: paq },
        { name: "sueltas", type: sql.Int, value: sueltas },
        { name: "fecha", type: sql.Date, value: fechaMov }
      ]
    );
    
    const pTotal = parseFloat(precio_total) || 0;
    const pPaq = parseFloat(precio_compra_paq) || 0;
    const pUni = parseFloat(precio_compra_uni) || (unidadesPorPaquete > 0 ? pPaq / unidadesPorPaquete : 0);
    const provId = id_proveedor ? parseInt(id_proveedor) : prodData.id_proveedor;
    
    // Registrar la compra
    await query(
      `INSERT INTO COMPRA (id_producto, Cantidad, Paquetes, Unidades_sueltas, Precio_compra_paquete, Precio_compra_unidad, Precio_total, id_proveedor, id_empleado, Fecha)
       VALUES (@idp, @cant, @paq, @sueltas, @pcpaq, @pcuni, @ptotal, @iprov, @iemp, @fecha)`,
      [
        { name: "idp", type: sql.Int, value: parseInt(id_producto) },
        { name: "cant", type: sql.Int, value: cantidadTotal },
        { name: "paq", type: sql.Int, value: paq },
        { name: "sueltas", type: sql.Int, value: sueltas },
        { name: "pcpaq", type: sql.Decimal, value: pPaq },
        { name: "pcuni", type: sql.Decimal, value: pUni },
        { name: "ptotal", type: sql.Decimal, value: pTotal },
        { name: "iprov", type: sql.Int, value: parseInt(provId) },
        { name: "iemp", type: sql.Int, value: id_empleado ? parseInt(id_empleado) : null },
        { name: "fecha", type: sql.DateTime, value: fechaMov }
      ]
    );
    
    // Si hay caja abierta y se ingresó un costo, registrar movimiento de Egreso
    if (pTotal > 0) {
      try {
        const cajaRow = await query(
          `SELECT TOP 1 id_caja, total_egresos FROM CAJA WHERE Estado = 'Abierta' ORDER BY fecha_apertura DESC`
        );
        if (cajaRow.recordset.length > 0) {
          const caja = cajaRow.recordset[0];
          const hoy = new Date();
          const hora = hoy.toTimeString().split(" ")[0];
          const desc = `Compra: ${paq} paq, ${sueltas} uds de ${prodData.Nombre}`;
          
          // Insertar movimiento
          await query(
            `INSERT INTO MOVIMIENTO_CAJA (id_caja, Tipo, Descripcion, Monto, Fecha, Hora)
             VALUES (@idc, 'Egreso', @desc, @monto, @fecha, @hora)`,
            [
              { name: "idc", type: sql.Int, value: caja.id_caja },
              { name: "desc", type: sql.NVarChar, value: desc },
              { name: "monto", type: sql.Decimal, value: pTotal },
              { name: "fecha", type: sql.DateTime, value: hoy },
              { name: "hora", type: sql.NVarChar, value: hora }
            ]
          );
          
          // Actualizar total_egresos de caja
          const nuevoEgreso = parseFloat(caja.total_egresos || 0) + pTotal;
          await query(
            `UPDATE CAJA SET total_egresos = @v WHERE id_caja = @idc`,
            [
              { name: "v", type: sql.Decimal, value: nuevoEgreso },
              { name: "idc", type: sql.Int, value: caja.id_caja }
            ]
          );
        }
      } catch (cajaErr) {
        console.warn("⚠️ No se pudo registrar el egreso en caja:", cajaErr.message);
      }
    }
    
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    console.error("Error en POST /api/inventario:", e);
    res.status(500).json({ error: e.message });
  }
});

/* PUT y DELETE de INVENTARIO desactivados — Inventario es solo lectura (se llena automáticamente desde PRODUCTO) */

/* ============================================================
   DEFECTUOSOS
   Tabla: PRODUCTO_DEFECTUOSO | PK: id_defectuoso
   Cols: id_inventario, id_producto, Cantidad, Fecha, Descripcion
   ============================================================ */
app.get("/api/defectuosos", async (req, res) => {
  try {
    const r = await query(
      `SELECT d.id_defectuoso AS id,
              d.id_inventario AS id_inv,
              d.id_producto   AS id_prod,
              p.Nombre AS nombre_prod,
              d.Cantidad      AS cantidad,
              d.Fecha         AS fecha,
              d.Descripcion   AS descripcion
       FROM PRODUCTO_DEFECTUOSO d
       LEFT JOIN PRODUCTO p ON d.id_producto = p.id_producto
       ORDER BY d.Fecha DESC`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/defectuosos", async (req, res) => {
  try {
    const { id_inv, id_prod, cantidad, fecha, descripcion } = req.body;
    const r = await query(
      `INSERT INTO PRODUCTO_DEFECTUOSO (id_inventario, id_producto, Cantidad, Fecha, Descripcion)
       OUTPUT INSERTED.id_defectuoso AS id,
              INSERTED.id_inventario AS id_inv,
              INSERTED.id_producto   AS id_prod,
              INSERTED.Cantidad      AS cantidad,
              INSERTED.Fecha         AS fecha,
              INSERTED.Descripcion   AS descripcion
       VALUES (@idinv, @idprod, @cant, @fecha, @desc)`,
      [
        { name: "idinv", type: sql.Int, value: parseInt(id_inv) },
        { name: "idprod", type: sql.Int, value: parseInt(id_prod) },
        { name: "cant", type: sql.Int, value: parseInt(cantidad) },
        {
          name: "fecha",
          type: sql.DateTime,
          value: fecha ? new Date(fecha) : new Date(),
        },
        { name: "desc", type: sql.NVarChar, value: descripcion },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/defectuosos/:id", async (req, res) => {
  try {
    const { id_inv, id_prod, cantidad, fecha, descripcion } = req.body;
    const r = await query(
      `UPDATE PRODUCTO_DEFECTUOSO
       SET id_inventario = @idinv,
           id_producto   = @idprod,
           Cantidad      = @cant,
           Fecha         = @fecha,
           Descripcion   = @desc
       OUTPUT INSERTED.id_defectuoso AS id,
              INSERTED.id_inventario AS id_inv,
              INSERTED.id_producto   AS id_prod,
              INSERTED.Cantidad      AS cantidad,
              INSERTED.Fecha         AS fecha,
              INSERTED.Descripcion   AS descripcion
       WHERE id_defectuoso = @id`,
      [
        { name: "idinv", type: sql.Int, value: parseInt(id_inv) },
        { name: "idprod", type: sql.Int, value: parseInt(id_prod) },
        { name: "cant", type: sql.Int, value: parseInt(cantidad) },
        {
          name: "fecha",
          type: sql.DateTime,
          value: fecha ? new Date(fecha) : new Date(),
        },
        { name: "desc", type: sql.NVarChar, value: descripcion },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/defectuosos/:id", async (req, res) => {
  try {
    await query("DELETE FROM PRODUCTO_DEFECTUOSO WHERE id_defectuoso = @id", [
      { name: "id", type: sql.Int, value: parseInt(req.params.id) },
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   VENTAS (FACTURA_VENTA)
   Tabla: FACTURA_VENTA | PK: id_factura
   Cols: id_cliente, id_empleado, Fecha, Total
   Al registrar: si hay caja abierta → MOVIMIENTO_CAJA + actualizar CAJA
   ============================================================ */
app.get("/api/ventas", async (req, res) => {
  try {
    const r = await query(
      `SELECT f.id_factura  AS id,
              f.id_cliente  AS id_cli,
              f.id_empleado AS id_emp,
              f.Fecha       AS fecha,
              f.Total       AS total,
              c.Nombre + ' ' + c.Apellido AS cliente_nombre,
              e.Nombre + ' ' + e.Apellido AS empleado_nombre
       FROM FACTURA_VENTA f
       LEFT JOIN CLIENTE  c ON f.id_cliente  = c.id_cliente
       LEFT JOIN EMPLEADO e ON f.id_empleado = e.id_empleado
       ORDER BY f.Fecha DESC`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/ventas", async (req, res) => {
  try {
    const { id_cli, id_emp, fecha, total } = req.body;
    
    // VERIFICAR QUE HAYA CAJA ABIERTA Y QUE SEA EL RESPONSABLE
    const cajaRow = await query(
      `SELECT TOP 1 id_caja, id_empleado, Estado FROM CAJA WHERE Estado = 'Abierta' ORDER BY fecha_apertura DESC`,
    );
    
    if (cajaRow.recordset.length === 0) {
      return res.status(403).json({ 
        error: "No hay caja abierta. Debes abrir la caja antes de realizar ventas." 
      });
    }
    
    const caja = cajaRow.recordset[0];
    const idEmpleadoVenta = parseInt(id_emp);
    const idEmpleadoCaja = parseInt(caja.id_empleado);
    
    if (idEmpleadoVenta !== idEmpleadoCaja) {
      // Obtener nombre del responsable
      const empRow = await query(
        `SELECT Nombre + ' ' + Apellido AS nombre FROM EMPLEADO WHERE id_empleado = @id`,
        [{ name: "id", type: sql.Int, value: idEmpleadoCaja }]
      );
      const nombreResponsable = empRow.recordset[0]?.nombre || "desconocido";
      
      return res.status(403).json({ 
        error: `Acceso denegado. Solo ${nombreResponsable} (quien abrió la caja) puede realizar ventas mientras la caja permanezca abierta.` 
      });
    }
    
    // Proceder con la venta
    const r = await query(
      `INSERT INTO FACTURA_VENTA (id_cliente, id_empleado, Fecha, Total)
       OUTPUT INSERTED.id_factura  AS id,
              INSERTED.id_cliente  AS id_cli,
              INSERTED.id_empleado AS id_emp,
              INSERTED.Fecha       AS fecha,
              INSERTED.Total       AS total
       VALUES (@idcli, @idemp, @fecha, @total)`,
      [
        { name: "idcli", type: sql.Int, value: parseInt(id_cli) },
        { name: "idemp", type: sql.Int, value: parseInt(id_emp) },
        {
          name: "fecha",
          type: sql.DateTime,
          value: fecha ? new Date(fecha) : new Date(),
        },
        { name: "total", type: sql.Decimal, value: parseFloat(total) },
      ],
    );
    const venta = r.recordset[0];

    // Registrar movimiento en caja
    try {
      const hoy = new Date();
      const hora = hoy.toTimeString().split(" ")[0];

      await query(
        `INSERT INTO MOVIMIENTO_CAJA (id_caja, Tipo, Descripcion, Monto, Fecha, Hora)
         VALUES (@idc, 'Venta', @desc, @monto, @fecha, @hora)`,
        [
          { name: "idc", type: sql.Int, value: caja.id_caja },
          { name: "desc", type: sql.NVarChar, value: `Factura #${venta.id}` },
          { name: "monto", type: sql.Decimal, value: parseFloat(total) },
          { name: "fecha", type: sql.DateTime, value: hoy },
          { name: "hora", type: sql.NVarChar, value: hora },
        ],
      );

      const nuevasVentas =
        parseFloat(caja.total_ventas || 0) + parseFloat(total);
      await query(`UPDATE CAJA SET total_ventas = @tv WHERE id_caja = @idc`, [
        { name: "tv", type: sql.Decimal, value: nuevasVentas },
        { name: "idc", type: sql.Int, value: caja.id_caja },
      ]);
    } catch (_) {
      // No bloquear la venta si el registro de caja falla
    }

    res.status(201).json(venta);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/ventas/:id", async (req, res) => {
  try {
    const { id_cli, id_emp, fecha, total } = req.body;
    const r = await query(
      `UPDATE FACTURA_VENTA
       SET id_cliente = @idcli, id_empleado = @idemp, Fecha = @fecha, Total = @total
       OUTPUT INSERTED.id_factura  AS id,
              INSERTED.id_cliente  AS id_cli,
              INSERTED.id_empleado AS id_emp,
              INSERTED.Fecha       AS fecha,
              INSERTED.Total       AS total
       WHERE id_factura = @id`,
      [
        { name: "idcli", type: sql.Int, value: parseInt(id_cli) },
        { name: "idemp", type: sql.Int, value: parseInt(id_emp) },
        {
          name: "fecha",
          type: sql.DateTime,
          value: fecha ? new Date(fecha) : new Date(),
        },
        { name: "total", type: sql.Decimal, value: parseFloat(total) },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/ventas/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const pp = [{ name: "id", type: sql.Int, value: id }];
    await query("DELETE FROM DETALLE_VENTA WHERE id_factura = @id", pp);
    await query("DELETE FROM FACTURA_VENTA  WHERE id_factura = @id", pp);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   DETALLES DE VENTA
   Tabla: DETALLE_VENTA | PK: id_detalle
   Cols: id_factura, id_producto, Cantidad, Precio_unitario, Total
   ============================================================ */
app.get("/api/detalles", async (req, res) => {
  try {
    const r = await query(
      `SELECT dv.id_detalle      AS id,
              dv.id_factura      AS id_fac,
              dv.id_producto     AS id_prod,
              p.Nombre  AS nombre_prod,
              dv.Cantidad        AS cantidad,
              dv.Precio_unitario AS precio_unit,
              dv.Total           AS total
       FROM DETALLE_VENTA dv
       LEFT JOIN PRODUCTO p ON dv.id_producto = p.id_producto
       ORDER BY dv.id_detalle`,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/detalles", async (req, res) => {
  try {
    const { id_fac, id_prod, cantidad, precio_unit, total } = req.body;
    
    // 1. Insertar el detalle de venta
    const r = await query(
      `INSERT INTO DETALLE_VENTA (id_factura, id_producto, Cantidad, Precio_unitario, Total)
       OUTPUT INSERTED.id_detalle      AS id,
              INSERTED.id_factura      AS id_fac,
              INSERTED.id_producto     AS id_prod,
              INSERTED.Cantidad        AS cantidad,
              INSERTED.Precio_unitario AS precio_unit,
              INSERTED.Total           AS total
       VALUES (@idfac, @idprod, @cant, @pu, @total)`,
      [
        { name: "idfac", type: sql.Int, value: parseInt(id_fac) },
        { name: "idprod", type: sql.Int, value: parseInt(id_prod) },
        { name: "cant", type: sql.Int, value: parseInt(cantidad) },
        { name: "pu", type: sql.Decimal, value: parseFloat(precio_unit) },
        { name: "total", type: sql.Decimal, value: parseFloat(total) },
      ],
    );
    
    // 2. ACTUALIZAR INVENTARIO - Reducir stock cuando se vende
    const cantidadVendida = parseInt(cantidad);
    
    // Obtener producto para saber unidades por paquete
    const prodResult = await query(
      `SELECT Unidades_por_paquete FROM PRODUCTO WHERE id_producto = @id`,
      [{ name: "id", type: sql.Int, value: parseInt(id_prod) }]
    );
    const unidadesPorPaquete = prodResult.recordset[0]?.Unidades_por_paquete || 1;
    
    // Obtener inventario disponible ordenado por fecha (FIFO)
    const invResult = await query(
      `SELECT id_inventario, Cantidad, Paquetes, Unidades_sueltas 
       FROM INVENTARIO 
       WHERE id_producto = @id AND Estado = 'Disponible' AND Cantidad > 0
       ORDER BY Fecha_movimiento ASC`,
      [{ name: "id", type: sql.Int, value: parseInt(id_prod) }]
    );
    
    let restante = cantidadVendida;
    
    for (const inv of invResult.recordset) {
      if (restante <= 0) break;
      
      let paquetes = parseInt(inv.Paquetes) || 0;
      let sueltas = parseInt(inv.Unidades_sueltas) || 0;
      const totalDisponible = paquetes * unidadesPorPaquete + sueltas;
      
      if (totalDisponible <= 0) continue;
      
      const aDescontar = Math.min(totalDisponible, restante);
      
      // Primero descontar de unidades sueltas
      const deSueltas = Math.min(sueltas, aDescontar);
      sueltas -= deSueltas;
      let aunFalta = aDescontar - deSueltas;
      
      // Si falta, romper paquetes
      if (aunFalta > 0 && paquetes > 0) {
        const paquetesARomper = Math.ceil(aunFalta / unidadesPorPaquete);
        const unidadesDeRomper = paquetesARomper * unidadesPorPaquete;
        paquetes -= paquetesARomper;
        sueltas += (unidadesDeRomper - aunFalta);
      }
      
      const nuevaCantidad = paquetes * unidadesPorPaquete + sueltas;
      const nuevoEstado = nuevaCantidad <= 0 ? 'Agotado' : 'Disponible';
      
      // Actualizar inventario
      await query(
        `UPDATE INVENTARIO 
         SET Cantidad = @cant, Paquetes = @paq, Unidades_sueltas = @sueltas, Estado = @estado
         WHERE id_inventario = @id`,
        [
          { name: "cant", type: sql.Int, value: Math.max(0, nuevaCantidad) },
          { name: "paq", type: sql.Int, value: Math.max(0, paquetes) },
          { name: "sueltas", type: sql.Int, value: Math.max(0, sueltas) },
          { name: "estado", type: sql.NVarChar, value: nuevoEstado },
          { name: "id", type: sql.Int, value: inv.id_inventario }
        ]
      );
      
      restante -= aDescontar;
    }
    
    if (restante > 0) {
      console.warn(`⚠️ Stock insuficiente para producto ${id_prod}. Faltaron ${restante} unidades.`);
    }
    
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    console.error("Error en POST /api/detalles:", e);
    res.status(500).json({ error: e.message });
  }
});

app.put("/api/detalles/:id", async (req, res) => {
  try {
    const { id_fac, id_prod, cantidad, precio_unit, total } = req.body;
    const r = await query(
      `UPDATE DETALLE_VENTA
       SET id_factura = @idfac, id_producto = @idprod,
           Cantidad = @cant, Precio_unitario = @pu, Total = @total
       OUTPUT INSERTED.id_detalle      AS id,
              INSERTED.id_factura      AS id_fac,
              INSERTED.id_producto     AS id_prod,
              INSERTED.Cantidad        AS cantidad,
              INSERTED.Precio_unitario AS precio_unit,
              INSERTED.Total           AS total
       WHERE id_detalle = @id`,
      [
        { name: "idfac", type: sql.Int, value: parseInt(id_fac) },
        { name: "idprod", type: sql.Int, value: parseInt(id_prod) },
        { name: "cant", type: sql.Int, value: parseInt(cantidad) },
        { name: "pu", type: sql.Decimal, value: parseFloat(precio_unit) },
        { name: "total", type: sql.Decimal, value: parseFloat(total) },
        { name: "id", type: sql.Int, value: parseInt(req.params.id) },
      ],
    );
    res.json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/detalles/:id", async (req, res) => {
  try {
    await query("DELETE FROM DETALLE_VENTA WHERE id_detalle = @id", [
      { name: "id", type: sql.Int, value: parseInt(req.params.id) },
    ]);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   DASHBOARD
   ============================================================ */
app.get("/api/dashboard", async (req, res) => {
  try {
    const [
      ventasHoyR,
      ventasMesR,
      comprasMesR,
      prodTotalR,
      bajostockR,
      clientesR,
      empleadosR,
      proveedoresR,
      invTotalR,
      defTotalR,
      cajaR,
      ultimasVentasR,
    ] = await Promise.all([
      // ventas hoy: count + sum
      query(`SELECT COUNT(*)    AS ventasHoy,
                    ISNULL(SUM(Total), 0) AS montoVentasHoy
             FROM FACTURA_VENTA
             WHERE CAST(Fecha AS DATE) = CAST(GETDATE() AS DATE)`),

      // ventas del mes
      query(`SELECT ISNULL(SUM(Total), 0) AS ventasMes
             FROM FACTURA_VENTA
             WHERE MONTH(Fecha) = MONTH(GETDATE())
               AND YEAR(Fecha)  = YEAR(GETDATE())`),

      // compras del mes
      query(`SELECT ISNULL(SUM(Precio_total), 0) AS comprasMes
             FROM COMPRA
             WHERE MONTH(Fecha) = MONTH(GETDATE())
               AND YEAR(Fecha)  = YEAR(GETDATE())`),

      // total de productos
      query(`SELECT COUNT(*) AS productosTotal FROM PRODUCTO`),

      // productos bajo stock (< 10 unidades)
      query(`SELECT COUNT(*) AS productosBajoStock
             FROM PRODUCTO p
             WHERE ISNULL(
               (SELECT SUM(i.Cantidad) FROM INVENTARIO i WHERE i.id_producto = p.id_producto), 0
             ) < 10`),

      // clientes activos
      query(
        `SELECT COUNT(*) AS clientesActivos FROM CLIENTE WHERE Estado = 'Activo'`,
      ),

      // empleados activos
      query(
        `SELECT COUNT(*) AS empleadosActivos FROM EMPLEADO WHERE Estado = 'Activo'`,
      ),

      // proveedores activos
      query(
        `SELECT COUNT(*) AS proveedoresActivos FROM PROVEEDOR WHERE Estado = 'Activo'`,
      ),

      // total inventario (unidades y paquetes)
      query(
        `SELECT ISNULL(SUM(Cantidad), 0)         AS totalInventario,
                ISNULL(SUM(Paquetes), 0)          AS totalPaquetes,
                ISNULL(SUM(Unidades_sueltas), 0)  AS totalUnidadesSueltas
         FROM INVENTARIO`,
      ),

      // total defectuosos
      query(
        `SELECT ISNULL(SUM(Cantidad), 0) AS totalDefectuosos FROM PRODUCTO_DEFECTUOSO`,
      ),

      // caja abierta
      query(`SELECT TOP 1 Estado, monto_inicial, monto_final,
                          total_ventas, total_ingresos, total_egresos, ganancia
             FROM CAJA
             WHERE Estado = 'Abierta'
             ORDER BY fecha_apertura DESC`),

      // últimas 7 ventas
      query(`SELECT TOP 7
                    f.id_factura  AS id,
                    f.Fecha       AS fecha,
                    f.Total       AS total,
                    c.Nombre + ' ' + c.Apellido AS cliente,
                    e.Nombre + ' ' + e.Apellido AS empleado
             FROM FACTURA_VENTA f
             LEFT JOIN CLIENTE  c ON f.id_cliente  = c.id_cliente
             LEFT JOIN EMPLEADO e ON f.id_empleado = e.id_empleado
             ORDER BY f.Fecha DESC`),
    ]);

    const vh = ventasHoyR.recordset[0];
    const vm = ventasMesR.recordset[0];
    const cm = comprasMesR.recordset[0];
    const pt = prodTotalR.recordset[0];
    const bs = bajostockR.recordset[0];
    const cli = clientesR.recordset[0];
    const emp = empleadosR.recordset[0];
    const prov = proveedoresR.recordset[0];
    const invT = invTotalR.recordset[0] || {
      totalInventario: 0,
      totalPaquetes: 0,
      totalUnidadesSueltas: 0,
    };
    const defT = defTotalR.recordset[0];
    const caja = cajaR.recordset[0] || null;

    res.json({
      ventasHoy: vh.ventasHoy,
      montoVentasHoy: parseFloat(vh.montoVentasHoy),
      gananciaMes: parseFloat(vm.ventasMes || 0) - parseFloat(cm.comprasMes || 0),
      productosTotal: pt.productosTotal,
      productosBajoStock: bs.productosBajoStock,
      clientesActivos: cli.clientesActivos,
      empleadosActivos: emp.empleadosActivos,
      proveedoresActivos: prov.proveedoresActivos,
      totalInventario: parseInt(invT.totalInventario),
      totalPaquetes: parseInt(invT.totalPaquetes),
      totalUnidadesSueltas: parseInt(invT.totalUnidadesSueltas),
      totalDefectuosos: parseInt(defT.totalDefectuosos),
      cajaEstado: caja ? caja.Estado : null,
      cajaMonto: caja ? parseFloat(caja.monto_inicial || 0) : null,
      ultimasVentas: ultimasVentasR.recordset,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   CAJA
   Tabla: CAJA | PK: id_caja
   Cols: id_empleado, fecha_apertura, hora_apertura, monto_inicial,
         fecha_cierre, hora_cierre, total_ventas, total_ingresos,
         total_egresos, monto_final, ganancia, Estado
   ============================================================ */

// GET caja actual (abierta)
app.get("/api/caja/actual", async (req, res) => {
  try {
    const r = await query(
      `SELECT TOP 1
              c.id_caja, c.id_empleado,
              e.Nombre + ' ' + e.Apellido AS empleado_nombre,
              c.fecha_apertura, c.hora_apertura,
              c.monto_inicial, c.total_ventas,
              c.total_ingresos, c.total_egresos,
              c.monto_final, c.ganancia, c.Estado
       FROM CAJA c
       LEFT JOIN EMPLEADO e ON c.id_empleado = e.id_empleado
       WHERE c.Estado = 'Abierta'
       ORDER BY c.fecha_apertura DESC`,
    );
    res.json(r.recordset[0] || null);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST apertura de caja
app.post("/api/caja/apertura", async (req, res) => {
  try {
    // Verificar que no haya caja abierta
    const existe = await query(
      `SELECT TOP 1 id_caja FROM CAJA WHERE Estado = 'Abierta'`,
    );
    if (existe.recordset.length > 0) {
      return res.status(400).json({ error: "Ya existe una caja abierta." });
    }

    const { id_empleado, monto_inicial } = req.body;
    const ahora = new Date();
    const hora = ahora.toTimeString().split(" ")[0];

    const r = await query(
      `INSERT INTO CAJA
         (id_empleado, fecha_apertura, hora_apertura,
          monto_inicial, total_ventas, total_ingresos,
          total_egresos, monto_final, ganancia, Estado)
       OUTPUT INSERTED.id_caja, INSERTED.Estado,
              INSERTED.monto_inicial, INSERTED.fecha_apertura, INSERTED.hora_apertura
       VALUES (@idemp, @fecha, @hora, @monto, 0, 0, 0, 0, 0, 'Abierta')`,
      [
        { name: "idemp", type: sql.Int, value: parseInt(id_empleado) },
        { name: "fecha", type: sql.DateTime, value: ahora },
        { name: "hora", type: sql.NVarChar, value: hora },
        { name: "monto", type: sql.Decimal, value: parseFloat(monto_inicial) },
      ],
    );
    res.status(201).json(r.recordset[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST cierre de caja
app.post("/api/caja/cierre", async (req, res) => {
  try {
    const cajaRow = await query(
      `SELECT TOP 1 id_caja, fecha_apertura, hora_apertura, total_ventas, total_ingresos, total_egresos
       FROM CAJA WHERE Estado = 'Abierta'
       ORDER BY fecha_apertura DESC`,
    );
    if (cajaRow.recordset.length === 0) {
      return res.status(400).json({ error: "No hay caja abierta." });
    }

    const caja = cajaRow.recordset[0];
    const { monto_final = 0 } = req.body;
    
    // Obtener las compras realizadas durante la sesión de caja
    const fechaAperturaStr = new Date(caja.fecha_apertura).toISOString().split("T")[0];
    const aperturaDateTime = new Date(`${fechaAperturaStr}T${caja.hora_apertura}`);
    
    const comprasRow = await query(
      `SELECT ISNULL(SUM(Precio_total), 0) AS total_compras
       FROM COMPRA
       WHERE Fecha >= @apertura`,
      [{ name: "apertura", type: sql.DateTime, value: aperturaDateTime }]
    );
    const totalCompras = parseFloat(comprasRow.recordset[0]?.total_compras || 0);
    
    // Ganancia Neta = Total Ventas - Total Compras
    const ganancia = parseFloat(caja.total_ventas || 0) - totalCompras;
    const ahora = new Date();
    const hora = ahora.toTimeString().split(" ")[0];

    await query(
      `UPDATE CAJA
       SET Estado = 'Cerrada',
           fecha_cierre = @fecha,
           hora_cierre  = @hora,
           monto_final  = @mf,
           ganancia     = @gan
       WHERE id_caja = @idc`,
      [
        { name: "fecha", type: sql.DateTime, value: ahora },
        { name: "hora", type: sql.NVarChar, value: hora },
        { name: "mf", type: sql.Decimal, value: parseFloat(monto_final) },
        { name: "gan", type: sql.Decimal, value: ganancia },
        { name: "idc", type: sql.Int, value: caja.id_caja },
      ],
    );

    res.json({
      ok: true,
      resumen: {
        id_caja: caja.id_caja,
        total_ventas: caja.total_ventas,
        total_ingresos: caja.total_ingresos,
        total_egresos: caja.total_egresos,
        total_compras: totalCompras,
        monto_final,
        ganancia,
      },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET movimientos de caja actual
app.get("/api/caja/movimientos", async (req, res) => {
  try {
    const cajaRow = await query(
      `SELECT TOP 1 id_caja FROM CAJA WHERE Estado = 'Abierta' ORDER BY fecha_apertura DESC`,
    );
    if (cajaRow.recordset.length === 0) {
      return res.json([]);
    }
    const idCaja = cajaRow.recordset[0].id_caja;
    const r = await query(
      `SELECT TOP 50
              id_movimiento AS id,
              id_caja,
              Tipo, Descripcion, Monto, Fecha, Hora
       FROM MOVIMIENTO_CAJA
       WHERE id_caja = @idc
       ORDER BY Fecha DESC, Hora DESC`,
      [{ name: "idc", type: sql.Int, value: idCaja }],
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST movimiento manual de caja (Ingreso / Egreso)
app.post("/api/caja/movimientos", async (req, res) => {
  try {
    const cajaRow = await query(
      `SELECT TOP 1 id_caja, total_ingresos, total_egresos
       FROM CAJA WHERE Estado = 'Abierta'
       ORDER BY fecha_apertura DESC`,
    );
    if (cajaRow.recordset.length === 0) {
      return res.status(400).json({ error: "No hay caja abierta." });
    }

    const caja = cajaRow.recordset[0];
    const { tipo, descripcion, monto } = req.body;
    const montoNum = parseFloat(monto);
    const ahora = new Date();
    const hora = ahora.toTimeString().split(" ")[0];

    await query(
      `INSERT INTO MOVIMIENTO_CAJA (id_caja, Tipo, Descripcion, Monto, Fecha, Hora)
       VALUES (@idc, @tipo, @desc, @monto, @fecha, @hora)`,
      [
        { name: "idc", type: sql.Int, value: caja.id_caja },
        { name: "tipo", type: sql.NVarChar, value: tipo },
        { name: "desc", type: sql.NVarChar, value: descripcion },
        { name: "monto", type: sql.Decimal, value: montoNum },
        { name: "fecha", type: sql.DateTime, value: ahora },
        { name: "hora", type: sql.NVarChar, value: hora },
      ],
    );

    // Actualizar totales de caja
    if (tipo === "Ingreso") {
      const nuevo = parseFloat(caja.total_ingresos || 0) + montoNum;
      await query(`UPDATE CAJA SET total_ingresos = @v WHERE id_caja = @idc`, [
        { name: "v", type: sql.Decimal, value: nuevo },
        { name: "idc", type: sql.Int, value: caja.id_caja },
      ]);
    } else if (tipo === "Egreso") {
      const nuevo = parseFloat(caja.total_egresos || 0) + montoNum;
      await query(`UPDATE CAJA SET total_egresos = @v WHERE id_caja = @idc`, [
        { name: "v", type: sql.Decimal, value: nuevo },
        { name: "idc", type: sql.Int, value: caja.id_caja },
      ]);
    }

    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   REPORTE DE COMPRAS
   Historial de productos ingresados con todos los datos de compra
   ============================================================ */
app.get("/api/reportes/compras", async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let whereClause = "";
    const params = [];
    if (desde && hasta) {
      whereClause = "WHERE c.Fecha BETWEEN @desde AND @hasta";
      params.push({ name: "desde", type: sql.DateTime, value: new Date(desde + "T00:00:00") });
      params.push({ name: "hasta", type: sql.DateTime, value: new Date(hasta + "T23:59:59") });
    } else if (desde) {
      whereClause = "WHERE c.Fecha >= @desde";
      params.push({ name: "desde", type: sql.DateTime, value: new Date(desde + "T00:00:00") });
    } else if (hasta) {
      whereClause = "WHERE c.Fecha <= @hasta";
      params.push({ name: "hasta", type: sql.DateTime, value: new Date(hasta + "T23:59:59") });
    }

    const r = await query(
      `SELECT c.id_compra              AS id,
              c.Fecha                  AS fecha_ingreso,
              p.Nombre                 AS nombre,
              p.Descripcion            AS descripcion,
              cat.Nombre_categoria     AS categoria,
              c.Cantidad               AS cantidad,
              c.Paquetes               AS stock_paquetes,
              c.Unidades_sueltas       AS stock_unidades,
              p.Unidades_por_paquete   AS unidades_paquete,
              c.Precio_compra_paquete  AS precio_compra_paq,
              c.Precio_compra_unidad   AS precio_compra_uni,
              p.Precio_venta_paquete   AS precio_venta_paq,
              p.Precio_unitario        AS precio_unit,
              c.Precio_total           AS precio_total,
              prov.Nombre              AS proveedor,
              ISNULL(e.Nombre + ' ' + e.Apellido, '—') AS empleado_registro,
              ISNULL((SELECT SUM(i.Cantidad) FROM INVENTARIO i WHERE i.id_producto = p.id_producto), 0) AS stock_total
       FROM COMPRA c
       INNER JOIN PRODUCTO p ON c.id_producto = p.id_producto
       LEFT JOIN CATEGORIA cat ON p.id_categoria = cat.id_categoria
       LEFT JOIN PROVEEDOR prov ON c.id_proveedor = prov.id_proveedor
       LEFT JOIN EMPLEADO e ON c.id_empleado = e.id_empleado
       ${whereClause}
       ORDER BY c.Fecha DESC, p.Nombre`,
      params,
    );
    res.json(r.recordset);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   EXPORTAR EXCEL
   GET /api/exportar/excel/:tipo
   tipos: ventas | inventario | clientes | empleados | proveedores | productos
   Query params opcionales: ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  (solo para ventas)
   ============================================================ */
app.get("/api/exportar/excel/:tipo", async (req, res) => {
  try {
    const { tipo } = req.params;
    const { desde, hasta } = req.query;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Comercializadora Rosales";
    workbook.created = new Date();

    let sheet, data, filename;

    // Estilo de encabezado común
    const headerStyle = {
      font: { bold: true, color: { argb: "FFFFFFFF" } },
      fill: {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1E3A5F" },
      },
      alignment: { horizontal: "center" },
    };

    if (tipo === "ventas") {
      let sql_q = `
        SELECT f.id_factura AS ID,
               f.Fecha      AS Fecha,
               c.Nombre + ' ' + c.Apellido AS Cliente,
               e.Nombre + ' ' + e.Apellido AS Empleado,
               f.Total      AS Total
        FROM FACTURA_VENTA f
        LEFT JOIN CLIENTE  c ON f.id_cliente  = c.id_cliente
        LEFT JOIN EMPLEADO e ON f.id_empleado = e.id_empleado
      `;
      const params = [];
      if (desde) {
        sql_q += " WHERE CAST(f.Fecha AS DATE) >= @desde";
        params.push({ name: "desde", type: sql.Date, value: new Date(desde) });
      }
      if (hasta) {
        sql_q += params.length ? " AND" : " WHERE";
        sql_q += " CAST(f.Fecha AS DATE) <= @hasta";
        params.push({ name: "hasta", type: sql.Date, value: new Date(hasta) });
      }
      sql_q += " ORDER BY f.Fecha DESC";

      const r = await query(sql_q, params);
      data = r.recordset;
      filename = "ventas.xlsx";

      sheet = workbook.addWorksheet("Ventas");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Fecha", key: "Fecha", width: 20 },
        { header: "Cliente", key: "Cliente", width: 30 },
        { header: "Empleado", key: "Empleado", width: 30 },
        { header: "Total", key: "Total", width: 14 },
      ];
    } else if (tipo === "inventario") {
      const r = await query(`
        SELECT i.id_inventario    AS ID,
               p.Nombre  AS Producto,
               i.Cantidad         AS Cantidad,
               i.Paquetes         AS Paquetes,
               i.Unidades_sueltas AS Unidades_Sueltas,
               i.Estado           AS Estado,
               i.Fecha_movimiento AS Fecha
        FROM INVENTARIO i
        LEFT JOIN PRODUCTO p ON i.id_producto = p.id_producto
        ORDER BY p.Nombre
      `);
      data = r.recordset;
      filename = "inventario.xlsx";
      sheet = workbook.addWorksheet("Inventario");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Producto", key: "Producto", width: 30 },
        { header: "Cantidad", key: "Cantidad", width: 12 },
        { header: "Paquetes", key: "Paquetes", width: 12 },
        { header: "Unidades Sueltas", key: "Unidades_Sueltas", width: 16 },
        { header: "Estado", key: "Estado", width: 14 },
        { header: "Fecha", key: "Fecha", width: 20 },
      ];
    } else if (tipo === "clientes") {
      const r = await query(`
        SELECT id_cliente AS ID, Nombre, Apellido, Direccion, Telefono, Email, Estado
        FROM CLIENTE ORDER BY Nombre, Apellido
      `);
      data = r.recordset;
      filename = "clientes.xlsx";
      sheet = workbook.addWorksheet("Clientes");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Nombre", key: "Nombre", width: 20 },
        { header: "Apellido", key: "Apellido", width: 20 },
        { header: "Dirección", key: "Direccion", width: 30 },
        { header: "Teléfono", key: "Telefono", width: 16 },
        { header: "Email", key: "Email", width: 25 },
        { header: "Estado", key: "Estado", width: 12 },
      ];
    } else if (tipo === "empleados") {
      const r = await query(`
        SELECT id_empleado AS ID, Nombre, Apellido, Correo, Ruta, Estado
        FROM EMPLEADO ORDER BY Nombre, Apellido
      `);
      data = r.recordset;
      filename = "empleados.xlsx";
      sheet = workbook.addWorksheet("Empleados");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Nombre", key: "Nombre", width: 20 },
        { header: "Apellido", key: "Apellido", width: 20 },
        { header: "Correo", key: "Correo", width: 25 },
        { header: "Ruta", key: "Ruta", width: 20 },
        { header: "Estado", key: "Estado", width: 12 },
      ];
    } else if (tipo === "proveedores") {
      const r = await query(`
        SELECT id_proveedor AS ID, Nombre, Direccion, Telefono, Correo, Estado
        FROM PROVEEDOR ORDER BY Nombre
      `);
      data = r.recordset;
      filename = "proveedores.xlsx";
      sheet = workbook.addWorksheet("Proveedores");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Nombre", key: "Nombre", width: 25 },
        { header: "Dirección", key: "Direccion", width: 30 },
        { header: "Teléfono", key: "Telefono", width: 16 },
        { header: "Correo", key: "Correo", width: 25 },
        { header: "Estado", key: "Estado", width: 12 },
      ];
    } else if (tipo === "productos") {
      const r = await query(`
        SELECT p.id_producto           AS ID,
               p.Nombre       AS Nombre,
               c.Nombre_categoria      AS Categoria,
               c.Tipo                  AS Tipo_Cat,
               p.Precio_unitario       AS Precio_Unitario,
               p.Precio_mayorista        AS Precio_Mayoreo,
               p.Unidades_por_paquete  AS Unidades_Paquete,
               p.Precio_compra_paquete AS Precio_Compra_Paq,
               p.Precio_venta_paquete  AS Precio_Venta_Paq
        FROM PRODUCTO p
        LEFT JOIN CATEGORIA c ON p.id_categoria = c.id_categoria
        ORDER BY p.Nombre
      `);
      data = r.recordset;
      filename = "productos.xlsx";
      sheet = workbook.addWorksheet("Productos");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Nombre", key: "Nombre", width: 25 },
        { header: "Categoría", key: "Categoria", width: 20 },
        { header: "Tipo", key: "Tipo_Cat", width: 14 },
        { header: "Precio Unitario", key: "Precio_Unitario", width: 16 },
        { header: "Precio Mayoreo", key: "Precio_Mayoreo", width: 16 },
        { header: "Uds/Paquete", key: "Unidades_Paquete", width: 12 },
        { header: "P.Compra Paq.", key: "Precio_Compra_Paq", width: 16 },
        { header: "P.Venta Paq.", key: "Precio_Venta_Paq", width: 16 },
      ];
    } else if (tipo === "compras") {
      // Exportación de compras con filtro de fechas
      let whereClause = "";
      const params = [];
      if (desde && hasta) {
        whereClause = "WHERE c.Fecha BETWEEN @desde AND @hasta";
        params.push({ name: "desde", type: sql.DateTime, value: new Date(desde + "T00:00:00") });
        params.push({ name: "hasta", type: sql.DateTime, value: new Date(hasta + "T23:59:59") });
      } else if (desde) {
        whereClause = "WHERE c.Fecha >= @desde";
        params.push({ name: "desde", type: sql.DateTime, value: new Date(desde + "T00:00:00") });
      } else if (hasta) {
        whereClause = "WHERE c.Fecha <= @hasta";
        params.push({ name: "hasta", type: sql.DateTime, value: new Date(hasta + "T23:59:59") });
      }

      const r = await query(
        `SELECT c.id_compra              AS ID,
                CONVERT(VARCHAR, c.Fecha, 103) AS Fecha,
                p.Nombre                 AS Producto,
                p.Descripcion            AS Descripcion,
                cat.Nombre_categoria     AS Categoria,
                c.Cantidad               AS Cantidad_Total,
                c.Paquetes               AS Paq_Comprados,
                c.Unidades_sueltas       AS Uds_Sueltas,
                p.Unidades_por_paquete   AS Uds_Por_Paq,
                c.Precio_compra_paquete  AS P_Compra_Paq,
                c.Precio_compra_unidad   AS P_Compra_Uni,
                c.Precio_total           AS Total_Pagado,
                p.Precio_venta_paquete   AS P_Venta_Paq,
                p.Precio_unitario        AS P_Venta_Uni,
                prov.Nombre              AS Proveedor,
                ISNULL(e.Nombre + ' ' + e.Apellido, '—') AS Registrado_Por,
                ISNULL((SELECT SUM(i.Cantidad) FROM INVENTARIO i WHERE i.id_producto = p.id_producto), 0) AS Stock_Actual
         FROM COMPRA c
         INNER JOIN PRODUCTO p ON c.id_producto = p.id_producto
         LEFT JOIN CATEGORIA cat ON p.id_categoria = cat.id_categoria
         LEFT JOIN PROVEEDOR prov ON c.id_proveedor = prov.id_proveedor
         LEFT JOIN EMPLEADO e ON c.id_empleado = e.id_empleado
         ${whereClause}
         ORDER BY c.Fecha DESC, p.Nombre`,
        params,
      );
      data = r.recordset;
      filename = "compras.xlsx";
      sheet = workbook.addWorksheet("Compras");
      sheet.columns = [
        { header: "ID", key: "ID", width: 8 },
        { header: "Fecha", key: "Fecha", width: 14 },
        { header: "Producto", key: "Producto", width: 25 },
        { header: "Descripción", key: "Descripcion", width: 20 },
        { header: "Categoría", key: "Categoria", width: 20 },
        { header: "Cantidad Total", key: "Cantidad_Total", width: 14 },
        { header: "Paq. Comprados", key: "Paq_Comprados", width: 14 },
        { header: "Uds Sueltas", key: "Uds_Sueltas", width: 12 },
        { header: "Uds/Paq", key: "Uds_Por_Paq", width: 10 },
        { header: "P.Compra Paq", key: "P_Compra_Paq", width: 14 },
        { header: "P.Compra Uni", key: "P_Compra_Uni", width: 14 },
        { header: "Total Pagado", key: "Total_Pagado", width: 14 },
        { header: "P.Venta Paq", key: "P_Venta_Paq", width: 14 },
        { header: "P.Venta Uni", key: "P_Venta_Uni", width: 14 },
        { header: "Proveedor", key: "Proveedor", width: 25 },
        { header: "Registrado Por", key: "Registrado_Por", width: 25 },
        { header: "Stock Actual", key: "Stock_Actual", width: 12 },
      ];
    } else {
      return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
    }

    // Aplicar estilo a fila de encabezados
    sheet.getRow(1).eachCell((cell) => {
      cell.font = headerStyle.font;
      cell.fill = headerStyle.fill;
      cell.alignment = headerStyle.alignment;
    });

    sheet.addRows(data);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   EXPORTAR PDF (HTML para Ctrl+P / imprimir)
   GET /api/exportar/pdf/:tipo?desde=&hasta=
   tipos: ventas | inventario | compras | movimientos
   ============================================================ */
app.get("/api/exportar/pdf/:tipo", async (req, res) => {
  try {
    const { tipo } = req.params;
    const { desde, hasta } = req.query;
    const fechaGen = new Date().toLocaleString("es-GT");

    let titulo = "";
    let headers = [];
    let rows = [];

    if (tipo === "ventas") {
      titulo = "Reporte de Ventas";
      let sql_q = `
        SELECT f.id_factura AS id,
               CONVERT(VARCHAR, f.Fecha, 103) AS fecha,
               c.Nombre + ' ' + c.Apellido AS cliente,
               e.Nombre + ' ' + e.Apellido AS empleado,
               f.Total AS total
        FROM FACTURA_VENTA f
        LEFT JOIN CLIENTE  c ON f.id_cliente  = c.id_cliente
        LEFT JOIN EMPLEADO e ON f.id_empleado = e.id_empleado
      `;
      const params = [];
      if (desde) {
        sql_q += " WHERE CAST(f.Fecha AS DATE) >= @desde";
        params.push({ name: "desde", type: sql.Date, value: new Date(desde) });
      }
      if (hasta) {
        sql_q += params.length ? " AND" : " WHERE";
        sql_q += " CAST(f.Fecha AS DATE) <= @hasta";
        params.push({ name: "hasta", type: sql.Date, value: new Date(hasta) });
      }
      sql_q += " ORDER BY f.Fecha DESC";
      const r = await query(sql_q, params);
      headers = ["ID", "Fecha", "Cliente", "Empleado", "Total (Q)"];
      rows = r.recordset.map((x) => [
        x.id,
        x.fecha,
        x.cliente,
        x.empleado,
        Number(x.total).toFixed(2),
      ]);
    } else if (tipo === "inventario") {
      titulo = "Reporte de Inventario";
      const r = await query(`
        SELECT i.id_inventario AS id, p.Nombre AS producto,
               i.Cantidad AS cantidad, i.Paquetes AS paquetes,
               i.Unidades_sueltas AS sueltas, i.Estado AS estado,
               CONVERT(VARCHAR, i.Fecha_movimiento, 103) AS fecha
        FROM INVENTARIO i
        LEFT JOIN PRODUCTO p ON i.id_producto = p.id_producto
        ORDER BY p.Nombre
      `);
      headers = [
        "ID",
        "Producto",
        "Cantidad",
        "Paquetes",
        "Uds. Sueltas",
        "Estado",
        "Fecha",
      ];
      rows = r.recordset.map((x) => [
        x.id,
        x.producto,
        x.cantidad,
        x.paquetes,
        x.sueltas,
        x.estado,
        x.fecha,
      ]);
    } else if (tipo === "compras") {
      titulo = "Reporte de Compras / Entradas de Inventario";
      const r = await query(`
        SELECT i.id_inventario AS id,
               p.Nombre AS producto,
               i.Paquetes AS paquetes, i.Unidades_sueltas AS sueltas,
               i.Cantidad AS cantidad_total,
               pr.Nombre AS proveedor,
               CONVERT(VARCHAR, i.Fecha_movimiento, 103) AS fecha
        FROM INVENTARIO i
        LEFT JOIN PRODUCTO  p  ON i.id_producto  = p.id_producto
        LEFT JOIN PROVEEDOR pr ON p.id_proveedor = pr.id_proveedor
        WHERE i.Estado = 'Disponible'
        ORDER BY i.Fecha_movimiento DESC
      `);
      headers = [
        "ID",
        "Producto",
        "Paquetes",
        "Uds. Sueltas",
        "Total Uds.",
        "Proveedor",
        "Fecha",
      ];
      rows = r.recordset.map((x) => [
        x.id,
        x.producto,
        x.paquetes,
        x.sueltas,
        x.cantidad_total,
        x.proveedor,
        x.fecha,
      ]);
    } else if (tipo === "movimientos") {
      titulo = "Movimientos de Caja";
      const cajaRow = await query(
        `SELECT TOP 1 id_caja FROM CAJA ORDER BY fecha_apertura DESC`,
      );
      if (cajaRow.recordset.length > 0) {
        const idCaja = cajaRow.recordset[0].id_caja;
        const r = await query(
          `
          SELECT m.Tipo, m.Descripcion, m.Monto,
                 CONVERT(VARCHAR, m.Fecha, 103) AS fecha, m.Hora
          FROM MOVIMIENTO_CAJA m
          WHERE m.id_caja = @idc
          ORDER BY m.Fecha DESC, m.Hora DESC
        `,
          [{ name: "idc", type: sql.Int, value: idCaja }],
        );
        headers = ["Tipo", "Descripción", "Monto (Q)", "Fecha", "Hora"];
        rows = r.recordset.map((x) => [
          x.Tipo,
          x.Descripcion,
          Number(x.Monto).toFixed(2),
          x.fecha,
          x.Hora,
        ]);
      } else {
        headers = ["Sin datos"];
        rows = [];
      }
    } else {
      return res.status(400).json({ error: `Tipo desconocido: ${tipo}` });
    }

    // Calcular total si aplica
    let totalRow = "";
    if (tipo === "ventas") {
      const suma = rows.reduce((acc, r) => acc + parseFloat(r[4] || 0), 0);
      totalRow = `
        <tr style="font-weight:bold; background:#f0f0f0;">
          <td colspan="4" style="text-align:right; padding:6px 8px;">TOTAL:</td>
          <td style="padding:6px 8px;">Q ${suma.toFixed(2)}</td>
        </tr>`;
    }

    const tableRows = rows
      .map(
        (r) =>
          `<tr>${r.map((c) => `<td style="padding:5px 8px; border-bottom:1px solid #ddd;">${c ?? ""}</td>`).join("")}</tr>`,
      )
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${titulo} — Comercializadora Rosales</title>
  <style>
    @media print { button { display: none !important; } }
    body { font-family: Arial, sans-serif; margin: 30px; color: #222; background: #fff; }
    header { border-bottom: 3px solid #1e3a5f; padding-bottom: 12px; margin-bottom: 20px; }
    header h1 { margin: 0; font-size: 22px; color: #1e3a5f; }
    header p  { margin: 4px 0 0; font-size: 13px; color: #555; }
    h2 { font-size: 17px; color: #1e3a5f; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    thead th {
      background: #1e3a5f; color: #fff;
      padding: 8px; text-align: left;
    }
    tbody tr:nth-child(even) { background: #f7f9fb; }
    tfoot td { font-weight: bold; background: #e8ecf1; }
    .print-btn {
      margin-bottom: 16px;
      padding: 8px 18px;
      background: #1e3a5f; color: #fff;
      border: none; border-radius: 4px;
      cursor: pointer; font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <h1>Comercializadora Rosales S.A.</h1>
    <p>Generado el: ${fechaGen}</p>
  </header>
  <button class="print-btn" onclick="window.print()">&#128438; Imprimir / Guardar PDF</button>
  <h2>${titulo}</h2>
  <table>
    <thead>
      <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
    ${totalRow ? `<tfoot>${totalRow}</tfoot>` : ""}
  </table>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(html);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/* ============================================================
   REPORTES DE GANANCIAS
   ============================================================ */

// Reporte de ganancias diarias
app.get("/api/reportes/ganancias/diarias", async (req, res) => {
  try {
    const { fecha } = req.query;
    const fechaConsulta = fecha ? new Date(fecha) : new Date();
    
    // Ventas del día
    const ventas = await query(
      `SELECT ISNULL(SUM(Total), 0) AS total_ventas
       FROM FACTURA_VENTA
       WHERE CAST(Fecha AS DATE) = CAST(@fecha AS DATE)`,
      [{ name: "fecha", type: sql.DateTime, value: fechaConsulta }]
    );
    
    // Compras del día
    const compras = await query(
      `SELECT ISNULL(SUM(Precio_total), 0) AS total_compras
       FROM COMPRA
       WHERE CAST(Fecha AS DATE) = CAST(@fecha AS DATE)`,
      [{ name: "fecha", type: sql.DateTime, value: fechaConsulta }]
    );
    
    const totalVentas = parseFloat(ventas.recordset[0]?.total_ventas || 0);
    const totalCompras = parseFloat(compras.recordset[0]?.total_compras || 0);
    const gananciaNeta = totalVentas - totalCompras;
    
    // Cajas del día
    const cajas = await query(
      `SELECT monto_inicial, monto_final, hora_apertura, hora_cierre, Estado
       FROM CAJA
       WHERE CAST(fecha_apertura AS DATE) = CAST(@fecha AS DATE)`,
      [{ name: "fecha", type: sql.DateTime, value: fechaConsulta }]
    );
    
    let cajaAbierta = 0;
    let cajaCerrada = 0;
    
    if (cajas.recordset.length > 0) {
      cajaAbierta = parseFloat(cajas.recordset[0].monto_inicial || 0);
      cajaCerrada = parseFloat(cajas.recordset[0].monto_final || 0);
    }
    
    res.json({
      fecha: fechaConsulta,
      caja_abierta: cajaAbierta,
      caja_cerrada: cajaCerrada,
      cajas: cajas.recordset,
      total_ventas: totalVentas,
      total_compras: totalCompras,
      ganancia_neta: gananciaNeta
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reporte de ganancias semanales
app.get("/api/reportes/ganancias/semanales", async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    const inicio = fecha_inicio ? new Date(fecha_inicio) : new Date();
    const fin = fecha_fin ? new Date(fecha_fin) : new Date();
    
    const ventas = await query(
      `SELECT ISNULL(SUM(Total), 0) AS total_ventas
       FROM FACTURA_VENTA
       WHERE Fecha BETWEEN @inicio AND @fin`,
      [
        { name: "inicio", type: sql.DateTime, value: inicio },
        { name: "fin", type: sql.DateTime, value: fin }
      ]
    );
    
    const compras = await query(
      `SELECT ISNULL(SUM(Precio_total), 0) AS total_compras
       FROM COMPRA
       WHERE Fecha BETWEEN @inicio AND @fin`,
      [
        { name: "inicio", type: sql.DateTime, value: inicio },
        { name: "fin", type: sql.DateTime, value: fin }
      ]
    );
    
    const totalVentas = parseFloat(ventas.recordset[0]?.total_ventas || 0);
    const totalCompras = parseFloat(compras.recordset[0]?.total_compras || 0);
    
    res.json({
      fecha_inicio: inicio,
      fecha_fin: fin,
      total_ventas: totalVentas,
      total_compras: totalCompras,
      ganancia_neta: totalVentas - totalCompras
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Reporte de ganancias mensuales
app.get("/api/reportes/ganancias/mensuales", async (req, res) => {
  try {
    const { mes, anio } = req.query;
    const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
    const anioActual = anio ? parseInt(anio) : new Date().getFullYear();
    
    const ventas = await query(
      `SELECT ISNULL(SUM(Total), 0) AS total_ventas
       FROM FACTURA_VENTA
       WHERE MONTH(Fecha) = @mes AND YEAR(Fecha) = @anio`,
      [
        { name: "mes", type: sql.Int, value: mesActual },
        { name: "anio", type: sql.Int, value: anioActual }
      ]
    );
    
    const compras = await query(
      `SELECT ISNULL(SUM(Precio_total), 0) AS total_compras
       FROM COMPRA
       WHERE MONTH(Fecha) = @mes AND YEAR(Fecha) = @anio`,
      [
        { name: "mes", type: sql.Int, value: mesActual },
        { name: "anio", type: sql.Int, value: anioActual }
      ]
    );
    
    const totalVentas = parseFloat(ventas.recordset[0]?.total_ventas || 0);
    const totalCompras = parseFloat(compras.recordset[0]?.total_compras || 0);
    
    res.json({
      mes: mesActual,
      anio: anioActual,
      total_ventas: totalVentas,
      total_compras: totalCompras,
      ganancia_neta: totalVentas - totalCompras
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});



/* ============================================================
   START
   ============================================================ */
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
