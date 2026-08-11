// IMS/server/utils/service-importer.js
import XLSX from 'xlsx';
import pool from '../config/db.js';

/**
 * Импорт услуг из Excel (1С: Альфа-Авто)
 * @param {string} filePath - Путь к файлу
 * @param {Object} options - Опции импорта
 * @returns {Promise<Object>} Детальный результат
 */
export async function importServicesFromExcel(filePath, options = {}) {
  const {
    importGroups = false,        // Импортить ли группы как категории
    updatePrices = false,        // Обновлять ли цены при повторном импорте
    dryRun = false,              // Только предпросмотр, без записи в БД
    batchSize = 100              // Пакетная обработка для больших файлов
  } = options;

  try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: '' });
    
    if (!rawData || rawData.length < 2) {
      throw new Error('Файл пуст или не содержит данных');
    }

    // 🔍 Парсим заголовки и показываем их в логах
    const headers = rawData[0].map(h => String(h).trim());
    console.log('📋 Заголовки в файле:', headers);

    // 🔍 Гибкий маппинг колонок (поддерживаем множественные варианты названий)
    const colMap = {
      code: findColumn(headers, ['Код', 'code', 'Service_Code', 'Артикул', 'Код услуги', '№']),
      name: findColumn(headers, ['Наименование', 'name', 'Name', 'Услуга', 'Работа', 'Название']),
      parent: findColumn(headers, ['Родитель', 'Родительская', 'category', 'Category', 'Группа', 'Категория']),
      isGroup: findColumn(headers, ['Это группа', 'ЭтоГруппа', 'is_group', 'IsGroup', 'Тип', 'Вид']),
      fullName: findColumn(headers, ['Наименование полное', 'Полное наименование', 'full_name', 'FullName', 'Описание', 'Детали']),
      laborHours: findColumn(headers, ['Время выполнения', 'Время', 'Нормо-часы', 'Нормочасы', 'labor_hours', 'LaborHours', 'Часы', 'Длительность']),
      basePrice: findColumn(headers, ['Цена', 'Base_Price', 'BasePrice', 'Стоимость', 'Тариф', 'Цена базовая', 'Стоимость базовая']),
      comment: findColumn(headers, ['Комментарий', 'Comment', 'Примечание', 'Заметка']),
      additional: findColumn(headers, ['Дополнительно', 'Additional', 'Доп', 'Доп. инфо'])
    };

    // 🔍 Проверка обязательных колонок
    const requiredMissing = [];
    if (colMap.name === -1) requiredMissing.push('Наименование');
    
    if (requiredMissing.length > 0) {
      throw new Error(`Не найдены обязательные колонки: ${requiredMissing.join(', ')}. 
        Доступные заголовки: ${headers.slice(0, 10).join(', ')}${headers.length > 10 ? '...' : ''}`);
    }

    const results = {
      imported: 0,
      updated: 0,
      skipped: 0,
      groups: 0,
      errors: [],
      preview: [],  // 🔍 Первые 10 обработанных строк для отладки
      totalRows: rawData.length - 1
    };

    let processed = 0;

    // 🔍 Обрабатываем строки с прогрессом
    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Пропускаем полностью пустые строки
      if (!row || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
        continue;
      }

      processed++;
      
      try {
        // 🔍 Извлекаем значения с безопасным доступом
        const code = colMap.code >= 0 ? safeString(row[colMap.code]) : null;
        const name = colMap.name >= 0 ? safeString(row[colMap.name]) : null;
        const parent = colMap.parent >= 0 ? safeString(row[colMap.parent]) : null;
        const isGroupRaw = colMap.isGroup >= 0 ? row[colMap.isGroup] : null;
        const isGroup = isGroupToString(isGroupRaw);
        const fullName = colMap.fullName >= 0 ? safeString(row[colMap.fullName]) : null;
        const laborHours = parseLaborHours(colMap.laborHours >= 0 ? row[colMap.laborHours] : null);
        const basePrice = parsePrice(colMap.basePrice >= 0 ? row[colMap.basePrice] : null);

        // 🔍 Логирование для отладки (первые 10 строк)
        if (results.preview.length < 10) {
          results.preview.push({
            row: i + 1,
            code,
            name,
            parent,
            isGroup,
            laborHours,
            basePrice,
            raw: row.slice(0, 6) // Первые 6 ячеек для отладки
          });
        }

        // ❌ Пропуск без наименования
        if (!name || name.length < 2) {
          results.skipped++;
          results.errors.push(`Строка ${i + 1}: пусто или слишком короткое "Наименование"`);
          continue;
        }

        // 📁 Обработка групп
        if (isGroup) {
          results.groups++;
          if (!importGroups) {
            // Пропускаем группы, если не указано импортировать их
            continue;
          }
          // Если importGroups=true — продолжаем как обычную услугу
        }

        // 🔧 Генерация service_code
        const serviceCode = code && code.length > 1 
          ? code 
          : generateServiceCode(name, i);

        // 🔧 Подготовка данных для БД
        const service = {
          service_code: serviceCode,
          name,
          full_name: fullName || null,
          category: parent || null,
          labor_hours: laborHours,
          base_price: basePrice,
          comment: null,
          additional: null,
          is_active: true
        };

        // 🚫 Dry run — только предпросмотр
        if (dryRun) {
          results.imported++;
          continue;
        }

        // 💾 UPSERT в базу данных
        const upsertQuery = `
          INSERT INTO services (
            service_code, name, full_name, category,
            labor_hours, base_price, comment, additional, is_active
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (service_code) 
          DO UPDATE SET
            name = EXCLUDED.name,
            full_name = EXCLUDED.full_name,
            category = EXCLUDED.category,
            labor_hours = EXCLUDED.labor_hours,
            ${updatePrices ? 'base_price = EXCLUDED.base_price,' : ''}
            comment = EXCLUDED.comment,
            additional = EXCLUDED.additional,
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
          RETURNING id, xmax
        `;
        
        const dbResult = await pool.query(upsertQuery, [
          service.service_code, service.name, service.full_name, service.category,
          service.labor_hours, service.base_price, service.comment, service.additional, service.is_active
        ]);

        // Определяем: вставка (xmax=0) или обновление (xmax≠0)
        const rowResult = dbResult.rows[0];
        if (rowResult) {
          if (rowResult.xmax === 0) {
            results.imported++;
          } else {
            results.updated++;
          }
        }

        // 📦 Пакетная обработка для больших файлов
        if (batchSize > 0 && processed % batchSize === 0) {
          console.log(`⏳ Обработано ${processed}/${rawData.length - 1} строк...`);
          // Небольшая пауза чтобы не перегружать БД
          await new Promise(resolve => setTimeout(resolve, 10));
        }

      } catch (err) {
        results.skipped++;
        results.errors.push(`Строка ${i + 1}: ${err.message}`);
        console.warn(`⚠️ Строка ${i + 1}:`, err.message);
      }
    }

    console.log(`✅ Импорт завершён: ${results.imported} добавлено, ${results.updated} обновлено, ${results.skipped} пропущено`);
    return results;
    
  } catch (error) {
    console.error('❌ Critical error importing Excel:', error);
    throw new Error(`Ошибка импорта: ${error.message}`);
  }
}

// 🔧 Вспомогательные функции

/**
 * Поиск колонки по множеству возможных названий
 */
function findColumn(headers, variants) {
  const lowerHeaders = headers.map(h => h.toLowerCase());
  for (const variant of variants) {
    const idx = lowerHeaders.findIndex(h => h === variant.toLowerCase().trim());
    if (idx !== -1) return idx;
  }
  return -1;
}

/**
 * Безопасное преобразование в строку
 */
function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

/**
 * Преобразование значения "Это группа" в boolean
 */
function isGroupToString(value) {
  if (value === null || value === undefined) return false;
  const str = String(value).toLowerCase().trim();
  return str === 'да' || str === 'yes' || str === 'true' || str === '1' || str === 'группа';
}

/**
 * Парсинг времени выполнения (поддержка разных форматов)
 */
function parseLaborHours(value) {
  if (value === null || value === undefined || value === '') return 0;
  
  const raw = String(value).trim().toLowerCase();
  
  // Формат "1:30" → 1.5 часа
  if (raw.includes(':')) {
    const [h, m] = raw.split(':').map(Number);
    return (isNaN(h) ? 0 : h) + (isNaN(m) ? 0 : m / 60);
  }
  
  // Формат "30 мин", "1.5 часа", "2ч"
  if (raw.includes('мин')) {
    return parseFloat(raw) / 60 || 0;
  }
  if (raw.includes('час')) {
    return parseFloat(raw) || 0;
  }
  if (raw.includes('ч') && !raw.includes('час')) {
    return parseFloat(raw) || 0;
  }
  
  // Просто число (с запятой или точкой)
  return parseFloat(raw.replace(',', '.')) || 0;
}

/**
 * Парсинг цены
 */
function parsePrice(value) {
  if (value === null || value === undefined || value === '') return 0;
  const raw = String(value).trim().replace(/[^\d.,]/g, '').replace(',', '.');
  return parseFloat(raw) || 0;
}

/**
 * Генерация уникального service_code из имени
 */
function generateServiceCode(name, index) {
  const clean = name
    .toUpperCase()
    .replace(/[^A-ZА-Я0-9]/g, '_')
    .slice(0, 30)
    .replace(/_+/g, '_');
  return `SRV_${clean}_${Date.now().toString(36)}_${index}`;
}

/**
 * Статистика по услугам
 */
export async function getServiceStats() {
  try {
    const [total, active, byCategory, recent] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM services'),
      pool.query('SELECT COUNT(*) FROM services WHERE is_active = TRUE'),
      pool.query(`
        SELECT category, COUNT(*) as count, ROUND(AVG(base_price), 2) as avg_price
        FROM services WHERE category IS NOT NULL AND is_active = TRUE 
        GROUP BY category ORDER BY count DESC LIMIT 10
      `),
      pool.query(`
        SELECT name, category, created_at 
        FROM services ORDER BY created_at DESC LIMIT 5
      `)
    ]);

    return {
      total: parseInt(total.rows[0]?.count || 0),
      active: parseInt(active.rows[0]?.count || 0),
      by_category: byCategory.rows,
      recent_imports: recent.rows,
      last_updated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error getting service stats:', error);
    return { error: error.message };
  }
}