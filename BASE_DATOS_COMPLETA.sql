-- ============================================================
-- BASE DE DATOS COMPLETA - COMERCIALIZADORA ROSALES S.A.
-- Sistema de Gestión Integral v2.0
-- ============================================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'ComercializadoraRosales')
BEGIN
    CREATE DATABASE ComercializadoraRosales;
    PRINT '✅ Base de datos ComercializadoraRosales creada';
END
ELSE
BEGIN
    PRINT '✅ Base de datos ComercializadoraRosales ya existe';
END
GO

USE ComercializadoraRosales;
GO

-- ============================================================
-- TABLA: CATEGORIA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CATEGORIA')
BEGIN
    CREATE TABLE CATEGORIA (
        id_categoria INT IDENTITY(1,1) PRIMARY KEY,
        Nombre_categoria NVARCHAR(100) NOT NULL,
        Tipo NVARCHAR(50) NOT NULL,
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla CATEGORIA creada';
END
GO

-- ============================================================
-- TABLA: PROVEEDOR
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PROVEEDOR')
BEGIN
    CREATE TABLE PROVEEDOR (
        id_proveedor INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(150) NOT NULL,
        Direccion NVARCHAR(250),
        Telefono NVARCHAR(20),
        Correo NVARCHAR(100),
        Estado NVARCHAR(20) DEFAULT 'Activo',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla PROVEEDOR creada';
END
GO

-- ============================================================
-- TABLA: EMPLEADO
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'EMPLEADO')
BEGIN
    CREATE TABLE EMPLEADO (
        id_empleado INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Apellido NVARCHAR(100) NOT NULL,
        Correo NVARCHAR(100),
        Ruta NVARCHAR(150),
        Estado NVARCHAR(20) DEFAULT 'Activo',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla EMPLEADO creada';
END
GO

-- ============================================================
-- TABLA: CLIENTE
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CLIENTE')
BEGIN
    CREATE TABLE CLIENTE (
        id_cliente INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Apellido NVARCHAR(100) NOT NULL,
        Direccion NVARCHAR(250),
        Telefono NVARCHAR(20),
        Email NVARCHAR(100),
        Estado NVARCHAR(20) DEFAULT 'Activo',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE()
    );
    PRINT '✅ Tabla CLIENTE creada';
END
GO

-- ============================================================
-- TABLA: PRODUCTO
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PRODUCTO')
BEGIN
    CREATE TABLE PRODUCTO (
        id_producto INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(150) NOT NULL,
        Descripcion NVARCHAR(500),
        Precio_unitario DECIMAL(10,2) NOT NULL,
        Precio_mayorista DECIMAL(10,2),
        id_categoria INT NOT NULL,
        id_proveedor INT NOT NULL,
        Paquetes INT DEFAULT 0,
        Unidades_por_paquete INT DEFAULT 1,
        Precio_compra_paquete DECIMAL(10,2) DEFAULT 0,
        Precio_compra_unidad DECIMAL(10,2) DEFAULT 0,
        Precio_venta_paquete DECIMAL(10,2) DEFAULT 0,
        id_empleado_registro INT NULL,
        fecha_ingreso DATE DEFAULT GETDATE(),
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_actualizacion DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (id_categoria) REFERENCES CATEGORIA(id_categoria),
        FOREIGN KEY (id_proveedor) REFERENCES PROVEEDOR(id_proveedor),
        FOREIGN KEY (id_empleado_registro) REFERENCES EMPLEADO(id_empleado)
    );
    PRINT '✅ Tabla PRODUCTO creada';
END
GO

-- ============================================================
-- TABLA: INVENTARIO
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'INVENTARIO')
BEGIN
    CREATE TABLE INVENTARIO (
        id_inventario INT IDENTITY(1,1) PRIMARY KEY,
        id_producto INT NOT NULL,
        Cantidad INT NOT NULL DEFAULT 0,
        Paquetes INT NOT NULL DEFAULT 0,
        Unidades_sueltas INT NOT NULL DEFAULT 0,
        Estado NVARCHAR(20) DEFAULT 'Disponible',
        Fecha_movimiento DATE DEFAULT GETDATE(),
        FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto)
    );
    PRINT '✅ Tabla INVENTARIO creada';
END
GO

-- ============================================================
-- TABLA: COMPRA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'COMPRA')
BEGIN
    CREATE TABLE COMPRA (
        id_compra INT IDENTITY(1,1) PRIMARY KEY,
        id_producto INT NOT NULL,
        Cantidad INT NOT NULL,
        Paquetes INT NOT NULL DEFAULT 0,
        Unidades_sueltas INT NOT NULL DEFAULT 0,
        Precio_compra_paquete DECIMAL(10,2) NOT NULL DEFAULT 0,
        Precio_compra_unidad DECIMAL(10,2) NOT NULL DEFAULT 0,
        Precio_total DECIMAL(10,2) NOT NULL DEFAULT 0,
        id_proveedor INT NULL,
        id_empleado INT NULL,
        Fecha DATETIME NOT NULL DEFAULT GETDATE(),
        FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto),
        FOREIGN KEY (id_proveedor) REFERENCES PROVEEDOR(id_proveedor),
        FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
    );
    PRINT '✅ Tabla COMPRA creada';
END
ELSE
BEGIN
    -- Agregar columnas faltantes si la tabla ya existe
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('COMPRA') AND name = 'Paquetes')
    BEGIN
        ALTER TABLE COMPRA ADD Paquetes INT NOT NULL DEFAULT 0;
        PRINT '  ✅ Columna Paquetes agregada a COMPRA';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('COMPRA') AND name = 'Unidades_sueltas')
    BEGIN
        ALTER TABLE COMPRA ADD Unidades_sueltas INT NOT NULL DEFAULT 0;
        PRINT '  ✅ Columna Unidades_sueltas agregada a COMPRA';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('COMPRA') AND name = 'Precio_compra_paquete')
    BEGIN
        ALTER TABLE COMPRA ADD Precio_compra_paquete DECIMAL(10,2) NOT NULL DEFAULT 0;
        PRINT '  ✅ Columna Precio_compra_paquete agregada a COMPRA';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('COMPRA') AND name = 'Precio_compra_unidad')
    BEGIN
        ALTER TABLE COMPRA ADD Precio_compra_unidad DECIMAL(10,2) NOT NULL DEFAULT 0;
        PRINT '  ✅ Columna Precio_compra_unidad agregada a COMPRA';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('COMPRA') AND name = 'id_proveedor')
    BEGIN
        ALTER TABLE COMPRA ADD id_proveedor INT NULL;
        PRINT '  ✅ Columna id_proveedor agregada a COMPRA';
    END
END
GO

-- ============================================================
-- TABLA: PRODUCTO_DEFECTUOSO
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PRODUCTO_DEFECTUOSO')
BEGIN
    CREATE TABLE PRODUCTO_DEFECTUOSO (
        id_defectuoso INT IDENTITY(1,1) PRIMARY KEY,
        id_inventario INT NOT NULL,
        id_producto INT NOT NULL,
        Cantidad INT NOT NULL,
        Fecha DATETIME DEFAULT GETDATE(),
        Descripcion NVARCHAR(500),
        FOREIGN KEY (id_inventario) REFERENCES INVENTARIO(id_inventario),
        FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto)
    );
    PRINT '✅ Tabla PRODUCTO_DEFECTUOSO creada';
END
GO

-- ============================================================
-- TABLA: FACTURA_VENTA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FACTURA_VENTA')
BEGIN
    CREATE TABLE FACTURA_VENTA (
        id_factura INT IDENTITY(1,1) PRIMARY KEY,
        id_cliente INT NOT NULL,
        id_empleado INT NOT NULL,
        Fecha DATETIME DEFAULT GETDATE(),
        Total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (id_cliente) REFERENCES CLIENTE(id_cliente),
        FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
    );
    PRINT '✅ Tabla FACTURA_VENTA creada';
END
GO

-- ============================================================
-- TABLA: DETALLE_VENTA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'DETALLE_VENTA')
BEGIN
    CREATE TABLE DETALLE_VENTA (
        id_detalle INT IDENTITY(1,1) PRIMARY KEY,
        id_factura INT NOT NULL,
        id_producto INT NOT NULL,
        Cantidad INT NOT NULL,
        Precio_unitario DECIMAL(10,2) NOT NULL,
        Total DECIMAL(10,2) NOT NULL,
        FOREIGN KEY (id_factura) REFERENCES FACTURA_VENTA(id_factura),
        FOREIGN KEY (id_producto) REFERENCES PRODUCTO(id_producto)
    );
    PRINT '✅ Tabla DETALLE_VENTA creada';
END
GO

-- ============================================================
-- TABLA: CAJA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CAJA')
BEGIN
    CREATE TABLE CAJA (
        id_caja INT IDENTITY(1,1) PRIMARY KEY,
        id_empleado INT NOT NULL,
        fecha_apertura DATETIME DEFAULT GETDATE(),
        hora_apertura NVARCHAR(10),
        monto_inicial DECIMAL(10,2) NOT NULL,
        fecha_cierre DATETIME NULL,
        hora_cierre NVARCHAR(10) NULL,
        total_ventas DECIMAL(10,2) DEFAULT 0,
        total_ingresos DECIMAL(10,2) DEFAULT 0,
        total_egresos DECIMAL(10,2) DEFAULT 0,
        monto_final DECIMAL(10,2) DEFAULT 0,
        ganancia DECIMAL(10,2) DEFAULT 0,
        Estado NVARCHAR(20) DEFAULT 'Abierta',
        FOREIGN KEY (id_empleado) REFERENCES EMPLEADO(id_empleado)
    );
    PRINT '✅ Tabla CAJA creada';
END
GO

-- ============================================================
-- TABLA: MOVIMIENTO_CAJA
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MOVIMIENTO_CAJA')
BEGIN
    CREATE TABLE MOVIMIENTO_CAJA (
        id_movimiento INT IDENTITY(1,1) PRIMARY KEY,
        id_caja INT NOT NULL,
        Tipo NVARCHAR(20) NOT NULL,
        Descripcion NVARCHAR(500),
        Monto DECIMAL(10,2) NOT NULL,
        Fecha DATETIME DEFAULT GETDATE(),
        Hora NVARCHAR(10),
        FOREIGN KEY (id_caja) REFERENCES CAJA(id_caja)
    );
    PRINT '✅ Tabla MOVIMIENTO_CAJA creada';
END
GO

-- ============================================================
-- DATOS INICIALES - CATEGORÍAS
-- ============================================================
IF NOT EXISTS (SELECT * FROM CATEGORIA)
BEGIN
    INSERT INTO CATEGORIA (Nombre_categoria, Tipo) VALUES
    ('Productos de Limpieza', 'Limpieza'),
    ('Productos Desechables', 'Desechable');
    PRINT '✅ Categorías iniciales insertadas';
END
GO

-- ============================================================
-- DATOS INICIALES - PROVEEDORES
-- ============================================================
IF NOT EXISTS (SELECT * FROM PROVEEDOR)
BEGIN
    INSERT INTO PROVEEDOR (Nombre, Direccion, Telefono, Correo, Estado) VALUES
    ('QuimicaLimpia S.A.', 'Parque Industrial Quito, Bodega 12', '0991100001', 'ventas@quimicalimpia.ec', 'Activo'),
    ('Distribuidora Nacional', 'Av. Américas 456, Guayaquil', '0991100002', 'info@distnacional.ec', 'Activo'),
    ('Suministros del Pacífico', 'Calle Principal 789, Cuenca', '0991100003', 'contacto@sumipacifico.ec', 'Activo'),
    ('Importadora Global', 'Zona Franca, Loja', '0991100004', 'ventas@impglobal.ec', 'Activo'),
    ('Comercial Andina', 'Av. Colón 321, Quito', '0991100005', 'info@comandina.ec', 'Activo');
    PRINT '✅ Proveedores iniciales insertados';
END
GO

-- ============================================================
-- DATOS INICIALES - EMPLEADOS
-- ============================================================
IF NOT EXISTS (SELECT * FROM EMPLEADO)
BEGIN
    INSERT INTO EMPLEADO (Nombre, Apellido, Correo, Ruta, Estado) VALUES
    ('Roberto', 'Lara', 'roberto.lara@rosales.ec', 'Ruta Norte Quito', 'Activo'),
    ('Patricia', 'Nunez', 'patricia.nunez@rosales.ec', 'Ruta Sur Quito', 'Activo'),
    ('Eduardo', 'Salcedo', 'eduardo.salcedo@rosales.ec', 'Ruta Centro Quito', 'Activo'),
    ('Monica', 'Quispe', 'monica.quispe@rosales.ec', 'Ruta Valles', 'Activo'),
    ('Felipe', 'Beltran', 'felipe.beltran@rosales.ec', 'Ruta Guayaquil Norte', 'Activo');
    PRINT '✅ Empleados iniciales insertados';
END
GO

-- ============================================================
-- DATOS INICIALES - CLIENTES
-- ============================================================
IF NOT EXISTS (SELECT * FROM CLIENTE)
BEGIN
    INSERT INTO CLIENTE (Nombre, Apellido, Direccion, Telefono, Email, Estado) VALUES
    ('Carlos', 'Mendoza', 'Av. Republica 120, Quito', '0991001001', 'carlos.mendoza@gmail.com', 'Activo'),
    ('Maria', 'Suarez', 'Calle Bolivar 45, Guayaquil', '0992002002', 'maria.suarez@hotmail.com', 'Activo'),
    ('Pedro', 'Jimenez', 'Av. Colon 789, Cuenca', '0993003003', 'pedro.jimenez@yahoo.com', 'Activo'),
    ('Ana', 'Torres', 'Calle Eloy Alfaro 23, Loja', '0994004004', 'ana.torres@gmail.com', 'Activo');
    PRINT '✅ Clientes iniciales insertados';
END
GO

-- ============================================================
-- VERIFICACIÓN FINAL
-- ============================================================
PRINT '';
PRINT '========================================';
PRINT '✅ BASE DE DATOS COMPLETA CONFIGURADA';
PRINT '========================================';
PRINT 'Base de datos: ComercializadoraRosales';
PRINT 'Tablas creadas: 12';
PRINT '- CATEGORIA';
PRINT '- PROVEEDOR';
PRINT '- EMPLEADO';
PRINT '- CLIENTE';
PRINT '- PRODUCTO';
PRINT '- INVENTARIO';
PRINT '- COMPRA';
PRINT '- PRODUCTO_DEFECTUOSO';
PRINT '- FACTURA_VENTA';
PRINT '- DETALLE_VENTA';
PRINT '- CAJA';
PRINT '- MOVIMIENTO_CAJA';
PRINT '';
PRINT '✅ Sistema listo para usar';
PRINT '========================================';
GO
