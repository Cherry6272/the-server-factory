import * as xlsx from 'xlsx';
const workbook = xlsx.readFile('THESERVERFACTORY.xlsx');
const dell = xlsx.utils.sheet_to_json(workbook.Sheets['Dell']);
console.log(dell.slice(0, 4));
