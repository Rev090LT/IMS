// IMS/server/src/utils/service-importer.js
import xlsx from 'xlsx';
import pool from '../config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Импортирует услуги из Excel файла 1С: Альфа-Авто
 */
export async function importServicesFromExcel(filePath) {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // Находим заголовок (строка с "Код", "Наименование", etc.)
    let headerIndex = 0;
    for (let i = 0; i < Math.min(10, data.length); i++) {
      if (data[i]?.some(cell => String(cell).toLowerCase().includes('код') || String(cell).toLowerCase().includes('наименование'))) {
        headerIndex = i;
        break;
      }
    }
    
    const headers = data[headerIndex]?.map(h => String(h || '').trim().toLowerCase()) || [];
    
    // Маппинг колонок
    const colIndex = {
      code: headers.findIndex(h => h.includes('код')),
      name: headers.findIndex(h => h.includes('наименование') && !h.includes('полное')),
      fullName: headers.findIndex(h => h.includes('полное')),
      parent: headers.findIndex(h => h.includes('родитель')),
      isGroup: headers.findIndex(h => h.includes('группа') || h.includes('это группа')),
      laborHours: headers.findIndex(h => h.includes('время') || h.includes('час')),
      comment: headers.findIndex(h => h.includes('комментарий')),
      additional: headers.findIndex(h => h.includes('дополнительное'))
    };
    
    const services = [];
    let imported = 0;
    let skipped = 0;
    let updated = 0;
    
    // Парсим строки
    for (let i = headerIndex + 1; i < data.length; i++) {
      const row = data[i];
      if (!row || !row.some(cell => cell)) continue;
      
      const code = colIndex.code >= 0 ? String(row[colIndex.code] || '').trim() : null;
      const name = colIndex.name >= 0 ? String(row[colIndex.name] || '').trim() : null;
      
      if (!name || name.length < 3) {
        skipped++;
        continue;
      }
      
      // Определяем категорию из parent или name
      let category = 'Прочее';
      if (colIndex.parent >= 0 && row[colIndex.parent]) {
        const parent = String(row[colIndex.parent]).trim();
        if (parent && parent !== 'Нет' && parent.length > 0) {
          category = parent;
        }
      }
      
      // Парсим нормо-часы
      let laborHours = 0;
      if (colIndex.laborHours >= 0 && row[colIndex.laborHours]) {
        const hours = parseFloat(String(row[colIndex.laborHours]).replace(',', '.'));
        if (!isNaN(hours)) {
          laborHours = hours;
        }
      }
      
      // Определяем является ли группой
      const isGroup = colIndex.isGroup >= 0 && 
        String(row[colIndex.isGroup] || '').toLowerCase().includes('да');
      
      // Пропускаем группы (категории)
      if (isGroup) {
        skipped++;
        continue;
      }
      
      // Рассчитываем цену (нормо-час × 2500₽)
      const basePrice = laborHours > 0 ? Math.round(laborHours * 2500) : 0;
      
      services.push({
        service_code: code,
        name,
        full_name: colIndex.fullName >= 0 ? String(row[colIndex.fullName] || '').trim() : name,
        category,
        labor_hours: laborHours,
        base_price: basePrice,
        comment: colIndex.comment >= 0 ? String(row[colIndex.comment] || '').trim() : null,
        additional: colIndex.additional >= 0 ? String(row[colIndex.additional] || '').trim() : null,
        is_active: true
      });
      
      imported++;
    }
    
    // Массовая вставка в БД
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      for (const service of services) {
        const existing = await client.query(
          'SELECT id FROM services WHERE service_code = $1',
          [service.service_code]
        );
        
        if (existing.rows.length > 0) {
          // Обновляем существующую
          await client.query(
            `UPDATE services SET
              name = $1, full_name = $2, category = $3,
              labor_hours = $4, base_price = $5,
              comment = $6, additional = $7,
              is_active = $8, updated_at = NOW()
            WHERE service_code = $9`,
            [service.name, service.full_name, service.category,
             service.labor_hours, service.base_price,
             service.comment, service.additional,
             service.is_active, service.service_code]
          );
          updated++;
        } else {
          // Вставляем новую
          await client.query(
            `INSERT INTO services 
             (service_code, name, full_name, category,
              labor_hours, base_price, comment, additional,
              is_active, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
            [service.service_code, service.name, service.full_name, service.category,
             service.labor_hours, service.base_price, service.comment, service.additional,
             service.is_active]
          );
        }
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        imported: services.length,
        updated,
        skipped,
        total: imported
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Error importing services:', error);
    throw new Error('Ошибка импорта услуг: ' + error.message);
  }
}

/**
 * Получает статистику по услугам
 */
export async function getServiceStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_services,
      COUNT(*) FILTER (WHERE is_active = TRUE) as active_services,
      COUNT(DISTINCT category) as categories_count,
      AVG(labor_hours) as avg_labor_hours,
      SUM(base_price) FILTER (WHERE is_active = TRUE) as total_price
    FROM services
  `);
  
  return result.rows[0];
}