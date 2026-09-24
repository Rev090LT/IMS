import xlsx from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function readServicesExcel() {
  const filePath = path.join(__dirname, '../../data/reference/автоработы-для-1С.xlsx');
  const workbook = xlsx.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet, { defval: '' });
  
  const groups = data.filter(row => row['Это группа'] === 'Да' && row['Наименование']).map(row => ({
    id: row['Код'],
    name: row['Наименование'],
    isGroup: true,
    children: []
  }));
  
  const items = data.filter(row => row['Это группа'] !== 'Да' && row['Наименование'] && row['Родитель']).map(row => ({
    id: row['Код'],
    name: row['Наименование'],
    category: row['Родитель'],
    laborHours: row['Время выполнения'] ? parseFloat(row['Время выполнения']) : null,
    comment: row['Комментарий'],
    isGroup: false
  }));
  
  groups.forEach(group => {
    group.children = items.filter(item => item.category === group.name);
  });
  
  return { groups, items };
}