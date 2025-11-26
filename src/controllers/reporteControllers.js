const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapeo simple de número de mes a nombre (para reportes)
const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

// -----------------------------------------------------------
// REPORTE 1: Total de préstamos activos y su valor total
// -----------------------------------------------------------
exports.getStatsResumen = async (req, res) => {
    try {
        const { usuario_id } = req.query;
        const whereClause = usuario_id ? { estado: 'ACTIVO', empeno: { usuario_id: parseInt(usuario_id) } } : { estado: 'ACTIVO' };

        // Total de préstamos ACTIVO
        const totalPrestamosActivos = await prisma.prestamo.count({
            where: whereClause
        });

        // Suma del valor de los préstamos ACTIVO
        const valorTotalActivo = await prisma.prestamo.aggregate({
            _sum: { valor: true },
            where: whereClause
        });

        res.status(200).json({
            totalPrestamosActivos: totalPrestamosActivos,
            valorTotalActivo: valorTotalActivo._sum.valor || 0,
        });
    } catch (error) {
        console.error('Error al obtener estadísticas de resumen:', error);
        res.status(500).json({ error: 'Fallo al generar el reporte de resumen.' });
    }
};

// -----------------------------------------------------------
// REPORTE 2: Ingresos por Intereses Mensuales
// -----------------------------------------------------------
exports.getInteresesMensuales = async (req, res) => {
    try {
        const { mes, anio, usuario_id } = req.query;

        let whereClause = { estado: 'PAGADO' };

        if (mes && anio) {
            const startDate = new Date(parseInt(anio), parseInt(mes) - 1, 1);
            const endDate = new Date(parseInt(anio), parseInt(mes), 1);
            whereClause.fecha_interes = { gte: startDate, lt: endDate };
        } else if (anio) {
            const startDate = new Date(parseInt(anio), 0, 1);
            const endDate = new Date(parseInt(anio) + 1, 0, 1);
            whereClause.fecha_interes = { gte: startDate, lt: endDate };
        } else {
            // Default: último año
            const unAñoAtras = new Date();
            unAñoAtras.setFullYear(unAñoAtras.getFullYear() - 1);
            whereClause.fecha_interes = { gte: unAñoAtras };
        }

        if (usuario_id) {
            whereClause.prestamo = { empeno: { usuario_id: parseInt(usuario_id) } };
        }

        // Obtener intereses PAGADOS con filtros
        const interesesPagados = await prisma.interes.findMany({
            where: whereClause,
            select: {
                valor: true,
                fecha_interes: true,
            }
        });

        // Agrupar y sumar por mes (lógica en JS)
        const resumenMensual = interesesPagados.reduce((acc, interes) => {
            const fecha = interes.fecha_interes;
            const mes = fecha.getMonth(); // 0 (Enero) - 11 (Diciembre)
            const anio = fecha.getFullYear();
            const clave = `${anio}-${mes}`;

            if (!acc[clave]) {
                acc[clave] = { mes: monthNames[mes], anio: anio, valor: 0 };
            }
            acc[clave].valor += parseFloat(interes.valor);
            return acc;
        }, {});

        // Convertir a array y ordenar por año/mes
        const resultado = Object.values(resumenMensual).sort((a, b) => {
            if (a.anio !== b.anio) return a.anio - b.anio;
            return monthNames.indexOf(a.mes) - monthNames.indexOf(b.mes);
        });
        
        res.status(200).json(resultado);
    } catch (error) {
        console.error('Error al obtener reporte de intereses mensuales:', error);
        res.status(500).json({ error: 'Fallo al generar el reporte de intereses.' });
    }
};

// -----------------------------------------------------------
// REPORTE 3: Cantidad de empeños por tipo de artículo
// -----------------------------------------------------------
exports.getEmpenosPorTipoArticulo = async (req, res) => {
    try {
        // Obtener artículos con sus tipos
        const articulos = await prisma.articulo.findMany({
            include: {
                tipo_articulo: { select: { nombre: true } }
            }
        });

        // Agrupar por nombre del tipo
        const grouped = articulos.reduce((acc, art) => {
            const tipoNombre = art.tipo_articulo?.nombre || 'Sin tipo';
            if (!acc[tipoNombre]) acc[tipoNombre] = 0;
            acc[tipoNombre]++;
            return acc;
        }, {});

        // Formatear la salida para Recharts (name, value)
        const data = Object.entries(grouped).map(([name, value]) => ({
            name,
            value,
        })).sort((a, b) => b.value - a.value);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener reporte de tipos de artículo:', error);
        res.status(500).json({ error: 'Fallo al generar el reporte de artículos.' });
    }
};

// -----------------------------------------------------------
// REPORTE 4: Historial de empeños por usuario (Listado)
// -----------------------------------------------------------
exports.getHistorialEmpenos = async (req, res) => {
    const { usuarioId, mes, anio } = req.query; // Filtros por usuario, mes, año

    let whereClause = {};
    if (usuarioId) {
        whereClause.usuario_id = parseInt(usuarioId);
    }
    if (mes && anio) {
        const startDate = new Date(parseInt(anio), parseInt(mes) - 1, 1);
        const endDate = new Date(parseInt(anio), parseInt(mes), 1);
        whereClause.fecha_empeno = { gte: startDate, lt: endDate };
    } else if (anio) {
        const startDate = new Date(parseInt(anio), 0, 1);
        const endDate = new Date(parseInt(anio) + 1, 0, 1);
        whereClause.fecha_empeno = { gte: startDate, lt: endDate };
    }

    try {
        const historial = await prisma.empeno.findMany({
            where: whereClause,
            include: {
                usuario: { select: { nombres: true, identificacion: true } },
                prestamos: { select: { valor: true, estado: true } },
                articulos: {
                    include: { tipo_articulo: { select: { nombre: true } } }
                }
            },
            orderBy: { fecha_empeno: 'desc' }
        });

        // Formatear los artículos para una mejor visualización en la tabla
        const data = historial.map(e => ({
            ...e,
            nombre_cliente: e.usuario.nombres,
            identificacion_cliente: e.usuario.identificacion,
            valor_prestamo: e.prestamos[0]?.valor || 0,
            estado_prestamo: e.prestamos[0]?.estado || 'N/A',
            articulos_resumen: e.articulos.map(a => `${a.tipo_articulo?.nombre || 'Sin tipo'} - ${a.descripcion}`).join('; '),
            fecha_empeno_formato: e.fecha_empeno.toISOString().split('T')[0],
        }));

        res.status(200).json(data);
    } catch (error) {
        console.error('Error al obtener historial de empeños:', error);
        res.status(500).json({ error: 'Fallo al generar el historial de empeños.' });
    }
};