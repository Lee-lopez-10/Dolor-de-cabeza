# GUÍA DE MIGRACIÓN: SQL SERVER → POSTGRESQL

## Cambios de Sintaxis Necesarios

### 1. **TOP n → LIMIT n**
```sql
-- SQL Server
SELECT TOP 10 * FROM tabla

-- PostgreSQL
SELECT * FROM tabla LIMIT 10
```

### 2. **OUTPUT INSERTED.* → RETURNING ***
```sql
-- SQL Server
INSERT INTO tabla (columna) 
OUTPUT INSERTED.id, INSERTED.nombre
VALUES ('valor')

-- PostgreSQL
INSERT INTO tabla (columna) 
VALUES ('valor')
RETURNING id, nombre
```

### 3. **GETDATE() → NOW() o CURRENT_TIMESTAMP**
```sql
-- SQL Server
INSERT INTO tabla (fecha) VALUES (GETDATE())

-- PostgreSQL
INSERT INTO tabla (fecha) VALUES (NOW())
-- o
INSERT INTO tabla (fecha) VALUES (CURRENT_TIMESTAMP)
```

### 4. **Concatenación de Strings: + → ||**
```sql
-- SQL Server
SELECT Nombre + ' ' + Apellido FROM tabla

-- PostgreSQL
SELECT Nombre || ' ' || Apellido FROM tabla
-- o
SELECT CONCAT(Nombre, ' ', Apellido) FROM tabla
```

### 5. **CONVERT → TO_CHAR / CAST**
```sql
-- SQL Server
CONVERT(VARCHAR, fecha, 103)

-- PostgreSQL
TO_CHAR(fecha, 'DD/MM/YYYY')
```

### 6. **Parámetros: @nombre → $1, $2, $3...**
```sql
-- SQL Server con mssql
WHERE id = @id AND nombre = @nombre

-- PostgreSQL con pg
WHERE id = $1 AND nombre = $2
```

### 7. **IDENTITY → SERIAL o GENERATED**
```sql
-- SQL Server
CREATE TABLE tabla (
  id INT IDENTITY(1,1) PRIMARY KEY
)

-- PostgreSQL
CREATE TABLE tabla (
  id SERIAL PRIMARY KEY
)
-- o más moderno
CREATE TABLE tabla (
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY
)
```
