// IMS/server/utils/vin-decoder.js

/**
 * Декодирование VIN через NHTSA API (США, бесплатно)
 */
export async function decodeVinNHTSA(vin) {
  try {
    const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    const data = await res.json();
    
    if (data.Results?.[0]?.Make?.Value) {
      const r = data.Results[0];
      return {
        source: 'nhtsa',
        success: true,
        data: {
          brand: r.Make?.Value || null,
          model: r.Model?.Value || null,
          year: r.ModelYear?.Value ? parseInt(r.ModelYear.Value) : null,
          body_type: r.BodyClass?.Value || null,
          engine_type: r.EngineConfiguration?.Value || null,
          engine_cylinders: r.Cylinders?.Value ? parseInt(r.Cylinders.Value) : null,
          drive_type: r.DriveType?.Value || null,
          transmission: r.TransmissionStyle?.Value || null,
          plant_country: r.PlantCountry?.Value || null,
          plant_city: r.PlantCity?.Value || null,
          vehicle_type: r.VehicleType?.Value || null,
          raw: r
        }
      };
    }
    return { source: 'nhtsa', success: false, message: 'VIN not found in NHTSA database' };
  } catch (e) {
    return { source: 'nhtsa', success: false, error: e.message };
  }
}

/**
 * Декодирование VIN через CarQuery API (мировой, бесплатно)
 */
export async function decodeVinCarQuery(vin) {
  try {
    const res = await fetch(`http://www.carqueryapi.com/api/0.3/?cmd=getVehicle&vin=${vin}`);
    const data = await res.json();
    
    if (data?.Vehicle?.[0]) {
      const v = data.Vehicle[0];
      return {
        source: 'carquery',
        success: true,
        data: {
          brand: v.make_model_manufacturer || null,
          model: v.make_model_name || null,
          year: v.model_year ? parseInt(v.model_year) : null,
          body_type: v.body_type || null,
          engine_type: v.engine_type || null,
          engine_displacement: v.engine_displacement || null,
          transmission: v.transmission_type || null,
          drive_type: v.drive_type || null,
          fuel_type: v.fuel_type || null,
          raw: v
        }
      };
    }
    return { source: 'carquery', success: false, message: 'VIN not found in CarQuery database' };
  } catch (e) {
    return { source: 'carquery', success: false, error: e.message };
  }
}

/**
 * Умный декодер с фоллбэками
 */
export async function decodeVinSmart(vin, checkLocal = true, pool = null) {
  const vinUpper = vin.toUpperCase().trim();
  
  // 1. Проверяем локальную базу (если передан pool)
  if (checkLocal && pool) {
    try {
      const local = await pool.query(
        'SELECT id, brand, model, generation, year, engine_type, transmission FROM cars WHERE vin = $1',
        [vinUpper]
      );
      
      if (local.rows.length > 0) {
        const car = local.rows[0];
        return {
          source: 'local',
          success: true,
          found: true,
          data: {
            id: car.id,
            brand: car.brand,
            model: car.model,
            generation: car.generation,
            year: car.year,
            engine_type: car.engine_type,
            transmission: car.transmission
          },
          message: 'Найдено в локальной базе'
        };
      }
    } catch (e) {
      console.log('Local DB check failed:', e.message);
    }
  }
  
  // 2. NHTSA (лучше для американских авто)
  const nhtsa = await decodeVinNHTSA(vinUpper);
  if (nhtsa.success) {
    return { ...nhtsa, found: true };
  }
  
  // 3. CarQuery (мировой)
  const carquery = await decodeVinCarQuery(vinUpper);
  if (carquery.success) {
    return { ...carquery, found: true };
  }
  
  // 4. Ничего не нашли
  return {
    source: null,
    success: false,
    found: false,
    vin: vinUpper,
    message: 'VIN не распознан. Попробуйте ручное добавление.'
  };
}

/**
 * Извлечение платформы из decoded данных (эвристический метод)
 */
export function guessPlatformFromData(data) {
  if (!data || !data.brand || !data.model) return null;
  
  const brand = (data.brand || '').toLowerCase();
  const model = (data.model || '').toLowerCase();
  const year = data.year || 0;
  
  // Эвристики для популярных платформ
  if (brand === 'nissan') {
    if (['cefiro', 'maxima'].includes(model) && year >= 1994 && year <= 2003) return 'FF-L';
    if (['x-trail', 'qashqai'].includes(model) && year >= 2007) return 'C';
  }
  
  if (brand === 'toyota') {
    if (['camry', 'avalon'].includes(model) && year >= 1996 && year <= 2006) return 'MC';
    if (['corolla'].includes(model) && year >= 2000 && year <= 2008) return 'E120';
  }
  
  if (brand === 'bmw' && model.includes('5') && year >= 1995 && year <= 2003) return 'E39';
  if (brand === 'mercedes-benz' && model.includes('e') && year >= 1995 && year <= 2002) return 'W210';
  if (brand === 'volkswagen' && ['golf', 'audi a3', 'octavia'].includes(model) && year >= 1997 && year <= 2005) return 'PQ34';
  if (brand === 'honda' && ['accord', 'odyssey'].includes(model) && year >= 1998 && year <= 2003) return 'JDM-C';
  
  return null;
}